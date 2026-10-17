using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using WorkItemsTracker.Core.DTOs;
using WorkItemsTracker.Core.Enums;

namespace WorkItemsTracker.Tests;

[Collection("DatabaseTests")]
public class WorkItemsIntegrationTests : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public WorkItemsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    public Task InitializeAsync() => _factory.ResetDatabaseAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<(HttpClient Client, AuthResponseDto Auth)> CreateAuthenticatedUserAsync(string prefix, string name)
    {
        var email = $"{prefix}_{Guid.NewGuid()}@example.com";
        var registerDto = new RegisterRequestDto(email, "Password123!", name);
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        var userClient = _factory.CreateClient();
        userClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        return (userClient, auth);
    }

    [Fact]
    public async Task GetAll_WithoutToken_Returns401Unauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/workitems");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithValidData_Returns201CreatedAndPersistsInSql()
    {
        // Arrange
        var (userClient, auth) = await CreateAuthenticatedUserAsync("creator", "Creator");
        var createDto = new CreateWorkItemRequestDto(
            Title: "Setup CI pipeline",
            Description: "Configure GitHub Actions workflow for .NET 10",
            Status: WorkItemStatus.Todo,
            Priority: WorkItemPriority.High,
            DueDateUtc: DateTime.UtcNow.AddDays(7)
        );

        // Act
        var response = await userClient.PostAsJsonAsync("/api/workitems", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<WorkItemResponseDto>();
        created.Should().NotBeNull();
        created!.Id.Should().NotBeEmpty();
        created.Title.Should().Be("Setup CI pipeline");
        created.Description.Should().Be("Configure GitHub Actions workflow for .NET 10");
        created.Status.Should().Be(WorkItemStatus.Todo);
        created.Priority.Should().Be(WorkItemPriority.High);
        created.OwnerId.Should().Be(auth.UserId);
        created.CreatedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GetById_OwnedItem_Returns200Ok()
    {
        // Arrange
        var (userClient, _) = await CreateAuthenticatedUserAsync("viewer", "Viewer");
        var createDto = new CreateWorkItemRequestDto(Title: "Task to View", Description: "Details");
        var createResponse = await userClient.PostAsJsonAsync("/api/workitems", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<WorkItemResponseDto>();

        // Act
        var response = await userClient.GetAsync($"/api/workitems/{created!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var item = await response.Content.ReadFromJsonAsync<WorkItemResponseDto>();
        item.Should().NotBeNull();
        item!.Id.Should().Be(created.Id);
        item.Title.Should().Be("Task to View");
    }

    [Fact]
    public async Task Update_OwnedItem_Returns200OkAndUpdatesProperties()
    {
        // Arrange
        var (userClient, _) = await CreateAuthenticatedUserAsync("updater", "Updater");
        var createDto = new CreateWorkItemRequestDto(Title: "Initial Title", Description: "Initial Description");
        var createResponse = await userClient.PostAsJsonAsync("/api/workitems", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<WorkItemResponseDto>();

        var updateDto = new UpdateWorkItemRequestDto(
            Title: "Updated Title",
            Description: "Updated Description",
            Status: WorkItemStatus.Done,
            Priority: WorkItemPriority.Critical,
            DueDateUtc: DateTime.UtcNow.AddDays(1)
        );

        // Act
        var response = await userClient.PutAsJsonAsync($"/api/workitems/{created!.Id}", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<WorkItemResponseDto>();
        updated.Should().NotBeNull();
        updated!.Title.Should().Be("Updated Title");
        updated.Description.Should().Be("Updated Description");
        updated.Status.Should().Be(WorkItemStatus.Done);
        updated.Priority.Should().Be(WorkItemPriority.Critical);
        updated.UpdatedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task Delete_OwnedItem_Returns204NoContentAndRemovesFromSql()
    {
        // Arrange
        var (userClient, _) = await CreateAuthenticatedUserAsync("deleter", "Deleter");
        var createDto = new CreateWorkItemRequestDto(Title: "Item to Delete", Description: null);
        var createResponse = await userClient.PostAsJsonAsync("/api/workitems", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<WorkItemResponseDto>();

        // Act
        var deleteResponse = await userClient.DeleteAsync($"/api/workitems/{created!.Id}");

        // Assert
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify it is gone
        var getResponse = await userClient.GetAsync($"/api/workitems/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task OwnershipEnforcement_UserCannotAccessOrMutateOtherUsersWorkItem()
    {
        // Arrange
        var (userAClient, userA) = await CreateAuthenticatedUserAsync("user_a", "User A");
        var (userBClient, _) = await CreateAuthenticatedUserAsync("user_b", "User B");

        // User A creates an item
        var createDto = new CreateWorkItemRequestDto(
            Title: "User A Confidential Item",
            Description: "Secret task details"
        );
        var createResponse = await userAClient.PostAsJsonAsync("/api/workitems", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var itemA = await createResponse.Content.ReadFromJsonAsync<WorkItemResponseDto>();
        itemA.Should().NotBeNull();

        // Act & Assert 1: User B tries to GET User A's item -> 404 NotFound (does not leak existence)
        var getResponse = await userBClient.GetAsync($"/api/workitems/{itemA!.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Act & Assert 2: User B tries to PUT (update) User A's item -> 404 NotFound
        var updateDto = new UpdateWorkItemRequestDto(
            Title: "Malicious Tampering",
            Description: "Hacked",
            Status: WorkItemStatus.Done,
            Priority: WorkItemPriority.Critical,
            DueDateUtc: null
        );
        var putResponse = await userBClient.PutAsJsonAsync($"/api/workitems/{itemA.Id}", updateDto);
        putResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Act & Assert 3: User B tries to DELETE User A's item -> 404 NotFound
        var deleteResponse = await userBClient.DeleteAsync($"/api/workitems/{itemA.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Act & Assert 4: User B lists items -> User A's item is NOT in User B's list
        var listResponse = await userBClient.GetAsync("/api/workitems");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var userBItems = await listResponse.Content.ReadFromJsonAsync<List<WorkItemResponseDto>>();
        userBItems.Should().BeEmpty();

        // Verify User A can still retrieve and owns their item intact
        var verifyResponse = await userAClient.GetAsync($"/api/workitems/{itemA.Id}");
        verifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var verified = await verifyResponse.Content.ReadFromJsonAsync<WorkItemResponseDto>();
        verified!.Title.Should().Be("User A Confidential Item");
    }
}
