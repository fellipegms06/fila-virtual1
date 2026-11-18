using FilaVirtual.Application.Abstractions;
using FilaVirtual.Infrastructure.Persistence;

namespace FilaVirtual.Infrastructure.Repositories;

public class UsuarioRepository(AppDbContext db) : IUsuarioRepository
{
    public Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        db.Usuarios.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default) =>
        db.Usuarios.FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<bool> CpfExisteAsync(string cpf, CancellationToken ct = default) =>
        db.Usuarios.AnyAsync(u => u.Cpf == cpf, ct);

    public Task<bool> EmailExisteAsync(string email, Guid? ignorarUsuarioId = null, CancellationToken ct = default) =>
        db.Usuarios.AnyAsync(u => u.Email == email && u.Id != ignorarUsuarioId, ct);

    public async Task AdicionarAsync(Usuario usuario, CancellationToken ct = default) =>
        await db.Usuarios.AddAsync(usuario, ct);

    public async Task<IReadOnlyDictionary<Guid, string>> ObterNomesAsync(IEnumerable<Guid> ids, CancellationToken ct = default)
    {
        var lista = ids.Distinct().ToList();
        if (lista.Count == 0) return new Dictionary<Guid, string>();

        return await db.Usuarios.AsNoTracking()
            .Where(u => lista.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.NomeCompleto, ct);
    }
}
