using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Enums;

namespace FilaVirtual.Application.UseCases.Agendamentos;

public class CancelarAgendamentoUseCase(
    IAgendamentoRepository agendamentos, ISenhaFilaRepository senhas, IUnitOfWork uow, IFilaNotifier notificador)
{
    public async Task ExecutarAsync(Guid usuarioId, Guid agendamentoId, CancellationToken ct = default)
    {
        var agendamento = await agendamentos.ObterComHorarioAsync(agendamentoId, ct);

        if (agendamento is null || agendamento.UsuarioId != usuarioId)
            throw new NotFoundException("Agendamento não encontrado.");

        var jaEstavaNaFila = agendamento.Status == StatusAtendimento.Aguardando;

        agendamento.Cancelar();
        agendamento.Horario.Liberar();

        if (jaEstavaNaFila && await senhas.ObterAtivaPorAgendamentoAsync(agendamento.Id, ct) is { } senha)
            senha.Cancelar();

        try
        {
            await uow.SaveChangesAsync(ct);
        }
        catch (ConcorrenciaException)
        {
            throw new ConflictException("Não foi possível cancelar agora. Tente de novo em instantes.");
        }

        if (jaEstavaNaFila)
            await notificador.FilaAtualizadaAsync(agendamento.Horario.UnidadeCrasId, ct);
    }
}
