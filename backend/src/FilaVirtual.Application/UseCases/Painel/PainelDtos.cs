using FilaVirtual.Domain.Entities;

namespace FilaVirtual.Application.UseCases.Painel;

public record CheckinRequest(string Codigo, bool Preferencial = false, Guid? UnidadeId = null);

public record SenhaPresencialRequest(Guid ServicoId, bool Preferencial = false, Guid? UnidadeId = null);

public record ChamarProximoRequest(string Guiche, Guid? UnidadeId = null);

public record PainelSenhaResponse(
    Guid Id, string Codigo, string Status, string Prioridade, Guid ServicoId, string Servico,
    string? Cidadao, bool TemAgendamento, DateTimeOffset EmitidaEm, DateTimeOffset? ChamadaEm,
    string? Guiche, int? Posicao)
{
    public static PainelSenhaResponse De(SenhaFila s, string? cidadao = null, int? posicao = null) => new(
        s.Id, s.Codigo, s.Status.ToString(), s.Prioridade.ToString(), s.ServicoId, s.Servico.Nome,
        cidadao, s.AgendamentoId != null, s.EmitidaEm, s.ChamadaEm, s.Guiche, posicao);
}

public record FilaDoDiaResponse(
    Guid UnidadeId, string Unidade, DateOnly Data,
    IReadOnlyList<PainelSenhaResponse> EmAtendimento,
    IReadOnlyList<PainelSenhaResponse> Aguardando,
    int ConcluidasHoje, int CanceladasHoje);

public record IndicadoresResponse(
    Guid UnidadeId, DateOnly Data,
    int SenhasEmitidas, int AtendimentosConcluidos, int Aguardando, int Canceladas,
    double? TempoMedioEsperaMinutos,
    double? TempoMedioAtendimentoMinutos,
    int AgendamentosDoDia, int AgendamentosSemCheckin,
    double TaxaAbsenteismo);
