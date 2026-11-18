using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Domain.Entities;

public class SenhaFila
{
    private SenhaFila() { }

    public SenhaFila(Guid unidadeCrasId, Guid servicoId, Guid? usuarioId, Guid? agendamentoId,
                     int numero, Prioridade prioridade, DateOnly dataReferencia)
    {
        if (unidadeCrasId == Guid.Empty)
            throw new DomainException("Informe a unidade.");
        if (servicoId == Guid.Empty)
            throw new DomainException("Informe o serviço.");
        if (numero <= 0)
            throw new DomainException("O número da senha deve ser maior que zero.");

        Id = Guid.NewGuid();
        UnidadeCrasId = unidadeCrasId;
        ServicoId = servicoId;
        UsuarioId = usuarioId;
        AgendamentoId = agendamentoId;
        Numero = numero;
        Prioridade = prioridade;
        Codigo = (prioridade == Prioridade.Preferencial ? "P" : "N") + numero.ToString("000");
        Status = StatusAtendimento.Aguardando;
        DataReferencia = dataReferencia;
        EmitidaEm = DateTimeOffset.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UnidadeCrasId { get; private set; }
    public Guid ServicoId { get; private set; }
    public Guid? UsuarioId { get; private set; }
    public Guid? AgendamentoId { get; private set; }
    public int Numero { get; private set; }
    public string Codigo { get; private set; } = default!;
    public Prioridade Prioridade { get; private set; }
    public StatusAtendimento Status { get; private set; }
    public string? Guiche { get; private set; }
    public DateOnly DataReferencia { get; private set; }
    public DateTimeOffset EmitidaEm { get; private set; }
    public DateTimeOffset? ChamadaEm { get; private set; }
    public DateTimeOffset? FinalizadaEm { get; private set; }

    public UnidadeCras Unidade { get; private set; } = default!;
    public Servico Servico { get; private set; } = default!;

    public bool Ativa => Status is StatusAtendimento.Aguardando or StatusAtendimento.EmAtendimento;

    public void Chamar(string guiche)
    {
        if (Status != StatusAtendimento.Aguardando)
            throw new DomainException("Só é possível chamar uma senha que está aguardando.");
        if (string.IsNullOrWhiteSpace(guiche))
            throw new DomainException("Informe o guichê.");

        Status = StatusAtendimento.EmAtendimento;
        Guiche = guiche.Trim();
        ChamadaEm = DateTimeOffset.UtcNow;
    }

    public void Concluir()
    {
        if (Status != StatusAtendimento.EmAtendimento)
            throw new DomainException("Só é possível concluir uma senha em atendimento.");

        Status = StatusAtendimento.Concluido;
        FinalizadaEm = DateTimeOffset.UtcNow;
    }

    public void Cancelar()
    {
        if (Status is not (StatusAtendimento.Aguardando or StatusAtendimento.EmAtendimento))
            throw new DomainException("Esta senha já foi finalizada.");

        Status = StatusAtendimento.Cancelado;
        FinalizadaEm = DateTimeOffset.UtcNow;
    }
}