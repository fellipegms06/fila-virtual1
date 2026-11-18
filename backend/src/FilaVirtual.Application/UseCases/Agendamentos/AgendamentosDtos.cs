using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.UseCases.Agendamentos;

public record ListarHorariosRequest(Guid UnidadeId, Guid ServicoId, DateOnly? Data);

public record HorarioResponse(Guid Id, DateTimeOffset DataHora, int VagasDisponiveis);

public record AgendarAtendimentoRequest(Guid HorarioAtendimentoId);

public record AgendamentoResponse(
    Guid Id, Guid UnidadeId, string Unidade, string EnderecoUnidade, Guid ServicoId, string Servico,
    DateTimeOffset DataHora, string Status, string CodigoCheckin, string? Senha)
{
    public static AgendamentoResponse De(Agendamento a, string? senha = null) => new(
        a.Id, a.Horario.UnidadeCrasId, a.Horario.Unidade.Nome, a.Horario.Unidade.Endereco,
        a.Horario.ServicoId, a.Horario.Servico.Nome, a.Horario.DataHora, a.Status.ToString(), a.CodigoCheckin, senha);
}
