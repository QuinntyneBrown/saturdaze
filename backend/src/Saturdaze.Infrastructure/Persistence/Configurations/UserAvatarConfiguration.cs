using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class UserAvatarConfiguration : IEntityTypeConfiguration<UserAvatar>
{
    public void Configure(EntityTypeBuilder<UserAvatar> b)
    {
        b.ToTable("UserAvatars");
        b.HasKey(x => x.UserId);
        b.Property(x => x.ContentType).HasMaxLength(32).IsRequired();
        b.Property(x => x.Data).IsRequired();
        b.HasOne<User>().WithOne().HasForeignKey<UserAvatar>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
