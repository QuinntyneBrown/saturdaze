using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Email;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Invitations;

/// <summary>
/// An administrator invites one or more addresses to Saturdaze (L2-157),
/// optionally with a sample weekend. The batch succeeds or fails as one.
/// </summary>
public sealed record SendInvitationsCommand(
    IReadOnlyList<string> Emails,
    Guid? ProspectId = null,
    string? Message = null) : IRequest<SendInvitationsResultDto>;

public sealed class SendInvitationsCommandValidator : AbstractValidator<SendInvitationsCommand>
{
    public const int MaxAddresses = 20;

    public SendInvitationsCommandValidator()
    {
        RuleFor(x => x.Emails)
            .NotNull().WithMessage("Enter at least one email address.")
            .Must(e => e.Count > 0).WithMessage("Enter at least one email address.")
            .Must(e => e.Count <= MaxAddresses).WithMessage($"Invite up to {MaxAddresses} addresses at a time.")
            .Must(e => e.Select(a => (a ?? string.Empty).Trim().ToLowerInvariant()).Distinct().Count() == e.Count)
                .WithMessage("Each address once.");
        RuleForEach(x => x.Emails)
            .NotEmpty().EmailAddress().MaximumLength(256)
            .OverridePropertyName("Emails");
        RuleFor(x => x.Message).MaximumLength(500);
    }
}

public sealed class SendInvitationsCommandHandler : IRequestHandler<SendInvitationsCommand, SendInvitationsResultDto>
{
    /// <summary>The email and the admin list say "works for 14 days" (L2-157 AC1).</summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(14);

    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokens;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly IEmailOutbox _outbox;
    private readonly InvitationEmails _emails;
    private readonly PlatformInvitationMapper _mapper;

    public SendInvitationsCommandHandler(
        IAppDbContext db,
        IJwtTokenService tokens,
        ICurrentUserAccessor user,
        IDateTimeProvider clock,
        IEmailOutbox outbox,
        InvitationEmails emails,
        PlatformInvitationMapper mapper)
    {
        _db = db;
        _tokens = tokens;
        _user = user;
        _clock = clock;
        _outbox = outbox;
        _emails = emails;
        _mapper = mapper;
    }

    public async Task<SendInvitationsResultDto> Handle(SendInvitationsCommand request, CancellationToken ct)
    {
        var now = _clock.UtcNow;
        var emails = request.Emails.Select(e => e.Trim()).ToList();
        var normalized = emails.Select(e => e.ToLowerInvariant()).ToList();

        if (request.ProspectId is { } prospectId && !await _db.Prospects.AnyAsync(p => p.Id == prospectId, ct))
            throw new Exceptions.ValidationException("ProspectId", "No sample weekend with that id.");

        // The whole batch is refused before any row or message exists (L2-157 AC3, AC4).
        var inUse = await _db.Users.AsNoTracking()
            .Where(u => normalized.Contains(u.NormalizedEmail))
            .Select(u => u.Email)
            .FirstOrDefaultAsync(ct);
        if (inUse is not null)
            throw new ConflictException("email_in_use", $"{inUse} already signs in to Saturdaze.");

        var pending = await _db.PlatformInvitations.AsNoTracking()
            .Where(i => normalized.Contains(i.NormalizedEmail)
                        && i.AcceptedAtUtc == null && i.RevokedAtUtc == null && i.ExpiresAtUtc > now)
            .Select(i => i.Email)
            .FirstOrDefaultAsync(ct);
        if (pending is not null)
            throw new ConflictException("already_invited", $"{pending} already has an invite that still works.");

        var invitedBy = _user.UserId ?? Guid.Empty;
        var message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim();
        var rows = new List<(PlatformInvitation Row, string Token)>();
        for (var i = 0; i < emails.Count; i++)
        {
            var raw = _tokens.CreateRawRefreshToken();
            var row = new PlatformInvitation
            {
                Id = Guid.NewGuid(),
                Email = emails[i],
                NormalizedEmail = normalized[i],
                TokenHash = _tokens.HashRefreshToken(raw),
                ProspectId = request.ProspectId,
                Message = message,
                InvitedByUserId = invitedBy,
                CreatedAtUtc = now,
                ExpiresAtUtc = now.Add(Lifetime),
            };
            _db.PlatformInvitations.Add(row);
            rows.Add((row, raw));
        }
        await _db.SaveChangesAsync(ct);

        var urls = rows.ToDictionary(r => r.Row.Id, r => JoinLink(r.Token));
        var dtos = await _mapper.ToDtosAsync(rows.Select(r => r.Row).ToList(), urls, ct);
        var sample = await SampleAsync(dtos[0].SampleWeekend, ct);

        // Mail leaves after the rows are committed, off the request path (L2-142).
        foreach (var (row, token) in rows)
        {
            var dto = dtos.Single(d => d.Id == row.Id);
            _outbox.Enqueue(_emails.Invitation(row.Email, token, dto.InvitedByEmail, sample, message));
        }

        return new SendInvitationsResultDto(dtos);
    }

    /// <summary>Relative: the API makes it absolute against the app's origin.</summary>
    public static string JoinLink(string token) => $"/join?token={Uri.EscapeDataString(token)}";

    /// <summary>The sample card of the email: the family, the dates and each day's first activity (L2-162 AC2).</summary>
    private async Task<InvitationSample?> SampleAsync(SampleWeekendSummaryDto? summary, CancellationToken ct)
    {
        if (summary is null) return null;
        var weekendId = await _db.Prospects.AsNoTracking()
            .Where(p => p.Id == summary.ProspectId).Select(p => p.WeekendId).FirstAsync(ct);
        var activities = await _db.ItineraryBlocks.AsNoTracking()
            .Where(b => b.WeekendId == weekendId && b.Kind == Domain.Enums.BlockKind.Activity)
            .OrderBy(b => b.SortOrder)
            .Select(b => new { b.Day, b.Title })
            .ToListAsync(ct);
        return new InvitationSample(
            summary.FamilyName,
            summary.WeekendOf,
            activities.FirstOrDefault(a => a.Day == Domain.Enums.DayOfWeekend.Saturday)?.Title,
            activities.FirstOrDefault(a => a.Day == Domain.Enums.DayOfWeekend.Sunday)?.Title);
    }
}
