using FilaVirtual.Application.Abstractions;
using FilaVirtual.Application.Exceptions;
using FilaVirtual.Application.UseCases.Agendamentos;
using FilaVirtual.Application.UseCases.Notificacoes;
using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace FilaVirtual.Tests.Aplicacao.Agendamentos;

internal static class Cenario
{
    public static readonly DateTimeOffset Agora = new(2026, 11, 9, 12, 0, 0, TimeSpan.Zero);

    public static HorarioAtendimento Horario(int vagas = 2, DateTimeOffset? quando = null)
    {
        var unidade = new UnidadeCras("CRAS Central", "Rua A, 1", "Centro", "8h às 17h", "6130000001", -15.79, -47.88);
        var servico = new Servico("Atualização cadastral", "Atualizar dados.", 30);
        var horario = new HorarioAtendimento(unidade.Id, servico.Id, quando ?? Agora.AddDays(1), vagas);
        Definir(horario, nameof(HorarioAtendimento.Unidade), unidade);
        Definir(horario, nameof(HorarioAtendimento.Servico), servico);
        return horario;
    }

    public static Agendamento Agendamento(Guid usuarioId, HorarioAtendimento horario)
    {
        horario.Reservar();
        var agendamento = new Agendamento(usuarioId, horario.Id);
        Definir(agendamento, nameof(Domain.Entities.Agendamento.Horario), horario);
        return agendamento;
    }

    public static void Definir(object alvo, string propriedade, object valor) =>
        alvo.GetType().GetProperty(propriedade)!.SetValue(alvo, valor);
}

public class AgendarAtendimentoUseCaseTests
{
    private readonly IHorarioRepository _horarios = Substitute.For<IHorarioRepository>();
    private readonly IAgendamentoRepository _agendamentos = Substitute.For<IAgendamentoRepository>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly INotificacaoRepository _notificacoes = Substitute.For<INotificacaoRepository>();
    private readonly AgendarAtendimentoUseCase _useCase;
    private readonly Guid _usuarioId = Guid.NewGuid();

    public AgendarAtendimentoUseCaseTests() =>
        _useCase = new AgendarAtendimentoUseCase(_horarios, _agendamentos, _uow,
            new ServicoDeNotificacao(_notificacoes, _uow, Substitute.For<IFilaNotifier>()), new FakeTimeProvider(Cenario.Agora));

    private HorarioAtendimento Disponivel(HorarioAtendimento horario)
    {
        _horarios.ObterComUnidadeEServicoAsync(horario.Id, Arg.Any<CancellationToken>()).Returns(horario);
        return horario;
    }

