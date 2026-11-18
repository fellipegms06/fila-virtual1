using FilaVirtual.Application.Comum;

namespace FilaVirtual.Infrastructure.Persistence.Seed;

public static class AgendaPadrao
{
    public static readonly TimeOnly Abertura = new(8, 0);
    public static readonly TimeOnly Fechamento = new(16, 0);
    public static readonly TimeSpan Intervalo = TimeSpan.FromMinutes(30);

    public static IEnumerable<DateTimeOffset> Gerar(DateTimeOffset agoraUtc, int dias)
    {
        var hoje = DateOnly.FromDateTime(HorarioDeBrasilia.Converter(agoraUtc).DateTime);

        for (var d = 0; d < dias; d++)
        {
            var data = hoje.AddDays(d);
            if (data.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                continue;

            for (var hora = Abertura; hora < Fechamento; hora = hora.Add(Intervalo))
            {
                var inicio = HorarioDeBrasilia.ParaUtc(data, hora);
                if (inicio > agoraUtc)
                    yield return inicio;
            }
        }
    }
}
