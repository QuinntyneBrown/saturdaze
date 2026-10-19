# Pick restaurants

## Overview

Saturdaze is a web application that plans personalized family weekends. Restaurant discovery scopes curated meal options to a day and meal slot, with optional proximity to an activity.

*meal slot* — named meal window such as lunch or dinner on a weekend day

`RestaurantService` loads restaurant DTOs for the selected presentation state. `GetRestaurantPicksQueryHandler` filters by the slot, applies the wife-approved default, and can prioritize proximity.

## Description

`IdeasFoodPage` at `/ideas/food` injects `RESTAURANT_SERVICE` and uses `RestaurantService.list(): Signal<IdeasFoodView>`. The service loads four day/meal lists with `wifeApprovedOnly=false&take=10`; the API's default remains true when omitted. `RestaurantService` asks for each meal's picks near the activity planned before that meal in the current weekend, and keeps the API's order after locked and wife-approved picks (L2-019 AC4).

`GetRestaurantPicksQueryHandler` filters meal slot, joins family-owned votes and day/slot locks, and optionally ranks by the difference between stored restaurant and activity drive estimates. Near an activity, picks rank by straight-line distance from it (`TravelEstimator.DistanceKm`) when both places are mapped, falling back to comparing drive times from home; this is not a road route calculation. Without `nearActivityId`, results order by drive minutes, then name. No validator or binding attribute rejects a request that omits `day` or `slot`; the 400 response in the `L2-019` acceptance criteria remains an implementation gap.

`RestaurantService.setFilters()` selects day, meal, wife-approved, and under-15-minute filters locally. The service ranks locked choices first, then approved and nearby choices. `vote(restaurantId, voterName, vote)` sends a family-scoped vote and replaces the returned record.

`LockRestaurantDialog` confirms a day/slot choice. `LockRestaurantCommandHandler` upserts one `RestaurantLock` per family/day/slot and updates or creates the current weekend's locked meal block when a current plan exists. The UI has no restaurant-unlock action.

`Restaurant.HasPatio` comes from seed data and from ingestion, whose restaurants prompt asks for `patio`; `GET /api/restaurants?patioOnly=true` narrows to it, and the Food segment adds a "Patio" filter chip after "Under 15 min" and a Patio chip on picks that have one (L2-147). D12 uses the mock's `card__head`, `card__title`, `card__meta` and `card__chips` classes. `VoteRestaurantCommandHandler` accepts a vote only for a member of the caller's family, matching the name without regard to case and storing the member's own spelling; any other name is a 400 naming `voterName`. A vote may carry the day and slot it was cast from, and its `locked` then reflects that day and slot; the browser keeps each list's own lock state when a vote returns (L2-148). `GET /api/restaurants` returns 400 naming `day` or `slot` when either is missing (L2-019 AC1).

Restaurant cards lead with the restaurant's photo since the 2026-10-06 mock (`docs/mocks/pages/ideas.food.html`); `discovery/store-place-location-and-imagery` designs the photo data. "Lock it in" stays the way to place a restaurant; restaurant cards carry no "Add to day" action (L2-107).

## Requirements

The following L2 requirements refine the cited L1 capabilities. Implementation gaps stated in Description do not waive these obligations.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-019` | `L1-006` | `GET /api/restaurants` shall require a `day` and `slot` parameter, optionally narrow by `nearActivityId`, and default `wifeApprovedOnly=true`. |
| `L2-147` | `L1-006` | Every restaurant shall record whether it has a patio, from seed data and from catalog ingestion. `GET /api/restaurants` shall accept `patioOnly=true`. The Food segment of `/ideas` shall offer a "Patio" filter chip after "Wife-approved" and "Under 15 min", and show a "Patio" chip on each pick that has one. |
| `L2-148` | `L1-006` | A restaurant vote shall be cast in the name of one of the caller's family members, matched without regard to case; any other name shall be refused. A vote may say which day and meal slot it was cast from, and the response shall then report the lock for that day and slot. |

## Diagrams

### System context

The context view identifies the person using the discovery capability and the systems that participate in the result.

![C4 system context for picking restaurants](diagrams/c4-context.png)

### Containers

The container view follows the interaction from the Angular web application through the API to persistence.

![C4 container view for picking restaurants](diagrams/c4-container.png)

### Components

The component view names the page, client service, controller, handler, domain type, and infrastructure boundary involved in the slice.

![C4 component view for picking restaurants](diagrams/c4-component.png)

### Class structure

The class view shows the request, handler, and state relationships used by the feature.

![Class diagram for picking restaurants](diagrams/class-structure.png)

### Behaviour — scope restaurant picks

The sequence view traces the primary behaviour to `L2-019`. Its alternate path produces a controlled empty, validation, authorization, or fallback state.

![Sequence diagram for picking restaurants](diagrams/sequence-pick-restaurants.png)
