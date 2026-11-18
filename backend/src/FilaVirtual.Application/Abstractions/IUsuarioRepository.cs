using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.Abstractions;

public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default);
    Task<bool> CpfExisteAsync(string cpf, CancellationToken ct = default);

    Task<bool> EmailExisteAsync(string email, Guid? ignorarUsuarioId = null, CancellationToken ct = default);
    Task AdicionarAsync(Usuario usuario, CancellationToken ct = default);

    Task<IReadOnlyDictionary<Guid, string>> ObterNomesAsync(IEnumerable<Guid> ids, CancellationToken ct = default);
}
