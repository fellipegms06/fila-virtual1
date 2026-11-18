using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Comum;
using FilaVirtual.Application.UseCases.Painel;
using FilaVirtual.Domain.Enums;
using FluentValidation;

namespace FilaVirtual.Application.UseCases.Notificacoes;

public record AvisoDaUnidadeRequest(string Mensagem, Guid? UnidadeId = null);

public record AvisoDaUnidadeResponse(int PessoasAvisadas);

public class EnviarAvisoDaUnidadeUseCase(
    IValidator<AvisoDaUnidadeRequest> validator,
    IUnidadeCrasRepository unidades,
    ISenhaFilaRepository senhas,
    IAgendamentoRepository agendamentos,
    ServicoDeNotificacao servico,
    TimeProvider relogio)
{
    public async Task<AvisoDaUnidadeResponse> ExecutarAsync(
        OperadorDoPainel operador, AvisoDaUnidadeRequest req, CancellationToken ct = default)
    {
        await validator.ValidateAndThrowAsync(req, ct);
        var unidadeId = await operador.ResolverUnidadeAsync(req.UnidadeId, unidades, ct);
        var nomeUnidade = await unidades.ObterNomeAsync(unidadeId, ct);
        var hoje = HorarioDeBrasilia.Hoje(relogio);

        var comSenha = (await senhas.ListarDoDiaAsync(unidadeId, hoje, ct))
            .Where(s => s.Ativa && s.UsuarioId != null).Select(s => s.UsuarioId!.Value);

        var (inicio, fim) = HorarioDeBrasilia.IntervaloDoDia(hoje);
        var comAgendamento = (await agendamentos.ListarDaUnidadeEntreAsync(unidadeId, inicio, fim, ct))
            .Where(a => a.Status is StatusAtendimento.Confirmado or StatusAtendimento.Aguardando).Select(a => a.UsuarioId);

        var destinatarios = comSenha.Concat(comAgendamento).Distinct().ToList();

        await servico.NotificarAsync(destinatarios
            .Select(id => new NovaNotificacao(id, $"Aviso do {nomeUnidade}", req.Mensagem.Trim(), TipoNotificacao.ImprevistoNaUnidade))
            .ToList(), ct);

        return new AvisoDaUnidadeResponse(destinatarios.Count);
    }
}
