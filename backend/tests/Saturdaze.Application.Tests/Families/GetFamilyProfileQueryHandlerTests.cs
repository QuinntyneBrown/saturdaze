using FluentAssertions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Families;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Families;

public class GetFamilyProfileQueryHandlerTests
{
    [Fact]
    public async Task Returns_family_with_sorted_children()
    {
        await using var app = TestApp.Create();
        var family = new Family
        {
            Id = Guid.NewGuid(),
            HomeLocation = "Port Credit",
            BudgetEnabled = true,
            Members =
            {
                new FamilyMember { Id = Guid.NewGuid(), Name = "Quinn", Age = 41 },
                new FamilyMember { Id = Guid.NewGuid(), Name = "Avery", Age = 5 },
                new FamilyMember { Id = Guid.NewGuid(), Name = "Theo",  Age = 9 }
            },
            Commitments =
            {
                new Commitment { Id = Guid.NewGuid(), Title = "Church", DayOfWeek = DayOfWeek.Sunday, StartTime = new TimeOnly(10,30), EndTime = new TimeOnly(12,0) },
                new Commitment { Id = Guid.NewGuid(), Title = "Swim",   DayOfWeek = DayOfWeek.Saturday, StartTime = new TimeOnly(9,30), EndTime = new TimeOnly(10,30) }
            },
            Preferences =
            {
                new Preference { Id = Guid.NewGuid(), Kind = PreferenceKind.Dislike, Value = "long-drive" },
                new Preference { Id = Guid.NewGuid(), Kind = PreferenceKind.Like,    Value = "outdoors" }
            }
        };
        app.Db.Families.Add(family);
        await app.Db.SaveChangesAsync();
        app.FamilyAccessor.FamilyId = family.Id;

        var handler = new GetFamilyProfileQueryHandler(app.Db, app.FamilyAccessor);
        var dto = await handler.Handle(new GetFamilyProfileQuery(), default);

        dto.Id.Should().Be(family.Id);
        dto.HomeLocation.Should().Be("Port Credit");
        dto.BudgetEnabled.Should().BeTrue();

        dto.Members.Select(m => m.Name).Should().Equal("Avery", "Theo", "Quinn"); // by age asc
        dto.Commitments.Select(c => c.Title).Should().Equal("Swim", "Church");    // Sat before Sun
        dto.Preferences.Select(p => (p.Kind, p.Value))
            .Should().Equal((PreferenceKind.Like, "outdoors"), (PreferenceKind.Dislike, "long-drive"));
    }

    [Fact]
    public async Task Throws_NotFound_when_family_missing()
    {
        await using var app = TestApp.Create();
        app.FamilyAccessor.FamilyId = Guid.NewGuid();

        var handler = new GetFamilyProfileQueryHandler(app.Db, app.FamilyAccessor);
        var act = async () => await handler.Handle(new GetFamilyProfileQuery(), default);
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
