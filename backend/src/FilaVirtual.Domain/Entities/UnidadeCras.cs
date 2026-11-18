using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Domain.Entities;

public class UnidadeCras
{
    private readonly List<UnidadeServico> _servicos = new();

    private UnidadeCras() { }

    public UnidadeCras(string nome, string endereco, string bairro, string horarioFuncionamento, string telefone, double latitude, double longitude)
    {
        if (string.IsNullOrWhiteSpace(nome))
            throw new DomainException("Informe o nome da unidade.");
        if (string.IsNullOrWhiteSpace(endereco))
            throw new DomainException("Informe o endereço da unidade.");
        if (string.IsNullOrWhiteSpace(bairro))
            throw new DomainException("Informe o bairro da unidade.");
        if (string.IsNullOrWhiteSpace(horarioFuncionamento))
            throw new DomainException("Informe o horário de funcionamento.");
        if (string.IsNullOrWhiteSpace(telefone))
            throw new DomainException("Informe o telefone de contato.");
        if (latitude is < -90 or > 90)
            throw new DomainException("Latitude inválida.");
        if (longitude is < -180 or > 180)
            throw new DomainException("Longitude inválida.");

        Id = Guid.NewGuid();
        Nome = nome.Trim();
        Endereco = endereco.Trim();
        Bairro = bairro.Trim();
        HorarioFuncionamento = horarioFuncionamento.Trim();
        Telefone = telefone.Trim();
        Latitude = latitude;
        Longitude = longitude;
    }

    public Guid Id { get; private set; }
    public string Nome { get; private set; } = default!;
    public string Endereco { get; private set; } = default!;
    public string Bairro { get; private set; } = default!;
    public string HorarioFuncionamento { get; private set; } = default!;
    public string Telefone { get; private set; } = default!;
    public double Latitude { get; private set; }
    public double Longitude { get; private set; }
    public IReadOnlyCollection<UnidadeServico> Servicos => _servicos;

    public void HabilitarServico(Guid servicoId)
    {
        if (_servicos.Any(s => s.ServicoId == servicoId)) return;
        _servicos.Add(new UnidadeServico(Id, servicoId));
    }
}