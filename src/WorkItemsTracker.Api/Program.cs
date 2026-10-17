using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using WorkItemsTracker.Infrastructure;
using WorkItemsTracker.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Database & Infrastructure Services
builder.Services.AddInfrastructure(builder.Configuration);

// 2. JWT Authentication: Configured via options pattern so DI & configuration overrides are respected
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IConfiguration>((options, configuration) =>
    {
        var key = configuration["Jwt:Key"];
        var issuer = configuration["Jwt:Issuer"] ?? "WorkItemsTrackerApi";
        var audience = configuration["Jwt:Audience"] ?? "WorkItemsTrackerClient";

        if (string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 32)
        {
            throw new InvalidOperationException(
                "Critical Configuration Error: 'Jwt:Key' must be configured and be at least 256 bits (32 bytes).");
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// 3. API Controllers & OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// 4. Health Checks: Liveness (process health) vs Readiness (database connectivity)
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("API process is alive"), tags: ["live"])
    .AddDbContextCheck<AppDbContext>(
        "database",
        failureStatus: HealthStatus.Unhealthy,
        tags: ["ready"]);

var app = builder.Build();

// 5. Explicit Migration CLI Command: dotnet run -- --migrate
if (args.Contains("--migrate"))
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    logger.LogInformation("Applying pending EF Core database migrations...");
    await dbContext.Database.MigrateAsync();
    logger.LogInformation("Database migrations applied successfully.");
    return;
}

// 6. HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health Check Endpoints
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("live")
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = WriteSafeHealthResponseAsync
});

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = WriteSafeHealthResponseAsync
});

app.Run();

// Sanitized Health Response: never leaks connection strings, secrets, or internal stack traces
static Task WriteSafeHealthResponseAsync(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";

    var safeReport = new
    {
        status = report.Status.ToString(),
        totalDurationMs = Math.Round(report.TotalDuration.TotalMilliseconds, 2),
        checks = report.Entries.Select(e => new
        {
            name = e.Key,
            status = e.Value.Status.ToString(),
            description = e.Value.Description,
            durationMs = Math.Round(e.Value.Duration.TotalMilliseconds, 2)
        })
    };

    return context.Response.WriteAsync(JsonSerializer.Serialize(safeReport, new JsonSerializerOptions
    {
        WriteIndented = true
    }));
}

// Expose Program class for WebApplicationFactory in integration tests
public partial class Program { }
