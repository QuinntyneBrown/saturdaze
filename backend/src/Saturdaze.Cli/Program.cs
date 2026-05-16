using System.CommandLine;
using Saturdaze.Cli;

return await RootCommandFactory.Create(args).InvokeAsync(args);
