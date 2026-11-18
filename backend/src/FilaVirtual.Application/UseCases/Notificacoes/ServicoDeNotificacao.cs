using FilaVirtual.Application.Abstractions;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;

namespace FilaVirtual.Application.UseCases.Notificacoes;

public record NovaNotificacao(Guid UsuarioId, string Titulo, string Mensagem, TipoNotificacao Tipo);

public class ServicoDeNotificacao(INotificacaoRepository notificacoes, IUnitOfWork uow, IFilaNotifier notificador)
{
    public async Task NotificarAsync(IReadOnlyCollection<NovaNotificacao> novas, CancellationToken ct = default)
    {
        if (novas.Count == 0) return;

        var criadas = new List<Notificacao>();
        foreach (var n in novas)
        {
            var notificacao = new Notificacao(n.UsuarioId, n.Titulo, n.Mensagem, n.Tipo);
            await notificacoes.AdicionarAsync(notificacao, ct);
            criadas.Add(notificacao);
        }

        await uow.SaveChangesAsync(ct);

        foreach (var n in criadas)
        {
            await notificador.NotificacaoAsync(n.UsuarioId,
                new NotificacaoEvento(n.Id, n.Titulo, n.Mensagem, n.Tipo.ToString(), n.CriadaEm), ct);
        }
    }

    public Task NotificarAsync(NovaNotificacao nova, CancellationToken ct = default) => NotificarAsync([nova], ct);
}
