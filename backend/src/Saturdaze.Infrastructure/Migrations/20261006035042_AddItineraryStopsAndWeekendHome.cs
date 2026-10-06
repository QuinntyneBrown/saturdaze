using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddItineraryStopsAndWeekendHome : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HomeAddress",
                table: "Weekends",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HomeLatitude",
                table: "Weekends",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HomeLongitude",
                table: "Weekends",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StopAddress",
                table: "ItineraryBlocks",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StopLatitude",
                table: "ItineraryBlocks",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StopLongitude",
                table: "ItineraryBlocks",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HomeAddress",
                table: "Weekends");

            migrationBuilder.DropColumn(
                name: "HomeLatitude",
                table: "Weekends");

            migrationBuilder.DropColumn(
                name: "HomeLongitude",
                table: "Weekends");

            migrationBuilder.DropColumn(
                name: "StopAddress",
                table: "ItineraryBlocks");

            migrationBuilder.DropColumn(
                name: "StopLatitude",
                table: "ItineraryBlocks");

            migrationBuilder.DropColumn(
                name: "StopLongitude",
                table: "ItineraryBlocks");
        }
    }
}
