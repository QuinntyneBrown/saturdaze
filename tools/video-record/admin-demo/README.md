# Saturdaze Admin demo environment

The data and services the Saturdaze Admin videos (`docs/videos/12-…` to `17-…`) are recorded against. It never touches the `Saturdaze` development database: everything lives in a separate `SaturdazeDemo` LocalDB database and under `.cache/admin-demo/` (not committed).

| Piece | What it is |
|-------|-----------|
| `SaturdazeDemo` | The bundled seed (`saturdaze reset`) plus `stage.mjs`: eight curated uploads by two administrators (`admin@saturdaze.app`, `jo.curator@saturdaze.app`), four unreviewed provider photos, one blocked `http://` primary, weekends whose covers follow Bronte Creek (5) and Snug Harbour (3), and one earlier ingestion run with photo skips. |
| API | `start-api.ps1`: HTTP on `:5100` for the apps, HTTPS on `:5101` for curated photos. Both `https://localhost:5101` (the curated store's public origin, ADR-015) and `https://localhost:5443` are on the image allow-list. |
| Stand-in provider CDN | `start-image-host.ps1`: serves the demo photos at `https://localhost:5443/provider/` with the trusted ASP.NET Core development certificate. |
| Photos | `download-photos.py`: fourteen CC0, public-domain and Creative Commons photos of the seeded places from Wikimedia Commons; `credits.json` beside them records each author, licence and source page. |
| Snapshot | `stage.ps1` backs the staged database and curated store up; `reset.mjs` restores them before each recording. |

Provider photos, weekend covers and ingestion runs are inserted with SQL, because only a live Claude ingestion run or a family's planning would create them. Curated photos go through the real admin API, so their audit entries are genuine.

## Run it (Windows, PowerShell, from the repository root)

```powershell
dotnet build backend/Saturdaze.sln
python -I tools/video-record/admin-demo/download-photos.py
# two long-running terminals:
./tools/video-record/admin-demo/start-image-host.ps1
./tools/video-record/admin-demo/start-api.ps1
# then, once:
./tools/video-record/admin-demo/stage.ps1
# and Saturdaze Admin itself (another terminal):
cd frontend; npm run start:admin
```

Record a video's clips (each run restores the snapshot first, so clips that change data start from the same state):

```powershell
$env:SD_DEMO_RESET = "node tools/video-record/admin-demo/reset.mjs"
$env:SD_ADMIN_URL = "http://localhost:4300"   # where `npm run start:admin` listens
node tools/video-record/record-clips.mjs docs/videos/14-managing-a-places-photos
```

Then build the video as usual (`tools/video-audio`, `tools/video-build`; see `docs/videos/README.md`).
