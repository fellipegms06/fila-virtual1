using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Services;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Auth;

public class CadastrarUsuarioUseCase(
    IValidator<CadastrarUsuarioRequest> validator,
    IUsuarioRepository usuarios,
    IPasswordHasher hasher,
    ITokenService tokens,
    IUnitOfWork uow)
{
    public async Task<AuthResponse> ExecutarAsync(CadastrarUsuarioRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);

        var cpf = CpfValidator.Normalizar(req.Cpf);
        if (await usuarios.CpfExisteAsync(cpf, ct))
            throw new ConflictException("Já existe uma conta com este CPF.");

        var email = req.Email.Trim().ToLowerInvariant();
        if (await usuarios.EmailExisteAsync(email, ct: ct))
            throw new ConflictException("Já existe uma conta com este e-mail.");

        var usuario = new Usuario(req.NomeCompleto, cpf, req.DataNascimento, email, hasher.Gerar(req.Senha));
        usuario.AtualizarTelefone(req.Telefone);

        await usuarios.AdicionarAsync(usuario, ct);
        try
        {
            await uow.SaveChangesAsync(ct);
        }
        catch (RegistroDuplicadoException)
        {
            throw new ConflictException("Já existe uma conta com este CPF ou e-mail.");
        }

        var token = tokens.Gerar(usuario);
        return new AuthResponse(token.Token, token.ExpiraEm, UsuarioResponse.De(usuario));
    }
}
