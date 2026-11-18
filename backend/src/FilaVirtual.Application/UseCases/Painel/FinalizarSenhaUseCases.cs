using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;

namespace FilaVirtual.Application.UseCases.Painel;

public class ConcluirAtendimentoUseCase(
    IUnidadeCrasRepository unidades, ISenhaFilaRepository senhas, IAgendamentoRepository agendamentos,
    IUnitOfWork uow, IFilaNotifier notificador)
{
    public async Task<PainelSenhaResponse> ExecutarAsync(
        OperadorDoPainel operador, Guid senhaId, Guid? unidadeSolicitada, CancellationToken ct = default)
    {
        var senha = await SenhaDaUnidade.ObterAsync(operador, senhaId, unidadeSolicitada, unidades, senhas, ct);

        senha.Concluir();
        if (senha.AgendamentoId is { } id && await agendamentos.ObterComHorarioAsync(id, ct) is { } agendamento)
            agendamento.Concluir();

        await uow.SaveChangesAsync(ct);
        await notificador.FilaAtualizadaAsync(senha.UnidadeCrasId, ct);
        return PainelSenhaResponse.De(senha);
    }
}

public class CancelarSenhaUseCase(
    IUnidadeCrasRepository unidades, ISenhaFilaRepository senhas, IAgendamentoRepository agendamentos,
    IUnitOfWork uow, IFilaNotifier notificador)
{
    public async Task<PainelSenhaResponse> ExecutarAsync(
        OperadorDoPainel operador, Guid senhaId, Guid? unidadeSolicitada, CancellationToken ct = default)
    {
        var senha = await SenhaDaUnidade.ObterAsync(operador, senhaId, unidadeSolicitada, unidades, senhas, ct);

        senha.Cancelar();
        if (senha.AgendamentoId is { } id && await agendamentos.ObterComHorarioAsync(id, ct) is { } agendamento
            && agendamento.Status is StatusAtendimento.Aguardando or StatusAtendimento.EmAtendimento)
        {
            agendamento.RegistrarNaoComparecimento();
        }

        await uow.SaveChangesAsync(ct);
        await notificador.FilaAtualizadaAsync(senha.UnidadeCrasId, ct);
        return PainelSenhaResponse.De(senha);
    }
}

internal static class SenhaDaUnidade
{
    public static async Task<SenhaFila> ObterAsync(
        OperadorDoPainel operador, Guid senhaId, Guid? unidadeSolicitada,
        IUnidadeCrasRepository unidades, ISenhaFilaRepository senhas, CancellationToken ct)
    {
        var senha = await senhas.ObterAsync(senhaId, ct);
        if (senha is null)
            throw new NotFoundException("Senha não encontrada.");

        var unidadeId = await operador.ResolverUnidadeAsync(
            operador.EhAdministrador ? unidadeSolicitada ?? senha.UnidadeCrasId : unidadeSolicitada, unidades, ct);

        return senha.UnidadeCrasId == unidadeId ? senha : throw new NotFoundException("Senha não encontrada.");
    }
}
