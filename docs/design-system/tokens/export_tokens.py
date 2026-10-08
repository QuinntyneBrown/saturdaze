#!/usr/bin/env python3
"""Export tokens.css to tokens.json in the W3C Design Tokens (DTCG) format.

The design-system skill's generic exporter nests on hyphens; Saturdaze tokens use
Fluent UI v9 camelCase names (ADR-013), so this exporter nests on case changes:
``--colorBrandBackgroundHover`` becomes ``color.brand.backgroundHover`` and
``--spacingHorizontalXXL`` becomes ``spacing.horizontal.XXL``.

Light (``:root``) values are the defaults. Dark values from the
``[data-theme="dark"]`` block are under ``$extensions["com.saturdaze"].themes``.
A value that is exactly one ``var(--other)`` is exported as a DTCG alias.

Usage (from the repo root):
    python docs/design-system/tokens/export_tokens.py
Standard library only.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DECL_RE = re.compile(r"(--[\w-]+)\s*:\s*([^;]+);")
VAR_RE = re.compile(r"var\(\s*(--[\w-]+)\s*\)")
SINGLE_VAR_RE = re.compile(r"^var\(\s*(--[\w-]+)\s*\)$")
SPLIT_RE = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")

TYPES = [
    ("globalColor", "color"), ("color", "color"), ("fontFamily", "fontFamily"),
    ("fontWeight", "fontWeight"), ("fontSize", "dimension"), ("lineHeight", "number"),
    ("letterSpacing", "dimension"), ("typography", "typography"), ("spacing", "dimension"),
    ("layoutColumns", "number"), ("layout", "dimension"), ("borderRadius", "dimension"),
    ("strokeWidth", "dimension"), ("shadow", "shadow"), ("duration", "duration"),
    ("curve", "cubicBezier"), ("zIndex", "number"), ("target", "dimension"),
    ("controlHeight", "dimension"), ("focusRing", "dimension"),
]


def strip_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def block(css: str, selector: str) -> str:
    """Body of the first top-level rule whose selector is exactly ``selector``."""
    match = re.search(r"(?:^|\})\s*" + re.escape(selector) + r"\s*\{([^}]*)\}", css)
    if not match:
        raise SystemExit(f"error: no '{selector}' block in tokens.css")
    return match.group(1)


def path_of(name: str) -> list[str]:
    parts = SPLIT_RE.split(name[2:])
    if len(parts) == 1:  # --shadow4 -> shadow.4
        parts = re.match(r"([a-z]+)(\d*)", parts[0]).groups()
        return [p for p in parts if p]
    head = [p[0].lower() + p[1:] for p in parts[:2]]
    tail = "".join(parts[2:])
    if tail:
        return head + [tail[0].lower() + tail[1:] if not tail[:2].isupper() else tail]
    return head


def token_type(name: str, value: str) -> str:
    bare = name[2:]
    if "Gradient" in bare:
        return "gradient"
    for prefix, kind in TYPES:
        if bare.startswith(prefix):
            return kind
    return "string"


def resolve(value: str, scope: dict[str, str], depth: int = 0) -> str:
    if depth > 20:
        raise ValueError("circular reference")
    return VAR_RE.sub(lambda m: resolve(scope.get(m.group(1), m.group(0)), scope, depth + 1), value).strip()


def coerce(kind: str, value: str):
    if kind == "number":
        try:
            return float(value) if "." in value else int(value)
        except ValueError:
            return value
    if kind == "fontWeight":
        return int(value) if value.isdigit() else value
    if kind == "cubicBezier":
        match = re.match(r"cubic-bezier\(([^)]*)\)", value)
        return [float(p) for p in match.group(1).split(",")] if match else value
    if kind == "fontFamily":
        return [p.strip().strip('"').strip("'") for p in value.split(",")]
    return value


def export(css_path: Path) -> dict:
    css = strip_comments(css_path.read_text(encoding="utf-8"))
    light = dict(DECL_RE.findall(block(css, ":root")))
    light = {k: v.strip() for k, v in light.items()}
    dark_raw = {k: v.strip() for k, v in DECL_RE.findall(block(css, '[data-theme="dark"]'))}
    dark = {**light, **dark_raw}
    tree: dict = {"$description": "Saturdaze design tokens, exported from tokens.css by export_tokens.py. "
                                  "Light values are the defaults; dark overrides are under $extensions."}
    for name, raw in light.items():
        kind = token_type(name, raw)
        alias = SINGLE_VAR_RE.match(raw)
        resolved = resolve(raw, light)
        leaf: dict = {"$type": kind,
                      "$value": "{" + ".".join(path_of(alias.group(1))) + "}" if alias else coerce(kind, resolved)}
        ext: dict = {"css": name}
        if alias:
            ext["resolved"] = resolved
        if name in dark_raw:
            d_raw = dark_raw[name]
            d_alias = SINGLE_VAR_RE.match(d_raw)
            ext["themes"] = {"dark": {
                "$value": "{" + ".".join(path_of(d_alias.group(1))) + "}" if d_alias else coerce(kind, resolve(d_raw, dark)),
                "resolved": resolve(d_raw, dark)}}
        leaf["$extensions"] = {"com.saturdaze": ext}
        node = tree
        keys = path_of(name)
        for key in keys[:-1]:
            node = node.setdefault(key, {})
        node[keys[-1]] = leaf
    return tree


def main() -> int:
    css_path = HERE / "tokens.css"
    tree = export(css_path)
    out = HERE / "tokens.json"
    out.write_text(json.dumps(tree, indent=2) + "\n", encoding="utf-8")
    count = out.read_text(encoding="utf-8").count('"$value"') - out.read_text(encoding="utf-8").count('"dark": {\n')
    print(f"wrote {out.name} ({count} tokens)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
