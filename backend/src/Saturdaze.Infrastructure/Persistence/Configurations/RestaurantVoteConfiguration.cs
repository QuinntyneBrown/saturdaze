using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class RestaurantVoteConfiguration : IEntityTypeConfiguration<RestaurantVote>
{
    public void Configure(EntityTypeBuilder<RestaurantVote> b)
    {
        b.ToTable("RestaurantVotes");
        b.HasKey(x => x.Id);
        b.Property(x => x.VoterName).HasMaxLength(100).IsRequired();
        b.Property(x => x.Vote).HasMaxLength(12).IsRequired();
        b.HasIndex(x => new { x.FamilyId, x.RestaurantId, x.VoterName }).IsUnique();
        b.HasOne<Restaurant>().WithMany().HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
    }
}
