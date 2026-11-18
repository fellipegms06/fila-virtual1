using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Exceptions;

namespace FilaVirtual.Tests.Dominio;

public class HorarioAtendimentoTests
{
    [Fact]
    public void Construtor_DeveGuardarDataEmUtc()
    {
        var local = new DateTimeOffset(2026, 11, 3, 9, 0, 0, TimeSpan.FromHours(-3));
        var horario = new HorarioAtendimento(Guid.NewGuid(), Guid.NewGuid(), local, 2);

        Assert.Equal(TimeSpan.Zero, horario.DataHora.Offset);
        Assert.Equal(12, horario.DataHora.Hour);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Construtor_DeveLancarDomainException_ParaVagasInvalidas(int vagas)
        => Assert.Throws<DomainException>(() =>
            new HorarioAtendimento(Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow, vagas));

    [Theory]
    [InlineData(0, true)]
    [InlineData(1, true)]
    [InlineData(2, false)]
    public void TemVaga_DeveComparar_VagasOcupadasComVagas(int reservas, bool esperado)
    {
        var horario = new HorarioAtendimento(Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow, 2);
        for (var i = 0; i < reservas; i++) horario.Reservar();

        Assert.Equal(esperado, horario.TemVaga);
        Assert.Equal(2 - reservas, horario.VagasDisponiveis);
    }

    [Fact]
    public void Reservar_SemVaga_LancaDomainException()
    {
        var horario = new HorarioAtendimento(Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow, 1);
        horario.Reservar();

        var erro = Assert.Throws<DomainException>(horario.Reservar);
        Assert.Equal("Não há mais vagas neste horário.", erro.Message);
    }

    [Fact]
    public void Liberar_DevolveAVaga_ENuncaFicaNegativo()
    {
        var horario = new HorarioAtendimento(Guid.NewGuid(), Guid.NewGuid(), DateTimeOffset.UtcNow, 1);
        horario.Reservar();
        horario.Liberar();
        horario.Liberar();

        Assert.Equal(0, horario.VagasOcupadas);
        Assert.True(horario.TemVaga);
    }
}

public class AgendamentoTests
{
    private static Agendamento Criar() => new(Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Construtor_DeveComecarConfirmado_ComCodigoDeCheckin()
    {
        var agendamento = Criar();

        Assert.Equal(StatusAtendimento.Confirmado, agendamento.Status);
        Assert.Equal(8, agendamento.CodigoCheckin.Length);
    }

    [Fact]
    public void Fluxo_DeveSeguirAOrdemDosStatus()
    {
        var agendamento = Criar();

        agendamento.FazerCheckin();
        Assert.Equal(StatusAtendimento.Aguardando, agendamento.Status);

        agendamento.IniciarAtendimento();
        Assert.Equal(StatusAtendimento.EmAtendimento, agendamento.Status);

        agendamento.Concluir();
        Assert.Equal(StatusAtendimento.Concluido, agendamento.Status);
    }

    [Fact]
    public void Cancelar_DevePermitir_QuandoConfirmado()
    {
        var agendamento = Criar();
        agendamento.Cancelar();
        Assert.Equal(StatusAtendimento.Cancelado, agendamento.Status);
    }

    [Fact]
    public void Cancelar_DeveLancarDomainException_QuandoJaConcluido()
    {
        var agendamento = Criar();
        agendamento.FazerCheckin();
        agendamento.IniciarAtendimento();
        agendamento.Concluir();

        Assert.Throws<DomainException>(() => agendamento.Cancelar());
    }

    [Fact]
    public void FazerCheckin_DeveLancarDomainException_SeFeitoDuasVezes()
    {
        var agendamento = Criar();
        agendamento.FazerCheckin();

        Assert.Throws<DomainException>(() => agendamento.FazerCheckin());
    }

    [Fact]
    public void RegistrarNaoComparecimento_DepoisDeChamado_Cancela()
    {
        var agendamento = Criar();
        agendamento.FazerCheckin();
        agendamento.IniciarAtendimento();

        agendamento.RegistrarNaoComparecimento();

        Assert.Equal(StatusAtendimento.Cancelado, agendamento.Status);
    }

    [Fact]
    public void RegistrarNaoComparecimento_SemCheckin_LancaDomainException() =>
        Assert.Throws<DomainException>(() => Criar().RegistrarNaoComparecimento());
}

public class SenhaFilaTests
{
    private static SenhaFila Criar(Prioridade prioridade = Prioridade.Normal, int numero = 7) =>
        new(Guid.NewGuid(), Guid.NewGuid(), null, null, numero, prioridade, new DateOnly(2026, 11, 9));

    [Theory]
    [InlineData(Prioridade.Normal, "N007")]
    [InlineData(Prioridade.Preferencial, "P007")]
    public void Construtor_DeveMontarCodigoComLetraEPreenchimento(Prioridade prioridade, string esperado)
        => Assert.Equal(esperado, Criar(prioridade).Codigo);

    [Fact]
    public void Chamar_DeveColocarEmAtendimento_ComGuiche()
    {
        var senha = Criar();
        senha.Chamar("Guichê 2");

        Assert.Equal(StatusAtendimento.EmAtendimento, senha.Status);
        Assert.Equal("Guichê 2", senha.Guiche);
        Assert.NotNull(senha.ChamadaEm);
    }

    [Fact]
    public void Chamar_DeveLancarDomainException_SeJaFoiChamada()
    {
        var senha = Criar();
        senha.Chamar("Guichê 1");

        Assert.Throws<DomainException>(() => senha.Chamar("Guichê 1"));
    }

    [Fact]
    public void Concluir_DeveLancarDomainException_SeNaoFoiChamada()
        => Assert.Throws<DomainException>(() => Criar().Concluir());

    [Fact]
    public void Cancelar_DeveLancarDomainException_SeJaConcluida()
    {
        var senha = Criar();
        senha.Chamar("Guichê 1");
        senha.Concluir();

        Assert.Throws<DomainException>(() => senha.Cancelar());
    }
}

public class NotificacaoTests
{
    [Fact]
    public void MarcarComoLida_DeveAtualizarOStatus()
    {
        var notificacao = new Notificacao(Guid.NewGuid(), "Sua vez está próxima",
            "Faltam 3 pessoas na sua frente.", TipoNotificacao.VezProxima);

        Assert.False(notificacao.Lida);
        notificacao.MarcarComoLida();
        Assert.True(notificacao.Lida);
    }

    [Fact]
    public void Construtor_DeveLancarDomainException_ParaTituloVazio()
        => Assert.Throws<DomainException>(() =>
            new Notificacao(Guid.NewGuid(), "", "Mensagem", TipoNotificacao.SenhaChamada));
}