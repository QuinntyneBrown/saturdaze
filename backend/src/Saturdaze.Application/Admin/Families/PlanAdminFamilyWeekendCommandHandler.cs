using MediatR;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Weekends;

namespace Saturdaze.Application.Admin.Families;

public sealed class PlanAdminFamilyWeekendCommandHandler : IRequestHandler<PlanAdminFamilyWeekendCommand, WeekendDto>
{
    private readonly AdminFamilyScope _scope;
    private readonly IDateTimeProvider _clock;
    private readonly ISender _sender;

    public PlanAdminFamilyWeekendCommandHandler(AdminFamilyScope scope, IDateTimeProvider clock, ISender sender)
    {
        _scope = scope;
        _clock = clock;
        _sender = sender;
    }

    public async Task<WeekendDto> Handle(PlanAdminFamilyWeekendCommand request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var weekendOf = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        return await _sender.Send(new GenerateWeekendCommand(weekendOf), ct);
    }
}
