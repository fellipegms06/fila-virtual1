using FilaVirtual.Application.Abstractions;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Services;

namespace FilaVirtual.Application.UseCases.Fila;

public class ConsultarMinhaPosicaoUseCase(ISenhaFilaRepository senhas)
{
    public async Task<MinhaFilaResponse> ExecutarAsync(Guid usuarioId, CancellationToken ct = default)
    {
        var minha = await senhas.ObterAtivaDoUsuarioAsync(usuarioId, ct);
        if (minha is null)
            return MinhaFilaResponse.ForaDaFila;

        return await MontarAsync(senhas, minha, ct);
    }

    internal static async Task<MinhaFilaResponse> MontarAsync(
        ISenhaFilaRepository senhas, SenhaFila minha, CancellationToken ct)
    {
        var doDia = await senhas.ListarDoDiaAsync(minha.UnidadeCrasId, minha.DataReferencia, ct);

        var ultimaChamada = doDia.Where(s => s.ChamadaEm != null).MaxBy(s => s.ChamadaEm);

        int posicao;
        if (minha.Status == StatusAtendimento.EmAtendimento)
        {
            posicao = 0;
        }
        else
        {
            var aguardando = doDia.Where(s => s.Id != minha.Id).Append(minha);
            posicao = OrdenadorDaFila.Posicao(aguardando, minha.Id) ?? 0;
        }

        var media = await senhas.MediaAtendimentoMinutosAsync(
            minha.UnidadeCrasId, EstimativaDeEspera.AtendimentosConsiderados, ct);

        return new MinhaFilaResponse(
            SenhaResponse.De(minha),
            posicao,
            Math.Max(posicao - 1, 0),
            EstimativaDeEspera.Minutos(posicao, media, minha.Servico.DuracaoMediaMinutos),
            ultimaChamada?.Codigo,
            ultimaChamada?.Guiche);
    }
}
