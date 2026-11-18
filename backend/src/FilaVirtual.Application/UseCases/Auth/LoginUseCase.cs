using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Auth;

public class LoginUseCase(
    IValidator<LoginRequest> validator,
    IUsuarioRepository usuarios,
    IPasswordHasher hasher,
    ITokenService tokens)
{
    public const string MensagemCredenciaisInvalidas = "E-mail ou senha incorretos.";

    public async Task<AuthResponse> ExecutarAsync(LoginRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);

        var usuario = await usuarios.ObterPorEmailAsync(req.Email.Trim().ToLowerInvariant(), ct);
        if (usuario is null || !hasher.Verificar(req.Senha, usuario.SenhaHash))
            throw new UnauthorizedAppException(MensagemCredenciaisInvalidas);

        var token = tokens.Gerar(usuario);
        return new AuthResponse(token.Token, token.ExpiraEm, UsuarioResponse.De(usuario));
    }
}
