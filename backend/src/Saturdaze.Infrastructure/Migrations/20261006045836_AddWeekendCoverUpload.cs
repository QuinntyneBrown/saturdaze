using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWeekendCoverUpload : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CoverUploadHeight",
                table: "Weekends",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverUploadKey",
                table: "Weekends",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoverUploadWidth",
                table: "Weekends",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverUploadHeight",
                table: "Weekends");

            migrationBuilder.DropColumn(
                name: "CoverUploadKey",
                table: "Weekends");

            migrationBuilder.DropColumn(
                name: "CoverUploadWidth",
                table: "Weekends");
        }
    }
}
