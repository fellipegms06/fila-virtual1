using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilaVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TokensDeConcorrencia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "senhas_fila",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "agendamentos",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "xmin",
                table: "senhas_fila");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "agendamentos");
        }
    }
}
