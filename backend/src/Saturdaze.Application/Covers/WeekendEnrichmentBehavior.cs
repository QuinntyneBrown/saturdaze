using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Covers;

/// <summary>
/// Every request that returns a weekend gets its stop photos and cover added on the way
/// out, so the many weekend handlers keep sharing one static projection.
/// </summary>
public sealed class WeekendEnrichmentBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly WeekendEnrichment _enrichment;

    public WeekendEnrichmentBehavior(WeekendEnrichment enrichment) => _enrichment = enrichment;

    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var response = await next();
        return response is WeekendDto weekend
            ? (TResponse)(object)await _enrichment.EnrichAsync(weekend, cancellationToken)
            : response;
    }
}
