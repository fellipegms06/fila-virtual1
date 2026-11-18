using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Services;

namespace FilaVirtual.Application.UseCases.Painel;

public class ObterFilaDoDiaUseCase(
    IUnidadeCrasRepository unidades, ISenhaFilaRepository senhas, IUsuarioRepository usuarios, TimeProvider relogio)
{
    public async Task<FilaDoDiaResponse> ExecutarAsync(
        OperadorDoPainel operador, Guid? unidadeSolicitada, CancellationToken ct = default)
    {
        var unidadeId = await operador.ResolverUnidadeAsync(unidadeSolicitada, unidades, ct);
        var hoje = HorarioDeBrasilia.Hoje(relogio);

        var doDia = await senhas.ListarDoDiaAsync(unidadeId, hoje, ct);
        var nomes = await usuarios.ObterNomesAsync(doDia.Where(s => s.UsuarioId != null).Select(s => s.UsuarioId!.Value), ct);
        string? Nome(Guid? id) => id is { } u && nomes.TryGetValue(u, out var n) ? n : null;

        var emAtendimento = doDia
            .Where(s => s.Status == StatusAtendimento.EmAtendimento)
            .OrderBy(s => s.ChamadaEm)
            .Select(s => PainelSenhaResponse.De(s, Nome(s.UsuarioId)))
            .ToList();

        var aguardando = OrdenadorDaFila.Ordenar(doDia)
            .Select((s, i) => PainelSenhaResponse.De(s, Nome(s.UsuarioId), i + 1))
            .ToList();

        var nomeUnidade = await unidades.ObterNomeAsync(unidadeId, ct) ?? "";

        return new FilaDoDiaResponse(
            unidadeId, nomeUnidade, hoje, emAtendimento, aguardando,
            doDia.Count(s => s.Status == StatusAtendimento.Concluido),
            doDia.Count(s => s.Status == StatusAtendimento.Cancelado));
    }
}
