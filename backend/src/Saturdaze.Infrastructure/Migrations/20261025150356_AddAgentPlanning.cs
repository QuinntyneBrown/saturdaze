using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentPlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlanSource",
                table: "Weekends",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "AgentRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WeekendOf = table.Column<DateOnly>(type: "date", nullable: false),
                    Trigger = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    FallbackReason = table.Column<int>(type: "int", nullable: true),
                    Error = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    QueuedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    StartedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    FinishedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Rounds = table.Column<int>(type: "int", nullable: false),
                    ModelCalls = table.Column<int>(type: "int", nullable: false),
                    ToolCalls = table.Column<int>(type: "int", nullable: false),
                    WebSearches = table.Column<int>(type: "int", nullable: false),
                    InputTokens = table.Column<int>(type: "int", nullable: false),
                    OutputTokens = table.Column<int>(type: "int", nullable: false),
                    CostUsd = table.Column<decimal>(type: "decimal(12,6)", precision: 12, scale: 6, nullable: false),
                    PolicyViolations = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    TraceId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentRuns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RegionResearch",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CellKey = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    WeekendOf = table.Column<DateOnly>(type: "date", nullable: false),
                    AgentRunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompletedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ItemsUpserted = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegionResearch", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WeekendDrafts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AgentRunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WeekendOf = table.Column<DateOnly>(type: "date", nullable: false),
                    ShortlistJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PicksJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ValidatorReport = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Applied = table.Column<bool>(type: "bit", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeekendDrafts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgentRuns_FamilyId_WeekendOf",
                table: "AgentRuns",
                columns: new[] { "FamilyId", "WeekendOf" });

            migrationBuilder.CreateIndex(
                name: "IX_AgentRuns_Status_QueuedUtc",
                table: "AgentRuns",
                columns: new[] { "Status", "QueuedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_RegionResearch_CellKey_WeekendOf",
                table: "RegionResearch",
                columns: new[] { "CellKey", "WeekendOf" });

            migrationBuilder.CreateIndex(
                name: "IX_WeekendDrafts_AgentRunId",
                table: "WeekendDrafts",
                column: "AgentRunId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WeekendDrafts_FamilyId_WeekendOf",
                table: "WeekendDrafts",
                columns: new[] { "FamilyId", "WeekendOf" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgentRuns");

            migrationBuilder.DropTable(
                name: "RegionResearch");

            migrationBuilder.DropTable(
                name: "WeekendDrafts");

            migrationBuilder.DropColumn(
                name: "PlanSource",
                table: "Weekends");
        }
    }
}
