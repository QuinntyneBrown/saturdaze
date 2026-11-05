using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCoupleDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoupleDates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FamilyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WeekendId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Day = table.Column<int>(type: "int", nullable: false),
                    Meal = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    AttendeeMemberIds = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ActivityDropped = table.Column<bool>(type: "bit", nullable: false),
                    RejectedRestaurantIds = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    RejectedActivityIds = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    StepsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RegenerateCount = table.Column<int>(type: "int", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoupleDates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoupleDates_Weekends_WeekendId",
                        column: x => x.WeekendId,
                        principalTable: "Weekends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CoupleDates_FamilyId",
                table: "CoupleDates",
                column: "FamilyId");

            migrationBuilder.CreateIndex(
                name: "IX_CoupleDates_WeekendId_Day_Meal",
                table: "CoupleDates",
                columns: new[] { "WeekendId", "Day", "Meal" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoupleDates");
        }
    }
}
