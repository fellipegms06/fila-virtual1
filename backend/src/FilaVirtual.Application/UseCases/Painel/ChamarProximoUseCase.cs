using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Domain.Exceptions;
using FilaVirtual.Domain.Services;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Painel;

public class ChamarProximoUseCase(
    IValidator<ChamarProximoRequest> validator,
    IUnidadeCrasRepository unidades,
    ISenhaFilaRepository senhas,
    IAgendamentoRepository agendamentos,
    IUsuarioRepository usuarios,
    IUnitOfWork uow,
    IFilaNotifier notificador,
    AvisosDaFila avisos,
    TimeProvider relogio)
{
    public async Task<PainelSenhaResponse> ExecutarAsync(
        OperadorDoPainel operador, ChamarProximoRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);
        var unidadeId = await operador.ResolverUnidadeAsync(req.UnidadeId, unidades, ct);

        var aguardando = await senhas.ListarAguardandoParaAtualizarAsync(unidadeId, HorarioDeBrasilia.Hoje(relogio), ct);
        var proxima = OrdenadorDaFila.Ordenar(aguardando).FirstOrDefault()
            ?? throw new DomainException("Não há ninguém aguardando na fila.");

        proxima.Chamar(req.Guiche);

        if (proxima.AgendamentoId is { } agendamentoId &&
            await agendamentos.ObterComHorarioAsync(agendamentoId, ct) is { } agendamento)
        {
            agendamento.IniciarAtendimento();
        }

        try
        {
            await uow.SaveChangesAsync(ct);
        }
        catch (ConcorrenciaException)
        {
            throw new ConflictException("Outro guichê acabou de chamar esta senha. Clique em Chamar próximo de novo.");
        }

        await notificador.SenhaChamadaAsync(
            new SenhaChamadaEvento(unidadeId, proxima.Id, proxima.Codigo, proxima.Guiche!, proxima.Servico.Nome),
            proxima.UsuarioId, ct);
        await notificador.FilaAtualizadaAsync(unidadeId, ct);
        await avisos.AposChamadaAsync(proxima, aguardando, ct);

        string? nome = null;
        if (proxima.UsuarioId is { } usuarioId)
            (await usuarios.ObterNomesAsync([usuarioId], ct)).TryGetValue(usuarioId, out nome);

        return PainelSenhaResponse.De(proxima, nome);
    }
}
