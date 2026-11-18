using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Domain.Enums;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Fila;

public class EntrarNaFilaUseCase(
    IValidator<EntrarNaFilaRequest> validator,
    IUsuarioRepository usuarios,
    IUnidadeCrasRepository unidades,
    ISenhaFilaRepository senhas,
    EmissorDeSenha emissor,
    IFilaNotifier notificador,
    AvisosDaFila avisos,
    TimeProvider relogio)
{
    public async Task<MinhaFilaResponse> ExecutarAsync(
        Guid usuarioId, EntrarNaFilaRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);

        var usuario = await usuarios.ObterPorIdAsync(usuarioId, ct)
            ?? throw new UnauthorizedAppException("Usuário não encontrado. Entre novamente.");

        if (!await unidades.ExisteAsync(req.UnidadeId, ct))
            throw new NotFoundException("Unidade CRAS não encontrada.");
        if (!await unidades.OfereceServicoAsync(req.UnidadeId, req.ServicoId, ct))
            throw new NotFoundException("Esta unidade não oferece o serviço escolhido.");

        if (await senhas.ObterAtivaDoUsuarioAsync(usuarioId, ct) is { } ativa)
            throw new ConflictException($"Você já está na fila com a senha {ativa.Codigo}.");

        var prioridade = usuario.EhIdoso(HorarioDeBrasilia.Hoje(relogio)) ? Prioridade.Preferencial : Prioridade.Normal;

        var senha = await emissor.EmitirAsync(req.UnidadeId, req.ServicoId, usuarioId, null, prioridade, ct);
        await notificador.FilaAtualizadaAsync(req.UnidadeId, ct);
        await avisos.AposEntradaPreferencialAsync(senha, ct);

        var salva = await senhas.ObterAsync(senha.Id, ct) ?? senha;
        return await ConsultarMinhaPosicaoUseCase.MontarAsync(senhas, salva, ct);
    }
}
