using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Domain.Enums;

namespace FilaVirtual.Application.UseCases.Notificacoes;

public class EnviarLembretesUseCase(
    IAgendamentoRepository agendamentos, ServicoDeNotificacao servico, IUnitOfWork uow, TimeProvider relogio)
{
    public static readonly TimeSpan Antecedencia = TimeSpan.FromHours(1);

    public async Task<int> ExecutarAsync(CancellationToken ct = default)
    {
        var agora = relogio.GetUtcNow();
        var pendentes = await agendamentos.ListarParaLembreteAsync(agora, agora + Antecedencia, ct);
        if (pendentes.Count == 0) return 0;

        var avisos = new List<NovaNotificacao>();
        foreach (var a in pendentes.Where(a => a.Status == StatusAtendimento.Confirmado && !a.LembreteEnviado))
        {
            var hora = HorarioDeBrasilia.Converter(a.Horario.DataHora);
            avisos.Add(new(a.UsuarioId, "Seu atendimento é daqui a pouco",
                $"{a.Horario.Servico.Nome} às {hora:HH:mm} no {a.Horario.Unidade.Nome}. Leve seus documentos e o código {a.CodigoCheckin}.",
                TipoNotificacao.VezProxima));
            a.MarcarLembreteEnviado();
        }

        await uow.SaveChangesAsync(ct);
        await servico.NotificarAsync(avisos, ct);
        return avisos.Count;
    }
}
