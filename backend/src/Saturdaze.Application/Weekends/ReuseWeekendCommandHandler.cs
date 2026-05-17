using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

public sealed class ReuseWeekendCommandHandler : IRequestHandler<ReuseWeekendCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IDateTimeProvider _clock;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;
    private readonly ISender _sender;

    public ReuseWeekendCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IDateTimeProvider clock,
        IWeatherClient weather,
        IOptions<HomeLocationOptions> home,
        ISender sender)
    {
        _db = db;
        _current = current;
        _clock = clock;
        _weather = weather;
        _home = home;
        _sender = sender;
    }

    public async Task<WeekendDto> Handle(ReuseWeekendCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
        var source = await _db.Weekends.AsNoTracking()
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.SourceWeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.SourceWeekendId);

        var sourceBlocks = source.Blocks
            .OrderBy(b => b.Day)
            .ThenBy(b => b.SortOrder)
            .ThenBy(b => b.StartTime)
            .ToList();
        var sourceErrands = source.Errands.ToList();
        var currentDate = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);

        var target = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.FamilyId == familyId && w.WeekendOf == currentDate, cancellationToken);

        if (target is null)
        {
            target = new Weekend
            {
                Id = Guid.NewGuid(),
                FamilyId = familyId,
                WeekendOf = currentDate
            };
            _db.Weekends.Add(target);
        }
        else
        {
            foreach (var block in target.Blocks.ToList())
            {
                target.Blocks.Remove(block);
                _db.ItineraryBlocks.Remove(block);
            }
            foreach (var errand in target.Errands.ToList())
            {
                target.Errands.Remove(errand);
                _db.ShoppingErrands.Remove(errand);
            }
        }

        target.IsFavourite = false;
        target.Notes = source.Notes;
        target.Title = request.Remix ? $"Remix of {source.Title ?? "saved weekend"}" : source.Title;
        target.Rating = null;
        target.RegenerateCount = request.Remix ? source.RegenerateCount + 1 : source.RegenerateCount;

        foreach (var block in sourceBlocks)
        {
            var clone = new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = target.Id,
                Day = block.Day,
                StartTime = block.StartTime,
                EndTime = block.EndTime,
                Kind = block.Kind,
                Title = block.Title,
                RefId = block.RefId,
                IsLocked = block.IsLocked,
                Reason = request.Remix && !block.IsLocked
                    ? "seeded from saved weekend; ready to remix"
                    : block.Reason,
                SortOrder = block.SortOrder
            };
            _db.ItineraryBlocks.Add(clone);
        }

        foreach (var errand in sourceErrands)
        {
            var clone = new ShoppingErrand
            {
                Id = Guid.NewGuid(),
                WeekendId = target.Id,
                Description = errand.Description,
                EstimatedMinutes = errand.EstimatedMinutes,
                Done = errand.Done
            };
            _db.ShoppingErrands.Add(clone);
        }

        await _db.SaveChangesAsync(cancellationToken);

        if (request.Remix)
            return await _sender.Send(new RegenerateWeekendCommand(target.Id), cancellationToken);

        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude,
            _home.Value.Longitude,
            target.WeekendOf,
            target.WeekendOf.AddDays(1),
            cancellationToken);
        return WeekendMapper.ToDto(target, forecast);
    }
}
