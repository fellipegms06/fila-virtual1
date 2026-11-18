using FilaVirtual.API.Extensions;
using FilaVirtual.Application.UseCases.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FilaVirtual.API.Controllers;

[ApiController]
[Authorize]
[Route("api/usuarios")]
public class UsuariosController : ControllerBase
{
    [HttpGet("me")]
    public async Task<UsuarioResponse> ObterMeusDados(
        [FromServices] ObterMeusDadosUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(User.ObterUsuarioId(), ct);

    [HttpPut("me")]
    public async Task<UsuarioResponse> Atualizar(
        AtualizarDadosCadastraisRequest req, [FromServices] AtualizarDadosCadastraisUseCase useCase,
        CancellationToken ct) =>
        await useCase.ExecutarAsync(User.ObterUsuarioId(), req, ct);
}
