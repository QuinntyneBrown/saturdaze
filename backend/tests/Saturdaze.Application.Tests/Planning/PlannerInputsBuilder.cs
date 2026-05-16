using Saturdaze.Application.Planning;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Tests.Planning;

internal sealed class PlannerInputsBuilder
{
    private Guid _familyId = Guid.NewGuid();
    private DateOnly _weekendOf = new(2026, 5, 16);
    private readonly List<FamilyMember> _members = new();
    private readonly List<Commitment> _commitments = new();
    private readonly List<Preference> _preferences = new();
    private readonly List<Activity> _activities = new();
    private readonly List<Restaurant> _restaurants = new();
    private readonly List<LocalEvent> _events = new();
    private readonly List<WeatherForecast> _forecast = new();
    private readonly List<HistoricalActivity> _history = new();
    private readonly List<ItineraryBlock> _locked = new();
    private ShoppingErrand? _errand;
    private bool _tryNew;
    private int _seed = 1;

    public PlannerInputsBuilder Members(params (string name, int age)[] m)
    {
        foreach (var (n, a) in m) _members.Add(new FamilyMember { Id = Guid.NewGuid(), Name = n, Age = a });
        return this;
    }

    public PlannerInputsBuilder Commitment(DayOfWeek day, TimeOnly start, TimeOnly end, string title = "Commit")
    {
        _commitments.Add(new Commitment { Id = Guid.NewGuid(), Title = title, DayOfWeek = day, StartTime = start, EndTime = end });
        return this;
    }

    public PlannerInputsBuilder Preference(PreferenceKind kind, string value)
    {
        _preferences.Add(new Preference { Id = Guid.NewGuid(), Kind = kind, Value = value });
        return this;
    }

    public PlannerInputsBuilder Activity(
        string name, bool indoor = false, int minAge = 0, int maxAge = 99, int drive = 5,
        int duration = 90, string category = "Outing", string description = "",
        params string[] weatherTags)
    {
        _activities.Add(new Activity
        {
            Id = Guid.NewGuid(), Name = name, Indoor = indoor, MinAge = minAge, MaxAge = maxAge,
            DriveMinutes = drive, TypicalDurationMinutes = duration, Category = category,
            Description = description, MapUrl = "u",
            WeatherTags = weatherTags.ToList()
        });
        return this;
    }

    public PlannerInputsBuilder Restaurant(string name, MealSlot slot, int drive, bool wifeApproved = true, string style = "")
    {
        _restaurants.Add(new Restaurant
        {
            Id = Guid.NewGuid(), Name = name, Slot = slot, DriveMinutes = drive,
            WifeApproved = wifeApproved, Style = style
        });
        return this;
    }

    public PlannerInputsBuilder Forecast(DateOnly date, bool unavailable = false, params string[] tags)
    {
        _forecast.Add(new WeatherForecast(date, tags, 18, 10, 0.0, unavailable));
        return this;
    }

    public PlannerInputsBuilder HistoricalActivityWeeksAgo(Guid activityId, int weeksBack)
    {
        _history.Add(new HistoricalActivity(_weekendOf.AddDays(-7 * weeksBack), activityId));
        return this;
    }

    public PlannerInputsBuilder LockedBlock(ItineraryBlock block) { _locked.Add(block); return this; }
    public PlannerInputsBuilder Errand(int estimatedMinutes, string description = "Costco")
    {
        _errand = new ShoppingErrand { Id = Guid.NewGuid(), Description = description, EstimatedMinutes = estimatedMinutes };
        return this;
    }
    public PlannerInputsBuilder TryNew(bool v = true) { _tryNew = v; return this; }
    public PlannerInputsBuilder Seed(int seed) { _seed = seed; return this; }
    public PlannerInputsBuilder WeekendOf(DateOnly d) { _weekendOf = d; return this; }

    public Guid LastActivityId() => _activities[^1].Id;
    public IReadOnlyList<Activity> Activities => _activities;

    public PlannerInputs Build() => new(
        _familyId, _weekendOf, _members, _commitments, _preferences, _activities, _restaurants, _events,
        _forecast, _history, _errand, _locked, _tryNew, _seed);
}
