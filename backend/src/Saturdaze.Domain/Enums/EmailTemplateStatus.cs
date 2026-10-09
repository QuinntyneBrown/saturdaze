namespace Saturdaze.Domain.Enums;

/// <summary>An email template's lifecycle (L2-129): being written, available to senders, or retired.</summary>
public enum EmailTemplateStatus
{
    Draft,
    Active,
    Archived,
}
