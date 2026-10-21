using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Calendar;

/// <summary>Starts connecting Google Calendar: Google's consent URL with a state bound to the caller (L2-173).</summary>
public sealed record AuthorizeGoogleCalendarCommand : IRequest<GoogleCalendarAuthorizationDto>;

public sealed record GoogleCalendarAuthorizationDto(string AuthorizationUrl);

/// <summary>Finishes connecting: exchanges the code Google returned to the app (L2-173).</summary>
public sealed record ConnectGoogleCalendarCommand(string? Code, string? State) : IRequest<CalendarSettingsDto>;

/// <summary>Turns "plan around my calendar" on or off (L2-174).</summary>
public sealed record UpdateGoogleCalendarCommand(bool ReadCommitments) : IRequest<CalendarSettingsDto>;

/// <summary>Revokes the grant and forgets the connection; written events stay (L2-175).</summary>
public sealed record DisconnectGoogleCalendarCommand : IRequest;

internal static class GoogleCalendarErrors
{
    public static AuthFlowException NotConfigured() =>
        new(503, "google_calendar_not_configured", "Google Calendar is not set up on this server.");

    public static AuthFlowException StateInvalid() =>
        new(400, "calendar_state_invalid", "That Google Calendar connection was not started here, or took too long.");

    public static Guid RequireUser(ICurrentUserAccessor user) =>
        user.UserId ?? throw new InvalidCredentialsException();
}

public sealed class AuthorizeGoogleCalendarCommandHandler
    : IRequestHandler<AuthorizeGoogleCalendarCommand, GoogleCalendarAuthorizationDto>
{
    /// <summary>How long the person has to finish Google's consent screen.</summary>
    public static readonly TimeSpan StateLifetime = TimeSpan.FromMinutes(10);

    private readonly IGoogleCalendarClient _google;
    private readonly ICalendarTokenProtector _protector;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly CalendarOptions _options;

    public AuthorizeGoogleCalendarCommandHandler(
        IGoogleCalendarClient google,
        ICalendarTokenProtector protector,
        ICurrentUserAccessor user,
        IDateTimeProvider clock,
        IOptions<CalendarOptions> options)
    {
        _google = google;
        _protector = protector;
        _user = user;
        _clock = clock;
        _options = options.Value;
    }

    public Task<GoogleCalendarAuthorizationDto> Handle(AuthorizeGoogleCalendarCommand request, CancellationToken ct)
    {
        if (!_google.IsConfigured) throw GoogleCalendarErrors.NotConfigured();
        var userId = GoogleCalendarErrors.RequireUser(_user);
        var state = _protector.CreateState(userId, _clock.UtcNow + StateLifetime);
        var url = _google.AuthorizationUrl(state, _options.RedirectUri);
        return Task.FromResult(new GoogleCalendarAuthorizationDto(url.AbsoluteUri));
    }
}

public sealed class ConnectGoogleCalendarCommandValidator : AbstractValidator<ConnectGoogleCalendarCommand>
{
    public ConnectGoogleCalendarCommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty();
        RuleFor(x => x.State).NotEmpty();
    }
}

public sealed class ConnectGoogleCalendarCommandHandler : IRequestHandler<ConnectGoogleCalendarCommand, CalendarSettingsDto>
{
    private readonly IAppDbContext _db;
    private readonly IGoogleCalendarClient _google;
    private readonly ICalendarTokenProtector _protector;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly CalendarOptions _options;
    private readonly ISender _sender;
    private readonly ICalendarSyncSignal _signal;
    private readonly ILogger<ConnectGoogleCalendarCommandHandler> _logger;

    public ConnectGoogleCalendarCommandHandler(
        IAppDbContext db,
        IGoogleCalendarClient google,
        ICalendarTokenProtector protector,
        ICurrentUserAccessor user,
        IDateTimeProvider clock,
        IOptions<CalendarOptions> options,
        ISender sender,
        ICalendarSyncSignal signal,
        ILogger<ConnectGoogleCalendarCommandHandler> logger)
    {
        _signal = signal;
        _db = db;
        _google = google;
        _protector = protector;
        _user = user;
        _clock = clock;
        _options = options.Value;
        _sender = sender;
        _logger = logger;
    }

