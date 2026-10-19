namespace Saturdaze.Application.Email;

/// <summary>A plain-text email to one recipient (L2-142).</summary>
public sealed record EmailMessage(string To, string Subject, string Body);
