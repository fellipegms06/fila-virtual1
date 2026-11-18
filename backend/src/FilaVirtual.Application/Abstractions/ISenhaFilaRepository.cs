using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.Abstractions;

public interface ISenhaFilaRepository
{
    Task AdicionarAsync(SenhaFila senha, CancellationToken ct = default);

    void Descartar(SenhaFila senha);

    Task<int> ProximoNumeroAsync(Guid unidadeId, DateOnly dia, CancellationToken ct = default);

    Task<SenhaFila?> ObterAtivaDoUsuarioAsync(Guid usuarioId, CancellationToken ct = default);

    Task<SenhaFila?> ObterAsync(Guid id, CancellationToken ct = default);

    Task<SenhaFila?> ObterAtivaPorAgendamentoAsync(Guid agendamentoId, CancellationToken ct = default);

    Task<IReadOnlyList<SenhaFila>> ListarDoDiaAsync(Guid unidadeId, DateOnly dia, CancellationToken ct = default);

    Task<IReadOnlyList<SenhaFila>> ListarAguardandoParaAtualizarAsync(Guid unidadeId, DateOnly dia, CancellationToken ct = default);

    Task<double?> MediaAtendimentoMinutosAsync(Guid unidadeId, int ultimos, CancellationToken ct = default);

    Task<IReadOnlyDictionary<Guid, string>> CodigosPorAgendamentoAsync(IEnumerable<Guid> agendamentoIds, CancellationToken ct = default);
}
