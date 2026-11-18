using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Fila;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Domain.Enums;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Painel;

public class EmitirSenhaPresencialUseCase(
    IValidator<SenhaPresencialRequest> validator,
    IUnidadeCrasRepository unidades,
    ISenhaFilaRepository senhas,
    EmissorDeSenha emissor,
    IFilaNotifier notificador,
    AvisosDaFila avisos)
{
    public async Task<PainelSenhaResponse> ExecutarAsync(
        OperadorDoPainel operador, SenhaPresencialRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);
        var unidadeId = await operador.ResolverUnidadeAsync(req.UnidadeId, unidades, ct);

        if (!await unidades.OfereceServicoAsync(unidadeId, req.ServicoId, ct))
            throw new NotFoundException("Esta unidade não oferece o serviço escolhido.");

        var prioridade = req.Preferencial ? Prioridade.Preferencial : Prioridade.Normal;
        var senha = await emissor.EmitirAsync(unidadeId, req.ServicoId, usuarioId: null, agendamentoId: null, prioridade, ct);
        await notificador.FilaAtualizadaAsync(unidadeId, ct);
        await avisos.AposEntradaPreferencialAsync(senha, ct);

        var salva = await senhas.ObterAsync(senha.Id, ct) ?? senha;
        return PainelSenhaResponse.De(salva);
    }
}
