using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Domain.Entities;

public class Agendamento
{
    private Agendamento() { }

    public Agendamento(Guid usuarioId, Guid horarioAtendimentoId)
    {
        if (usuarioId == Guid.Empty)
            throw new DomainException("Informe o usuário.");
        if (horarioAtendimentoId == Guid.Empty)
            throw new DomainException("Informe o horário de atendimento.");

        Id = Guid.NewGuid();
        UsuarioId = usuarioId;
        HorarioAtendimentoId = horarioAtendimentoId;
        Status = StatusAtendimento.Confirmado;
        CodigoCheckin = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        CriadoEm = DateTimeOffset.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public Guid HorarioAtendimentoId { get; private set; }
    public StatusAtendimento Status { get; private set; }
    public string CodigoCheckin { get; private set; } = default!;
    public DateTimeOffset CriadoEm { get; private set; }

    public bool LembreteEnviado { get; private set; }

    public HorarioAtendimento Horario { get; private set; } = default!;

    public void MarcarLembreteEnviado() => LembreteEnviado = true;

    public void FazerCheckin()
    {
        if (Status != StatusAtendimento.Confirmado)
            throw new DomainException("Só é possível fazer check-in de um agendamento confirmado.");
        Status = StatusAtendimento.Aguardando;
    }

    public void IniciarAtendimento()
    {
        if (Status != StatusAtendimento.Aguardando)
            throw new DomainException("O atendimento só pode começar depois do check-in.");
        Status = StatusAtendimento.EmAtendimento;
    }

    public void Concluir()
    {
        if (Status != StatusAtendimento.EmAtendimento)
            throw new DomainException("Só é possível concluir um agendamento em atendimento.");
        Status = StatusAtendimento.Concluido;
    }

    public void Cancelar()
    {
        if (Status is not (StatusAtendimento.Confirmado or StatusAtendimento.Aguardando))
            throw new DomainException("Este agendamento não pode mais ser cancelado.");
        Status = StatusAtendimento.Cancelado;
    }

    public void RegistrarNaoComparecimento()
    {
        if (Status is not (StatusAtendimento.Aguardando or StatusAtendimento.EmAtendimento))
            throw new DomainException("Só é possível registrar ausência depois do check-in.");
        Status = StatusAtendimento.Cancelado;
    }
}