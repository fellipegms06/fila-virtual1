namespace FilaVirtual.Application.Abstractions;

public record SenhaChamadaEvento(Guid UnidadeId, Guid SenhaId, string Codigo, string Guiche, string Servico);

public record NotificacaoEvento(Guid Id, string Titulo, string Mensagem, string Tipo, DateTimeOffset CriadaEm);

public interface IFilaNotifier
{
    Task FilaAtualizadaAsync(Guid unidadeId, CancellationToken ct = default);

    Task SenhaChamadaAsync(SenhaChamadaEvento evento, Guid? usuarioId, CancellationToken ct = default);

    Task NotificacaoAsync(Guid usuarioId, NotificacaoEvento notificacao, CancellationToken ct = default);
}
