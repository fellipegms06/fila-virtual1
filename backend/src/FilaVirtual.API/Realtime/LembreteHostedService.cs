using FilaVirtual.Application.UseCases.Notificacoes;

namespace FilaVirtual.API.Realtime;

public class LembreteHostedService(IServiceScopeFactory escopos, IConfiguration config, ILogger<LembreteHostedService> logger)
    : BackgroundService
{
    public static readonly TimeSpan Intervalo = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!config.GetValue("Lembretes:Habilitado", true))
            return;

        using var timer = new PeriodicTimer(Intervalo);
        do
        {
            try
            {
                await using var escopo = escopos.CreateAsyncScope();
                var enviados = await escopo.ServiceProvider.GetRequiredService<EnviarLembretesUseCase>()
                    .ExecutarAsync(stoppingToken);
                if (enviados > 0)
                    logger.LogInformation("{Quantidade} lembretes de agendamento enviados.", enviados);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Falha ao enviar lembretes de agendamento.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
