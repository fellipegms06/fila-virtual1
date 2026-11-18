using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Application.Exceptions;

namespace FilaVirtual.Application.UseCases.Agendamentos;

public class ListarHorariosUseCase(IUnidadeCrasRepository unidades, IHorarioRepository horarios, TimeProvider relogio)
{
    public const int DiasAFrente = 14;

    public async Task<IReadOnlyList<HorarioResponse>> ExecutarAsync(ListarHorariosRequest req, CancellationToken ct = default)
    {
        if (!await unidades.ExisteAsync(req.UnidadeId, ct))
            throw new NotFoundException("Unidade CRAS não encontrada.");
        if (!await unidades.OfereceServicoAsync(req.UnidadeId, req.ServicoId, ct))
            throw new NotFoundException("Esta unidade não oferece o serviço escolhido.");

        var agora = relogio.GetUtcNow();
        var (de, ate) = req.Data is { } data
            ? HorarioDeBrasilia.IntervaloDoDia(data)
            : (agora, agora.AddDays(DiasAFrente));

        if (de < agora) de = agora;
        if (ate <= de) return [];

        var lista = await horarios.ListarDisponiveisAsync(req.UnidadeId, req.ServicoId, de, ate, ct);
        return lista.Select(h => new HorarioResponse(h.Id, h.DataHora, h.VagasDisponiveis)).ToList();
    }
}
