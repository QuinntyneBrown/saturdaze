using MediatR;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Families;

public sealed class GetFamilyProfileQueryHandler : IRequestHandler<GetFamilyProfileQuery, FamilyProfileDto>
{
    private readonly FamilyProfileReader _reader;
    private readonly ICurrentFamilyAccessor _current;

    public GetFamilyProfileQueryHandler(FamilyProfileReader reader, ICurrentFamilyAccessor current)
    {
        _reader = reader;
        _current = current;
    }

    public async Task<FamilyProfileDto> Handle(GetFamilyProfileQuery request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        return await _reader.ReadAsync(familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Family), familyId);
    }
}
