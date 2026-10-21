using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarSyncRequestCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CalendarConnections_SyncRequestedUtc",
                table: "CalendarConnections");

            migrationBuilder.AddColumn<int>(
                name: "SyncRequestCount",
                table: "CalendarConnections",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SyncedRequestCount",
                table: "CalendarConnections",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_CalendarConnections_Status_SyncRequestCount_SyncedRequestCount",
                table: "CalendarConnections",
                columns: new[] { "Status", "SyncRequestCount", "SyncedRequestCount" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CalendarConnections_Status_SyncRequestCount_SyncedRequestCount",
                table: "CalendarConnections");

            migrationBuilder.DropColumn(
                name: "SyncRequestCount",
                table: "CalendarConnections");

            migrationBuilder.DropColumn(
                name: "SyncedRequestCount",
                table: "CalendarConnections");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarConnections_SyncRequestedUtc",
                table: "CalendarConnections",
                column: "SyncRequestedUtc");
        }
    }
}
