using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Domain.Entities;

public class HorarioAtendimento
{
    private HorarioAtendimento() { }

    public HorarioAtendimento(Guid unidadeCrasId, Guid servicoId, DateTimeOffset dataHora, int vagas)
    {
        if (unidadeCrasId == Guid.Empty)
            throw new DomainException("Informe a unidade.");
        if (servicoId == Guid.Empty)
            throw new DomainException("Informe o serviço.");
        if (vagas <= 0)
            throw new DomainException("O horário deve ter pelo menos uma vaga.");

        Id = Guid.NewGuid();
        UnidadeCrasId = unidadeCrasId;
        ServicoId = servicoId;
        DataHora = dataHora.ToUniversalTime();
        Vagas = vagas;
    }

    public Guid Id { get; private set; }
    public Guid UnidadeCrasId { get; private set; }
    public Guid ServicoId { get; private set; }
    public DateTimeOffset DataHora { get; private set; }
    public int Vagas { get; private set; }

    public int VagasOcupadas { get; private set; }

    public UnidadeCras Unidade { get; private set; } = default!;
    public Servico Servico { get; private set; } = default!;

    public int VagasDisponiveis => Vagas - VagasOcupadas;
    public bool TemVaga => VagasOcupadas < Vagas;

    public void Reservar()
    {
        if (!TemVaga)
            throw new DomainException("Não há mais vagas neste horário.");
        VagasOcupadas++;
    }

    public void Liberar()
    {
        if (VagasOcupadas > 0)
            VagasOcupadas--;
    }
}