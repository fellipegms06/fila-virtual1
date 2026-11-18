using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Fila;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Application.UseCases.Painel;
using FilaVirtual.Application.Validators;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;
using FilaVirtual.Tests.Aplicacao.Fila;
using FluentValidation;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace FilaVirtual.Tests.Aplicacao.Painel;

public class OperadorDoPainelTests
{
    private readonly IUnidadeCrasRepository _unidades = Substitute.For<IUnidadeCrasRepository>();
    private readonly Guid _minha = Guid.NewGuid();

    public OperadorDoPainelTests() => _unidades.ExisteAsync(default).ReturnsForAnyArgs(true);

    [Fact]
    public async Task Atendente_UsaAUnidadeDoToken() =>
        Assert.Equal(_minha, await new OperadorDoPainel(Guid.NewGuid(), false, _minha).ResolverUnidadeAsync(null, _unidades));

    [Fact]
    public async Task Atendente_NaoPodeMexerEmOutraUnidade() =>
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            new OperadorDoPainel(Guid.NewGuid(), false, _minha).ResolverUnidadeAsync(Guid.NewGuid(), _unidades));

    [Fact]
    public async Task AtendenteSemUnidade_Da403() =>
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            new OperadorDoPainel(Guid.NewGuid(), false, null).ResolverUnidadeAsync(null, _unidades));

    [Fact]
    public async Task Administrador_PrecisaInformarAUnidade() =>
        await Assert.ThrowsAsync<ValidationException>(() =>
            new OperadorDoPainel(Guid.NewGuid(), true, null).ResolverUnidadeAsync(null, _unidades));

    [Fact]
    public async Task Administrador_EscolheQualquerUnidade()
    {
        var qualquer = Guid.NewGuid();
        Assert.Equal(qualquer, await new OperadorDoPainel(Guid.NewGuid(), true, null).ResolverUnidadeAsync(qualquer, _unidades));
    }
}

public class PainelUseCasesTests
{
    private readonly IUnidadeCrasRepository _unidades = Substitute.For<IUnidadeCrasRepository>();
    private readonly ISenhaFilaRepository _senhas = Substitute.For<ISenhaFilaRepository>();
    private readonly IAgendamentoRepository _agendamentos = Substitute.For<IAgendamentoRepository>();
    private readonly IUsuarioRepository _usuarios = Substitute.For<IUsuarioRepository>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IFilaNotifier _notificador = Substitute.For<IFilaNotifier>();
    private readonly FakeTimeProvider _relogio = new(FilaCenario.Agora);
    private readonly INotificacaoRepository _notificacoes = Substitute.For<INotificacaoRepository>();
    private AvisosDaFila Avisos() => new(_senhas, new ServicoDeNotificacao(_notificacoes, _uow, _notificador));
    private readonly OperadorDoPainel _atendente = new(Guid.NewGuid(), false, FilaCenario.Unidade.Id);

    public PainelUseCasesTests()
    {
        _unidades.ExisteAsync(FilaCenario.Unidade.Id, Arg.Any<CancellationToken>()).Returns(true);
        _unidades.OfereceServicoAsync(FilaCenario.Unidade.Id, FilaCenario.Servico.Id, Arg.Any<CancellationToken>()).Returns(true);
        _usuarios.ObterNomesAsync(default!).ReturnsForAnyArgs(new Dictionary<Guid, string>());
        _senhas.ProximoNumeroAsync(default, default).ReturnsForAnyArgs(1);
    }

    private ChamarProximoUseCase Chamar() => new(new ChamarProximoValidator(), _unidades, _senhas, _agendamentos,
        _usuarios, _uow, _notificador, Avisos(), _relogio);

    private FazerCheckinUseCase Checkin() => new(new CheckinValidator(), _unidades, _agendamentos, _usuarios, _senhas,
        new EmissorDeSenha(_senhas, _uow, _relogio), _notificador, Avisos(), _relogio);

    private Agendamento AgendamentoDeHoje(Guid usuarioId, DateTimeOffset? quando = null)
    {
        var horario = new HorarioAtendimento(FilaCenario.Unidade.Id, FilaCenario.Servico.Id,
                                             quando ?? FilaCenario.Agora.AddMinutes(30), 2);
        FilaCenario.Definir(horario, nameof(HorarioAtendimento.Unidade), FilaCenario.Unidade);
        FilaCenario.Definir(horario, nameof(HorarioAtendimento.Servico), FilaCenario.Servico);
        horario.Reservar();
        var agendamento = new Agendamento(usuarioId, horario.Id);
        FilaCenario.Definir(agendamento, nameof(Agendamento.Horario), horario);
        _agendamentos.ObterPorCodigoCheckinAsync(agendamento.CodigoCheckin, Arg.Any<CancellationToken>()).Returns(agendamento);
        _agendamentos.ObterComHorarioAsync(agendamento.Id, Arg.Any<CancellationToken>()).Returns(agendamento);
        return agendamento;
    }

