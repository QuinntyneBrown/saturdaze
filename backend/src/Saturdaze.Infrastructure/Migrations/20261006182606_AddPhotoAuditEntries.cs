using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoAuditEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PhotoAuditEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sequence = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OccurredAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    AdminUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdminEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    PlaceKind = table.Column<int>(type: "int", nullable: false),
                    PlaceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PhotoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<int>(type: "int", nullable: false),
                    Before = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    After = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoAuditEntries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoAuditEntries_Admin",
                table: "PhotoAuditEntries",
                column: "AdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoAuditEntries_OccurredAt",
                table: "PhotoAuditEntries",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoAuditEntries_Place",
                table: "PhotoAuditEntries",
                columns: new[] { "PlaceKind", "PlaceId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PhotoAuditEntries");
        }
    }
}
