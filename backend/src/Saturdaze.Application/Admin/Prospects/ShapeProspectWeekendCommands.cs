using MediatR;
using Saturdaze.Application.Blocks;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Prospects;

/// <summary>Re-plans the prospect's weekend; locked blocks stay (L2-160 AC1).</summary>
public sealed record RegenerateProspectWeekendCommand(Guid ProspectId) : IRequest<WeekendDto>;

public sealed class RegenerateProspectWeekendCommandHandler : IRequestHandler<RegenerateProspectWeekendCommand, WeekendDto>
{
    private readonly ProspectReader _reader;
    private readonly WeekendReplanner _replanner;

    public RegenerateProspectWeekendCommandHandler(ProspectReader reader, WeekendReplanner replanner)
    {
        _reader = reader;
        _replanner = replanner;
    }

    public async Task<WeekendDto> Handle(RegenerateProspectWeekendCommand request, CancellationToken ct)
    {
        var (prospect, weekend) = await _reader.LoadWeekendAsync(request.ProspectId, ct);
        await _replanner.RegenerateAsync(weekend, prospect.FamilyId, ct);
        return await _reader.ToWeekendDtoAsync(weekend, ct);
    }
}

/// <summary>Replaces an unlocked activity block with the next best pick (L2-160 AC2).</summary>
public sealed record SwapProspectBlockCommand(Guid ProspectId, Guid BlockId) : IRequest<WeekendDto>;

public sealed class SwapProspectBlockCommandHandler : IRequestHandler<SwapProspectBlockCommand, WeekendDto>
{
    private readonly ProspectReader _reader;
    private readonly BlockSwapper _swapper;

    public SwapProspectBlockCommandHandler(ProspectReader reader, BlockSwapper swapper)
    {
        _reader = reader;
        _swapper = swapper;
    }

    public async Task<WeekendDto> Handle(SwapProspectBlockCommand request, CancellationToken ct)
    {
        var (prospect, weekend) = await _reader.LoadWeekendAsync(request.ProspectId, ct);
        var target = weekend.Blocks.FirstOrDefault(b => b.Id == request.BlockId)
            ?? throw new NotFoundException(nameof(ItineraryBlock), request.BlockId);
        await _swapper.SwapAsync(weekend, target, prospect.FamilyId, rejectedActivityIds: null, ct);
        return await _reader.ToWeekendDtoAsync(weekend, ct);
    }
}

/// <summary>Locks or unlocks a block of the prospect's weekend (L2-160 AC3).</summary>
public sealed record LockProspectBlockCommand(Guid ProspectId, Guid BlockId, bool Locked) : IRequest<WeekendDto>;

public sealed class LockProspectBlockCommandHandler : IRequestHandler<LockProspectBlockCommand, WeekendDto>
{
    private readonly Abstractions.IAppDbContext _db;
    private readonly ProspectReader _reader;

    public LockProspectBlockCommandHandler(Abstractions.IAppDbContext db, ProspectReader reader)
    {
        _db = db;
        _reader = reader;
    }

    public async Task<WeekendDto> Handle(LockProspectBlockCommand request, CancellationToken ct)
    {
        var (_, weekend) = await _reader.LoadWeekendAsync(request.ProspectId, ct);
        var block = weekend.Blocks.FirstOrDefault(b => b.Id == request.BlockId)
            ?? throw new NotFoundException(nameof(ItineraryBlock), request.BlockId);
        if (block.Kind == BlockKind.Commitment && !request.Locked)
            throw new ConflictException("commitment_locked", "Recurring commitments are always locked.");

        block.IsLocked = request.Locked;
        await _db.SaveChangesAsync(ct);
        return await _reader.ToWeekendDtoAsync(weekend, ct);
    }
}
