using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalEventLocationNaturalKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_LocalEvents_Name_StartsOn",
                table: "LocalEvents");

            migrationBuilder.CreateIndex(
                name: "IX_LocalEvents_Name_StartsOn_Location",
                table: "LocalEvents",
                columns: new[] { "Name", "StartsOn", "Location" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
