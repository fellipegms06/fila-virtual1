using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Exceptions;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Auth;

public class AtualizarDadosCadastraisUseCase(
    IValidator<AtualizarDadosCadastraisRequest> validator,
    IUsuarioRepository usuarios,
    IPasswordHasher hasher,
    IUnitOfWork uow)
{
    public async Task<UsuarioResponse> ExecutarAsync(
        Guid usuarioId, AtualizarDadosCadastraisRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);

        var usuario = await usuarios.ObterPorIdAsync(usuarioId, ct)
            ?? throw new UnauthorizedAppException("Usuário não encontrado. Entre novamente.");

        var email = req.Email.Trim().ToLowerInvariant();
        if (email != usuario.Email && await usuarios.EmailExisteAsync(email, usuario.Id, ct))
            throw new ConflictException("Já existe uma conta com este e-mail.");

        usuario.AtualizarEmail(email);
        usuario.AtualizarTelefone(req.Telefone);

        if (!string.IsNullOrEmpty(req.NovaSenha))
        {
            if (string.IsNullOrEmpty(req.SenhaAtual) || !hasher.Verificar(req.SenhaAtual, usuario.SenhaHash))
                throw new DomainException("A senha atual está incorreta.");
            usuario.AtualizarSenha(hasher.Gerar(req.NovaSenha));
        }

        try
        {
            await uow.SaveChangesAsync(ct);
        }
        catch (RegistroDuplicadoException)
        {
            throw new ConflictException("Já existe uma conta com este e-mail.");
        }

        return UsuarioResponse.De(usuario);
    }
}
