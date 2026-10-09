using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerUserId",
                table: "Families",
                type: "uniqueidentifier",
                nullable: true);

            // Existing families are owned by their earliest-created account (L2-124).
            migrationBuilder.Sql(@"
UPDATE f SET [OwnerUserId] = (
    SELECT TOP 1 u.[Id] FROM [Users] u
    WHERE u.[FamilyId] = f.[Id]
    ORDER BY u.[CreatedAtUtc], u.[Id])
FROM [Families] f");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Families");
        }
    }
}
