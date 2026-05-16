using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Weekends;

public sealed record MarkFavouriteCommand(Guid WeekendId, bool Favourite) : IRequest<WeekendDto>;
