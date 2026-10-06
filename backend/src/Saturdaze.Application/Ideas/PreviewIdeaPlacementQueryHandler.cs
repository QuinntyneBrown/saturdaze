using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Ideas;

public sealed class PreviewIdeaPlacementQueryHandler : IRequestHandler<PreviewIdeaPlacementQuery, IdeaPlacementDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IdeaResolver _ideas;

    public PreviewIdeaPlacementQueryHandler(IAppDbContext db, ICurrentFamilyAccessor current, IdeaResolver ideas)
    {
        _db = db;
        _current = current;
        _ideas = ideas;
    }

    public async Task<IdeaPlacementDto> Handle(PreviewIdeaPlacementQuery request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var weekend = await _db.Weekends.AsNoTracking()
            .Include(w => w.Blocks)
            .FirstOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);
        var idea = await _ideas.ResolveAsync(request.IdeaKind, request.IdeaId, ct);

        var placement = IdeaPlacementService.Place(
            weekend.Blocks.Where(b => b.Day == request.Day).ToList(), idea, request.Timing);

        return new IdeaPlacementDto(
            request.Day,
            placement.Start,
            placement.End,
            placement.Replaced.Where(b => b.Kind != Domain.Enums.BlockKind.Drive).Select(b => b.Title).ToList(),
            placement.Fits,
            placement.Reason);
    }
}
