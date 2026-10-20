using MediatR;
using Saturdaze.Application.Common;
using Saturdaze.Application.Weekends;

namespace Saturdaze.Application.Admin.Families;

public sealed class GetAdminFamilyHistoryQueryHandler : IRequestHandler<GetAdminFamilyHistoryQuery, WeekendHistoryPage>
{
    private readonly AdminFamilyScope _scope;
    private readonly ISender _sender;

    public GetAdminFamilyHistoryQueryHandler(AdminFamilyScope scope, ISender sender)
    {
        _scope = scope;
        _sender = sender;
    }

    public async Task<WeekendHistoryPage> Handle(GetAdminFamilyHistoryQuery request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        return await _sender.Send(new GetWeekendHistoryQuery(request.Take), ct);
    }
}
