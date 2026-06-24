# 5. Finding Activities

The **Discover** screen is your browsable library of things to do. Use it
when you want to look around and see what's near you. Tap **Discover** in the
bottom bar to open it.

## What you'll see

- A heading like **Picked for the Browns**, with a line of context about your
  family's ages and home area.
- A few **filter chips** near the top to narrow the tone of the list.
- A grid of **activity cards**. Each card shows:
  - An **icon** and a **tone** (outdoor, indoor, food)
  - The **name** of the place
  - A short **why-it-fits** line
  - The **drive time** and the **age range** it suits
  - Sometimes a **tag** or a small **why** chip

The cards are a **read-only browse view** — they show you what's out there
and why it fits. They are not, today, a tap-through to a detail page, and
there are no "Add to Saturday/Sunday", search box, or heart/favourite buttons
on them. Activities make it into your weekend through the **planner** (see
[Planning Your Weekend](03-planning-your-weekend.md)), not by being added
one at a time from this screen.

## Try something new

At the top of Discover there's a **Try something new** button (a little
sparkle). Tap it and Saturdaze opens a panel of **fresh suggestions** —
activities that fit your likes, the weather, and your drive tolerance, with a
lean toward places you haven't done recently. It's the quickest way to break
out of a rut.

This connects to the planner's **"try something new"** behaviour: when that
mode is in play, an activity your family hasn't done before gets an extra
boost when a weekend is generated.

## How activities get chosen for a plan

When you plan or regenerate a weekend, each candidate activity is scored on:

- **Weather fit** — indoor places get a boost on rainy/snowy days; outdoor
  places get a boost when it's sunny and warm.
- **Age fit** — if two or more family members fall outside an activity's age
  range, it's dropped; one that fits everyone gets a bonus.
- **Drive** — a long round-trip relative to the available time slot is
  penalized.
- **Recency** — something you did in the last week is strongly demoted; a
  couple of weeks back, mildly; older than that, no penalty.
- **Your likes and dislikes** — liked tags add points; a disliked tag drops
  the activity entirely.

Ties are broken alphabetically, and the final pick among the top candidates
is made with a fixed random seed — so the same inputs always produce the same
plan.

## What's in the library

Saturdaze ships with a small, curated set focused on the Port Credit /
Mississauga / Halton area. The starter catalog includes:

- **Terre Bleu Lavender Farm**
- **Bronte Creek Provincial Park**
- **Royal Botanical Gardens**
- **The Rec Room**
- **Ontario Science Centre**
- **Toronto Zoo**
- **Riverwood Conservancy**
- **Living Arts Centre**

The catalog is seeded data — it grows as more places are added behind the
scenes rather than by users suggesting them in-app today.

## Up next

Activities sorted? Now the food question:
[Picking a Restaurant](06-picking-restaurants.md).
