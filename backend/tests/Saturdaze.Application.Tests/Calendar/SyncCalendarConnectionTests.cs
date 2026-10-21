using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Calendar;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Calendar;

/// <summary>
/// A change to the plan that arrives while a calendar write is running is not
/// lost to the write's own save, even in the same instant (L2-175: the calendar
/// follows every change).
/// </summary>
public class SyncCalendarConnectionTests
{
    private static readonly DateTimeOffset Now = new(2026, 5, 14, 9, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task A_change_scheduled_during_a_write_in_the_same_instant_stays_pending()
    {
        var name = $"sync-{Guid.NewGuid():N}";
        DbContextOptions<TestAppDbContext> Options() =>
            new DbContextOptionsBuilder<TestAppDbContext>().UseInMemoryDatabase(name).Options;
        var clock = new StubDateTimeProvider { UtcNow = Now, Today = new DateOnly(2026, 5, 14) };
        var familyId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        await using (var seed = new TestAppDbContext(Options()))
        {
            var userId = Guid.NewGuid();
            seed.Users.Add(new User { Id = userId, Email = "a@b.c", NormalizedEmail = "a@b.c", FamilyId = familyId });
            var weekendId = Guid.NewGuid();
            seed.Weekends.Add(new Weekend
            {
                Id = weekendId, FamilyId = familyId, WeekendOf = new DateOnly(2026, 5, 16),
                Blocks =
                {
                    new ItineraryBlock
                    {
                        Id = Guid.NewGuid(), WeekendId = weekendId, Day = DayOfWeekend.Saturday, Kind = BlockKind.Activity,
                        Title = "Zoo", StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(12, 0),
                    },
                },
            });
            seed.CalendarConnections.Add(new CalendarConnection
            {
                Id = connectionId, UserId = userId, GoogleSubject = "g", Email = "cal@example.com",
                ProtectedRefreshToken = "rt", Status = CalendarConnectionStatus.Connected,
                SyncRequestedUtc = Now, NextAttemptUtc = Now, SyncRequestCount = 1,
            });
            await seed.SaveChangesAsync();
        }

        // While Google writes the event, the family changes the plan again in the same instant.
        var google = new SchedulingGoogle(async () =>
        {
            await using var other = new TestAppDbContext(Options());
            await new CalendarSyncScheduler(other, clock, new NoSignal()).RequestAsync(familyId, CancellationToken.None);
        });
        await using (var db = new TestAppDbContext(Options()))
        {
            var handler = new SyncCalendarConnectionCommandHandler(db, google, new PlainProtector(), clock,
                Microsoft.Extensions.Options.Options.Create(new CalendarOptions()),
                NullLogger<SyncCalendarConnectionCommandHandler>.Instance);
            await handler.Handle(new SyncCalendarConnectionCommand(connectionId), CancellationToken.None);
        }

        await using var check = new TestAppDbContext(Options());
        var connection = await check.CalendarConnections.SingleAsync(c => c.Id == connectionId);
        connection.SyncRequestCount.Should().BeGreaterThan(connection.SyncedRequestCount,
            "the change made during the write still has to be written");
    }

    private sealed class SchedulingGoogle(Func<Task> duringInsert) : IGoogleCalendarClient
    {
        public bool IsConfigured => true;
        public Uri AuthorizationUrl(string state, string redirectUri) => new("https://example.com");
        public Task<GoogleCalendarGrant> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct) => throw new NotSupportedException();
        public Task RevokeAsync(string refreshToken, CancellationToken ct) => Task.CompletedTask;
        public Task<IReadOnlyList<GoogleCalendarEvent>> ListEventsAsync(string refreshToken, DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
            => Task.FromResult<IReadOnlyList<GoogleCalendarEvent>>(Array.Empty<GoogleCalendarEvent>());
        public async Task<string> InsertEventAsync(string refreshToken, GoogleCalendarEventWrite write, CancellationToken ct)
        {
            await duringInsert();
            return write.EventId;
        }
        public Task<bool> UpdateEventAsync(string refreshToken, string eventId, GoogleCalendarEventWrite write, CancellationToken ct) => Task.FromResult(true);
        public Task DeleteEventAsync(string refreshToken, string eventId, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class PlainProtector : ICalendarTokenProtector
    {
        public string Protect(string refreshToken) => refreshToken;
        public string? Unprotect(string protectedToken) => protectedToken;
        public string CreateState(Guid userId, DateTimeOffset expiresUtc) => string.Empty;
        public CalendarState? ReadState(string state) => null;
    }

    private sealed class NoSignal : ICalendarSyncSignal
    {
        public void Notify() { }
    }
}
