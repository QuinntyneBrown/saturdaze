using Xunit;

namespace Saturdaze.Infrastructure.Tests.Support;

/// <summary>
/// A test of behaviour only SQL Server has: the migrations and <c>sp_getapplock</c> (ADR-020).
/// Skipped unless <c>SATURDAZE_TEST_SQLSERVER</c> names a server (or <c>localdb</c>), so the
/// default run and CI need no database server. Pair with <c>[Trait("Category", "SqlServer")]</c>.
/// </summary>
public sealed class SqlServerFactAttribute : FactAttribute
{
    public SqlServerFactAttribute()
    {
        if (!LocalDbConnection.Enabled)
            Skip = "Opt-in: needs SQL Server. Set SATURDAZE_TEST_SQLSERVER to a server connection string or to localdb.";
    }
}
