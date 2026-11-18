namespace FilaVirtual.Infrastructure.Security;

public class JwtOptions
{
    public const string Secao = "Jwt";

    public string Key { get; set; } = "";
    public string Issuer { get; set; } = "FilaVirtual";
    public string Audience { get; set; } = "FilaVirtual";
    public int ExpiracaoHoras { get; set; } = 8;

    public const string ClaimId = "sub";
    public const string ClaimEmail = "email";
    public const string ClaimPerfil = "role";
    public const string ClaimUnidade = "unidade";

    public void Validar()
    {
        if (string.IsNullOrWhiteSpace(Key) || Key.Length < 32)
            throw new InvalidOperationException(
                "Configure Jwt:Key com pelo menos 32 caracteres (dotnet user-secrets set \"Jwt:Key\" \"...\").");
    }
}
