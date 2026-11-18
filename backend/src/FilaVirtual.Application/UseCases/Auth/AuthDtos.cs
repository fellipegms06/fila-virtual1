using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.UseCases.Auth;

public record CadastrarUsuarioRequest(
    string NomeCompleto, string Cpf, DateOnly DataNascimento, string Email, string Senha, string? Telefone);

public record LoginRequest(string Email, string Senha);

public record AtualizarDadosCadastraisRequest(
    string Email, string? Telefone, string? SenhaAtual, string? NovaSenha);

public record UsuarioResponse(
    Guid Id, string NomeCompleto, string Cpf, DateOnly DataNascimento,
    string Email, string? Telefone, string Perfil, Guid? UnidadeCrasId)
{
    public static UsuarioResponse De(Usuario u) =>
        new(u.Id, u.NomeCompleto, u.Cpf, u.DataNascimento, u.Email, u.Telefone,
            u.Perfil.ToString(), u.UnidadeCrasId);
}

public record AuthResponse(string Token, DateTimeOffset ExpiraEm, UsuarioResponse Usuario);
