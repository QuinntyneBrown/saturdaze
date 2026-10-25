using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class AgentRunConfiguration : IEntityTypeConfiguration<AgentRun>
{
    public void Configure(EntityTypeBuilder<AgentRun> b)
    {
        b.ToTable("AgentRuns");
        b.HasKey(x => x.Id);
        b.Property(x => x.Error).HasMaxLength(2000);
        b.Property(x => x.PolicyViolations).HasMaxLength(4000);
        b.Property(x => x.TraceId).HasMaxLength(64);
        b.Property(x => x.CostUsd).HasPrecision(12, 6);
        b.HasIndex(x => new { x.FamilyId, x.WeekendOf });
        b.HasIndex(x => new { x.Status, x.QueuedUtc });
    }
}

public class WeekendDraftConfiguration : IEntityTypeConfiguration<WeekendDraft>
{
    public void Configure(EntityTypeBuilder<WeekendDraft> b)
    {
        b.ToTable("WeekendDrafts");
        b.HasKey(x => x.Id);
        b.Property(x => x.ShortlistJson).IsRequired();
        b.Property(x => x.PicksJson).IsRequired();
        b.Property(x => x.ValidatorReport).IsRequired();
        b.HasIndex(x => x.AgentRunId).IsUnique();
        b.HasIndex(x => new { x.FamilyId, x.WeekendOf });
    }
}

public class RegionResearchConfiguration : IEntityTypeConfiguration<RegionResearch>
{
    public void Configure(EntityTypeBuilder<RegionResearch> b)
    {
        b.ToTable("RegionResearch");
        b.HasKey(x => x.Id);
        b.Property(x => x.CellKey).HasMaxLength(32).IsRequired();
        b.HasIndex(x => new { x.CellKey, x.WeekendOf });
    }
}
