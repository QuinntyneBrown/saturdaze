"""Downloads the Saturdaze Admin demo photos from Wikimedia Commons.

Every file is CC0, public domain or Creative Commons licensed; credits.json records the
author, licence and source page of each one. Writes to .cache/admin-demo/www/provider/.

    python -I tools/video-record/admin-demo/download-photos.py
"""
import json
import pathlib
import re
import urllib.parse
import urllib.request

OUT = pathlib.Path(__file__).resolve().parents[3] / ".cache" / "admin-demo" / "www" / "provider"
UA = {"User-Agent": "SaturdazeDemoVideos/1.0 (https://github.com/QuinntyneBrown/saturdaze)"}
FILES = {
    "bronte-meadow": "File:Bronte Creek Provincial Park, Ontario1.jpg",
    "bronte-trail": "File:Bronte Creek Provincial Park, Ontario2.jpg",
    "bronte-shore": "File:Gfp-canada-ontario-bronte-creek-park-shoreline.jpg",
    "rbg-garden": "File:Royal Botanical Gardens, Burlington, Canada (Unsplash HiiQsQcyO8g).jpg",
    "rbg-path": "File:Royal Botanical Gardens, Burlington, Canada (Unsplash e6VmcXF8llA).jpg",
    "lighthouse": "File:Port Credit Lighthouse 2021.jpg",
    "zoo": "File:TorontoZoo.jpg",
    "science": "File:Ontario Science Centre December 24 2025 2.jpg",
    "riverwood": "File:Riverwood - Mississauga, Ontario.jpg",
    "riverwood-path": "File:Riverwood Park - Mississauga, Ontario 2019-04-24 (03).jpg",
    "lac": "File:Living Arts Centre 2022.jpg",
    "lavender": "File:North of 42 Lavender and Winery (29078588563).jpg",
    "snug": "File:Port Credit, ON - Snug Harbour.jpg",
    "aerial": "File:Aerial picture of Port Credit in Mississauga.JPG",
}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    credits = {}
    for key, title in FILES.items():
        query = {"action": "query", "format": "json", "titles": title, "prop": "imageinfo",
                 "iiprop": "url|extmetadata", "iiurlwidth": 1600}
        page = next(iter(json.load(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(query)))["query"]["pages"].values()))
        info = page["imageinfo"][0]
        meta = info["extmetadata"]
        data = get(info.get("thumburl") or info["url"]).read()
        (OUT / f"{key}.jpg").write_bytes(data)
        credits[key] = {
            "title": title,
            "artist": re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip(),
            "license": meta.get("LicenseShortName", {}).get("value", ""),
            "page": info["descriptionurl"],
            "width": info.get("thumbwidth"),
            "height": info.get("thumbheight"),
        }
        print(f"{key}: {credits[key]['license']} ({len(data) // 1024} KB)")
    (OUT / "credits.json").write_text(json.dumps(credits, indent=1, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
