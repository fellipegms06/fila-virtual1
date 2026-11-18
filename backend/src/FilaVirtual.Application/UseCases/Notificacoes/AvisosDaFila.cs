using FilaVirtual.Application.Abstractions;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Services;

namespace FilaVirtual.Application.UseCases.Notificacoes;

public class AvisosDaFila(ISenhaFilaRepository senhas, ServicoDeNotificacao servico)
{
    public static readonly int[] PosicoesAvisadas = [3, 1];

    public async Task AposChamadaAsync(SenhaFila chamada, IEnumerable<SenhaFila> aguardandoAntes, CancellationToken ct = default)
    {
        var avisos = new List<NovaNotificacao>();

        if (chamada.UsuarioId is { } dono)
            avisos.Add(new(dono, "Sua senha foi chamada!",
                $"Senha {chamada.Codigo}: dirija-se ao {chamada.Guiche}.", TipoNotificacao.SenhaChamada));

        var ordem = OrdenadorDaFila.Ordenar(aguardandoAntes.Where(s => s.Id != chamada.Id));
        for (var i = 0; i < ordem.Count; i++)
        {
            var posicao = i + 1;
            if (ordem[i].UsuarioId is not { } usuarioId || !PosicoesAvisadas.Contains(posicao))
                continue;

            avisos.Add(posicao == 1
                ? new(usuarioId, "Você é o próximo!", $"Sua senha {ordem[i].Codigo} será chamada em seguida. Fique atento ao painel.", TipoNotificacao.VezProxima)
                : new(usuarioId, "Sua vez está chegando", $"Faltam {posicao - 1} senhas antes da sua ({ordem[i].Codigo}). Fique por perto.", TipoNotificacao.VezProxima));
        }

        await servico.NotificarAsync(avisos, ct);
    }

    public async Task AposEntradaPreferencialAsync(SenhaFila nova, CancellationToken ct = default)
    {
        if (nova.Prioridade != Prioridade.Preferencial) return;

        var doDia = await senhas.ListarDoDiaAsync(nova.UnidadeCrasId, nova.DataReferencia, ct);
        var ordem = OrdenadorDaFila.Ordenar(doDia);

        var avisos = new List<NovaNotificacao>();
        for (var i = 0; i < ordem.Count; i++)
        {
            var s = ordem[i];
            if (s.Prioridade == Prioridade.Normal && s.UsuarioId is { } usuarioId)
                avisos.Add(new(usuarioId, "A ordem da fila mudou",
                    $"Uma senha preferencial (idoso, gestante ou pessoa com deficiência) foi colocada antes da sua. Sua posição agora é {i + 1}º.",
                    TipoNotificacao.AlteracaoNaFila));
        }

        await servico.NotificarAsync(avisos, ct);
    }
}
