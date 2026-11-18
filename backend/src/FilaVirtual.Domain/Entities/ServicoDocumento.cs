using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Domain.Entities;

public class ServicoDocumento
{
    private ServicoDocumento() { }

    public ServicoDocumento(Guid servicoId, string descricao, bool obrigatorio)
    {
        if (string.IsNullOrWhiteSpace(descricao))
            throw new DomainException("Informe a descrição do documento.");

        Id = Guid.NewGuid();
        ServicoId = servicoId;
        Descricao = descricao.Trim();
        Obrigatorio = obrigatorio;
    }

    public Guid Id { get; private set; }
    public Guid ServicoId { get; private set; }
    public string Descricao { get; private set; } = default!;
    public bool Obrigatorio { get; private set; }
}