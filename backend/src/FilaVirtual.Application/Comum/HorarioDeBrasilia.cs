namespace FilaVirtual.Application.Comum;

public static class HorarioDeBrasilia
{
    public static readonly TimeZoneInfo Fuso = CarregarFuso();

    public static DateTimeOffset Converter(DateTimeOffset instante) => TimeZoneInfo.ConvertTime(instante, Fuso);

    public static DateOnly Hoje(TimeProvider relogio) => DateOnly.FromDateTime(Converter(relogio.GetUtcNow()).DateTime);

    public static DateTimeOffset ParaUtc(DateOnly data, TimeOnly hora)
    {
        var local = data.ToDateTime(hora, DateTimeKind.Unspecified);
        return new DateTimeOffset(local, Fuso.GetUtcOffset(local)).ToUniversalTime();
    }

    public static (DateTimeOffset Inicio, DateTimeOffset Fim) IntervaloDoDia(DateOnly data) =>
        (ParaUtc(data, TimeOnly.MinValue), ParaUtc(data.AddDays(1), TimeOnly.MinValue));

    private static TimeZoneInfo CarregarFuso()
    {
        foreach (var id in new[] { "America/Sao_Paulo", "E. South America Standard Time" })
        {
            if (TimeZoneInfo.TryFindSystemTimeZoneById(id, out var fuso))
                return fuso;
        }
        return TimeZoneInfo.CreateCustomTimeZone("Brasilia", TimeSpan.FromHours(-3), "Brasília", "Brasília");
    }
}
