using FilaVirtual.Application.Abstractions;
using FilaVirtual.Infrastructure.Persistence;
using FilaVirtual.Infrastructure.Persistence.Seed;
using FilaVirtual.Infrastructure.Repositories;
using FilaVirtual.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FilaVirtual.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("A connection string 'Default' não foi encontrada. Configure com: dotnet user-secrets set \"ConnectionStrings:Default\" \"Host=localhost;Port=5433;Database=filavirtual;Username=fila;Password=...\" --project src/FilaVirtual.API");

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IUnidadeCrasRepository, UnidadeCrasRepository>();
        services.AddScoped<IHorarioRepository, HorarioRepository>();
        services.AddScoped<IAgendamentoRepository, AgendamentoRepository>();
        services.AddScoped<ISenhaFilaRepository, SenhaFilaRepository>();
        services.AddScoped<INotificacaoRepository, NotificacaoRepository>();
        services.AddScoped<DbSeeder>();

        services.AddOptions<JwtOptions>()
                .Bind(configuration.GetSection(JwtOptions.Secao))
                .Validate(o => { o.Validar(); return true; })
                .ValidateOnStart();

        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<ITokenService, JwtTokenService>();

        return services;
    }

    public static async Task SeedAsync(this IServiceProvider provider, CancellationToken ct = default)
    {
        await using var escopo = provider.CreateAsyncScope();
        await escopo.ServiceProvider.GetRequiredService<DbSeeder>().ExecutarAsync(ct);
    }
}
