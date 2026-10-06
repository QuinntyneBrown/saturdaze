using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaceLocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Restaurants",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "Restaurants",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "Restaurants",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "LocalEvents",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "LocalEvents",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "LocalEvents",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HomeAddress",
                table: "Families",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HomeLatitude",
                table: "Families",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HomeLongitude",
                table: "Families",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "EventSubmissions",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "EventSubmissions",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "EventSubmissions",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Activities",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "Activities",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "Activities",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "HomeAddress",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "HomeLatitude",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "HomeLongitude",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "EventSubmissions");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "EventSubmissions");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "EventSubmissions");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Activities");
        }
    }
}
