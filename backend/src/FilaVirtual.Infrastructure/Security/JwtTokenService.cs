using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FilaVirtual.Application.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FilaVirtual.Infrastructure.Security;

public class JwtTokenService(IOptions<JwtOptions> opcoes, TimeProvider relogio) : ITokenService
{
    private readonly JwtOptions _opcoes = opcoes.Value;

    public TokenGerado Gerar(Usuario usuario)
    {
        var agora = relogio.GetUtcNow();
        var expiraEm = agora.AddHours(_opcoes.ExpiracaoHoras);

        var claims = new List<Claim>
        {
            new(JwtOptions.ClaimId, usuario.Id.ToString()),
            new(JwtOptions.ClaimEmail, usuario.Email),
            new(JwtOptions.ClaimPerfil, usuario.Perfil.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        if (usuario.UnidadeCrasId is { } unidadeId)
            claims.Add(new Claim(JwtOptions.ClaimUnidade, unidadeId.ToString()));

        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opcoes.Key));
        var token = new JwtSecurityToken(
            issuer: _opcoes.Issuer,
            audience: _opcoes.Audience,
            claims: claims,
            notBefore: agora.UtcDateTime,
            expires: expiraEm.UtcDateTime,
            signingCredentials: new SigningCredentials(chave, SecurityAlgorithms.HmacSha256));

        return new TokenGerado(new JwtSecurityTokenHandler().WriteToken(token), expiraEm);
    }
}
