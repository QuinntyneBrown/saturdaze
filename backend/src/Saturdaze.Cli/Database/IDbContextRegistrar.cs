using Microsoft.EntityFrameworkCore;

namespace Saturdaze.Cli.Database;

public interface IDbContextRegistrar
{
    void Configure(DbContextOptionsBuilder builder, DatabaseOptions options);
}
