using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Enums;

namespace FilaVirtual.Application.UseCases.Fila;

public class SairDaFilaUseCase(ISenhaFilaRepository senhas, IUnitOfWork uow, IFilaNotifier notificador)
{
    public async Task ExecutarAsync(Guid usuarioId, CancellationToken ct = default)
    {
        var senha = await senhas.ObterAtivaDoUsuarioAsync(usuarioId, ct)
            ?? throw new NotFoundException("Você não está em nenhuma fila no momento.");

        if (senha.Status == StatusAtendimento.EmAtendimento)
            throw new Domain.Exceptions.DomainException("Sua senha já foi chamada. Fale com o atendente.");

        senha.Cancelar();
        await uow.SaveChangesAsync(ct);
        await notificador.FilaAtualizadaAsync(senha.UnidadeCrasId, ct);
    }
}
