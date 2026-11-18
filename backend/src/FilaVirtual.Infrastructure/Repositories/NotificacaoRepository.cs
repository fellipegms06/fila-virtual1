using FilaVirtual.Application.Abstractions;
using FilaVirtual.Infrastructure.Persistence;

namespace FilaVirtual.Infrastructure.Repositories;

public class NotificacaoRepository(AppDbContext db) : INotificacaoRepository
{
    public async Task AdicionarAsync(Notificacao notificacao, CancellationToken ct = default) =>
        await db.Notificacoes.AddAsync(notificacao, ct);

    public async Task<IReadOnlyList<Notificacao>> ListarDoUsuarioAsync(Guid usuarioId, int limite, CancellationToken ct = default) =>
        await db.Notificacoes.AsNoTracking()
            .Where(n => n.UsuarioId == usuarioId)
            .OrderByDescending(n => n.CriadaEm)
            .Take(limite)
            .ToListAsync(ct);

    public Task<Notificacao?> ObterAsync(Guid id, CancellationToken ct = default) =>
        db.Notificacoes.FirstOrDefaultAsync(n => n.Id == id, ct);

    public async Task<IReadOnlyList<Notificacao>> ListarNaoLidasAsync(Guid usuarioId, CancellationToken ct = default) =>
        await db.Notificacoes.Where(n => n.UsuarioId == usuarioId && !n.Lida).ToListAsync(ct);
}
