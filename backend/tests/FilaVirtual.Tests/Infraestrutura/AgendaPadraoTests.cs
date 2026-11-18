using FilaVirtual.Application.Comum;
using FilaVirtual.Infrastructure.Persistence.Seed;

namespace FilaVirtual.Tests.Infraestrutura;

public class AgendaPadraoTests
{
    private static readonly DateTimeOffset SegundaCedo = new(2026, 11, 9, 10, 0, 0, TimeSpan.Zero);

    [Fact]
    public void UmDiaUtil_Tem16Horarios_Das8hAs15h30()
    {
        var horarios = AgendaPadrao.Gerar(SegundaCedo, dias: 1)
            .Select(h => HorarioDeBrasilia.Converter(h)).ToList();

        Assert.Equal(16, horarios.Count);
        Assert.Equal(new TimeSpan(8, 0, 0), horarios.First().TimeOfDay);
        Assert.Equal(new TimeSpan(15, 30, 0), horarios.Last().TimeOfDay);
    }

    [Fact]
    public void QuatorzeDias_TemDezDiasUteis_SemSabadoNemDomingo()
    {
        var horarios = AgendaPadrao.Gerar(SegundaCedo, dias: 14).Select(HorarioDeBrasilia.Converter).ToList();

        Assert.Equal(10 * 16, horarios.Count);
        Assert.DoesNotContain(horarios, h => h.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday);
    }

    [Fact]
    public void HorariosDeHojeQueJaPassaram_NaoSaoGerados()
    {
        var meioDia = new DateTimeOffset(2026, 11, 9, 15, 10, 0, TimeSpan.Zero);

        var horarios = AgendaPadrao.Gerar(meioDia, dias: 1).ToList();

        Assert.Equal(7, horarios.Count);
        Assert.All(horarios, h => Assert.True(h > meioDia));
    }

    [Fact]
    public void HorariosSaoGeradosEmUtc()
    {
        var primeiro = AgendaPadrao.Gerar(SegundaCedo, dias: 1).First();

        Assert.Equal(TimeSpan.Zero, primeiro.Offset);
        Assert.Equal(11, primeiro.Hour);
    }
}
