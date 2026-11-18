using System.Security.Claims;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Infrastructure.Security;

namespace FilaVirtual.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid ObterUsuarioId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(JwtOptions.ClaimId), out var id)
            ? id
            : throw new UnauthorizedAppException("Sessão inválida. Entre novamente.");

    public static Guid? ObterUnidadeId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(JwtOptions.ClaimUnidade), out var id) ? id : null;
}
