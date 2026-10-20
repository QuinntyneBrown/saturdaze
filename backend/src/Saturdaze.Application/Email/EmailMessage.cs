namespace Saturdaze.Application.Email;

/// <summary>
/// An email to one recipient (L2-142): the plain-text words and, for every
/// message Saturdaze sends, the same words laid out on the brand in HTML
/// (L2-162). The senders put both in one <c>multipart/alternative</c> message.
/// </summary>
public sealed record EmailMessage(string To, string Subject, string Body, string? HtmlBody = null);
