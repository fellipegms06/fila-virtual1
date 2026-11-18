using System.Text.Json.Serialization;
using FilaVirtual.API.Extensions;
using FilaVirtual.API.Middleware;
using FilaVirtual.API.Realtime;
using FilaVirtual.Application;
using FilaVirtual.Application.Abstractions;
using FilaVirtual.Infrastructure;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
    .ConfigureApiBehaviorOptions(o =>
    {
        o.InvalidModelStateResponseFactory = ctx =>
        {
            var problema = new ValidationProblemDetails(ctx.ModelState)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Dados inválidos.",
                Detail = "Confira os campos enviados: algum está vazio ou em formato inválido."
            };
            return new BadRequestObjectResult(problema) { ContentTypes = { "application/problem+json" } };
        };
    });

builder.Services.AddSwaggerComJwt();

builder.Services.AddSignalR()
    .AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddScoped<IFilaNotifier, SignalRFilaNotifier>();
builder.Services.AddHostedService<LembreteHostedService>();

var origens = builder.Configuration.GetSection("Cors:Origens").Get<string[]>() ?? ["http://localhost:5173"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(origens)
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    await app.Services.SeedAsync();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<FilaHub>("/hubs/fila");

app.Run();

public partial class Program;
