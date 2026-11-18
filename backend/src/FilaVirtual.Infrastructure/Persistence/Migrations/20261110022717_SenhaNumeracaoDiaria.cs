using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilaVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SenhaNumeracaoDiaria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "DataReferencia",
                table: "senhas_fila",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.CreateIndex(
                name: "IX_senhas_fila_UnidadeCrasId_DataReferencia_Numero",
                table: "senhas_fila",
                columns: new[] { "UnidadeCrasId", "DataReferencia", "Numero" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_senhas_fila_UnidadeCrasId_DataReferencia_Numero",
                table: "senhas_fila");

            migrationBuilder.DropColumn(
                name: "DataReferencia",
                table: "senhas_fila");
        }
    }
}
