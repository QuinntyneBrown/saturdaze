using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class EmailTemplateRevisionConfiguration : IEntityTypeConfiguration<EmailTemplateRevision>
{
    public void Configure(EntityTypeBuilder<EmailTemplateRevision> b)
    {
        b.ToTable("EmailTemplateRevisions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Action).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Name).HasMaxLength(120).IsRequired();
        b.Property(x => x.Subject).HasMaxLength(200).IsRequired();
        b.Property(x => x.Preheader).HasMaxLength(200).IsRequired();
        b.Property(x => x.HtmlBody).IsRequired();
        b.Property(x => x.TextBody).IsRequired();
        b.Property(x => x.SampleData).IsRequired();
        b.Property(x => x.AdminEmail).HasMaxLength(256).IsRequired();
        b.HasIndex(x => new { x.TemplateId, x.Version }).IsUnique()
            .HasDatabaseName("IX_EmailTemplateRevisions_Template_Version");
        // A template's history goes with it (L2-129).
        b.HasOne<EmailTemplate>().WithMany().HasForeignKey(x => x.TemplateId).OnDelete(DeleteBehavior.Cascade);
    }
}
