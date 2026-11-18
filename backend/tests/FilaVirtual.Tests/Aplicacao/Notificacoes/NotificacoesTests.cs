using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Application.UseCases.Painel;
using FilaVirtual.Application.Validators;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Tests.Aplicacao.Fila;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;

namespace FilaVirtual.Tests.Aplicacao.Notificacoes;

public abstract class NotificacoesTestBase
{
    protected readonly INotificacaoRepository Repo = Substitute.For<INotificacaoRepository>();
    protected readonly IUnitOfWork Uow = Substitute.For<IUnitOfWork>();
    protected readonly IFilaNotifier Notificador = Substitute.For<IFilaNotifier>();
    protected readonly ISenhaFilaRepository Senhas = Substitute.For<ISenhaFilaRepository>();
    protected readonly List<Notificacao> Gravadas = [];

    protected NotificacoesTestBase() =>
        Repo.AdicionarAsync(Arg.Do<Notificacao>(Gravadas.Add), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

    protected ServicoDeNotificacao Servico() => new(Repo, Uow, Notificador);

    protected IEnumerable<Notificacao> Para(Guid usuarioId) => Gravadas.Where(n => n.UsuarioId == usuarioId);
}

public class ServicoDeNotificacaoTests : NotificacoesTestBase
{
    [Fact]
    public async Task GravaNoBanco_EDepoisEnviaEmTempoReal()
    {
        var usuario = Guid.NewGuid();

        await Servico().NotificarAsync(new NovaNotificacao(usuario, "Título", "Mensagem", TipoNotificacao.SenhaChamada));

        Assert.Single(Gravadas);
        Received.InOrder(() =>
        {
            Uow.SaveChangesAsync(Arg.Any<CancellationToken>());
            Notificador.NotificacaoAsync(usuario, Arg.Is<NotificacaoEvento>(e => e.Tipo == "SenhaChamada"), Arg.Any<CancellationToken>());
        });
    }

    [Fact]
    public async Task ListaVazia_NaoGravaNada()
    {
        await Servico().NotificarAsync([]);
        await Uow.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}

public class AvisosDaFilaTests : NotificacoesTestBase
{
    [Fact]
    public async Task AposChamada_AvisaODono_OProximo_EOTerceiro()
    {
        Guid dono = Guid.NewGuid(), primeiro = Guid.NewGuid(), segundo = Guid.NewGuid(), terceiro = Guid.NewGuid();
        var chamada = FilaCenario.Senha(1, usuarioId: dono, minutos: 0);
        var s2 = FilaCenario.Senha(2, usuarioId: primeiro, minutos: 1);
        var s3 = FilaCenario.Senha(3, usuarioId: segundo, minutos: 2);
        var s4 = FilaCenario.Senha(4, usuarioId: terceiro, minutos: 3);
        var presencial = FilaCenario.Senha(5, minutos: 4);
        chamada.Chamar("Guichê 4");

        await new AvisosDaFila(Senhas, Servico()).AposChamadaAsync(chamada, [chamada, s2, s3, s4, presencial]);

        Assert.Contains(Para(dono), n => n.Tipo == TipoNotificacao.SenhaChamada && n.Mensagem.Contains("Guichê 4"));
        Assert.Contains(Para(primeiro), n => n.Titulo == "Você é o próximo!");
        Assert.Empty(Para(segundo));
        Assert.Contains(Para(terceiro), n => n.Mensagem.StartsWith("Faltam 2 senhas"));
        Assert.Equal(3, Gravadas.Count);
    }

    [Fact]
    public async Task PreferencialEntrou_AvisaQuemTemSenhaNormal_ComANovaPosicao()
    {
        Guid normal = Guid.NewGuid(), idoso = Guid.NewGuid();
        var n1 = FilaCenario.Senha(1, usuarioId: normal, minutos: 0);
        var p2 = FilaCenario.Senha(2, Prioridade.Preferencial, idoso, minutos: 1);
        Senhas.ListarDoDiaAsync(FilaCenario.Unidade.Id, FilaCenario.Hoje, Arg.Any<CancellationToken>()).Returns([n1, p2]);

        await new AvisosDaFila(Senhas, Servico()).AposEntradaPreferencialAsync(p2);

        var aviso = Assert.Single(Gravadas);
        Assert.Equal(normal, aviso.UsuarioId);
        Assert.Equal(TipoNotificacao.AlteracaoNaFila, aviso.Tipo);
        Assert.Contains("2º", aviso.Mensagem);
    }

    [Fact]
    public async Task SenhaNormalEntrou_NinguemEhAvisado()
    {
        await new AvisosDaFila(Senhas, Servico()).AposEntradaPreferencialAsync(FilaCenario.Senha(1));

        Assert.Empty(Gravadas);
        await Senhas.DidNotReceiveWithAnyArgs().ListarDoDiaAsync(default, default);
    }
}

public class EnviarLembretesUseCaseTests : NotificacoesTestBase
{
    private readonly IAgendamentoRepository _agendamentos = Substitute.For<IAgendamentoRepository>();

