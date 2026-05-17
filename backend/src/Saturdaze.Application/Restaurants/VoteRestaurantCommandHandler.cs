using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Restaurants;

public sealed class VoteRestaurantCommandHandler : IRequestHandler<VoteRestaurantCommand, RestaurantDto>
{
    private static readonly HashSet<string> AllowedVotes = new(StringComparer.OrdinalIgnoreCase)
    {
        "up",
        "down",
        "none"
    };

    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IDateTimeProvider _clock;

    public VoteRestaurantCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<RestaurantDto> Handle(VoteRestaurantCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.VoterName))
            throw new ValidationException(nameof(request.VoterName), "Voter name is required.");

        var voteValue = request.Vote.Trim().ToLowerInvariant();
        if (!AllowedVotes.Contains(voteValue))
            throw new ValidationException(nameof(request.Vote), "Vote must be up, down, or none.");

        var restaurant = await _db.Restaurants
            .SingleOrDefaultAsync(r => r.Id == request.RestaurantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Restaurant), request.RestaurantId);

        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
        var voter = request.VoterName.Trim();
        var existing = await _db.RestaurantVotes
            .SingleOrDefaultAsync(v =>
                v.FamilyId == familyId &&
                v.RestaurantId == request.RestaurantId &&
                v.VoterName == voter,
                cancellationToken);

        if (existing is null)
        {
            existing = new RestaurantVote
            {
                Id = Guid.NewGuid(),
                FamilyId = familyId,
                RestaurantId = request.RestaurantId,
                VoterName = voter
            };
            _db.RestaurantVotes.Add(existing);
        }

        existing.Vote = voteValue;
        existing.UpdatedAtUtc = _clock.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        var votes = await _db.RestaurantVotes.AsNoTracking()
            .Where(v => v.FamilyId == familyId && v.RestaurantId == restaurant.Id)
            .OrderBy(v => v.VoterName)
            .Select(v => new RestaurantVoteDto(v.VoterName, v.Vote))
            .ToListAsync(cancellationToken);
        var locked = await _db.RestaurantLocks.AsNoTracking()
            .AnyAsync(l => l.FamilyId == familyId && l.RestaurantId == restaurant.Id, cancellationToken);

        return RestaurantProjection.ToDto(restaurant, votes, locked);
    }
}
