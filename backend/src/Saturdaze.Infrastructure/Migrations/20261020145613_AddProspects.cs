using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProspects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Prospects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WeekendId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ClaimedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ClaimedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prospects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prospects_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Prospects_Weekends_WeekendId",
                        column: x => x.WeekendId,
                        principalTable: "Weekends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlatformInvitations_ProspectId",
                table: "PlatformInvitations",
                column: "ProspectId");

            migrationBuilder.CreateIndex(
                name: "IX_Prospects_CreatedAtUtc",
                table: "Prospects",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Prospects_FamilyId",
                table: "Prospects",
                column: "FamilyId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Prospects_WeekendId",
                table: "Prospects",
                column: "WeekendId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PlatformInvitations_Prospects_ProspectId",
                table: "PlatformInvitations",
                column: "ProspectId",
                principalTable: "Prospects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlatformInvitations_Prospects_ProspectId",
                table: "PlatformInvitations");

            migrationBuilder.DropTable(
                name: "Prospects");

            migrationBuilder.DropIndex(
                name: "IX_PlatformInvitations_ProspectId",
                table: "PlatformInvitations");
        }
    }
}
