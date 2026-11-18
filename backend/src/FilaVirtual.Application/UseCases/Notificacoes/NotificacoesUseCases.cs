using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.UseCases.Notificacoes;

public record NotificacaoResponse(Guid Id, string Titulo, string Mensagem, string Tipo, bool Lida, DateTimeOffset CriadaEm)
{
    public static NotificacaoResponse De(Notificacao n) => new(n.Id, n.Titulo, n.Mensagem, n.Tipo.ToString(), n.Lida, n.CriadaEm);
}

public class ListarNotificacoesUseCase(INotificacaoRepository notificacoes)
{
    public const int Limite = 50;

    public async Task<IReadOnlyList<NotificacaoResponse>> ExecutarAsync(Guid usuarioId, CancellationToken ct = default) =>
        (await notificacoes.ListarDoUsuarioAsync(usuarioId, Limite, ct)).Select(NotificacaoResponse.De).ToList();
}

public class MarcarNotificacaoComoLidaUseCase(INotificacaoRepository notificacoes, IUnitOfWork uow)
{
    public async Task ExecutarAsync(Guid usuarioId, Guid notificacaoId, CancellationToken ct = default)
    {
        var notificacao = await notificacoes.ObterAsync(notificacaoId, ct);
        if (notificacao is null || notificacao.UsuarioId != usuarioId)
            throw new NotFoundException("Notificação não encontrada.");

        notificacao.MarcarComoLida();
        await uow.SaveChangesAsync(ct);
    }
}

public class MarcarTodasComoLidasUseCase(INotificacaoRepository notificacoes, IUnitOfWork uow)
{
    public async Task ExecutarAsync(Guid usuarioId, CancellationToken ct = default)
    {
        foreach (var n in await notificacoes.ListarNaoLidasAsync(usuarioId, ct))
            n.MarcarComoLida();
        await uow.SaveChangesAsync(ct);
    }
}
