using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;

namespace FilaVirtual.Application.UseCases.Auth;

public class ObterMeusDadosUseCase(IUsuarioRepository usuarios)
{
    public async Task<UsuarioResponse> ExecutarAsync(Guid usuarioId, CancellationToken ct = default)
    {
        var usuario = await usuarios.ObterPorIdAsync(usuarioId, ct)
            ?? throw new UnauthorizedAppException("Usuário não encontrado. Entre novamente.");
        return UsuarioResponse.De(usuario);
    }
}
