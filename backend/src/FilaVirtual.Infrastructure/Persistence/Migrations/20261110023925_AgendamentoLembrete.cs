using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilaVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AgendamentoLembrete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "LembreteEnviado",
                table: "agendamentos",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LembreteEnviado",
                table: "agendamentos");
        }
    }
}
