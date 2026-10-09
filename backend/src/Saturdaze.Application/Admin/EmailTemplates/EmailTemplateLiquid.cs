using Fluid;
using Fluid.Ast;
using Microsoft.Extensions.FileProviders;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>What a parsed template reads and uses (L2-128, L2-131).</summary>
/// <param name="Variables">Top-level variables read from outside the template, in order of first use.</param>
/// <param name="Filters">Distinct filter names, in order of first use.</param>
/// <param name="Includes">Whether the template uses <c>include</c> or <c>render</c>.</param>
public sealed record LiquidAnalysis(IReadOnlyList<string> Variables, IReadOnlyList<string> Filters, bool Includes);

/// <summary>
/// Parses, checks and renders template fields as Liquid with Fluid under the restricted profile of
/// ADR-016: Fluid's standard filters only, no <c>include</c> or <c>render</c>, no <c>raw</c> in the
/// HTML body and at most 10 000 steps per render. Every refusal names the field.
/// </summary>
public static class EmailTemplateLiquid
{
    public const int MaxSteps = 10_000;

    public const string Subject = "Subject";
    public const string Preheader = "Preheader";
    public const string HtmlBody = "HTML body";
    public const string TextBody = "Plain-text body";

    private static readonly FluidParser Parser = new();

    /// <summary>The options every render uses; the file provider is empty so nothing outside the template is read.</summary>
    public static readonly TemplateOptions Options = new()
    {
        MaxSteps = MaxSteps,
        FileProvider = new NullFileProvider(),
    };

    /// <summary>Parses <paramref name="text"/>, refusing invalid Liquid with <c>invalid_template</c> (L2-131 AC1).</summary>
    public static IFluidTemplate Parse(string field, string? text)
    {
        if (Parser.TryParse(text ?? string.Empty, out var template, out var error)) return template;
        // Fluid appends the source after the message; the first line names the problem and position.
        throw Invalid(field, error.Split('\n', 2)[0].Trim());
    }

    public static LiquidAnalysis Analyse(IFluidTemplate template)
    {
        var walker = new Walker();
        walker.VisitTemplate(template);
        return new LiquidAnalysis(
            walker.Read.Where(name => !walker.Defined.Contains(name)).ToList(),
            walker.Filters,
            walker.Includes);
    }

    /// <summary>
    /// Parses and analyses one field: an unknown filter or an <c>include</c>/<c>render</c> is
    /// <c>invalid_template</c> (L2-131 AC2, AC3); <c>raw</c> in the HTML body is <c>unsafe_html</c> (AC4).
    /// </summary>
    public static (IFluidTemplate Template, LiquidAnalysis Analysis) Check(string field, string? text, bool html = false)
    {
        var template = Parse(field, text);
        var analysis = Analyse(template);
        if (analysis.Includes)
            throw Invalid(field, "include and render aren't available; a template must be self-contained.");
        foreach (var filter in analysis.Filters)
        {
            if (!Options.Filters.TryGetValue(filter, out _))
                throw Invalid(field, $"Unknown filter '{filter}'.");
            if (html && filter == "raw")
                throw new BadRequestException("unsafe_html",
                    $"{field}: the raw filter isn't allowed in the HTML body; values are always HTML-encoded.");
        }
        return (template, analysis);
    }

    /// <summary>A render that ran past <see cref="MaxSteps"/> (L2-131 AC5).</summary>
    public static BadRequestException TooManySteps(string field)
        => Invalid(field, $"The template takes too many steps to render (at most {MaxSteps:N0}).");

    private static BadRequestException Invalid(string field, string message) => new("invalid_template", $"{field}: {message}");

    /// <summary>Collects variables read, names defined, filters and includes in one pass over the syntax tree.</summary>
    private sealed class Walker : AstVisitor
    {
        public List<string> Read { get; } = [];
        public HashSet<string> Defined { get; } = ["forloop", "tablerowloop"];
        public List<string> Filters { get; } = [];
        public bool Includes { get; private set; }

        protected override Expression VisitMemberExpression(MemberExpression memberExpression)
        {
            if (memberExpression.Segments.Count > 0
                && memberExpression.Segments[0] is IdentifierSegment root
                && !Read.Contains(root.Identifier))
            {
                Read.Add(root.Identifier);
            }
            return base.VisitMemberExpression(memberExpression);
        }

        protected override Expression VisitFilterExpression(FilterExpression filterExpression)
        {
            if (!Filters.Contains(filterExpression.Name)) Filters.Add(filterExpression.Name);
            return base.VisitFilterExpression(filterExpression);
        }

        protected override Statement VisitAssignStatement(AssignStatement assignStatement)
        {
            Defined.Add(assignStatement.Identifier);
            return base.VisitAssignStatement(assignStatement);
        }

        protected override Statement VisitCaptureStatement(CaptureStatement captureStatement)
        {
            Defined.Add(captureStatement.Identifier);
            return base.VisitCaptureStatement(captureStatement);
        }

        protected override Statement VisitForStatement(ForStatement forStatement)
        {
            Defined.Add(forStatement.Identifier);
            return base.VisitForStatement(forStatement);
        }

        protected override Statement VisitTableRowStatement(TableRowStatement tableRowStatement)
        {
            Defined.Add(tableRowStatement.Identifier);
            return base.VisitTableRowStatement(tableRowStatement);
        }

        protected override Statement VisitIncludeStatement(IncludeStatement includeStatement)
        {
            Includes = true;
            return base.VisitIncludeStatement(includeStatement);
        }

        protected override Statement VisitRenderStatement(RenderStatement renderStatement)
        {
            Includes = true;
            return base.VisitRenderStatement(renderStatement);
        }
    }
}
