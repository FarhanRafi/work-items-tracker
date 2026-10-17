using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using WorkItemsTracker.Core.DTOs;

namespace WorkItemsTracker.Tests;

[Collection("DatabaseTests")]
public class AuthIntegrationTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Register_ValidRequest_Returns201CreatedAndToken()
    {
        // Arrange
        var request = new RegisterRequestDto(
            Email: $"developer_{Guid.NewGuid()}@example.com",
            Password: "Password123!",
            FullName: "Test Developer"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        authResponse.Should().NotBeNull();
        authResponse!.Token.Should().NotBeNullOrWhiteSpace();
        authResponse.Email.Should().Be(request.Email.ToLowerInvariant());
        authResponse.FullName.Should().Be("Test Developer");
        authResponse.UserId.Should().NotBeEmpty();
        authResponse.ExpiresAtUtc.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409Conflict()
    {
        // Arrange
        var email = $"duplicate_{Guid.NewGuid()}@example.com";
        var initialUser = new RegisterRequestDto(
            Email: email,
            Password: "Password123!",
            FullName: "First User"
        );
        var initialResponse = await _client.PostAsJsonAsync("/api/auth/register", initialUser);
        initialResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var duplicateUser = new RegisterRequestDto(
            Email: email.ToUpperInvariant(), // Tests case-insensitive uniqueness
            Password: "DifferentPassword123!",
            FullName: "Second User"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", duplicateUser);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Theory]
    [InlineData("", "Password123!", "Valid Name")]
    [InlineData("not-an-email", "Password123!", "Valid Name")]
    [InlineData("valid@example.com", "short", "Valid Name")] // Password < 8 characters
    [InlineData("valid@example.com", "Password123!", "")] // Empty full name
    public async Task Register_InvalidPayload_Returns400BadRequest(string email, string password, string fullName)
    {
        // Arrange
        var request = new RegisterRequestDto(email, password, fullName);

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200OkAndToken()
    {
        // Arrange
        var email = $"login_{Guid.NewGuid()}@example.com";
        var registerDto = new RegisterRequestDto(
            Email: email,
            Password: "CorrectPassword123!",
            FullName: "Login User"
        );
        await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        var loginDto = new LoginRequestDto(
            Email: email,
            Password: "CorrectPassword123!"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        authResponse.Should().NotBeNull();
        authResponse!.Token.Should().NotBeNullOrWhiteSpace();
        authResponse.Email.Should().Be(email.ToLowerInvariant());
        authResponse.UserId.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Login_InvalidPassword_Returns401Unauthorized()
    {
        // Arrange
        var email = $"secure_{Guid.NewGuid()}@example.com";
        var registerDto = new RegisterRequestDto(
            Email: email,
            Password: "CorrectPassword123!",
            FullName: "Secure User"
        );
        await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        var loginDto = new LoginRequestDto(
            Email: email,
            Password: "WrongPassword999!"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_NonExistentEmail_Returns401Unauthorized()
    {
        // Arrange
        var loginDto = new LoginRequestDto(
            Email: $"ghost_{Guid.NewGuid()}@example.com",
            Password: "AnyPassword123!"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_WithValidToken_Returns200Ok()
    {
        // Arrange
        var email = $"me_{Guid.NewGuid()}@example.com";
        var registerDto = new RegisterRequestDto(
            Email: email,
            Password: "Password123!",
            FullName: "Profile User"
        );
        var regResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        var auth = await regResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCurrentUser_WithoutToken_Returns401Unauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
