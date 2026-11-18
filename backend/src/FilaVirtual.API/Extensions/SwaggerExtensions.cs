using Microsoft.OpenApi;

namespace FilaVirtual.API.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddSwaggerComJwt(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(o =>
        {
            o.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "FilaVirtual API",
                Version = "v1",
                Description = "API de agendamento e fila virtual do CadÚnico/CRAS."
            });

            o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Cole aqui o token devolvido por /api/auth/login (sem a palavra Bearer)."
            });
            o.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", doc)] = []
            });
        });
        return services;
    }
}
