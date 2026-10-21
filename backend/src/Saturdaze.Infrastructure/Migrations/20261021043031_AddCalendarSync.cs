using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FailedAttempts",
                table: "CalendarConnections",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "NextAttemptUtc",
                table: "CalendarConnections",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SyncRequestedUtc",
                table: "CalendarConnections",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CalendarEventLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConnectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WeekendId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BlockId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: false),
                    Fingerprint = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEventLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarEventLinks_CalendarConnections_ConnectionId",
                        column: x => x.ConnectionId,
                        principalTable: "CalendarConnections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarConnections_SyncRequestedUtc",
                table: "CalendarConnections",
                column: "SyncRequestedUtc");

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEventLinks_ConnectionId_WeekendId_BlockId",
                table: "CalendarEventLinks",
                columns: new[] { "ConnectionId", "WeekendId", "BlockId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarEventLinks");

            migrationBuilder.DropIndex(
                name: "IX_CalendarConnections_SyncRequestedUtc",
                table: "CalendarConnections");

            migrationBuilder.DropColumn(
                name: "FailedAttempts",
                table: "CalendarConnections");

            migrationBuilder.DropColumn(
                name: "NextAttemptUtc",
                table: "CalendarConnections");

            migrationBuilder.DropColumn(
                name: "SyncRequestedUtc",
                table: "CalendarConnections");
        }
    }
}
