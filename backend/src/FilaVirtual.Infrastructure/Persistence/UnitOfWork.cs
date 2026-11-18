using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using Npgsql;

namespace FilaVirtual.Infrastructure.Persistence;

public class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    private const string ViolacaoUnicidade = "23505";
    private const string ViolacaoCheck = "23514";

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcorrenciaException();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: ViolacaoUnicidade })
        {
            throw new RegistroDuplicadoException();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: ViolacaoCheck })
        {
            throw new ConcorrenciaException();
        }
    }
}
