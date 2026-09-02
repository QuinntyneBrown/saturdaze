using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilySettingsAndBlockIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "FridayPreviewEnabled",
                table: "Families",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Families",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TryNewEnabled",
                table: "Families",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_ItineraryBlocks_Kind_RefId",
                table: "ItineraryBlocks",
                columns: new[] { "Kind", "RefId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ItineraryBlocks_Kind_RefId",
                table: "ItineraryBlocks");

            migrationBuilder.DropColumn(
                name: "FridayPreviewEnabled",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "TryNewEnabled",
                table: "Families");
        }
    }
}
