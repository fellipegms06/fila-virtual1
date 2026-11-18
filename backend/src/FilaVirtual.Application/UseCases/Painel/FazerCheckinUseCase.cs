using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Fila;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Painel;

public class FazerCheckinUseCase(
    IValidator<CheckinRequest> validator,
    IUnidadeCrasRepository unidades,
    IAgendamentoRepository agendamentos,
    IUsuarioRepository usuarios,
    ISenhaFilaRepository senhas,
    EmissorDeSenha emissor,
    IFilaNotifier notificador,
    AvisosDaFila avisos,
    TimeProvider relogio)
{
    public async Task<PainelSenhaResponse> ExecutarAsync(
        OperadorDoPainel operador, CheckinRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);
        var unidadeId = await operador.ResolverUnidadeAsync(req.UnidadeId, unidades, ct);

        var agendamento = await agendamentos.ObterPorCodigoCheckinAsync(req.Codigo.Trim().ToUpperInvariant(), ct)
            ?? throw new NotFoundException("Código de agendamento não encontrado.");

        if (agendamento.Horario.UnidadeCrasId != unidadeId)
            throw new DomainException($"Este agendamento é da unidade {agendamento.Horario.Unidade.Nome}.");

        var hoje = HorarioDeBrasilia.Hoje(relogio);
        var horarioLocal = HorarioDeBrasilia.Converter(agendamento.Horario.DataHora);
        if (DateOnly.FromDateTime(horarioLocal.DateTime) != hoje)
            throw new DomainException($"Este agendamento é para {horarioLocal:dd/MM 'às' HH:mm}, não para hoje.");

        agendamento.FazerCheckin();

        var dono = await usuarios.ObterPorIdAsync(agendamento.UsuarioId, ct);
        var prioridade = req.Preferencial || (dono?.EhIdoso(hoje) ?? false) ? Prioridade.Preferencial : Prioridade.Normal;

        try
        {
            var senha = await emissor.EmitirAsync(unidadeId, agendamento.Horario.ServicoId,
                agendamento.UsuarioId, agendamento.Id, prioridade, ct);
            await notificador.FilaAtualizadaAsync(unidadeId, ct);
            await avisos.AposEntradaPreferencialAsync(senha, ct);

            var salva = await senhas.ObterAsync(senha.Id, ct) ?? senha;
            return PainelSenhaResponse.De(salva, dono?.NomeCompleto);
        }
        catch (ConcorrenciaException)
        {
            throw new ConflictException("O check-in deste agendamento acabou de ser feito em outro guichê.");
        }
    }
}
