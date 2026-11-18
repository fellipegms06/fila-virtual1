using FilaVirtual.Application.Abstractions;

namespace FilaVirtual.Application.UseCases.Agendamentos;

public class ListarMeusAgendamentosUseCase(IAgendamentoRepository agendamentos, ISenhaFilaRepository senhas)
{
    public async Task<IReadOnlyList<AgendamentoResponse>> ExecutarAsync(Guid usuarioId, CancellationToken ct = default)
    {
        var lista = await agendamentos.ListarDoUsuarioAsync(usuarioId, ct);
        var codigos = await senhas.CodigosPorAgendamentoAsync(lista.Select(a => a.Id), ct);

        return lista.Select(a => AgendamentoResponse.De(a, codigos.GetValueOrDefault(a.Id))).ToList();
    }
}
