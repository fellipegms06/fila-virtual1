using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;

namespace FilaVirtual.Application.UseCases.Fila;

public class EmissorDeSenha(ISenhaFilaRepository senhas, IUnitOfWork uow, TimeProvider relogio)
{
    public const int Tentativas = 3;

    public async Task<SenhaFila> EmitirAsync(
        Guid unidadeId, Guid servicoId, Guid? usuarioId, Guid? agendamentoId, Prioridade prioridade,
        CancellationToken ct = default)
    {
        var dia = HorarioDeBrasilia.Hoje(relogio);

        for (var tentativa = 1; ; tentativa++)
        {
            var numero = await senhas.ProximoNumeroAsync(unidadeId, dia, ct);
            var senha = new SenhaFila(unidadeId, servicoId, usuarioId, agendamentoId, numero, prioridade, dia);
            await senhas.AdicionarAsync(senha, ct);

            try
            {
                await uow.SaveChangesAsync(ct);
                return senha;
            }
            catch (RegistroDuplicadoException) when (tentativa < Tentativas)
            {
                senhas.Descartar(senha);
            }
            catch (RegistroDuplicadoException)
            {
                throw new ConflictException("Muitas senhas sendo emitidas ao mesmo tempo. Tente novamente.");
            }
        }
    }
}
