using System.Net;
using System.Text.Json;
using FluentAssertions;

namespace WorkItemsTracker.Tests;

[Collection("DatabaseTests")]
public class HealthCheckIntegrationTests
{
    private readonly HttpClient _client;

    public HealthCheckIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHealthLive_Returns200Ok()
    {
        // Act
        var response = await _client.GetAsync("/health/live");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Be("Healthy");
    }

    [Fact]
    public async Task GetHealthReady_Returns200OkWithDatabaseCheck()
    {
        // Act
        var response = await _client.GetAsync("/health/ready");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.GetProperty("status").GetString().Should().Be("Healthy");
        var checks = root.GetProperty("checks");
        checks.GetArrayLength().Should().BeGreaterThan(0);

        var dbCheck = checks.EnumerateArray().FirstOrDefault(c => c.GetProperty("name").GetString() == "database");
        dbCheck.ValueKind.Should().NotBe(JsonValueKind.Undefined);
        dbCheck.GetProperty("status").GetString().Should().Be("Healthy");

        // Sensitive information check: ensure connection strings, passwords, or server names are not in the response
        json.Should().NotContain("Password");
        json.Should().NotContain("Server=");
        json.Should().NotContain("Trusted_Connection");
    }

    [Fact]
    public async Task GetHealth_ReturnsSanitizedJsonWithoutExposingSecrets()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("status").GetString().Should().Be("Healthy");

        // Must not expose connection details
        json.Should().NotContain("mssqllocaldb");
        json.Should().NotContain("DefaultConnection");
    }
}
