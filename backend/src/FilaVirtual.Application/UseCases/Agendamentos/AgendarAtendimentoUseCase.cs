using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Application.UseCases.Agendamentos;

public class AgendarAtendimentoUseCase(
    IHorarioRepository horarios,
    IAgendamentoRepository agendamentos,
    IUnitOfWork uow,
    ServicoDeNotificacao notificacoes,
    TimeProvider relogio)
{
    public const string MensagemSemVagas = "Não há mais vagas neste horário. Escolha outro.";
    public const string MensagemDisputa =
        "Outra pessoa acabou de reservar este horário. Atualize a lista e tente de novo.";

    public async Task<AgendamentoResponse> ExecutarAsync(
        Guid usuarioId, AgendarAtendimentoRequest req, CancellationToken ct = default)
    {
        var horario = await horarios.ObterComUnidadeEServicoAsync(req.HorarioAtendimentoId, ct)
            ?? throw new NotFoundException("Horário não encontrado.");

        if (horario.DataHora <= relogio.GetUtcNow())
            throw new DomainException("Este horário já passou. Escolha outro.");

        if (!horario.TemVaga)
            throw new ConflictException(MensagemSemVagas);

        if (await agendamentos.UsuarioTemAgendamentoAtivoEmAsync(usuarioId, horario.DataHora, ct))
            throw new ConflictException("Você já tem um agendamento neste mesmo dia e horário.");

        horario.Reservar();
        var agendamento = new Agendamento(usuarioId, horario.Id);
        await agendamentos.AdicionarAsync(agendamento, ct);

        try
        {
            await uow.SaveChangesAsync(ct);
        }
        catch (ConcorrenciaException)
        {
            throw new ConflictException(MensagemDisputa);
        }
        catch (RegistroDuplicadoException)
        {
            throw new ConflictException("Você já tem um agendamento neste horário.");
        }

        var quando = HorarioDeBrasilia.Converter(horario.DataHora);
        await notificacoes.NotificarAsync(new NovaNotificacao(usuarioId, "Agendamento confirmado",
            $"{horario.Servico.Nome} no {horario.Unidade.Nome}, dia {quando:dd/MM} às {quando:HH:mm}. Código do check-in: {agendamento.CodigoCheckin}.",
            TipoNotificacao.AgendamentoConfirmado), ct);

        return new AgendamentoResponse(
            agendamento.Id, horario.UnidadeCrasId, horario.Unidade.Nome, horario.Unidade.Endereco,
            horario.ServicoId, horario.Servico.Nome, horario.DataHora,
            agendamento.Status.ToString(), agendamento.CodigoCheckin, Senha: null);
    }
}