    [Fact]
    public async Task DeveAgendar_ReservandoAVaga_ComStatusConfirmado()
    {
        var horario = Disponivel(Cenario.Horario(vagas: 2));

        var resposta = await _useCase.ExecutarAsync(_usuarioId, new AgendarAtendimentoRequest(horario.Id));

        Assert.Equal("Confirmado", resposta.Status);
        Assert.Equal("CRAS Central", resposta.Unidade);
        Assert.Equal("Atualização cadastral", resposta.Servico);
        Assert.Equal(8, resposta.CodigoCheckin.Length);
        Assert.Equal(1, horario.VagasOcupadas);
        await _agendamentos.Received(1).AdicionarAsync(Arg.Any<Agendamento>(), Arg.Any<CancellationToken>());
        await _uow.Received(2).SaveChangesAsync(Arg.Any<CancellationToken>());
        await _notificacoes.Received(1).AdicionarAsync(
            Arg.Is<Notificacao>(n => n.Tipo == TipoNotificacao.AgendamentoConfirmado && n.Mensagem.Contains(resposta.CodigoCheckin)),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task HorarioLotado_Da409_SemGravarNada()
    {
        var horario = Disponivel(Cenario.Horario(vagas: 1));
        horario.Reservar();

        var erro = await Assert.ThrowsAsync<ConflictException>(
            () => _useCase.ExecutarAsync(_usuarioId, new AgendarAtendimentoRequest(horario.Id)));

        Assert.Equal(AgendarAtendimentoUseCase.MensagemSemVagas, erro.Message);
        await _uow.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DisputaPelaUltimaVaga_QuemSalvaDepoisRecebe409()
    {
        var horario = Disponivel(Cenario.Horario(vagas: 1));
        _uow.SaveChangesAsync(Arg.Any<CancellationToken>()).ThrowsAsync(new ConcorrenciaException());

        var erro = await Assert.ThrowsAsync<ConflictException>(
            () => _useCase.ExecutarAsync(_usuarioId, new AgendarAtendimentoRequest(horario.Id)));

        Assert.Equal(AgendarAtendimentoUseCase.MensagemDisputa, erro.Message);
    }

    [Fact]
    public async Task MesmoCidadao_NoMesmoHorario_Da409()
    {
        var horario = Disponivel(Cenario.Horario());
        _agendamentos.UsuarioTemAgendamentoAtivoEmAsync(_usuarioId, horario.DataHora, Arg.Any<CancellationToken>())
                     .Returns(true);

        await Assert.ThrowsAsync<ConflictException>(
            () => _useCase.ExecutarAsync(_usuarioId, new AgendarAtendimentoRequest(horario.Id)));
        Assert.Equal(0, horario.VagasOcupadas);
    }

    [Fact]
    public async Task HorarioQueJaPassou_Da422()
    {
        var horario = Disponivel(Cenario.Horario(quando: Cenario.Agora.AddMinutes(-1)));

        await Assert.ThrowsAsync<DomainException>(
            () => _useCase.ExecutarAsync(_usuarioId, new AgendarAtendimentoRequest(horario.Id)));
    }

    [Fact]
    public async Task HorarioInexistente_Da404() =>
        await Assert.ThrowsAsync<NotFoundException>(
            () => _useCase.ExecutarAsync(_usuarioId, new AgendarAtendimentoRequest(Guid.NewGuid())));
}

public class CancelarAgendamentoUseCaseTests
{
    private readonly IAgendamentoRepository _agendamentos = Substitute.For<IAgendamentoRepository>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();
    private readonly ISenhaFilaRepository _senhas = Substitute.For<ISenhaFilaRepository>();
    private readonly IFilaNotifier _notificador = Substitute.For<IFilaNotifier>();
    private readonly Guid _dono = Guid.NewGuid();

    private CancelarAgendamentoUseCase Criar() => new(_agendamentos, _senhas, _uow, _notificador);

    [Fact]
    public async Task DepoisDoCheckin_CancelaTambemASenhaDaFila()
    {
        var horario = Cenario.Horario();
        var agendamento = Cenario.Agendamento(_dono, horario);
        agendamento.FazerCheckin();
        var senha = new SenhaFila(horario.UnidadeCrasId, horario.ServicoId, _dono, agendamento.Id, 1,
                                  Prioridade.Normal, new DateOnly(2026, 11, 9));
        _agendamentos.ObterComHorarioAsync(agendamento.Id, Arg.Any<CancellationToken>()).Returns(agendamento);
        _senhas.ObterAtivaPorAgendamentoAsync(agendamento.Id, Arg.Any<CancellationToken>()).Returns(senha);

        await Criar().ExecutarAsync(_dono, agendamento.Id);

        Assert.Equal(StatusAtendimento.Cancelado, senha.Status);
        await _notificador.Received(1).FilaAtualizadaAsync(horario.UnidadeCrasId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DonoCancela_EAVagaVoltaAFicarLivre()
    {
        var horario = Cenario.Horario(vagas: 1);
        var agendamento = Cenario.Agendamento(_dono, horario);
        _agendamentos.ObterComHorarioAsync(agendamento.Id, Arg.Any<CancellationToken>()).Returns(agendamento);

        await Criar().ExecutarAsync(_dono, agendamento.Id);

        Assert.Equal(StatusAtendimento.Cancelado, agendamento.Status);
        Assert.True(horario.TemVaga);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task OutraPessoa_NaoConsegueCancelar_ERecebe404()
    {
        var agendamento = Cenario.Agendamento(_dono, Cenario.Horario());
        _agendamentos.ObterComHorarioAsync(agendamento.Id, Arg.Any<CancellationToken>()).Returns(agendamento);

        await Assert.ThrowsAsync<NotFoundException>(
            () => Criar().ExecutarAsync(Guid.NewGuid(), agendamento.Id));

        Assert.Equal(StatusAtendimento.Confirmado, agendamento.Status);
    }

    [Fact]
    public async Task AgendamentoJaCancelado_NaoPodeSerCanceladoDeNovo()
    {
        var agendamento = Cenario.Agendamento(_dono, Cenario.Horario());
        agendamento.Cancelar();
        _agendamentos.ObterComHorarioAsync(agendamento.Id, Arg.Any<CancellationToken>()).Returns(agendamento);

        await Assert.ThrowsAsync<DomainException>(
            () => Criar().ExecutarAsync(_dono, agendamento.Id));
    }
}

public class ListarHorariosUseCaseTests
{
    private readonly IUnidadeCrasRepository _unidades = Substitute.For<IUnidadeCrasRepository>();
    private readonly IHorarioRepository _horarios = Substitute.For<IHorarioRepository>();
    private readonly ListarHorariosUseCase _useCase;
    private readonly Guid _unidade = Guid.NewGuid();
    private readonly Guid _servico = Guid.NewGuid();

    public ListarHorariosUseCaseTests()
    {
        _unidades.ExisteAsync(_unidade, Arg.Any<CancellationToken>()).Returns(true);
        _useCase = new ListarHorariosUseCase(_unidades, _horarios, new FakeTimeProvider(Cenario.Agora));
    }

    [Fact]
    public async Task ServicoQueAUnidadeNaoOferece_Da404()
    {
        var erro = await Assert.ThrowsAsync<NotFoundException>(
            () => _useCase.ExecutarAsync(new ListarHorariosRequest(_unidade, _servico, null)));
        Assert.Equal("Esta unidade não oferece o serviço escolhido.", erro.Message);
    }

    [Fact]
    public async Task DataDeHoje_ComecaAPartirDeAgora_NuncaNoPassado()
    {
        _unidades.OfereceServicoAsync(_unidade, _servico, Arg.Any<CancellationToken>()).Returns(true);

        await _useCase.ExecutarAsync(new ListarHorariosRequest(_unidade, _servico, new DateOnly(2026, 11, 9)));

        await _horarios.Received(1).ListarDisponiveisAsync(_unidade, _servico,
            Cenario.Agora,
            new DateTimeOffset(2026, 11, 10, 3, 0, 0, TimeSpan.Zero),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DataNoPassado_DevolveListaVazia_SemConsultarOBanco()
    {
        _unidades.OfereceServicoAsync(_unidade, _servico, Arg.Any<CancellationToken>()).Returns(true);

        var lista = await _useCase.ExecutarAsync(new ListarHorariosRequest(_unidade, _servico, new DateOnly(2026, 11, 1)));

        Assert.Empty(lista);
        await _horarios.DidNotReceiveWithAnyArgs().ListarDisponiveisAsync(default, default, default, default);
    }
}
