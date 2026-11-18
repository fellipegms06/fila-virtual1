using FilaVirtual.API.Extensions;
using FilaVirtual.Application.UseCases.Agendamentos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FilaVirtual.API.Controllers;

[ApiController]
[Authorize]
public class AgendamentosController : ControllerBase
{
    [HttpGet("api/unidades/{unidadeId:guid}/horarios")]
    public async Task<IReadOnlyList<HorarioResponse>> Horarios(
        Guid unidadeId, [FromQuery] Guid servicoId, [FromQuery] DateOnly? data,
        [FromServices] ListarHorariosUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(new ListarHorariosRequest(unidadeId, servicoId, data), ct);

    [HttpPost("api/agendamentos")]
    [ProducesResponseType<AgendamentoResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Agendar(
        AgendarAtendimentoRequest req, [FromServices] AgendarAtendimentoUseCase useCase, CancellationToken ct)
    {
        var agendamento = await useCase.ExecutarAsync(User.ObterUsuarioId(), req, ct);
        return Created("/api/agendamentos/meus", agendamento);
    }

    [HttpGet("api/agendamentos/meus")]
    public async Task<IReadOnlyList<AgendamentoResponse>> Meus(
        [FromServices] ListarMeusAgendamentosUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(User.ObterUsuarioId(), ct);

    [HttpDelete("api/agendamentos/{id:guid}")]
    public async Task<IActionResult> Cancelar(
        Guid id, [FromServices] CancelarAgendamentoUseCase useCase, CancellationToken ct)
    {
        await useCase.ExecutarAsync(User.ObterUsuarioId(), id, ct);
        return NoContent();
    }
}
