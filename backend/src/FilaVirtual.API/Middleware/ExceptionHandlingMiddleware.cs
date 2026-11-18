using FilaVirtual.Application.Exceptions;
using FilaVirtual.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace FilaVirtual.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex) when (!context.Response.HasStarted)
        {
            await TratarAsync(context, ex);
        }
    }

    private async Task TratarAsync(HttpContext context, Exception ex)
    {
        var (status, titulo) = ex switch
        {
            ValidationException => (StatusCodes.Status400BadRequest, "Dados inválidos."),
            UnauthorizedAppException => (StatusCodes.Status401Unauthorized, ex.Message),
            ForbiddenException => (StatusCodes.Status403Forbidden, ex.Message),
            NotFoundException => (StatusCodes.Status404NotFound, ex.Message),
            ConflictException => (StatusCodes.Status409Conflict, ex.Message),
            DomainException => (StatusCodes.Status422UnprocessableEntity, ex.Message),
            _ => (StatusCodes.Status500InternalServerError, "Ocorreu um erro inesperado. Tente novamente mais tarde.")
        };

        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(ex, "Erro não tratado em {Metodo} {Caminho}", context.Request.Method, context.Request.Path);

        ProblemDetails problema;
        if (ex is ValidationException validacao)
        {
            problema = new ValidationProblemDetails(
                validacao.Errors
                    .GroupBy(e => CamelCase(e.PropertyName))
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray()))
            {
                Detail = validacao.Errors.FirstOrDefault()?.ErrorMessage
            };
        }
        else
        {
            problema = new ProblemDetails();
        }

        problema.Status = status;
        problema.Title = titulo;

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problema, problema.GetType(), options: null,
            contentType: "application/problem+json");
    }

    private static string CamelCase(string nome) =>
        string.IsNullOrEmpty(nome) ? nome : char.ToLowerInvariant(nome[0]) + nome[1..];
}
