using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilaVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "servicos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DuracaoMediaMinutos = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_servicos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "unidades_cras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Endereco = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Bairro = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    HorarioFuncionamento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Telefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unidades_cras", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "servico_documentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Obrigatorio = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_servico_documentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_servico_documentos_servicos_ServicoId",
                        column: x => x.ServicoId,
                        principalTable: "servicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "horarios_atendimento",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UnidadeCrasId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicoId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataHora = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Vagas = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_horarios_atendimento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_horarios_atendimento_servicos_ServicoId",
                        column: x => x.ServicoId,
                        principalTable: "servicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_horarios_atendimento_unidades_cras_UnidadeCrasId",
                        column: x => x.UnidadeCrasId,
                        principalTable: "unidades_cras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "unidade_servicos",
                columns: table => new
                {
                    UnidadeCrasId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicoId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_unidade_servicos", x => new { x.UnidadeCrasId, x.ServicoId });
                    table.ForeignKey(
                        name: "FK_unidade_servicos_servicos_ServicoId",
                        column: x => x.ServicoId,
                        principalTable: "servicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_unidade_servicos_unidades_cras_UnidadeCrasId",
                        column: x => x.UnidadeCrasId,
                        principalTable: "unidades_cras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NomeCompleto = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Cpf = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: false),
                    DataNascimento = table.Column<DateOnly>(type: "date", nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    SenhaHash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Perfil = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    UnidadeCrasId = table.Column<Guid>(type: "uuid", nullable: true),
                    CriadoEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_usuarios_unidades_cras_UnidadeCrasId",
                        column: x => x.UnidadeCrasId,
                        principalTable: "unidades_cras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "agendamentos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    HorarioAtendimentoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CodigoCheckin = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    CriadoEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agendamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_agendamentos_horarios_atendimento_HorarioAtendimentoId",
                        column: x => x.HorarioAtendimentoId,
                        principalTable: "horarios_atendimento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_agendamentos_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "notificacoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Mensagem = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Lida = table.Column<bool>(type: "boolean", nullable: false),
                    CriadaEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notificacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_notificacoes_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "senhas_fila",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UnidadeCrasId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicoId = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    AgendamentoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Numero = table.Column<int>(type: "integer", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Prioridade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Guiche = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EmitidaEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ChamadaEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    FinalizadaEm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_senhas_fila", x => x.Id);
                    table.ForeignKey(
                        name: "FK_senhas_fila_agendamentos_AgendamentoId",
                        column: x => x.AgendamentoId,
                        principalTable: "agendamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_senhas_fila_servicos_ServicoId",
                        column: x => x.ServicoId,
                        principalTable: "servicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_senhas_fila_unidades_cras_UnidadeCrasId",
                        column: x => x.UnidadeCrasId,
                        principalTable: "unidades_cras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_senhas_fila_usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_CodigoCheckin",
                table: "agendamentos",
                column: "CodigoCheckin",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_HorarioAtendimentoId",
                table: "agendamentos",
                column: "HorarioAtendimentoId");

            migrationBuilder.CreateIndex(
                name: "IX_agendamentos_UsuarioId_HorarioAtendimentoId",
                table: "agendamentos",
                columns: new[] { "UsuarioId", "HorarioAtendimentoId" },
                unique: true,
                filter: "\"Status\" <> 'Cancelado'");

            migrationBuilder.CreateIndex(
                name: "IX_horarios_atendimento_ServicoId",
                table: "horarios_atendimento",
                column: "ServicoId");

            migrationBuilder.CreateIndex(
                name: "IX_horarios_atendimento_UnidadeCrasId_ServicoId_DataHora",
                table: "horarios_atendimento",
                columns: new[] { "UnidadeCrasId", "ServicoId", "DataHora" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_notificacoes_UsuarioId_Lida_CriadaEm",
                table: "notificacoes",
                columns: new[] { "UsuarioId", "Lida", "CriadaEm" });

            migrationBuilder.CreateIndex(
                name: "IX_senhas_fila_AgendamentoId",
                table: "senhas_fila",
                column: "AgendamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_senhas_fila_ServicoId",
                table: "senhas_fila",
                column: "ServicoId");

            migrationBuilder.CreateIndex(
                name: "IX_senhas_fila_UnidadeCrasId_Status_EmitidaEm",
                table: "senhas_fila",
                columns: new[] { "UnidadeCrasId", "Status", "EmitidaEm" });

            migrationBuilder.CreateIndex(
                name: "IX_senhas_fila_UsuarioId",
                table: "senhas_fila",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_servico_documentos_ServicoId",
                table: "servico_documentos",
                column: "ServicoId");

            migrationBuilder.CreateIndex(
                name: "IX_unidade_servicos_ServicoId",
                table: "unidade_servicos",
                column: "ServicoId");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_Cpf",
                table: "usuarios",
                column: "Cpf",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_Email",
                table: "usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_UnidadeCrasId",
                table: "usuarios",
                column: "UnidadeCrasId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "notificacoes");

            migrationBuilder.DropTable(
                name: "senhas_fila");

            migrationBuilder.DropTable(
                name: "servico_documentos");

            migrationBuilder.DropTable(
                name: "unidade_servicos");

            migrationBuilder.DropTable(
                name: "agendamentos");

            migrationBuilder.DropTable(
                name: "horarios_atendimento");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "servicos");

            migrationBuilder.DropTable(
                name: "unidades_cras");
        }
    }
}
