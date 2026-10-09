# Family members demo

The data the family member videos (`docs/videos/20-…` to `23-…`) are recorded against: the Rivera family, staged through the real API by `family.mjs` in each clip's off-camera `setup`. Alex registers The Riveras and so owns it; Jordan, Rosa and Theo are invited or join as each video needs. Every account uses the password `lavender-weekend`.

The emails are fixed (`alex.rivera@example.com` and so on), so each recording run must start from a freshly seeded database. Point the API at a database of its own, never your development one, and let `SD_DEMO_RESET` run `saturdaze reset --yes` against it before recording.

## Run it (from the repository root)

```sh
export SATURDAZE_CONNECTION="Server=127.0.0.1,1433;Database=SaturdazeVideo;User Id=sa;Password=…;TrustServerCertificate=True"
dotnet run --project backend/src/Saturdaze.Cli -- reset --yes
# two long-running terminals:
ASPNETCORE_ENVIRONMENT=Development ConnectionStrings__Saturdaze="$SATURDAZE_CONNECTION" \
  dotnet run --project backend/src/Saturdaze.Api --urls http://localhost:5100
(cd frontend && npm start)

# record a video's clips; the reset runs once first
SD_DEMO_RESET='dotnet run --project backend/src/Saturdaze.Cli -- reset --yes' \
  node tools/video-record/record-clips.mjs docs/videos/20-who-owns-a-family
```

The API must run as Development: the invite link (D30) is built from `Saturdaze:Share:AppOrigin`, which `appsettings.Development.json` sets to `http://localhost:4200`.
