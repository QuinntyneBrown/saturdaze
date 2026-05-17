using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            await WriteAsync(context, StatusCodes.Status400BadRequest, "Validation failed", ex.Message, ex.Errors);
        }
        catch (InvalidCredentialsException ex)
        {
            await WriteAuthError(context, StatusCodes.Status401Unauthorized, ex.Code, ex.Message);
        }
        catch (NotFoundException ex)
        {
            await WriteAsync(context, StatusCodes.Status404NotFound, "Not found", ex.Message);
        }
        catch (ConflictException ex)
        {
            // Auth-relevant conflicts (`email_in_use`, …) ship in the AuthError
            // shape; generic conflicts fall back to ProblemDetails.
            if (IsAuthRoute(context))
            {
                await WriteAuthError(context, StatusCodes.Status409Conflict, ex.Code, ex.Message);
            }
            else
            {
                await WriteAsync(context, StatusCodes.Status409Conflict, "Conflict", ex.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing {Path}", context.Request.Path);
            await WriteAsync(context, StatusCodes.Status500InternalServerError, "Server error", "An unexpected error occurred.");
        }
    }

    private static bool IsAuthRoute(HttpContext ctx)
        => ctx.Request.Path.StartsWithSegments("/api/auth");

    private static async Task WriteAuthError(HttpContext context, int statusCode, string code, string message)
    {
        if (context.Response.HasStarted) return;
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new { code, message });
    }

    private static async Task WriteAsync(
        HttpContext context,
        int statusCode,
        string title,
        string detail,
        IReadOnlyDictionary<string, string[]>? errors = null)
    {
        if (context.Response.HasStarted) return;

        context.Response.StatusCode = statusCode;

        if (errors is not null)
        {
            var vpd = new ValidationProblemDetails(errors.ToDictionary(kv => kv.Key, kv => kv.Value))
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Type = $"https://httpstatuses.io/{statusCode}",
                Instance = context.Request.Path
            };
            await context.Response.WriteAsJsonAsync(vpd, options: null, contentType: "application/problem+json");
        }
        else
        {
            var pd = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Type = $"https://httpstatuses.io/{statusCode}",
                Instance = context.Request.Path
            };
            await context.Response.WriteAsJsonAsync(pd, options: null, contentType: "application/problem+json");
        }
    }
}
