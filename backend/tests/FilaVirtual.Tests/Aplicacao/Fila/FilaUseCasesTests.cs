using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Fila;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Application.Validators;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace FilaVirtual.Tests.Aplicacao.Fila;

internal static class FilaCenario
{
    public static readonly DateTimeOffset Agora = new(2026, 11, 9, 13, 0, 0, TimeSpan.Zero);
    public static readonly DateOnly Hoje = new(2026, 11, 9);

    public static readonly UnidadeCras Unidade =
        new("CRAS Central", "Rua A", "Centro", "8h às 17h", "6130000001", -15.79, -47.88);
    public static readonly Servico Servico = new("Atualização cadastral", "Atualizar dados.", 30);

    public static SenhaFila Senha(int numero, Prioridade prioridade = Prioridade.Normal, Guid? usuarioId = null,
                                  int minutos = 0)
    {
        var senha = new SenhaFila(Unidade.Id, Servico.Id, usuarioId, null, numero, prioridade, Hoje);
        Definir(senha, nameof(SenhaFila.Unidade), Unidade);
        Definir(senha, nameof(SenhaFila.Servico), Servico);
        Definir(senha, nameof(SenhaFila.EmitidaEm), Agora.AddMinutes(minutos));
        return senha;
    }

    public static void Definir(object alvo, string propriedade, object valor) =>
        alvo.GetType().GetProperty(propriedade)!.SetValue(alvo, valor);
}

public class EmissorDeSenhaTests
{
    private readonly ISenhaFilaRepository _senhas = Substitute.For<ISenhaFilaRepository>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly EmissorDeSenha _emissor;

    public EmissorDeSenhaTests() => _emissor = new EmissorDeSenha(_senhas, _uow, new FakeTimeProvider(FilaCenario.Agora));

    [Fact]
    public async Task UsaOProximoNumeroDoDia_NoHorarioDeBrasilia()
    {
        _senhas.ProximoNumeroAsync(FilaCenario.Unidade.Id, FilaCenario.Hoje, Arg.Any<CancellationToken>()).Returns(5);

        var senha = await _emissor.EmitirAsync(FilaCenario.Unidade.Id, FilaCenario.Servico.Id, null, null, Prioridade.Normal);

        Assert.Equal("N005", senha.Codigo);
        Assert.Equal(FilaCenario.Hoje, senha.DataReferencia);
    }

    [Fact]
    public async Task DiaDaSenha_EhODiaEmBrasilia_NaoOUtc()
    {
        var noite = new DateTimeOffset(2026, 11, 10, 1, 0, 0, TimeSpan.Zero);
        var emissor = new EmissorDeSenha(_senhas, _uow, new FakeTimeProvider(noite));
        _senhas.ProximoNumeroAsync(default, default).ReturnsForAnyArgs(1);

        var senha = await emissor.EmitirAsync(Guid.NewGuid(), Guid.NewGuid(), null, null, Prioridade.Normal);

        Assert.Equal(new DateOnly(2026, 11, 9), senha.DataReferencia);
    }

    [Fact]
    public async Task NumeroRepetido_TentaDeNovoComONumeroSeguinte()
    {
        _senhas.ProximoNumeroAsync(default, default).ReturnsForAnyArgs(5, 6);
        _uow.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(_ => throw new RegistroDuplicadoException(), _ => Task.CompletedTask);

        var senha = await _emissor.EmitirAsync(Guid.NewGuid(), Guid.NewGuid(), null, null, Prioridade.Preferencial);

        Assert.Equal("P006", senha.Codigo);
        _senhas.Received(1).Descartar(Arg.Is<SenhaFila>(s => s.Numero == 5));
    }

    [Fact]
    public async Task DepoisDe3Tentativas_Desiste_Com409()
    {
        _senhas.ProximoNumeroAsync(default, default).ReturnsForAnyArgs(1);
        _uow.SaveChangesAsync(Arg.Any<CancellationToken>()).ThrowsAsync(new RegistroDuplicadoException());

        await Assert.ThrowsAsync<ConflictException>(
            () => _emissor.EmitirAsync(Guid.NewGuid(), Guid.NewGuid(), null, null, Prioridade.Normal));
        await _uow.Received(EmissorDeSenha.Tentativas).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}

public class EntrarNaFilaUseCaseTests
{
    private readonly IUsuarioRepository _usuarios = Substitute.For<IUsuarioRepository>();
    private readonly IUnidadeCrasRepository _unidades = Substitute.For<IUnidadeCrasRepository>();
    private readonly ISenhaFilaRepository _senhas = Substitute.For<ISenhaFilaRepository>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IFilaNotifier _notificador = Substitute.For<IFilaNotifier>();
    private readonly EntrarNaFilaUseCase _useCase;

