using FilaVirtual.Application.Abstractions;
using FilaVirtual.Infrastructure.Persistence;

namespace FilaVirtual.Infrastructure.Repositories;

public class HorarioRepository(AppDbContext db) : IHorarioRepository
{
    public Task<HorarioAtendimento?> ObterComUnidadeEServicoAsync(Guid id, CancellationToken ct = default) =>
        db.Horarios.Include(h => h.Unidade).Include(h => h.Servico).FirstOrDefaultAsync(h => h.Id == id, ct);

    public async Task<IReadOnlyList<HorarioAtendimento>> ListarDisponiveisAsync(
        Guid unidadeId, Guid servicoId, DateTimeOffset de, DateTimeOffset ate, CancellationToken ct = default) =>
        await db.Horarios.AsNoTracking()
            .Where(h => h.UnidadeCrasId == unidadeId && h.ServicoId == servicoId
                        && h.DataHora >= de && h.DataHora < ate
                        && h.VagasOcupadas < h.Vagas)
            .OrderBy(h => h.DataHora)
            .ToListAsync(ct);
}
