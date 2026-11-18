namespace FilaVirtual.Domain.Entities;

public class UnidadeServico
{
    private UnidadeServico() { }

    public UnidadeServico(Guid unidadeCrasId, Guid servicoId)
    {
        UnidadeCrasId = unidadeCrasId;
        ServicoId = servicoId;
    }

    public Guid UnidadeCrasId { get; private set; }
    public Guid ServicoId { get; private set; }
    public UnidadeCras UnidadeCras { get; private set; } = default!;
    public Servico Servico { get; private set; } = default!;
}