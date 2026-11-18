using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilaVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HorarioConcorrencia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VagasOcupadas",
                table: "horarios_atendimento",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "horarios_atendimento",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddCheckConstraint(
                name: "ck_horarios_vagas_ocupadas",
                table: "horarios_atendimento",
                sql: "\"VagasOcupadas\" BETWEEN 0 AND \"Vagas\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_horarios_vagas_ocupadas",
                table: "horarios_atendimento");

            migrationBuilder.DropColumn(
                name: "VagasOcupadas",
                table: "horarios_atendimento");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "horarios_atendimento");
        }
    }
}
