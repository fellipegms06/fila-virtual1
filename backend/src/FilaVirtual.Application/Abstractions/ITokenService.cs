using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.Abstractions;

public record TokenGerado(string Token, DateTimeOffset ExpiraEm);

public interface ITokenService
{
    TokenGerado Gerar(Usuario usuario);
}
