using FilaVirtual.Application.UseCases.Unidades;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FilaVirtual.API.Controllers;

[ApiController]
[Authorize]
[Route("api/unidades")]
public class UnidadesController : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<UnidadeResumoResponse>> Listar(
        [FromQuery] double? lat, [FromQuery] double? lng,
        [FromServices] ListarUnidadesUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(new ListarUnidadesRequest(lat, lng), ct);

    [HttpGet("{id:guid}")]
    public async Task<UnidadeDetalheResponse> Obter(
        Guid id, [FromServices] ObterUnidadeUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(id, ct);

    [HttpGet("{id:guid}/servicos")]
    public async Task<IReadOnlyList<ServicoResponse>> Servicos(
        Guid id, [FromServices] ListarServicosDaUnidadeUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(id, ct);
}
