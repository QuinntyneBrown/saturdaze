using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Saturdaze.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminPhotoColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AdminLocked",
                table: "PlacePhotos",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Existing rows: curated and seeded photos count as reviewed; provider photos
            // ingestion stored before review existed wait in the queue (L2-120).
            migrationBuilder.AddColumn<int>(
                name: "ReviewState",
                table: "PlacePhotos",
                type: "int",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.Sql("UPDATE [PlacePhotos] SET [ReviewState] = 1 WHERE [Source] = 2");

            migrationBuilder.AddColumn<string>(
                name: "StorageKey",
                table: "PlacePhotos",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UpdatedAt",
                table: "PlacePhotos",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedBy",
                table: "PlacePhotos",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdminLocked",
                table: "PlacePhotos");

            migrationBuilder.DropColumn(
                name: "ReviewState",
                table: "PlacePhotos");

            migrationBuilder.DropColumn(
                name: "StorageKey",
                table: "PlacePhotos");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PlacePhotos");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "PlacePhotos");
        }
    }
}
