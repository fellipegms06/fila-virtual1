using FilaVirtual.API.Extensions;
using FilaVirtual.Application.UseCases.Notificacoes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FilaVirtual.API.Controllers;

[ApiController]
[Authorize]
[Route("api/notificacoes")]
public class NotificacoesController : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<NotificacaoResponse>> Listar(
        [FromServices] ListarNotificacoesUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(User.ObterUsuarioId(), ct);

    [HttpPatch("{id:guid}/lida")]
    public async Task<IActionResult> MarcarComoLida(
        Guid id, [FromServices] MarcarNotificacaoComoLidaUseCase useCase, CancellationToken ct)
    {
        await useCase.ExecutarAsync(User.ObterUsuarioId(), id, ct);
        return NoContent();
    }

    [HttpPatch("lidas")]
    public async Task<IActionResult> MarcarTodasComoLidas(
        [FromServices] MarcarTodasComoLidasUseCase useCase, CancellationToken ct)
    {
        await useCase.ExecutarAsync(User.ObterUsuarioId(), ct);
        return NoContent();
    }
}
