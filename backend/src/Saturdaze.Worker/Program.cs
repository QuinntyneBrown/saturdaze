using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Saturdaze.Infrastructure;
using Saturdaze.Infrastructure.Ingestion;
using Saturdaze.Worker;

var builder = Host.CreateApplicationBuilder(args);

// Same composition as the API for persistence/config, plus the ingestion
// pipeline (runner + parser + upserter + Anthropic web-search client).
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddIngestion(builder.Configuration);

builder.Services.Configure<IngestionScheduleOptions>(
    builder.Configuration.GetSection(IngestionScheduleOptions.SectionName));
builder.Services.AddHostedService<IngestionWorker>();

var host = builder.Build();
host.Run();
