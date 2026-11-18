using FilaVirtual.Application.UseCases.Auth;
using Microsoft.AspNetCore.Mvc;

namespace FilaVirtual.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("cadastro")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Cadastrar(
        CadastrarUsuarioRequest req, [FromServices] CadastrarUsuarioUseCase useCase, CancellationToken ct)
    {
        var resposta = await useCase.ExecutarAsync(req, ct);
        return Created("/api/usuarios/me", resposta);
    }

    [HttpPost("login")]
    public async Task<AuthResponse> Login(
        LoginRequest req, [FromServices] LoginUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(req, ct);
}