    public EntrarNaFilaUseCaseTests()
    {
        var relogio = new FakeTimeProvider(FilaCenario.Agora);
        _unidades.ExisteAsync(FilaCenario.Unidade.Id, Arg.Any<CancellationToken>()).Returns(true);
        _unidades.OfereceServicoAsync(FilaCenario.Unidade.Id, FilaCenario.Servico.Id, Arg.Any<CancellationToken>()).Returns(true);
        _senhas.ProximoNumeroAsync(default, default).ReturnsForAnyArgs(1);
        _senhas.ObterAsync(default).ReturnsForAnyArgs(_ => FilaCenario.Senha(1));
        _useCase = new EntrarNaFilaUseCase(new EntrarNaFilaValidator(), _usuarios, _unidades, _senhas,
            new EmissorDeSenha(_senhas, _uow, relogio), _notificador,
            new AvisosDaFila(_senhas, new ServicoDeNotificacao(Substitute.For<INotificacaoRepository>(), _uow, _notificador)),
            relogio);
    }

    private Usuario Cidadao(DateOnly nascimento)
    {
        var u = new Usuario("Maria", "52998224725", nascimento, "maria@email.com", "hash");
        _usuarios.ObterPorIdAsync(u.Id, Arg.Any<CancellationToken>()).Returns(u);
        return u;
    }

    private Task<MinhaFilaResponse> Entrar(Usuario u) =>
        _useCase.ExecutarAsync(u.Id, new EntrarNaFilaRequest(FilaCenario.Unidade.Id, FilaCenario.Servico.Id));

