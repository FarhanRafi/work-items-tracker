using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WorkItemsTracker.Infrastructure.Data;

namespace WorkItemsTracker.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly object Lock = new();
    private static bool _databaseInitialized;

    // Use a dedicated local integration test database in SQL Server LocalDB
    public const string TestConnectionString =
        "Server=(localdb)\\mssqllocaldb;Database=WorkItemsTrackerDb_Test;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = TestConnectionString,
                ["Jwt:Key"] = "IntegrationTestingKeyForWorkItemsTrackerThatIs32BytesLong!",
                ["Jwt:Issuer"] = "WorkItemsTrackerApi",
                ["Jwt:Audience"] = "WorkItemsTrackerClient",
                ["Jwt:ExpirationMinutes"] = "30"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Build the service provider to ensure migrations are applied to the test database
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            lock (Lock)
            {
                if (!_databaseInitialized)
                {
                    db.Database.Migrate();
                    _databaseInitialized = true;
                }
            }
        });
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Clean tables in reverse dependency order
        await db.WorkItems.ExecuteDeleteAsync();
        await db.Users.ExecuteDeleteAsync();
    }
}
