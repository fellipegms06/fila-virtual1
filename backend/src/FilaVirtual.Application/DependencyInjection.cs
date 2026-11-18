using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FilaVirtual.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        foreach (var tipo in assembly.GetTypes()
                     .Where(t => t is { IsClass: true, IsAbstract: false } && t.Name.EndsWith("UseCase")))
        {
            services.AddScoped(tipo);
        }

        services.AddScoped<UseCases.Fila.EmissorDeSenha>();
        services.AddScoped<UseCases.Notificacoes.ServicoDeNotificacao>();
        services.AddScoped<UseCases.Notificacoes.AvisosDaFila>();

        services.AddValidatorsFromAssembly(assembly, ServiceLifetime.Scoped);

        services.TryAddSingleton(TimeProvider.System);

        return services;
    }
}
