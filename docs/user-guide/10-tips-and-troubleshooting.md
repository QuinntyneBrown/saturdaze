# 10. Tips, Shortcuts, and Troubleshooting

A grab-bag chapter: faster moves, common questions, and what to do when
something feels off.

## Shortcuts

### Lock-and-regenerate

The main way to shape a weekend:

1. On the home screen, open **Quick actions → Lock what's already perfect**
   to enter lock mode.
2. Tap the blocks you love to pin them.
3. **Regenerate the weekend** (or a single day from its Itinerary).

Everything you locked stays; the rest gets fresh ideas.

### Regenerate one day, not both

If only Sunday is off, open Sunday's Itinerary and tap **Regenerate**. The
other day is untouched.

### Share or hand off to a calendar

- **Share this weekend** (Quick actions) makes a read-only link plus a tidy
  text summary — faster than re-explaining the plan over text.
- The **calendar** option gives you `.ics`, `webcal`, and Google Calendar
  links so the plan lands in the calendar you already use.

(A day's **More** menu lists an "Export as text" option too, but it isn't
functional yet — Share and Calendar are the working hand-offs today.)

### Try something new

On **Discover**, tap **Try something new** for a panel of fresh suggestions
that lean toward places you haven't done recently.

## Common questions

### Why is the app suggesting things we don't like?

Most often your **profile** needs a touch-up. Open **Family** and check:

- Are everyone's **ages** right? (Age fit can drop or keep an activity.)
- Do your **likes & dislikes** reflect reality? A disliked tag removes
  matching activities entirely.

Note that members and commitments are editable in-app today; the likes &
dislikes shown on the profile come from your initial setup and aren't yet
editable from that screen.

### Why is everything outdoors (or indoors)?

The planner weights activities to the **weather**: indoor on wet days,
outdoor when it's sunny and warm. If the forecast is great, that's the app
doing its job. Regenerate to see other options in the same conditions.

### Why is the same activity showing up again?

Two possibilities:

- It's a **commitment** (swim, church, workout). Those repeat by design.
- It scored highest again. To force variety, lock the keepers and regenerate,
  or use **Try something new** on Discover.

### Why won't the app schedule anything late on Sunday?

By design. **Sunday winds down from 7:30 pm** and **Sunday dinner is left
off** so the evening stays open for the week ahead. Saturday runs later, to
9 pm.

### Can I plan more than one weekend ahead?

Saturdaze focuses on the **upcoming weekend** — "Plan This Weekend" always
targets the next Saturday/Sunday. This keeps suggestions accurate to the real
forecast.

### What if my partner uses the app too?

Sign in to the **same family** account on each device and you're working from
the same plan. The **Share** link is for people *outside* the family
(grandparents, sitters) who don't sign in.

### Is there a kid-facing view?

Not today. There's no separate child view.

## Troubleshooting

### The plan won't generate

The most common cause is an incomplete profile:

- Add at least one **family member** (the planner needs ages).
- Add your **commitments** with valid **start and end times**.

If two **commitments overlap** on the same day, the planner refuses to build
that day and reports the clash — open the offending commitments and fix the
times.

### I can't find a place I expected

The activity and restaurant catalogs are **curated, seeded data**. There's no
in-app "suggest a place" today, so if something's missing it has to be added
to the catalog behind the scenes (see
[Admin and Command-Line Tools](11-admin-and-cli.md) for how data is loaded).

### The weather looks wrong

Forecasts are pulled in the background. Regenerate the weekend to pick up the
latest forecast.

### I got signed out

If **Remember me** was off at sign-in, your session ends when the app closes.
Turn it on (on your own device) to stay signed in. If a request comes back
unauthorized, the app returns you to the **Sign in** screen with your place
remembered — just sign back in.

### A shared link doesn't open for my partner

Share links are read-only previews of a specific weekend. Generate a fresh
one from **Share this weekend** if an old link no longer resolves. If your
partner signs in to the same family, they don't need the link at all.

## Getting help

The app's sign-in and email screens point to **support@saturdaze.app** for a
hand. For anything about running the app itself (database setup, seeding), see
[Admin and Command-Line Tools](11-admin-and-cli.md).

## Final note

Saturdaze is meant to make weekends easier, not stricter. Take the plan,
regenerate it, lock half and redo the rest — the app will adjust. The point
isn't a perfect schedule. It's more "Saturday" and less "what should we do
today?"

Have a great weekend.
