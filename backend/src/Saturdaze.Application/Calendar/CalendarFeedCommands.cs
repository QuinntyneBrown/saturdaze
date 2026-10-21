using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Calendar;

/// <summary>Mints the family's subscription link, replacing any earlier one (L2-178).</summary>
public sealed record CreateCalendarFeedCommand : IRequest<CalendarFeedToken>;

/// <summary>The raw token, returned once; only its hash is stored.</summary>
public sealed record CalendarFeedToken(string Token, DateTimeOffset CreatedUtc);

/// <summary>Stops the family's subscription link (L2-178 AC5).</summary>
public sealed record StopCalendarFeedCommand : IRequest;

/// <summary>What a subscription link serves: the family's current weekend, or nothing yet.</summary>
public sealed record GetCalendarFeedQuery(string Token) : IRequest<CalendarFeedWeekend>;

public sealed record CalendarFeedWeekend(DateOnly WeekendOf, IReadOnlyList<ItineraryBlock> Events);

public sealed class CreateCalendarFeedCommandHandler : IRequestHandler<CreateCalendarFeedCommand, CalendarFeedToken>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public CreateCalendarFeedCommandHandler(
        IAppDbContext db, ICurrentFamilyAccessor current, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<CalendarFeedToken> Handle(CreateCalendarFeedCommand request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var existing = await _db.CalendarFeeds.Where(f => f.FamilyId == familyId).ToListAsync(ct);
        _db.CalendarFeeds.RemoveRange(existing);
        if (existing.Count > 0) await _db.SaveChangesAsync(ct);

        var raw = _tokens.CreateRawRefreshToken();
        var feed = new CalendarFeed
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            TokenHash = _tokens.HashRefreshToken(raw),
            CreatedUtc = _clock.UtcNow,
        };
        _db.CalendarFeeds.Add(feed);
        await _db.SaveChangesAsync(ct);
        return new CalendarFeedToken(raw, feed.CreatedUtc);
    }
}

public sealed class StopCalendarFeedCommandHandler : IRequestHandler<StopCalendarFeedCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;

    public StopCalendarFeedCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task Handle(StopCalendarFeedCommand request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        _db.CalendarFeeds.RemoveRange(await _db.CalendarFeeds.Where(f => f.FamilyId == familyId).ToListAsync(ct));
        await _db.SaveChangesAsync(ct);
    }
}

public sealed class GetCalendarFeedQueryHandler : IRequestHandler<GetCalendarFeedQuery, CalendarFeedWeekend>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public GetCalendarFeedQueryHandler(IAppDbContext db, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<CalendarFeedWeekend> Handle(GetCalendarFeedQuery request, CancellationToken ct)
    {
        var hash = _tokens.HashRefreshToken(request.Token);
        var feed = await _db.CalendarFeeds.AsNoTracking().FirstOrDefaultAsync(f => f.TokenHash == hash, ct)
            ?? throw new NotFoundException(nameof(CalendarFeed), request.Token);

        // The feed never plans a weekend; it serves the one the family has (L2-178 AC3).
        var weekendOf = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        var weekend = await _db.Weekends.AsNoTracking()
            .Include(w => w.Blocks)
            .FirstOrDefaultAsync(w => w.FamilyId == feed.FamilyId && w.WeekendOf == weekendOf, ct);
        var events = weekend?.Blocks.Where(CalendarEventSelection.Includes).ToList() ?? new List<ItineraryBlock>();
        return new CalendarFeedWeekend(weekendOf, events);
    }
}
