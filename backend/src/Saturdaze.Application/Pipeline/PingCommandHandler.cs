using MediatR;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Pipeline;

public sealed class PingCommandHandler : IRequestHandler<PingCommand, PingResponse>
{
    public Task<PingResponse> Handle(PingCommand request, CancellationToken cancellationToken) =>
        request.Mode switch
        {
            "notfound" => throw new NotFoundException("Ping target", request.Mode),
            "conflict" => throw new ConflictException("Ping conflict triggered."),
            _ => Task.FromResult(new PingResponse("pong"))
        };
}
