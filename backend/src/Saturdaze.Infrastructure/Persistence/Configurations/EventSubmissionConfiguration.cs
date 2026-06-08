using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class EventSubmissionConfiguration : IEntityTypeConfiguration<EventSubmission>
{
    public void Configure(EntityTypeBuilder<EventSubmission> b)
    {
        b.ToTable("EventSubmissions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Location).HasMaxLength(200);
        b.Property(x => x.Description).HasMaxLength(2000);
        b.Property(x => x.CostNote).HasMaxLength(80);
        b.Property(x => x.AgeRange).HasMaxLength(80);
        b.Property(x => x.SourceUrl).HasMaxLength(500);
        b.Property(x => x.Category).HasMaxLength(80);
        b.Property(x => x.RejectionReason).HasMaxLength(500);
        b.Property(x => x.Status).HasConversion<int>();
        b.HasIndex(x => new { x.Status, x.SubmittedAtUtc });
        b.HasIndex(x => x.SubmittedByUserId);
    }
}
