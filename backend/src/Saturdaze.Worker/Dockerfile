# Saturdaze ingestion Worker container.
#
# Build from the *backend* directory so the central build props and all
# referenced projects are in context:
#
#   cd backend
#   docker build -f src/Saturdaze.Worker/Dockerfile -t saturdaze-worker .
#
# Run as a long-lived cron daemon (uses the built-in CronSchedule):
#
#   docker run --rm \
#     -e SATURDAZE_CONNECTION="Server=...;Database=Saturdaze;..." \
#     -e ANTHROPIC_API_KEY="sk-ant-..." \
#     saturdaze-worker
#
# Or as a one-shot job (e.g. a Kubernetes CronJob / Azure Container Apps Job
# where an external scheduler owns the cadence):
#
#   docker run --rm \
#     -e SATURDAZE_CONNECTION="..." -e ANTHROPIC_API_KEY="..." \
#     -e Saturdaze__Ingestion__Schedule__RunOnceThenExit=true \
#     saturdaze-worker
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/ src/
RUN dotnet restore src/Saturdaze.Worker/Saturdaze.Worker.csproj
RUN dotnet publish src/Saturdaze.Worker/Saturdaze.Worker.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app
COPY --from=build /app ./
ENTRYPOINT ["dotnet", "Saturdaze.Worker.dll"]
