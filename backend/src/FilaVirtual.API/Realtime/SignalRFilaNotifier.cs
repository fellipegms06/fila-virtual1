using FilaVirtual.Application.Abstractions;
using Microsoft.AspNetCore.SignalR;

namespace FilaVirtual.API.Realtime;

public class SignalRFilaNotifier(IHubContext<FilaHub> hub, ILogger<SignalRFilaNotifier> logger) : IFilaNotifier
{
    public const string EventoFilaAtualizada = "FilaAtualizada";
    public const string EventoSenhaChamada = "SenhaChamada";
    public const string EventoNotificacao = "Notificacao";

    public Task FilaAtualizadaAsync(Guid unidadeId, CancellationToken ct = default) =>
        Enviar(() => hub.Clients.Group(FilaHub.GrupoUnidade(unidadeId))
            .SendAsync(EventoFilaAtualizada, new { unidadeId }, ct));

    public Task SenhaChamadaAsync(SenhaChamadaEvento evento, Guid? usuarioId, CancellationToken ct = default)
    {
        var grupos = new List<string> { FilaHub.GrupoUnidade(evento.UnidadeId) };
        if (usuarioId is { } id)
            grupos.Add(FilaHub.GrupoUsuario(id));

        return Enviar(() => hub.Clients.Groups(grupos).SendAsync(EventoSenhaChamada, evento, ct));
    }

    public Task NotificacaoAsync(Guid usuarioId, NotificacaoEvento notificacao, CancellationToken ct = default) =>
        Enviar(() => hub.Clients.Group(FilaHub.GrupoUsuario(usuarioId))
            .SendAsync(EventoNotificacao, notificacao, ct));

    private async Task Enviar(Func<Task> envio)
    {
        try
        {
            await envio();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao enviar evento em tempo real.");
        }
    }
}
