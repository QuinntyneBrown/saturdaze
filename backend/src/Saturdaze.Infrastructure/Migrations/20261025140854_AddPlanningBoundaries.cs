using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanningBoundaries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Interests",
                table: "FamilyMembers",
                type: "nvarchar(400)",
                maxLength: 400,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<TimeOnly>(
                name: "DayStart",
                table: "Families",
                type: "time",
                nullable: false,
                defaultValue: new TimeOnly(9, 0, 0));

            migrationBuilder.AddColumn<string>(
                name: "ExcludedThemes",
                table: "Families",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Leaning",
                table: "Families",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxDriveMinutes",
                table: "Families",
                type: "int",
                nullable: false,
                defaultValue: 120);

            migrationBuilder.AddColumn<int>(
                name: "OutingsPerDay",
                table: "Families",
                type: "int",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<bool>(
                name: "QuietSunday",
                table: "Families",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SundayDinnerAtHome",
                table: "Families",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "YoungestBedtime",
                table: "Families",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttendeeMemberIds",
                table: "Commitments",
                type: "nvarchar(400)",
                maxLength: 400,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LocationAddress",
                table: "Commitments",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LocationLatitude",
                table: "Commitments",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LocationLongitude",
                table: "Commitments",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Interests",
                table: "FamilyMembers");

            migrationBuilder.DropColumn(
                name: "DayStart",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "ExcludedThemes",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "Leaning",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "MaxDriveMinutes",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "OutingsPerDay",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "QuietSunday",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "SundayDinnerAtHome",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "YoungestBedtime",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "AttendeeMemberIds",
                table: "Commitments");

            migrationBuilder.DropColumn(
                name: "LocationAddress",
                table: "Commitments");

            migrationBuilder.DropColumn(
                name: "LocationLatitude",
                table: "Commitments");

            migrationBuilder.DropColumn(
                name: "LocationLongitude",
                table: "Commitments");
        }
    }
}
