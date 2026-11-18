using FilaVirtual.Application.Abstractions;
using FilaVirtual.Infrastructure.Persistence;

namespace FilaVirtual.Infrastructure.Repositories;

public class AgendamentoRepository(AppDbContext db) : IAgendamentoRepository
{
    public async Task AdicionarAsync(Agendamento agendamento, CancellationToken ct = default) =>
        await db.Agendamentos.AddAsync(agendamento, ct);

    public Task<Agendamento?> ObterComHorarioAsync(Guid id, CancellationToken ct = default) =>
        ComHorario(db.Agendamentos).FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<IReadOnlyList<Agendamento>> ListarDoUsuarioAsync(Guid usuarioId, CancellationToken ct = default) =>
        await ComHorario(db.Agendamentos.AsNoTracking())
            .Where(a => a.UsuarioId == usuarioId)
            .OrderByDescending(a => a.Horario.DataHora)
            .ToListAsync(ct);

    public Task<Agendamento?> ObterPorCodigoCheckinAsync(string codigo, CancellationToken ct = default) =>
        ComHorario(db.Agendamentos).FirstOrDefaultAsync(a => a.CodigoCheckin == codigo, ct);

    public async Task<IReadOnlyList<Agendamento>> ListarDaUnidadeEntreAsync(
        Guid unidadeId, DateTimeOffset de, DateTimeOffset ate, CancellationToken ct = default) =>
        await ComHorario(db.Agendamentos.AsNoTracking())
            .Where(a => a.Horario.UnidadeCrasId == unidadeId && a.Horario.DataHora >= de && a.Horario.DataHora < ate)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Agendamento>> ListarParaLembreteAsync(
        DateTimeOffset de, DateTimeOffset ate, CancellationToken ct = default) =>
        await ComHorario(db.Agendamentos)
            .Where(a => a.Status == StatusAtendimento.Confirmado && !a.LembreteEnviado
                        && a.Horario.DataHora > de && a.Horario.DataHora <= ate)
            .ToListAsync(ct);

    public Task<bool> UsuarioTemAgendamentoAtivoEmAsync(Guid usuarioId, DateTimeOffset dataHora, CancellationToken ct = default) =>
        db.Agendamentos.AnyAsync(a => a.UsuarioId == usuarioId
                                      && a.Horario.DataHora == dataHora
                                      && a.Status != StatusAtendimento.Cancelado
                                      && a.Status != StatusAtendimento.Concluido, ct);

    private static IQueryable<Agendamento> ComHorario(IQueryable<Agendamento> consulta) =>
        consulta.Include(a => a.Horario).ThenInclude(h => h.Unidade)
                .Include(a => a.Horario).ThenInclude(h => h.Servico);
}
