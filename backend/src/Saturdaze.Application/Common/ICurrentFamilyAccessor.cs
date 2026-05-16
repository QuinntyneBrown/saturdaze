namespace Saturdaze.Application.Common;

public interface ICurrentFamilyAccessor
{
    Task<Guid> GetCurrentFamilyIdAsync(CancellationToken cancellationToken = default);
}
