using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogFacts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeOnly>(
                name: "EndTime",
                table: "LocalEvents",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxAge",
                table: "LocalEvents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinAge",
                table: "LocalEvents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PriceTier",
                table: "LocalEvents",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "StartTime",
                table: "LocalEvents",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Themes",
                table: "LocalEvents",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<TimeOnly>(
                name: "ClosesAt",
                table: "Activities",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "OpensAt",
                table: "Activities",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PriceTier",
                table: "Activities",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeasonEndMonth",
                table: "Activities",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SeasonStartMonth",
                table: "Activities",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceUrl",
                table: "Activities",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Themes",
                table: "Activities",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "MaxAge",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "MinAge",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "PriceTier",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "Themes",
                table: "LocalEvents");

            migrationBuilder.DropColumn(
                name: "ClosesAt",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "OpensAt",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "PriceTier",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "SeasonEndMonth",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "SeasonStartMonth",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "SourceUrl",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "Themes",
                table: "Activities");
        }
    }
}