    [Fact]
    public async Task AvisaUmaVezSo_EMarcaOAgendamento()
    {
        var horario = new HorarioAtendimento(FilaCenario.Unidade.Id, FilaCenario.Servico.Id, FilaCenario.Agora.AddMinutes(40), 2);
        FilaCenario.Definir(horario, nameof(HorarioAtendimento.Unidade), FilaCenario.Unidade);
        FilaCenario.Definir(horario, nameof(HorarioAtendimento.Servico), FilaCenario.Servico);
        var agendamento = new Agendamento(Guid.NewGuid(), horario.Id);
        FilaCenario.Definir(agendamento, nameof(Agendamento.Horario), horario);
        _agendamentos.ListarParaLembreteAsync(default, default).ReturnsForAnyArgs([agendamento]);
        var useCase = new EnviarLembretesUseCase(_agendamentos, Servico(), Uow, new FakeTimeProvider(FilaCenario.Agora));

        var primeira = await useCase.ExecutarAsync();
        var segunda = await useCase.ExecutarAsync();

        Assert.Equal(1, primeira);
        Assert.Equal(0, segunda);
        Assert.True(agendamento.LembreteEnviado);
        var aviso = Assert.Single(Gravadas);
        Assert.Contains("10:40", aviso.Mensagem);
        Assert.Contains(agendamento.CodigoCheckin, aviso.Mensagem);
    }

    [Fact]
    public async Task ProcuraNaJanelaDaProximaHora()
    {
        var useCase = new EnviarLembretesUseCase(_agendamentos, Servico(), Uow, new FakeTimeProvider(FilaCenario.Agora));
        _agendamentos.ListarParaLembreteAsync(default, default).ReturnsForAnyArgs([]);

        await useCase.ExecutarAsync();

        await _agendamentos.Received(1).ListarParaLembreteAsync(FilaCenario.Agora, FilaCenario.Agora.AddHours(1), Arg.Any<CancellationToken>());
    }
}

public class MarcarNotificacaoComoLidaUseCaseTests : NotificacoesTestBase
{
    [Fact]
    public async Task DonoMarcaComoLida()
    {
        var n = new Notificacao(Guid.NewGuid(), "T", "M", TipoNotificacao.VezProxima);
        Repo.ObterAsync(n.Id, Arg.Any<CancellationToken>()).Returns(n);

        await new MarcarNotificacaoComoLidaUseCase(Repo, Uow).ExecutarAsync(n.UsuarioId, n.Id);

        Assert.True(n.Lida);
    }

    [Fact]
    public async Task NotificacaoDeOutraPessoa_Da404()
    {
        var n = new Notificacao(Guid.NewGuid(), "T", "M", TipoNotificacao.VezProxima);
        Repo.ObterAsync(n.Id, Arg.Any<CancellationToken>()).Returns(n);

        await Assert.ThrowsAsync<NotFoundException>(
            () => new MarcarNotificacaoComoLidaUseCase(Repo, Uow).ExecutarAsync(Guid.NewGuid(), n.Id));
        Assert.False(n.Lida);
    }
}

public class EnviarAvisoDaUnidadeUseCaseTests : NotificacoesTestBase
{
    [Fact]
    public async Task AvisaCadaPessoaUmaVez_ComSenhaAtivaOuAgendamentoHoje()
    {
        var unidades = Substitute.For<IUnidadeCrasRepository>();
        var agendamentos = Substitute.For<IAgendamentoRepository>();
        unidades.ExisteAsync(default).ReturnsForAnyArgs(true);
        unidades.ObterNomeAsync(default).ReturnsForAnyArgs("CRAS Central");

        Guid comSenhaEAgendamento = Guid.NewGuid(), soAgendamento = Guid.NewGuid(), jaAtendido = Guid.NewGuid();
        var ativa = FilaCenario.Senha(1, usuarioId: comSenhaEAgendamento);
        var concluida = FilaCenario.Senha(2, usuarioId: jaAtendido);
        concluida.Chamar("G1");
        concluida.Concluir();
        Senhas.ListarDoDiaAsync(default, default).ReturnsForAnyArgs([ativa, concluida, FilaCenario.Senha(3)]);
        agendamentos.ListarDaUnidadeEntreAsync(default, default, default).ReturnsForAnyArgs(
            [new Agendamento(comSenhaEAgendamento, Guid.NewGuid()), new Agendamento(soAgendamento, Guid.NewGuid())]);

        var useCase = new EnviarAvisoDaUnidadeUseCase(new AvisoDaUnidadeValidator(), unidades, Senhas, agendamentos,
            Servico(), new FakeTimeProvider(FilaCenario.Agora));

        var r = await useCase.ExecutarAsync(new OperadorDoPainel(Guid.NewGuid(), false, FilaCenario.Unidade.Id),
            new AvisoDaUnidadeRequest("Sistema fora do ar até as 11h."));

        Assert.Equal(2, r.PessoasAvisadas);
        Assert.Single(Para(comSenhaEAgendamento));
        Assert.Single(Para(soAgendamento));
        Assert.Empty(Para(jaAtendido));
        Assert.All(Gravadas, n => Assert.Equal("Aviso do CRAS Central", n.Titulo));
    }
}
