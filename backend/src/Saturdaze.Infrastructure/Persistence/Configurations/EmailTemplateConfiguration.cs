using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class EmailTemplateConfiguration : IEntityTypeConfiguration<EmailTemplate>
{
    public void Configure(EntityTypeBuilder<EmailTemplate> b)
    {
        b.ToTable("EmailTemplates");
        b.HasKey(x => x.Id);
        b.Property(x => x.Key).HasMaxLength(100).IsRequired();
        b.Property(x => x.Name).HasMaxLength(120).IsRequired();
        b.Property(x => x.Description).HasMaxLength(500).IsRequired();
        b.Property(x => x.Category).HasConversion<string>().HasMaxLength(32);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Subject).HasMaxLength(200).IsRequired();
        b.Property(x => x.Preheader).HasMaxLength(200).IsRequired();
        // Bounded by validation (L2-124): 100 000 and 50 000 characters.
        b.Property(x => x.HtmlBody).IsRequired();
        b.Property(x => x.TextBody).IsRequired();
        b.Property(x => x.SampleData).IsRequired();
        b.Property(x => x.CreatedByEmail).HasMaxLength(256).IsRequired();
        b.Property(x => x.UpdatedByEmail).HasMaxLength(256).IsRequired();
        // Concurrent saves never overwrite each other (L2-127 AC2).
        b.Property(x => x.Version).IsConcurrencyToken();
        b.HasIndex(x => x.Key).IsUnique().HasDatabaseName("IX_EmailTemplates_Key");
        b.HasIndex(x => new { x.Category, x.Status }).HasDatabaseName("IX_EmailTemplates_Category_Status");
    }
}
