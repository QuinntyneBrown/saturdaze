using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWeekendCover : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CoverPlaceId",
                table: "Weekends",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoverPlaceKind",
                table: "Weekends",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoverSource",
                table: "Weekends",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverPlaceId",
                table: "Weekends");

            migrationBuilder.DropColumn(
                name: "CoverPlaceKind",
                table: "Weekends");

            migrationBuilder.DropColumn(
                name: "CoverSource",
                table: "Weekends");
        }
    }
}
