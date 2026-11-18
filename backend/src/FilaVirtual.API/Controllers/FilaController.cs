using FilaVirtual.API.Extensions;
using FilaVirtual.Application.UseCases.Fila;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FilaVirtual.API.Controllers;

[ApiController]
[Authorize]
[Route("api/fila")]
public class FilaController : ControllerBase
{
    [HttpPost("entrar")]
    [ProducesResponseType<MinhaFilaResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Entrar(
        EntrarNaFilaRequest req, [FromServices] EntrarNaFilaUseCase useCase, CancellationToken ct)
    {
        var resposta = await useCase.ExecutarAsync(User.ObterUsuarioId(), req, ct);
        return Created("/api/fila/minha", resposta);
    }

    [HttpGet("minha")]
    public async Task<MinhaFilaResponse> Minha(
        [FromServices] ConsultarMinhaPosicaoUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(User.ObterUsuarioId(), ct);

    [HttpDelete("minha")]
    public async Task<IActionResult> Sair([FromServices] SairDaFilaUseCase useCase, CancellationToken ct)
    {
        await useCase.ExecutarAsync(User.ObterUsuarioId(), ct);
        return NoContent();
    }
}
