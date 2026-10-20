using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Blocks;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Families;

/// <summary>
/// Each admin weekend handler enters the family's scope, sends the family's own command so
/// every rule applies unchanged (L2-158, L2-160), then records what changed (L2-161). A
/// refused command throws before anything is recorded.
/// </summary>
public sealed class RegenerateAdminFamilyWeekendCommandHandler : IRequestHandler<RegenerateAdminFamilyWeekendCommand, WeekendDto>
{
    private readonly AdminFamilyScope _scope;
    private readonly ISender _sender;
    private readonly WeekendAuditWriter _audit;
    private readonly IAppDbContext _db;

    public RegenerateAdminFamilyWeekendCommandHandler(AdminFamilyScope scope, ISender sender, WeekendAuditWriter audit, IAppDbContext db)
    {
        _scope = scope;
        _sender = sender;
        _audit = audit;
        _db = db;
    }

    public async Task<WeekendDto> Handle(RegenerateAdminFamilyWeekendCommand request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var before = await AdminWeekendLookup.BlockCountAsync(_db, request.FamilyId, request.WeekendId, ct);
        var weekend = await _sender.Send(new RegenerateWeekendCommand(request.WeekendId), ct);
        _audit.Write(request.FamilyId, weekend, WeekendAuditAction.Regenerate,
            before: new { blocks = before }, after: WeekendAuditWriter.Count(weekend));
        await _db.SaveChangesAsync(ct);
        return weekend;
    }
}

public sealed class RegenerateAdminFamilyDayCommandHandler : IRequestHandler<RegenerateAdminFamilyDayCommand, WeekendDto>
{
    private readonly AdminFamilyScope _scope;
    private readonly ISender _sender;
    private readonly WeekendAuditWriter _audit;
    private readonly IAppDbContext _db;

    public RegenerateAdminFamilyDayCommandHandler(AdminFamilyScope scope, ISender sender, WeekendAuditWriter audit, IAppDbContext db)
    {
        _scope = scope;
        _sender = sender;
        _audit = audit;
        _db = db;
    }

    public async Task<WeekendDto> Handle(RegenerateAdminFamilyDayCommand request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var before = await AdminWeekendLookup.BlockCountAsync(_db, request.FamilyId, request.WeekendId, ct, request.Day);
        var weekend = await _sender.Send(new RegenerateWeekendDayCommand(request.WeekendId, request.Day), ct);
        _audit.Write(request.FamilyId, weekend, WeekendAuditAction.RegenerateDay, day: request.Day,
            before: new { blocks = before }, after: WeekendAuditWriter.Count(weekend, request.Day));
        await _db.SaveChangesAsync(ct);
        return weekend;
    }
}

public sealed class LockAdminFamilyDayCommandHandler : IRequestHandler<LockAdminFamilyDayCommand, WeekendDto>
{
    private readonly AdminFamilyScope _scope;
    private readonly ISender _sender;
    private readonly WeekendAuditWriter _audit;
    private readonly IAppDbContext _db;

    public LockAdminFamilyDayCommandHandler(AdminFamilyScope scope, ISender sender, WeekendAuditWriter audit, IAppDbContext db)
    {
        _scope = scope;
        _sender = sender;
        _audit = audit;
        _db = db;
    }

    public async Task<WeekendDto> Handle(LockAdminFamilyDayCommand request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var weekend = await _sender.Send(new LockWeekendDayCommand(request.WeekendId, request.Day, request.Locked), ct);
        _audit.Write(request.FamilyId, weekend, request.Locked ? WeekendAuditAction.LockDay : WeekendAuditAction.UnlockDay,
            day: request.Day, after: new { locked = request.Locked });
        await _db.SaveChangesAsync(ct);
        return weekend;
    }
}

public sealed class LockAdminFamilyBlockCommandHandler : IRequestHandler<LockAdminFamilyBlockCommand, WeekendDto>
{
    private readonly AdminFamilyScope _scope;
    private readonly ISender _sender;
    private readonly WeekendAuditWriter _audit;
    private readonly IAppDbContext _db;

    public LockAdminFamilyBlockCommandHandler(AdminFamilyScope scope, ISender sender, WeekendAuditWriter audit, IAppDbContext db)
    {
        _scope = scope;
        _sender = sender;
        _audit = audit;
        _db = db;
    }

    public async Task<WeekendDto> Handle(LockAdminFamilyBlockCommand request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var before = await AdminWeekendLookup.BlockAsync(_db, request.FamilyId, request.BlockId, ct);
        var weekend = await _sender.Send(new LockBlockCommand(request.BlockId, request.Locked), ct);
        var after = weekend.Blocks.Single(b => b.Id == request.BlockId);
        _audit.Write(request.FamilyId, weekend, request.Locked ? WeekendAuditAction.LockBlock : WeekendAuditAction.UnlockBlock,
            day: after.Day, blockId: request.BlockId,
            before: new { title = before.Title, locked = before.IsLocked }, after: WeekendAuditWriter.Snapshot(after));
        await _db.SaveChangesAsync(ct);
        return weekend;
    }
}

public sealed class SwapAdminFamilyBlockCommandHandler : IRequestHandler<SwapAdminFamilyBlockCommand, WeekendDto>
{
    private readonly AdminFamilyScope _scope;
    private readonly ISender _sender;
    private readonly WeekendAuditWriter _audit;
    private readonly IAppDbContext _db;

    public SwapAdminFamilyBlockCommandHandler(AdminFamilyScope scope, ISender sender, WeekendAuditWriter audit, IAppDbContext db)
    {
        _scope = scope;
        _sender = sender;
        _audit = audit;
        _db = db;
    }

    public async Task<WeekendDto> Handle(SwapAdminFamilyBlockCommand request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var before = await AdminWeekendLookup.BlockAsync(_db, request.FamilyId, request.BlockId, ct);
        var weekend = await _sender.Send(new SwapBlockCommand(request.BlockId, request.RejectedActivityIds), ct);
        var after = weekend.Blocks.Single(b => b.Id == request.BlockId);
        _audit.Write(request.FamilyId, weekend, WeekendAuditAction.Swap, day: after.Day, blockId: request.BlockId,
            before: new { title = before.Title, locked = before.IsLocked }, after: WeekendAuditWriter.Snapshot(after));
        await _db.SaveChangesAsync(ct);
        return weekend;
    }
}

/// <summary>What the log needs before a change, read inside the family's scope; a stranger's id is a 404 (L2-158 AC3).</summary>
internal static class AdminWeekendLookup
{
    public static async Task<int> BlockCountAsync(IAppDbContext db, Guid familyId, Guid weekendId, CancellationToken ct, DayOfWeekend? day = null)
    {
        var count = await db.Weekends.AsNoTracking()
            .Where(w => w.Id == weekendId && w.FamilyId == familyId)
            .Select(w => (int?)w.Blocks.Count(b => day == null || b.Day == day))
            .FirstOrDefaultAsync(ct);
        return count ?? throw new NotFoundException(nameof(Weekend), weekendId);
    }

    public static async Task<ItineraryBlock> BlockAsync(IAppDbContext db, Guid familyId, Guid blockId, CancellationToken ct)
        => await db.ItineraryBlocks.AsNoTracking()
            .Where(b => b.Id == blockId && db.Weekends.Any(w => w.Id == b.WeekendId && w.FamilyId == familyId))
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException(nameof(ItineraryBlock), blockId);
}
