# Email template demo environment

The data the email template videos (`docs/videos/19-…` to `21-…`) are recorded against. It never touches the `Saturdaze` development database: everything lives in a separate `SaturdazeEmailDemo` database and under `.cache/email-demo/` (not committed). Unlike the photo demo (`../admin-demo`), it needs no image host and runs on Windows, macOS and Linux.

| Piece | What it is |
|-------|-----------|
| `SaturdazeEmailDemo` | `saturdaze reset` with the bundled seed, plus a second administrator (`jo.curator@saturdaze.app`), so it carries the two system templates (L2-130). |
| `reset.mjs` | Rebuilds the database, then stages a morning of template work through the real admin API as two administrators: `notify.weekend-ready` (written, revised by the second curator, activated), `schedule.weekly-digest` and `occasion.holidays` (drafts), and `promo.spring-sale` (activated, then archived). Every revision is genuine. |
| `demo-env.mjs` | The API address, the two administrators and small API helpers the clips reuse (`token`, `call`, `idOf`, `save`, `setStatus`). |

## Run it (from the repository root)

```sh
dotnet build backend/Saturdaze.sln

# The demo database, for the reset and for the API. It must be named SaturdazeEmailDemo.
# Windows LocalDB:
export SD_EMAIL_DEMO_CONNECTION='Server=(localdb)\MSSQLLocalDB;Database=SaturdazeEmailDemo;Trusted_Connection=True;TrustServerCertificate=True'
# or a SQL Server container:
export SD_EMAIL_DEMO_CONNECTION='Server=localhost,1433;Database=SaturdazeEmailDemo;User Id=sa;Password=<password>;TrustServerCertificate=True'

# The API against the same database (one terminal):
SATURDAZE_CONNECTION="$SD_EMAIL_DEMO_CONNECTION" ASPNETCORE_ENVIRONMENT=Development \
  ASPNETCORE_URLS=http://localhost:5100 dotnet run --project backend/src/Saturdaze.Api
# Saturdaze Admin (another terminal):
cd frontend && npm run start:admin
```

Record a video's clips; each run rebuilds and restages the data first, so clips that change templates start from the same state:

```sh
export SD_DEMO_RESET="node tools/video-record/email-demo/reset.mjs"
export SD_ADMIN_URL="http://localhost:4300"
# Optional: an installed Chromium instead of Playwright's download.
export CHROME_PATH=/path/to/chromium
node tools/video-record/record-clips.mjs docs/videos/24-email-templates-catalog-and-new
```

Then build the video as usual (`tools/video-audio`, `tools/video-build`; see `docs/videos/README.md`). Revision times and "updated" lines show the time of the recording, in UTC.
