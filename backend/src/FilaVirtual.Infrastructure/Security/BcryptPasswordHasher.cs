using FilaVirtual.Application.Abstractions;

namespace FilaVirtual.Infrastructure.Security;

public class BcryptPasswordHasher : IPasswordHasher
{
    private const int FatorDeCusto = 11;

    public string Gerar(string senha) => BCrypt.Net.BCrypt.HashPassword(senha, FatorDeCusto);

    public bool Verificar(string senha, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(senha, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }
}
