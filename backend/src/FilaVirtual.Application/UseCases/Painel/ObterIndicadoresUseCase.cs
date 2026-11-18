using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Domain.Enums;

namespace FilaVirtual.Application.UseCases.Painel;

public class ObterIndicadoresUseCase(
    IUnidadeCrasRepository unidades, ISenhaFilaRepository senhas, IAgendamentoRepository agendamentos,
    TimeProvider relogio)
{
    public static readonly TimeSpan Tolerancia = TimeSpan.FromMinutes(30);

    public async Task<IndicadoresResponse> ExecutarAsync(
        OperadorDoPainel operador, Guid? unidadeSolicitada, DateOnly? data, CancellationToken ct = default)
    {
        var unidadeId = await operador.ResolverUnidadeAsync(unidadeSolicitada, unidades, ct);
        var dia = data ?? HorarioDeBrasilia.Hoje(relogio);
        var agora = relogio.GetUtcNow();

        var doDia = await senhas.ListarDoDiaAsync(unidadeId, dia, ct);

        var esperas = doDia.Where(s => s.ChamadaEm != null)
                           .Select(s => (s.ChamadaEm!.Value - s.EmitidaEm).TotalMinutes).ToList();
        var atendimentos = doDia.Where(s => s.Status == StatusAtendimento.Concluido && s.ChamadaEm != null && s.FinalizadaEm != null)
                                .Select(s => (s.FinalizadaEm!.Value - s.ChamadaEm!.Value).TotalMinutes).ToList();

        var (inicio, fim) = HorarioDeBrasilia.IntervaloDoDia(dia);
        var agendamentosDoDia = (await agendamentos.ListarDaUnidadeEntreAsync(unidadeId, inicio, fim, ct))
            .Where(a => a.Status != StatusAtendimento.Cancelado).ToList();
        var semCheckin = agendamentosDoDia.Count(a =>
            a.Status == StatusAtendimento.Confirmado && a.Horario.DataHora + Tolerancia < agora);

        return new IndicadoresResponse(
            unidadeId, dia,
            SenhasEmitidas: doDia.Count,
            AtendimentosConcluidos: doDia.Count(s => s.Status == StatusAtendimento.Concluido),
            Aguardando: doDia.Count(s => s.Status == StatusAtendimento.Aguardando),
            Canceladas: doDia.Count(s => s.Status == StatusAtendimento.Cancelado),
            TempoMedioEsperaMinutos: Media(esperas),
            TempoMedioAtendimentoMinutos: Media(atendimentos),
            AgendamentosDoDia: agendamentosDoDia.Count,
            AgendamentosSemCheckin: semCheckin,
            TaxaAbsenteismo: agendamentosDoDia.Count == 0 ? 0 : Math.Round((double)semCheckin / agendamentosDoDia.Count, 3));
    }

    private static double? Media(List<double> valores) => valores.Count == 0 ? null : Math.Round(valores.Average(), 1);
}
