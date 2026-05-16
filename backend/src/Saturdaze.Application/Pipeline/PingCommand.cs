using MediatR;

namespace Saturdaze.Application.Pipeline;

/// <summary>
/// Exercises the full MediatR pipeline (validation → logging → handler → exception middleware).
/// Used by API tests to assert the cross-cutting plumbing is wired correctly.
/// </summary>
public sealed record PingCommand(string Mode) : IRequest<PingResponse>;

public sealed record PingResponse(string Message);