    [Fact]
    public async Task Idoso_RecebeSenhaPreferencial()
    {
        var idoso = Cidadao(new DateOnly(1950, 1, 1));

        await Entrar(idoso);

        await _senhas.Received(1).AdicionarAsync(
            Arg.Is<SenhaFila>(s => s.Prioridade == Prioridade.Preferencial && s.UsuarioId == idoso.Id),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Adulto_RecebeSenhaNormal_EAvisaAUnidade()
    {
        var adulto = Cidadao(new DateOnly(1990, 1, 1));

        await Entrar(adulto);

        await _senhas.Received(1).AdicionarAsync(
            Arg.Is<SenhaFila>(s => s.Prioridade == Prioridade.Normal), Arg.Any<CancellationToken>());
        await _notificador.Received(1).FilaAtualizadaAsync(FilaCenario.Unidade.Id, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task QuemJaEstaNaFila_NaoPegaOutraSenha()
    {
        var adulto = Cidadao(new DateOnly(1990, 1, 1));
        _senhas.ObterAtivaDoUsuarioAsync(adulto.Id, Arg.Any<CancellationToken>()).Returns(FilaCenario.Senha(3));

        var erro = await Assert.ThrowsAsync<ConflictException>(() => Entrar(adulto));

        Assert.Equal("Você já está na fila com a senha N003.", erro.Message);
        await _uow.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ServicoQueAUnidadeNaoOferece_Da404()
    {
        var adulto = Cidadao(new DateOnly(1990, 1, 1));
        _unidades.OfereceServicoAsync(default, default).ReturnsForAnyArgs(false);

        await Assert.ThrowsAsync<NotFoundException>(() => Entrar(adulto));
    }
}

public class ConsultarMinhaPosicaoUseCaseTests
{
    private readonly ISenhaFilaRepository _senhas = Substitute.For<ISenhaFilaRepository>();
    private readonly Guid _eu = Guid.NewGuid();

    private void Fila(params SenhaFila[] senhas) =>
        _senhas.ListarDoDiaAsync(FilaCenario.Unidade.Id, FilaCenario.Hoje, Arg.Any<CancellationToken>()).Returns(senhas);

    [Fact]
    public async Task ForaDaFila_DevolveRespostaVazia()
    {
        var resposta = await new ConsultarMinhaPosicaoUseCase(_senhas).ExecutarAsync(_eu);

        Assert.Null(resposta.MinhaSenha);
        Assert.Null(resposta.Posicao);
    }

    [Fact]
    public async Task CalculaPosicao_SenhaChamada_ETempoPelaMediaReal()
    {
        var chamada = FilaCenario.Senha(1, minutos: 0);
        chamada.Chamar("Guichê 2");
        var outra = FilaCenario.Senha(2, minutos: 1);
        var preferencial = FilaCenario.Senha(4, Prioridade.Preferencial, minutos: 3);
        var minha = FilaCenario.Senha(3, usuarioId: _eu, minutos: 2);
        Fila(chamada, outra, minha, preferencial);
        _senhas.ObterAtivaDoUsuarioAsync(_eu, Arg.Any<CancellationToken>()).Returns(minha);
        _senhas.MediaAtendimentoMinutosAsync(FilaCenario.Unidade.Id, 20, Arg.Any<CancellationToken>()).Returns(10.0);

        var r = await new ConsultarMinhaPosicaoUseCase(_senhas).ExecutarAsync(_eu);

        Assert.Equal(3, r.Posicao);
        Assert.Equal(2, r.PessoasAFrente);
        Assert.Equal(30, r.TempoEstimadoMinutos);
        Assert.Equal("N001", r.SenhaChamadaAgora);
        Assert.Equal("Guichê 2", r.GuicheChamadaAgora);
        Assert.Equal("N003", r.MinhaSenha!.Codigo);
    }

    [Fact]
    public async Task SemHistorico_UsaDuracaoMediaDoServico()
    {
        var minha = FilaCenario.Senha(1, usuarioId: _eu);
        Fila(minha);
        _senhas.ObterAtivaDoUsuarioAsync(_eu, Arg.Any<CancellationToken>()).Returns(minha);
        _senhas.MediaAtendimentoMinutosAsync(default, default).ReturnsForAnyArgs((double?)null);

        var r = await new ConsultarMinhaPosicaoUseCase(_senhas).ExecutarAsync(_eu);

        Assert.Equal(1, r.Posicao);
        Assert.Equal(FilaCenario.Servico.DuracaoMediaMinutos, r.TempoEstimadoMinutos);
    }

    [Fact]
    public async Task JaChamado_PosicaoZero_ComGuiche()
    {
        var minha = FilaCenario.Senha(1, usuarioId: _eu);
        minha.Chamar("Guichê 1");
        Fila(minha);
        _senhas.ObterAtivaDoUsuarioAsync(_eu, Arg.Any<CancellationToken>()).Returns(minha);

        var r = await new ConsultarMinhaPosicaoUseCase(_senhas).ExecutarAsync(_eu);

        Assert.Equal(0, r.Posicao);
        Assert.Equal(0, r.TempoEstimadoMinutos);
        Assert.Equal("Guichê 1", r.MinhaSenha!.Guiche);
    }
}

public class SairDaFilaUseCaseTests
{
    private readonly ISenhaFilaRepository _senhas = Substitute.For<ISenhaFilaRepository>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly IFilaNotifier _notificador = Substitute.For<IFilaNotifier>();
    private readonly Guid _eu = Guid.NewGuid();

    [Fact]
    public async Task CancelaASenha_EAvisaAUnidade()
    {
        var minha = FilaCenario.Senha(1, usuarioId: _eu);
        _senhas.ObterAtivaDoUsuarioAsync(_eu, Arg.Any<CancellationToken>()).Returns(minha);

        await new SairDaFilaUseCase(_senhas, _uow, _notificador).ExecutarAsync(_eu);

        Assert.Equal(StatusAtendimento.Cancelado, minha.Status);
        await _notificador.Received(1).FilaAtualizadaAsync(FilaCenario.Unidade.Id, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SenhaJaChamada_NaoPodeSairPeloApp()
    {
        var minha = FilaCenario.Senha(1, usuarioId: _eu);
        minha.Chamar("Guichê 1");
        _senhas.ObterAtivaDoUsuarioAsync(_eu, Arg.Any<CancellationToken>()).Returns(minha);

        await Assert.ThrowsAsync<DomainException>(() => new SairDaFilaUseCase(_senhas, _uow, _notificador).ExecutarAsync(_eu));
    }
}
