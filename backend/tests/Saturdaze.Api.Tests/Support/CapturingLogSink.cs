using System.Collections.Concurrent;
using Serilog.Core;
using Serilog.Events;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Keeps every rendered log message so tests can check what is (not) logged.</summary>
public sealed class CapturingLogSink : ILogEventSink
{
    private readonly ConcurrentQueue<string> _messages = new();

    public IReadOnlyCollection<string> Messages => _messages.ToArray();

    public void Emit(LogEvent logEvent) =>
        _messages.Enqueue(logEvent.RenderMessage() + " " + string.Join(" ", logEvent.Properties.Values));
}
