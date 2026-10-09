namespace Saturdaze.Domain.Enums;

/// <summary>An email template's lifecycle (L2-135): being written, available to senders, or retired.</summary>
public enum EmailTemplateStatus
{
    Draft,
    Active,
    Archived,
}
