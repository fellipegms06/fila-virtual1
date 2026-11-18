using FilaVirtual.Domain.Entities;
using FilaVirtual.Domain.Enums;
using FilaVirtual.Domain.Services;

namespace FilaVirtual.Tests.Dominio;

public class OrdenadorDaFilaTests
{
    private static readonly DateTimeOffset Inicio = new(2026, 11, 9, 11, 0, 0, TimeSpan.Zero);

    internal static SenhaFila Senha(int numero, Prioridade prioridade, int minutos)
    {
        var senha = new SenhaFila(Guid.NewGuid(), Guid.NewGuid(), null, null, numero, prioridade, new DateOnly(2026, 11, 9));
        typeof(SenhaFila).GetProperty(nameof(SenhaFila.EmitidaEm))!.SetValue(senha, Inicio.AddMinutes(minutos));
        return senha;
    }

    [Fact]
    public void PreferenciaisPrimeiro_DepoisOrdemDeChegada()
    {
        var n1 = Senha(1, Prioridade.Normal, 0);
        var n2 = Senha(2, Prioridade.Normal, 1);
        var p3 = Senha(3, Prioridade.Preferencial, 2);
        var n4 = Senha(4, Prioridade.Normal, 3);
        var p5 = Senha(5, Prioridade.Preferencial, 4);

        var ordem = OrdenadorDaFila.Ordenar([n4, p5, n1, p3, n2]);

        Assert.Equal(["P003", "P005", "N001", "N002", "N004"], ordem.Select(s => s.Codigo));
    }

    [Fact]
    public void SoConsideraQuemEstaAguardando()
    {
        var chamada = Senha(1, Prioridade.Normal, 0);
        chamada.Chamar("Guichê 1");
        var cancelada = Senha(2, Prioridade.Normal, 1);
        cancelada.Cancelar();
        var aguardando = Senha(3, Prioridade.Normal, 2);

        Assert.Equal(1, OrdenadorDaFila.Posicao([chamada, cancelada, aguardando], aguardando.Id));
        Assert.Null(OrdenadorDaFila.Posicao([chamada, cancelada, aguardando], chamada.Id));
    }

    [Fact]
    public void EmpateNoHorario_DesempataPeloNumero()
    {
        var b = Senha(8, Prioridade.Normal, 0);
        var a = Senha(7, Prioridade.Normal, 0);

        Assert.Equal(["N007", "N008"], OrdenadorDaFila.Ordenar([b, a]).Select(s => s.Codigo));
    }
}

public class EstimativaDeEsperaTests
{
    [Theory]
    [InlineData(3, 12.0, 30, 36)]
    [InlineData(3, null, 30, 90)]
    [InlineData(2, 7.4, 30, 15)]
    [InlineData(0, 12.0, 30, 0)]
    public void Minutos(int posicao, double? media, int duracaoServico, int esperado) =>
        Assert.Equal(esperado, EstimativaDeEspera.Minutos(posicao, media, duracaoServico));
}
