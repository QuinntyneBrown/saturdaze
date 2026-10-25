"""The canonical evaluation family and its variants (L2-212, docs/schedule-generation-evaluation.md).

A Christian family in Mississauga that does not celebrate Halloween: Dad 45, Mom 43,
daughters Ava (10) and Mia (6); Aqua Tots Heartland swims on Sunday at 5980 McLaughlin Rd;
up to two hours' drive each way. Each variant changes one thing about that weekend.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, field

HOME = {
    "address": "2091 Hurontario St, Mississauga L5A 4E6",
    "latitude": 43.5711,
    "longitude": -79.6024,
}

HEARTLAND = {"address": "5980 McLaughlin Rd, Mississauga", "latitude": 43.6297, "longitude": -79.7127}

#: Words that give a Halloween theme away even when a title avoids "Halloween" (B1).
HALLOWEEN_WORDS = (
    "halloween", "spook", "pumpkin", "haunt", "trick-or-treat", "trick or treat",
    "ghost", "zombie", "witch", "monster bash", "boo ", "costume parade", "fright",
)

WEEKENDS = ("2026-10-31", "2026-11-07")


@dataclass
class Persona:
    """What the target saves through `PUT /api/family` before it drafts."""

    variant: str
    members: list[dict] = field(default_factory=list)
    commitments: list[dict] = field(default_factory=list)
    excluded_themes: list[str] = field(default_factory=lambda: ["halloween"])
    max_drive_minutes: int = 120
    weekend_of: str = WEEKENDS[0]
    #: Rainy forecast or none at all; the API's own weather client decides, so the target only labels it.
    weather_note: str = "live"

    def family_name(self) -> str:
        return "The Evaluation Family"


def _base() -> Persona:
    return Persona(
        variant="persona",
        members=[
            {"name": "Dad", "age": 45},
            {"name": "Mom", "age": 43},
            {"name": "Ava", "age": 10},
            {"name": "Mia", "age": 6},
        ],
        commitments=[
            {"title": "Aqua Tots — Mia", "dayOfWeek": "Sunday", "startTime": "16:20:00", "endTime": "16:50:00",
             "attendees": ["Mia"], "location": HEARTLAND},
            {"title": "Aqua Tots — Ava", "dayOfWeek": "Sunday", "startTime": "17:00:00", "endTime": "17:30:00",
             "attendees": ["Ava"], "location": HEARTLAND},
        ],
    )


def persona(variant: str, weekend_of: str | None = None) -> Persona:
    """The persona with one variant applied: grandparents, party, overlap, rainy, beyond-forecast."""
    p = _base()
    p.variant = variant
    if weekend_of:
        p.weekend_of = weekend_of
    if variant == "grandparents":
        p.members += [{"name": "Grandma", "age": 72}, {"name": "Grandpa", "age": 75}]
    elif variant == "party":
        p.commitments.append({"title": "Birthday party — Ava", "dayOfWeek": "Saturday", "startTime": "13:00:00",
                              "endTime": "16:00:00", "attendees": ["Ava"], "location": None})
    elif variant == "overlap":
        p.commitments[1] = {**p.commitments[1], "startTime": "16:30:00", "endTime": "17:00:00"}
    elif variant == "rainy":
        p.weather_note = "rain"
    elif variant == "beyond-forecast":
        p.weekend_of = "2026-11-21"
        p.weather_note = "none"
    elif variant not in ("persona", "injection", "cross-family", "tools-fail"):
        raise ValueError(f"Unknown variant: {variant}")
    return copy.deepcopy(p)
