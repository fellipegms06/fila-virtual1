using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.Abstractions;

public interface INotificacaoRepository
{
    Task AdicionarAsync(Notificacao notificacao, CancellationToken ct = default);

    Task<IReadOnlyList<Notificacao>> ListarDoUsuarioAsync(Guid usuarioId, int limite, CancellationToken ct = default);

    Task<Notificacao?> ObterAsync(Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<Notificacao>> ListarNaoLidasAsync(Guid usuarioId, CancellationToken ct = default);
}
