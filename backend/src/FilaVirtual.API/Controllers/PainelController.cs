using FilaVirtual.API.Extensions;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Application.UseCases.Painel;
using FilaVirtual.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FilaVirtual.API.Controllers;

[ApiController]
[Authorize(Roles = $"{nameof(PerfilUsuario.Atendente)},{nameof(PerfilUsuario.Administrador)}")]
[Route("api/painel")]
public class PainelController : ControllerBase
{
    private OperadorDoPainel Operador => new(
        User.ObterUsuarioId(),
        User.IsInRole(nameof(PerfilUsuario.Administrador)),
        User.ObterUnidadeId());

    [HttpGet("fila")]
    public async Task<FilaDoDiaResponse> Fila(
        [FromQuery] Guid? unidadeId, [FromServices] ObterFilaDoDiaUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(Operador, unidadeId, ct);

    [HttpPost("checkin")]
    [ProducesResponseType<PainelSenhaResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Checkin(
        CheckinRequest req, [FromServices] FazerCheckinUseCase useCase, CancellationToken ct) =>
        Created("/api/painel/fila", await useCase.ExecutarAsync(Operador, req, ct));

    [HttpPost("senhas")]
    [ProducesResponseType<PainelSenhaResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> SenhaPresencial(
        SenhaPresencialRequest req, [FromServices] EmitirSenhaPresencialUseCase useCase, CancellationToken ct) =>
        Created("/api/painel/fila", await useCase.ExecutarAsync(Operador, req, ct));

    [HttpPost("chamar-proximo")]
    public async Task<PainelSenhaResponse> ChamarProximo(
        ChamarProximoRequest req, [FromServices] ChamarProximoUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(Operador, req, ct);

    [HttpPost("senhas/{id:guid}/concluir")]
    public async Task<PainelSenhaResponse> Concluir(
        Guid id, [FromQuery] Guid? unidadeId, [FromServices] ConcluirAtendimentoUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(Operador, id, unidadeId, ct);

    [HttpPost("senhas/{id:guid}/cancelar")]
    public async Task<PainelSenhaResponse> Cancelar(
        Guid id, [FromQuery] Guid? unidadeId, [FromServices] CancelarSenhaUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(Operador, id, unidadeId, ct);

    [HttpPost("avisos")]
    public async Task<AvisoDaUnidadeResponse> Aviso(
        AvisoDaUnidadeRequest req, [FromServices] EnviarAvisoDaUnidadeUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(Operador, req, ct);

    [HttpGet("indicadores")]
    public async Task<IndicadoresResponse> Indicadores(
        [FromQuery] Guid? unidadeId, [FromQuery] DateOnly? data,
        [FromServices] ObterIndicadoresUseCase useCase, CancellationToken ct) =>
        await useCase.ExecutarAsync(Operador, unidadeId, data, ct);
}