    public async Task<CalendarSettingsDto> Handle(ConnectGoogleCalendarCommand request, CancellationToken ct)
    {
        if (!_google.IsConfigured) throw GoogleCalendarErrors.NotConfigured();
        var userId = GoogleCalendarErrors.RequireUser(_user);
        var state = _protector.ReadState(request.State!);
        if (state is null || state.UserId != userId || state.ExpiresUtc < _clock.UtcNow)
            throw GoogleCalendarErrors.StateInvalid();

        GoogleCalendarGrant grant;
        try
        {
            grant = await _google.ExchangeCodeAsync(request.Code!, _options.RedirectUri, ct);
        }
        catch (GoogleCalendarCodeRejectedException)
        {
            throw new AuthFlowException(400, "google_calendar_code_invalid", "Google didn't accept that sign-in. Try connecting again.");
        }
        catch (GoogleCalendarUnavailableException)
        {
            throw new AuthFlowException(502, "google_calendar_unavailable", "Google didn't answer. Nothing was connected.");
        }

        if (!grant.HasCalendarScope)
        {
            await RevokeQuietlyAsync(grant.RefreshToken, ct);
            throw new AuthFlowException(400, "google_calendar_scope_missing", "Google Calendar access wasn't granted.");
        }

        var connection = await _db.CalendarConnections.FirstOrDefaultAsync(c => c.UserId == userId, ct);
        if (connection is null)
        {
            connection = new CalendarConnection { Id = Guid.NewGuid(), UserId = userId, CreatedUtc = _clock.UtcNow };
            _db.CalendarConnections.Add(connection);
        }
        else
        {
            if (_protector.Unprotect(connection.ProtectedRefreshToken) is { } previous)
                await RevokeQuietlyAsync(previous, ct);
            // Events written to another Google account are not this calendar's to update.
            if (connection.GoogleSubject != grant.Subject)
                _db.CalendarEventLinks.RemoveRange(
                    await _db.CalendarEventLinks.Where(l => l.ConnectionId == connection.Id).ToListAsync(ct));
        }

        connection.GoogleSubject = grant.Subject;
        connection.Email = grant.Email;
        connection.ProtectedRefreshToken = _protector.Protect(grant.RefreshToken);
        connection.Status = CalendarConnectionStatus.Connected;
        connection.ReadCommitments = true;
        connection.LastSyncedUtc = null;
        // Write the current weekend straight away (L2-178 AC4).
        connection.SyncRequestedUtc = _clock.UtcNow;
        connection.SyncRequestCount++;
        connection.NextAttemptUtc = _clock.UtcNow;
        connection.FailedAttempts = 0;
        await _db.SaveChangesAsync(ct);
        _signal.Notify();

        return await _sender.Send(new GetCalendarSettingsQuery(), ct);
    }

    private async Task RevokeQuietlyAsync(string refreshToken, CancellationToken ct)
    {
        try
        {
            await _google.RevokeAsync(refreshToken, ct);
        }
        catch (Exception ex) when (ex is GoogleCalendarUnavailableException or GoogleCalendarGrantRevokedException)
        {
            _logger.LogWarning("Google Calendar revocation failed: {Error}", ex.GetType().Name);
        }
    }
}

public sealed class UpdateGoogleCalendarCommandHandler : IRequestHandler<UpdateGoogleCalendarCommand, CalendarSettingsDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly ISender _sender;

    public UpdateGoogleCalendarCommandHandler(IAppDbContext db, ICurrentUserAccessor user, ISender sender)
    {
        _db = db;
        _user = user;
        _sender = sender;
    }

    public async Task<CalendarSettingsDto> Handle(UpdateGoogleCalendarCommand request, CancellationToken ct)
    {
        var userId = GoogleCalendarErrors.RequireUser(_user);
        var connection = await _db.CalendarConnections.FirstOrDefaultAsync(c => c.UserId == userId, ct)
            ?? throw new NotFoundException(nameof(CalendarConnection), userId);
        connection.ReadCommitments = request.ReadCommitments;
        await _db.SaveChangesAsync(ct);
        return await _sender.Send(new GetCalendarSettingsQuery(), ct);
    }
}

public sealed class DisconnectGoogleCalendarCommandHandler : IRequestHandler<DisconnectGoogleCalendarCommand>
{
    private readonly IAppDbContext _db;
    private readonly IGoogleCalendarClient _google;
    private readonly ICalendarTokenProtector _protector;
    private readonly ICurrentUserAccessor _user;
    private readonly ILogger<DisconnectGoogleCalendarCommandHandler> _logger;

    public DisconnectGoogleCalendarCommandHandler(
        IAppDbContext db,
        IGoogleCalendarClient google,
        ICalendarTokenProtector protector,
        ICurrentUserAccessor user,
        ILogger<DisconnectGoogleCalendarCommandHandler> logger)
    {
        _db = db;
        _google = google;
        _protector = protector;
        _user = user;
        _logger = logger;
    }

    public async Task Handle(DisconnectGoogleCalendarCommand request, CancellationToken ct)
    {
        var userId = GoogleCalendarErrors.RequireUser(_user);
        var connection = await _db.CalendarConnections.FirstOrDefaultAsync(c => c.UserId == userId, ct);
        if (connection is null) return;

        if (_protector.Unprotect(connection.ProtectedRefreshToken) is { } refreshToken)
        {
            try
            {
                await _google.RevokeAsync(refreshToken, ct);
            }
            catch (Exception ex) when (ex is GoogleCalendarUnavailableException or GoogleCalendarGrantRevokedException)
            {
                // Forgetting the grant matters more than Google confirming it (L2-175 AC2).
                _logger.LogWarning("Google Calendar revocation failed for connection {ConnectionId}: {Error}",
                    connection.Id, ex.GetType().Name);
            }
        }

        _db.CalendarConnections.Remove(connection);
        await _db.SaveChangesAsync(ct);
    }
}
