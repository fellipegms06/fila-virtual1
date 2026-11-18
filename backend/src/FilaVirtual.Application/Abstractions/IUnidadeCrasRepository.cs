using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.Abstractions;

public interface IUnidadeCrasRepository
{
    Task<IReadOnlyList<UnidadeCras>> ListarAsync(CancellationToken ct = default);

    Task<UnidadeCras?> ObterComServicosAsync(Guid id, CancellationToken ct = default);

    Task<bool> ExisteAsync(Guid id, CancellationToken ct = default);

    Task<string?> ObterNomeAsync(Guid id, CancellationToken ct = default);

    Task<bool> OfereceServicoAsync(Guid unidadeId, Guid servicoId, CancellationToken ct = default);
}
