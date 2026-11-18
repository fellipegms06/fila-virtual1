using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;

namespace FilaVirtual.Application.UseCases.Unidades;

public class ObterUnidadeUseCase(IUnidadeCrasRepository unidades)
{
    public async Task<UnidadeDetalheResponse> ExecutarAsync(Guid unidadeId, CancellationToken ct = default)
    {
        var unidade = await unidades.ObterComServicosAsync(unidadeId, ct)
            ?? throw new NotFoundException("Unidade CRAS não encontrada.");
        return UnidadeDetalheResponse.De(unidade);
    }
}
