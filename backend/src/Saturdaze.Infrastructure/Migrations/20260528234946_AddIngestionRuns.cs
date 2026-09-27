using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIngestionRuns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LocalEvents_Name_StartsOn",
                table: "LocalEvents");

            migrationBuilder.CreateTable(
                name: "IngestionRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    FinishedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ItemsConsidered = table.Column<int>(type: "int", nullable: false),
                    ItemsUpserted = table.Column<int>(type: "int", nullable: false),
                    ItemsRejected = table.Column<int>(type: "int", nullable: false),
                    InputTokens = table.Column<int>(type: "int", nullable: false),
                    OutputTokens = table.Column<int>(type: "int", nullable: false),
                    WebSearchCount = table.Column<int>(type: "int", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IngestionRuns", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LocalEvents_Name_StartsOn_Location",
                table: "LocalEvents",
                columns: new[] { "Name", "StartsOn", "Location" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IngestionRuns_Type_StartedUtc",
                table: "IngestionRuns",
                columns: new[] { "Type", "StartedUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IngestionRuns");

            migrationBuilder.DropIndex(
                name: "IX_LocalEvents_Name_StartsOn_Location",
                table: "LocalEvents");

            migrationBuilder.CreateIndex(
                name: "IX_LocalEvents_Name_StartsOn",
                table: "LocalEvents",
                columns: new[] { "Name", "StartsOn" },
                unique: true);
        }
    }
}
