using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Domain.Entities;

public class Servico
{
    private readonly List<ServicoDocumento> _documentos = new();

    private Servico() { }

    public Servico(string nome, string descricao, int duracaoMediaMinutos)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new DomainException("Informe o nome do serviço.");
        if (string.IsNullOrWhiteSpace(descricao))
            throw new DomainException("Informe a descrição do serviço.");
        if (duracaoMediaMinutos <= 0)
            throw new DomainException("A duração média deve ser maior que zero.");

        Id = Guid.NewGuid();
        Nome = nome.Trim();
        Descricao = descricao.Trim();
        DuracaoMediaMinutos = duracaoMediaMinutos;
    }

    public Guid Id { get; private set; }
    public string Nome { get; private set; } = default!;
    public string Descricao { get; private set; } = default!;
    public int DuracaoMediaMinutos { get; private set; }
    public IReadOnlyCollection<ServicoDocumento> Documentos => _documentos;

    public void AdicionarDocumento(string descricao, bool obrigatorio = true) =>
        _documentos.Add(new ServicoDocumento(Id, descricao, obrigatorio));
}