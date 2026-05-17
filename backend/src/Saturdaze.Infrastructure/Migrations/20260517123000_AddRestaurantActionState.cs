using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Saturdaze.Infrastructure.Persistence;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260517123000_AddRestaurantActionState")]
    public partial class AddRestaurantActionState : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RestaurantLocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Day = table.Column<int>(type: "int", nullable: false),
                    Slot = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantLocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RestaurantLocks_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VoterName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Vote = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RestaurantVotes_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantLocks_FamilyId_Day_Slot",
                table: "RestaurantLocks",
                columns: new[] { "FamilyId", "Day", "Slot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantLocks_RestaurantId",
                table: "RestaurantLocks",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantVotes_FamilyId_RestaurantId_VoterName",
                table: "RestaurantVotes",
                columns: new[] { "FamilyId", "RestaurantId", "VoterName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantVotes_RestaurantId",
                table: "RestaurantVotes",
                column: "RestaurantId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RestaurantLocks");
            migrationBuilder.DropTable(name: "RestaurantVotes");
        }
    }
}
