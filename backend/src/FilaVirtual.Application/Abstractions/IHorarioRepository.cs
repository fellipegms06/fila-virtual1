using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.Abstractions;

public interface IHorarioRepository
{
    Task<HorarioAtendimento?> ObterComUnidadeEServicoAsync(Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<HorarioAtendimento>> ListarDisponiveisAsync(
        Guid unidadeId, Guid servicoId, DateTimeOffset de, DateTimeOffset ate, CancellationToken ct = default);
}
