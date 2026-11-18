using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.Abstractions;

public interface IAgendamentoRepository
{
    Task AdicionarAsync(Agendamento agendamento, CancellationToken ct = default);

    Task<Agendamento?> ObterComHorarioAsync(Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<Agendamento>> ListarDoUsuarioAsync(Guid usuarioId, CancellationToken ct = default);

    Task<Agendamento?> ObterPorCodigoCheckinAsync(string codigo, CancellationToken ct = default);

    Task<IReadOnlyList<Agendamento>> ListarDaUnidadeEntreAsync(
        Guid unidadeId, DateTimeOffset de, DateTimeOffset ate, CancellationToken ct = default);

    Task<IReadOnlyList<Agendamento>> ListarParaLembreteAsync(DateTimeOffset de, DateTimeOffset ate, CancellationToken ct = default);

    Task<bool> UsuarioTemAgendamentoAtivoEmAsync(Guid usuarioId, DateTimeOffset dataHora, CancellationToken ct = default);
}
