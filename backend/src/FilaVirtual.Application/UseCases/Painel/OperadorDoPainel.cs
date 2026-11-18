using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FluentValidation;
using FluentValidation.Results;

namespace FilaVirtual.Application.UseCases.Painel;

public record OperadorDoPainel(Guid UsuarioId, bool EhAdministrador, Guid? UnidadeDoToken)
{
    public async Task<Guid> ResolverUnidadeAsync(
        Guid? unidadeSolicitada, IUnidadeCrasRepository unidades, CancellationToken ct = default)
    {
        Guid unidadeId;
        if (EhAdministrador)
        {
            unidadeId = unidadeSolicitada
                ?? throw new ValidationException([new ValidationFailure("unidadeId", "Informe a unidade CRAS.")]);
        }
        else
        {
            unidadeId = UnidadeDoToken
                ?? throw new ForbiddenException("Seu usuário não está vinculado a nenhuma unidade CRAS.");
            if (unidadeSolicitada is { } outra && outra != unidadeId)
                throw new ForbiddenException("Você só pode gerenciar a fila da sua unidade.");
        }

        if (!await unidades.ExisteAsync(unidadeId, ct))
            throw new NotFoundException("Unidade CRAS não encontrada.");
        return unidadeId;
    }
}
