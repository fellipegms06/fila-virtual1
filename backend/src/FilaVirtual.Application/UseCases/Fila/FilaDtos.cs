using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.UseCases.Fila;

public record EntrarNaFilaRequest(Guid UnidadeId, Guid ServicoId);

public record SenhaResponse(
    Guid Id, string Codigo, string Status, string Prioridade, Guid UnidadeId, string Unidade,
    Guid ServicoId, string Servico, DateTimeOffset EmitidaEm, DateTimeOffset? ChamadaEm, string? Guiche)
{
    public static SenhaResponse De(SenhaFila s) => new(
        s.Id, s.Codigo, s.Status.ToString(), s.Prioridade.ToString(), s.UnidadeCrasId, s.Unidade.Nome,
        s.ServicoId, s.Servico.Nome, s.EmitidaEm, s.ChamadaEm, s.Guiche);
}

public record MinhaFilaResponse(
    SenhaResponse? MinhaSenha,
    int? Posicao,
    int? PessoasAFrente,
    int? TempoEstimadoMinutos,
    string? SenhaChamadaAgora,
    string? GuicheChamadaAgora)
{
    public static readonly MinhaFilaResponse ForaDaFila = new(null, null, null, null, null, null);
}