    [Fact]
    public async Task ChamarProximo_ChamaOPreferencialPrimeiro_EAvisaODono()
    {
        var dono = Guid.NewGuid();
        var normal = FilaCenario.Senha(1, minutos: 0);
        var preferencial = FilaCenario.Senha(2, Prioridade.Preferencial, dono, minutos: 5);
        _senhas.ListarAguardandoParaAtualizarAsync(FilaCenario.Unidade.Id, FilaCenario.Hoje, Arg.Any<CancellationToken>())
               .Returns([normal, preferencial]);

        var chamada = await Chamar().ExecutarAsync(_atendente, new ChamarProximoRequest("Guichê 3"));

        Assert.Equal("P002", chamada.Codigo);
        Assert.Equal(StatusAtendimento.EmAtendimento, preferencial.Status);
        Assert.Equal(StatusAtendimento.Aguardando, normal.Status);
        await _notificador.Received(1).SenhaChamadaAsync(
            Arg.Is<SenhaChamadaEvento>(e => e.Codigo == "P002" && e.Guiche == "Guichê 3"), dono, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ChamarProximo_ColocaOAgendamentoEmAtendimento()
    {
        var agendamento = AgendamentoDeHoje(Guid.NewGuid());
        agendamento.FazerCheckin();
        var senha = new SenhaFila(FilaCenario.Unidade.Id, FilaCenario.Servico.Id, agendamento.UsuarioId, agendamento.Id,
                                  1, Prioridade.Normal, FilaCenario.Hoje);
        FilaCenario.Definir(senha, nameof(SenhaFila.Servico), FilaCenario.Servico);
        _senhas.ListarAguardandoParaAtualizarAsync(default, default).ReturnsForAnyArgs([senha]);

        await Chamar().ExecutarAsync(_atendente, new ChamarProximoRequest("Guichê 1"));

        Assert.Equal(StatusAtendimento.EmAtendimento, agendamento.Status);
    }

    [Fact]
    public async Task ChamarProximo_FilaVazia_Da422()
    {
        _senhas.ListarAguardandoParaAtualizarAsync(default, default).ReturnsForAnyArgs([]);

        var erro = await Assert.ThrowsAsync<DomainException>(
            () => Chamar().ExecutarAsync(_atendente, new ChamarProximoRequest("Guichê 1")));
        Assert.Equal("Não há ninguém aguardando na fila.", erro.Message);
    }

    [Fact]
    public async Task ChamarProximo_DoisGuichesAoMesmoTempo_OSegundoRecebe409()
    {
        _senhas.ListarAguardandoParaAtualizarAsync(default, default).ReturnsForAnyArgs([FilaCenario.Senha(1)]);
        _uow.SaveChangesAsync(Arg.Any<CancellationToken>()).ThrowsAsync(new ConcorrenciaException());

        await Assert.ThrowsAsync<ConflictException>(
            () => Chamar().ExecutarAsync(_atendente, new ChamarProximoRequest("Guichê 1")));
        await _notificador.DidNotReceiveWithAnyArgs().SenhaChamadaAsync(default!, default);
    }

    [Fact]
    public async Task Checkin_TransformaOAgendamentoEmSenha()
    {
        var agendamento = AgendamentoDeHoje(Guid.NewGuid());
        _senhas.ObterAsync(default).ReturnsForAnyArgs(_ => FilaCenario.Senha(1));

        var senha = await Checkin().ExecutarAsync(_atendente, new CheckinRequest(agendamento.CodigoCheckin.ToLowerInvariant()));

        Assert.Equal(StatusAtendimento.Aguardando, agendamento.Status);
        await _senhas.Received(1).AdicionarAsync(
            Arg.Is<SenhaFila>(s => s.AgendamentoId == agendamento.Id && s.UsuarioId == agendamento.UsuarioId),
            Arg.Any<CancellationToken>());
        Assert.Equal("N001", senha.Codigo);
    }

    [Fact]
    public async Task Checkin_AgendamentoDeOutroDia_Da422()
    {
        var amanha = AgendamentoDeHoje(Guid.NewGuid(), FilaCenario.Agora.AddDays(1));

        var erro = await Assert.ThrowsAsync<DomainException>(
            () => Checkin().ExecutarAsync(_atendente, new CheckinRequest(amanha.CodigoCheckin)));
        Assert.Contains("não para hoje", erro.Message);
        Assert.Equal(StatusAtendimento.Confirmado, amanha.Status);
    }

    [Fact]
    public async Task Checkin_AgendamentoDeOutraUnidade_Da422()
    {
        var agendamento = AgendamentoDeHoje(Guid.NewGuid());
        var outraUnidade = Guid.NewGuid();
        _unidades.ExisteAsync(outraUnidade, Arg.Any<CancellationToken>()).Returns(true);

        await Assert.ThrowsAsync<DomainException>(() => Checkin().ExecutarAsync(
            new OperadorDoPainel(Guid.NewGuid(), false, outraUnidade), new CheckinRequest(agendamento.CodigoCheckin)));
    }

    [Fact]
    public async Task Checkin_CodigoInexistente_Da404() =>
        await Assert.ThrowsAsync<NotFoundException>(
            () => Checkin().ExecutarAsync(_atendente, new CheckinRequest("ABCDEF12")));

    [Fact]
    public async Task Concluir_SenhaJaConcluida_Da422()
    {
        var senha = FilaCenario.Senha(1);
        senha.Chamar("Guichê 1");
        senha.Concluir();
        _senhas.ObterAsync(senha.Id, Arg.Any<CancellationToken>()).Returns(senha);
        var useCase = new ConcluirAtendimentoUseCase(_unidades, _senhas, _agendamentos, _uow, _notificador);

        await Assert.ThrowsAsync<DomainException>(() => useCase.ExecutarAsync(_atendente, senha.Id, null));
    }

    [Fact]
    public async Task Concluir_SenhaDeOutraUnidade_Da404()
    {
        var outraUnidade = new UnidadeCras("Outro CRAS", "Rua", "Bairro", "8h", "6130000009", 0, 0);
        var senha = new SenhaFila(outraUnidade.Id, FilaCenario.Servico.Id, null, null, 1, Prioridade.Normal, FilaCenario.Hoje);
        _senhas.ObterAsync(senha.Id, Arg.Any<CancellationToken>()).Returns(senha);
        var useCase = new ConcluirAtendimentoUseCase(_unidades, _senhas, _agendamentos, _uow, _notificador);

        await Assert.ThrowsAsync<NotFoundException>(() => useCase.ExecutarAsync(_atendente, senha.Id, null));
    }

    [Fact]
    public async Task CancelarSenhaChamada_RegistraAusenciaNoAgendamento()
    {
        var agendamento = AgendamentoDeHoje(Guid.NewGuid());
        agendamento.FazerCheckin();
        agendamento.IniciarAtendimento();
        var senha = new SenhaFila(FilaCenario.Unidade.Id, FilaCenario.Servico.Id, agendamento.UsuarioId, agendamento.Id,
                                  1, Prioridade.Normal, FilaCenario.Hoje);
        FilaCenario.Definir(senha, nameof(SenhaFila.Servico), FilaCenario.Servico);
        senha.Chamar("Guichê 1");
        _senhas.ObterAsync(senha.Id, Arg.Any<CancellationToken>()).Returns(senha);

        await new CancelarSenhaUseCase(_unidades, _senhas, _agendamentos, _uow, _notificador)
            .ExecutarAsync(_atendente, senha.Id, null);

        Assert.Equal(StatusAtendimento.Cancelado, senha.Status);
        Assert.Equal(StatusAtendimento.Cancelado, agendamento.Status);
    }

    [Fact]
    public async Task Indicadores_CalculaMediasEAbsenteismo()
    {
        var a = FilaCenario.Senha(1, minutos: -60);
        a.Chamar("G1");
        FilaCenario.Definir(a, nameof(SenhaFila.ChamadaEm), FilaCenario.Agora.AddMinutes(-50));
        a.Concluir();
        FilaCenario.Definir(a, nameof(SenhaFila.FinalizadaEm), FilaCenario.Agora.AddMinutes(-30));
        var b = FilaCenario.Senha(2, minutos: -40);
        b.Chamar("G2");
        FilaCenario.Definir(b, nameof(SenhaFila.ChamadaEm), FilaCenario.Agora.AddMinutes(-10));
        _senhas.ListarDoDiaAsync(FilaCenario.Unidade.Id, FilaCenario.Hoje, Arg.Any<CancellationToken>()).Returns([a, b]);

        var faltou = AgendamentoDeHoje(Guid.NewGuid(), FilaCenario.Agora.AddHours(-2));
        var veio = AgendamentoDeHoje(Guid.NewGuid(), FilaCenario.Agora.AddHours(-1));
        veio.FazerCheckin();
        var futuro = AgendamentoDeHoje(Guid.NewGuid(), FilaCenario.Agora.AddHours(2));
        var cancelado = AgendamentoDeHoje(Guid.NewGuid(), FilaCenario.Agora.AddHours(-3));
        cancelado.Cancelar();
        _agendamentos.ListarDaUnidadeEntreAsync(default, default, default).ReturnsForAnyArgs([faltou, veio, futuro, cancelado]);

        var r = await new ObterIndicadoresUseCase(_unidades, _senhas, _agendamentos, _relogio)
            .ExecutarAsync(_atendente, null, null);

        Assert.Equal(2, r.SenhasEmitidas);
        Assert.Equal(1, r.AtendimentosConcluidos);
        Assert.Equal(20, r.TempoMedioEsperaMinutos);
        Assert.Equal(20, r.TempoMedioAtendimentoMinutos);
        Assert.Equal(3, r.AgendamentosDoDia);
        Assert.Equal(1, r.AgendamentosSemCheckin);
        Assert.Equal(0.333, r.TaxaAbsenteismo);
    }
}
