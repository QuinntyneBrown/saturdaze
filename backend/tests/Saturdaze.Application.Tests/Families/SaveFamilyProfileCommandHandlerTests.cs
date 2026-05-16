using FluentAssertions;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Application.Common;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Families;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Families;

public class SaveFamilyProfileCommandHandlerTests
{
    [Fact]
    public async Task Creates_family_on_first_save()
    {
        await using var app = TestApp.Create();
        var mediator = BuildMediator(app);

        var cmd = new SaveFamilyProfileCommand(
            "Port Credit",
            BudgetEnabled: true,
            Members: new[] { new SaveMemberInput("Quinn", 41), new SaveMemberInput("Theo", 9) },
            Commitments: new[] { new SaveCommitmentInput("Swim", DayOfWeek.Saturday, new TimeOnly(9, 30), new TimeOnly(10, 30)) },
            Preferences: new[] { new SavePreferenceInput(PreferenceKind.Like, "outdoors") });

        var dto = await mediator.Send(cmd);

        dto.HomeLocation.Should().Be("Port Credit");
        dto.Members.Should().HaveCount(2);
        dto.Commitments.Should().HaveCount(1);
        dto.Preferences.Should().HaveCount(1);
        (await app.Db.Families.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Updates_existing_member_age_by_name_match()
    {
        await using var app = TestApp.Create();
        var familyId = Guid.NewGuid();
        var existingMemberId = Guid.NewGuid();
        app.Db.Families.Add(new Family
        {
            Id = familyId,
            HomeLocation = "Old",
            Members = { new FamilyMember { Id = existingMemberId, FamilyId = familyId, Name = "Theo", Age = 8 } }
        });
        await app.Db.SaveChangesAsync();
        app.FamilyAccessor.FamilyId = familyId;
        var mediator = BuildMediator(app);

        var cmd = new SaveFamilyProfileCommand(
            "New Home",
            BudgetEnabled: false,
            Members: new[] { new SaveMemberInput("Theo", 9) },
            Commitments: Array.Empty<SaveCommitmentInput>(),
            Preferences: Array.Empty<SavePreferenceInput>());

        var dto = await mediator.Send(cmd);

        dto.HomeLocation.Should().Be("New Home");
        dto.Members.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(new { Id = existingMemberId, Name = "Theo", Age = 9 });
    }

    [Fact]
    public async Task Removes_members_not_in_request()
    {
        await using var app = TestApp.Create();
        var familyId = Guid.NewGuid();
        app.Db.Families.Add(new Family
        {
            Id = familyId,
            HomeLocation = "X",
            Members =
            {
                new FamilyMember { Id = Guid.NewGuid(), FamilyId = familyId, Name = "A", Age = 1 },
                new FamilyMember { Id = Guid.NewGuid(), FamilyId = familyId, Name = "B", Age = 2 }
            }
        });
        await app.Db.SaveChangesAsync();
        app.FamilyAccessor.FamilyId = familyId;
        var mediator = BuildMediator(app);

        var cmd = new SaveFamilyProfileCommand(
            "X",
            BudgetEnabled: false,
            Members: new[] { new SaveMemberInput("A", 1) },
            Commitments: Array.Empty<SaveCommitmentInput>(),
            Preferences: Array.Empty<SavePreferenceInput>());

        var dto = await mediator.Send(cmd);
        dto.Members.Select(m => m.Name).Should().Equal("A");
    }

    private static IMediator BuildMediator(TestApp app)
    {
        var services = new ServiceCollection();
        services.AddSingleton<IAppDbContext>(app.Db);
        services.AddSingleton<ICurrentFamilyAccessor>(app.FamilyAccessor);
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<SaveFamilyProfileCommand>());
        return services.BuildServiceProvider().GetRequiredService<IMediator>();
    }
}

internal static class DbExtensions
{
    public static async Task<int> CountAsync<T>(this Microsoft.EntityFrameworkCore.DbSet<T> set) where T : class
    {
        var list = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(set);
        return list.Count;
    }
}
