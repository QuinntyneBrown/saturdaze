using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWeekendAuditEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeekendAuditEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sequence = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OccurredAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    AdminUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdminEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WeekendId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WeekendOf = table.Column<DateOnly>(type: "date", nullable: false),
                    Action = table.Column<int>(type: "int", nullable: false),
                    Day = table.Column<int>(type: "int", nullable: true),
                    BlockId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Before = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    After = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeekendAuditEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeekendAuditEntries_Family",
                table: "WeekendAuditEntries",
                columns: new[] { "FamilyId", "Sequence" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeekendAuditEntries");
        }
    }
}
