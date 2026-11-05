# 45 · Couples dates: the product

Saturdaze plans the whole family's weekend. Every block is for everyone in Who's in, and the meals are restaurant picks for lunch and dinner. This video is about the one thing parents kept asking for: time for just the two of them. You will see the mocks the feature was designed from, the real app doing it, and the choices that shape it.

## The ask

Parents wanted a date, not another family outing. A date has a different audience, two adults instead of the family. It has a different shape, a meal, maybe a walk or a gallery, and the drives in between. And it uses a meal the family planner never plans, breakfast. It still has to fit the weekend: it may not clash with the couple's commitments, and the family plan has to make room for it, because the kids need care while the parents are out.

## The mocks

Every feature in Saturdaze starts as a static mock, so the design is agreed before any code is written. On the Weekend mock, a quiet Plan a date action sits beside Add to calendar and Share. Scroll to Sunday and the date is one block in the timeline, marked with a heart, titled Dinner date at Snug Harbour, with who is going and two chips: Date, and Kids need care from five fifteen to eight fifteen.

The dialogs gallery gained six specimens, D38 to D43. D38 is Plan a date: meal, day and who is going, with two adults already ticked and a hint that the kids stay on the family plan. D38b is the same dialog for a family with fewer than two adults: it says why, and nothing can be chosen. Then one small dialog per change: swap the restaurant, change or drop the activity, move the date, regenerate it, and cancel it in red.

The date has its own screen. The header says Dinner date, Sunday, the time, and Quinn and Sara. A warm banner says the kids need care and that Saturdaze does not book childcare. Then the plan: the drive, dinner at Snug Harbour with why it was picked, a walk at Memorial Park that ends before sunset, and the drive home. The mock also shows the planning state, the no restaurant fits state, and a date that is just dinner.

Two more mocks changed. Food ideas gained a Breakfast filter beside Lunch and Dinner, with breakfast spots first. And Past shows a date line on any weekend that had one.

## The app

Here is the real app on the Browns' weekend. Plan a date opens D38 as a dialog. Pick Dinner and Sunday, keep Quinn and Sara ticked, and Plan the date. Saturdaze picks the restaurant, finds a nearby activity if one fits, times the drives, and opens the date's screen. Every step says why it was chosen.

Back on the weekend, Sunday now has the date block with its heart. The chips say Date and when the kids need care, and the family's evening has been planned again around it. The block cannot be unlocked or swapped, because the date is changed from its own screen.

From that screen you can swap the restaurant. Saturdaze picks the next best dinner spot that fits the same time, and never offers a place you swapped away again. The activity has its own dialog: swap it for another place near the restaurant, or drop it and keep the date to just dinner.

Move opens the meal and day again and plans the date at the new time; the restaurant is chosen again, because a lunch place is not a dinner place. Regenerate keeps the meal, the day and the people and picks everything again. And Cancel takes the date off the weekend, which is planned again without it. Nothing was booked, so there is nothing else to cancel.

Breakfast is now a meal in its own right. Food ideas has a Breakfast filter, and the seeded catalog has breakfast spots so a breakfast date works out of the box. On Past, a weekend that had a date shows it on the card, and it is rated with the weekend.

## The choices

A few decisions shaped this. First, no fifth navigation item. A date is part of a weekend, so it starts on the Weekend screen, shows in its day, and has its screen under the Weekend item. Second, every edit is a dialog. There are no inline forms anywhere in Saturdaze, and dates follow the same rule. Third, the weekend treats the date as a locked block, so every existing path, regenerate, swap, lock and the agents, keeps it without new code. Fourth, Saturdaze says who needs care but books nothing: no restaurant, no activity, no childcare. And fifth, when nothing fits, it says why in plain words rather than inventing a place.

## Recap

Plan a date on the Weekend screen gives two adults a meal out with a nearby activity, planned around their commitments, with the family weekend planned around it. The kids stay on the family plan and the plan says when they need care. Every change is a dialog, every pick has a reason, and nothing is booked. The next two videos go under the hood: the backend that plans a date, and the frontend and tests that put it on screen.
