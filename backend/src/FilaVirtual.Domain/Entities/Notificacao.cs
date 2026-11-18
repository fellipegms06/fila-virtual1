using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Domain.Entities;

public class Notificacao
{
    private Notificacao() { }

    public Notificacao(Guid usuarioId, string titulo, string mensagem, TipoNotificacao tipo)
    {
        if (usuarioId == Guid.Empty)
            throw new DomainException("Informe o usuário.");
        if (string.IsNullOrWhiteSpace(titulo))
            throw new DomainException("Informe o título da notificação.");
        if (string.IsNullOrWhiteSpace(mensagem))
            throw new DomainException("Informe a mensagem da notificação.");

        Id = Guid.NewGuid();
        UsuarioId = usuarioId;
        Titulo = titulo.Trim();
        Mensagem = mensagem.Trim();
        Tipo = tipo;
        Lida = false;
        CriadaEm = DateTimeOffset.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string Titulo { get; private set; } = default!;
    public string Mensagem { get; private set; } = default!;
    public TipoNotificacao Tipo { get; private set; }
    public bool Lida { get; private set; }
    public DateTimeOffset CriadaEm { get; private set; }

    public void MarcarComoLida() => Lida = true;
}