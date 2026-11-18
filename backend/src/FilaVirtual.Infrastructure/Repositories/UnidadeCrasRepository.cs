using FilaVirtual.Application.Abstractions;
using FilaVirtual.Infrastructure.Persistence;

namespace FilaVirtual.Infrastructure.Repositories;

public class UnidadeCrasRepository(AppDbContext db) : IUnidadeCrasRepository
{
    public async Task<IReadOnlyList<UnidadeCras>> ListarAsync(CancellationToken ct = default) =>
        await db.Unidades.AsNoTracking().ToListAsync(ct);

    public Task<UnidadeCras?> ObterComServicosAsync(Guid id, CancellationToken ct = default) =>
        db.Unidades.AsNoTracking()
            .Include(u => u.Servicos).ThenInclude(us => us.Servico).ThenInclude(s => s.Documentos)
            .AsSplitQuery()
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<bool> ExisteAsync(Guid id, CancellationToken ct = default) =>
        db.Unidades.AnyAsync(u => u.Id == id, ct);

    public Task<string?> ObterNomeAsync(Guid id, CancellationToken ct = default) =>
        db.Unidades.Where(u => u.Id == id).Select(u => u.Nome).FirstOrDefaultAsync(ct);

    public Task<bool> OfereceServicoAsync(Guid unidadeId, Guid servicoId, CancellationToken ct = default) =>
        db.UnidadeServicos.AnyAsync(us => us.UnidadeCrasId == unidadeId && us.ServicoId == servicoId, ct);
}
