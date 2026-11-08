using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using WorkItemsTracker.Core.DTOs;
using WorkItemsTracker.Core.Entities;
using WorkItemsTracker.Core.Enums;
using WorkItemsTracker.Infrastructure.Data;
using WorkItemsTracker.Infrastructure.Services;

namespace WorkItemsTracker.Tests.Services;

public class WorkItemServiceTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"WorkItemTestDb_{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateAsync_WhitespaceOrEmptyTitle_ThrowsArgumentException(string invalidTitle)
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());
        var request = new CreateWorkItemRequestDto(invalidTitle, "description");

        // Act & Assert
        var act = () => service.CreateAsync(Guid.NewGuid(), request);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*Title cannot be empty or whitespace*");
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_AssignsOwnerIdAndUtcTimestamps()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());
        var ownerId = Guid.NewGuid();
        var request = new CreateWorkItemRequestDto("Task Title", "Details", WorkItemStatus.Todo, WorkItemPriority.High);

        // Act
        var result = await service.CreateAsync(ownerId, request);

        // Assert
        result.Should().NotBeNull();
        result.OwnerId.Should().Be(ownerId);
        result.Title.Should().Be("Task Title");
        result.CreatedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.UpdatedAtUtc.Should().BeNull();

        var persisted = await dbContext.WorkItems.FindAsync(result.Id);
        persisted.Should().NotBeNull();
        persisted!.OwnerId.Should().Be(ownerId);
    }

    [Fact]
    public async Task GetAllAsync_OnlyReturnsItemsOwnedByRequestedUser()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        dbContext.WorkItems.AddRange(
            new WorkItem { Id = Guid.NewGuid(), Title = "Item A1", OwnerId = userA, CreatedAtUtc = DateTime.UtcNow },
            new WorkItem { Id = Guid.NewGuid(), Title = "Item A2", OwnerId = userA, CreatedAtUtc = DateTime.UtcNow },
            new WorkItem { Id = Guid.NewGuid(), Title = "Item B1", OwnerId = userB, CreatedAtUtc = DateTime.UtcNow }
        );
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var userAItems = await service.GetAllAsync(userA);
        var userBItems = await service.GetAllAsync(userB);

        // Assert
        userAItems.Should().HaveCount(2);
        userAItems.Select(x => x.Title).Should().Contain(new[] { "Item A1", "Item A2" });
        userBItems.Should().HaveCount(1);
        userBItems.Single().Title.Should().Be("Item B1");
    }

    [Fact]
    public async Task GetByIdAsync_ItemBelongsToDifferentUser_ReturnsNull()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var itemId = Guid.NewGuid();

        dbContext.WorkItems.Add(new WorkItem
        {
            Id = itemId,
            Title = "Confidential Item",
            OwnerId = ownerId,
            CreatedAtUtc = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var result = await service.GetByIdAsync(itemId, otherUserId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_ItemNotFoundOrNotOwned_ReturnsNull()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());
        var request = new UpdateWorkItemRequestDto("Updated", null, WorkItemStatus.Done, WorkItemPriority.Low, null);

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), Guid.NewGuid(), request);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ItemNotFoundOrNotOwned_ReturnsFalse()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetByIdAsync_OwnedItemExists_ReturnsDto()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var itemId = Guid.NewGuid();
        var dueDate = DateTime.UtcNow.AddDays(3);

        dbContext.WorkItems.Add(new WorkItem
        {
            Id = itemId,
            Title = "Feature Implementation",
            Description = "Detailed description",
            Status = WorkItemStatus.InProgress,
            Priority = WorkItemPriority.High,
            DueDateUtc = dueDate,
            CreatedAtUtc = DateTime.UtcNow.AddHours(-1),
            OwnerId = ownerId
        });
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var result = await service.GetByIdAsync(itemId, ownerId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(itemId);
        result.Title.Should().Be("Feature Implementation");
        result.Description.Should().Be("Detailed description");
        result.Status.Should().Be(WorkItemStatus.InProgress);
        result.Priority.Should().Be(WorkItemPriority.High);
        result.DueDateUtc.Should().Be(dueDate);
        result.OwnerId.Should().Be(ownerId);
    }

    [Fact]
    public async Task UpdateAsync_OwnedItemExists_UpdatesPropertiesAndSetsUpdatedAtUtc()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var itemId = Guid.NewGuid();
        var createdTime = DateTime.UtcNow.AddDays(-2);

        dbContext.WorkItems.Add(new WorkItem
        {
            Id = itemId,
            Title = "Original Title",
            Description = "Original Description",
            Status = WorkItemStatus.Todo,
            Priority = WorkItemPriority.Low,
            DueDateUtc = createdTime.AddDays(1),
            CreatedAtUtc = createdTime,
            OwnerId = ownerId
        });
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());
        var newDueDate = DateTime.UtcNow.AddDays(5);
        var request = new UpdateWorkItemRequestDto(
            Title: "  Updated Title  ",
            Description: "  Updated Description  ",
            Status: WorkItemStatus.Done,
            Priority: WorkItemPriority.Critical,
            DueDateUtc: newDueDate
        );

        // Act
        var result = await service.UpdateAsync(itemId, ownerId, request);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(itemId);
        result.Title.Should().Be("Updated Title");
        result.Description.Should().Be("Updated Description");
        result.Status.Should().Be(WorkItemStatus.Done);
        result.Priority.Should().Be(WorkItemPriority.Critical);
        result.DueDateUtc.Should().Be(newDueDate);
        result.CreatedAtUtc.Should().Be(createdTime);
        result.UpdatedAtUtc.Should().NotBeNull();
        result.UpdatedAtUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        var persisted = await dbContext.WorkItems.FindAsync(itemId);
        persisted.Should().NotBeNull();
        persisted!.Title.Should().Be("Updated Title");
        persisted.Description.Should().Be("Updated Description");
        persisted.Status.Should().Be(WorkItemStatus.Done);
        persisted.UpdatedAtUtc.Should().Be(result.UpdatedAtUtc);
    }

    [Fact]
    public async Task DeleteAsync_OwnedItemExists_RemovesFromDatabaseAndReturnsTrue()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var itemId = Guid.NewGuid();

        dbContext.WorkItems.Add(new WorkItem
        {
            Id = itemId,
            Title = "Item to delete",
            OwnerId = ownerId,
            CreatedAtUtc = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var result = await service.DeleteAsync(itemId, ownerId);

        // Assert
        result.Should().BeTrue();
        var persisted = await dbContext.WorkItems.FindAsync(itemId);
        persisted.Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_FilteredByStatus_ReturnsOnlyMatchingItems()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();

        dbContext.WorkItems.AddRange(
            new WorkItem { Id = Guid.NewGuid(), Title = "Item 1", Status = WorkItemStatus.Todo, OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-3) },
            new WorkItem { Id = Guid.NewGuid(), Title = "Item 2", Status = WorkItemStatus.InProgress, OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-2) },
            new WorkItem { Id = Guid.NewGuid(), Title = "Item 3", Status = WorkItemStatus.Done, OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-1) }
        );
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var items = await service.GetAllAsync(ownerId, status: WorkItemStatus.InProgress);

        // Assert
        items.Should().HaveCount(1);
        items.Single().Title.Should().Be("Item 2");
        items.Single().Status.Should().Be(WorkItemStatus.InProgress);
    }

    [Fact]
    public async Task GetAllAsync_FilteredByPriority_ReturnsOnlyMatchingItems()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();

        dbContext.WorkItems.AddRange(
            new WorkItem { Id = Guid.NewGuid(), Title = "Low Item", Priority = WorkItemPriority.Low, OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-2) },
            new WorkItem { Id = Guid.NewGuid(), Title = "High Item 1", Priority = WorkItemPriority.High, OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-1) },
            new WorkItem { Id = Guid.NewGuid(), Title = "High Item 2", Priority = WorkItemPriority.High, OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow }
        );
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var items = await service.GetAllAsync(ownerId, priority: WorkItemPriority.High);

        // Assert
        items.Should().HaveCount(2);
        items.Select(x => x.Title).Should().Contain(new[] { "High Item 1", "High Item 2" });
    }

    [Fact]
    public async Task GetAllAsync_SearchFilter_MatchesTitleAndDescription()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();

        dbContext.WorkItems.AddRange(
            new WorkItem { Id = Guid.NewGuid(), Title = "Deploy release pipeline", Description = "Clean up scripts", OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-3) },
            new WorkItem { Id = Guid.NewGuid(), Title = "Fix issue #42", Description = "Bug during release flow", OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-2) },
            new WorkItem { Id = Guid.NewGuid(), Title = "Database migration", Description = "Add indexes", OwnerId = ownerId, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-1) }
        );
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var items = await service.GetAllAsync(ownerId, search: "release");

        // Assert
        items.Should().HaveCount(2);
        items.Select(x => x.Title).Should().Contain(new[] { "Deploy release pipeline", "Fix issue #42" });
    }

    [Fact]
    public async Task GetAllAsync_StableSorting_OrdersByCreatedAtDescendingThenById()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var timestamp = new DateTime(2026, 11, 8, 12, 0, 0, DateTimeKind.Utc);

        var idA = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var idB = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var olderId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        dbContext.WorkItems.AddRange(
            new WorkItem { Id = idB, Title = "Same Timestamp B", OwnerId = ownerId, CreatedAtUtc = timestamp },
            new WorkItem { Id = idA, Title = "Same Timestamp A", OwnerId = ownerId, CreatedAtUtc = timestamp },
            new WorkItem { Id = olderId, Title = "Older Item", OwnerId = ownerId, CreatedAtUtc = timestamp.AddHours(-1) }
        );
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());

        // Act
        var items = await service.GetAllAsync(ownerId);

        // Assert
        items.Should().HaveCount(3);
        items[0].Id.Should().Be(idA);
        items[1].Id.Should().Be(idB);
        items[2].Id.Should().Be(olderId);
    }

    [Fact]
    public async Task CreateAsync_WhitespaceDescription_NormalizesToNull()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());
        var request = new CreateWorkItemRequestDto("Task Title", "   \t\n  ");

        // Act
        var result = await service.CreateAsync(Guid.NewGuid(), request);

        // Assert
        result.Description.Should().BeNull();
        var persisted = await dbContext.WorkItems.FindAsync(result.Id);
        persisted!.Description.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_WhitespaceDescription_NormalizesToNull()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var itemId = Guid.NewGuid();

        dbContext.WorkItems.Add(new WorkItem
        {
            Id = itemId,
            Title = "Existing Title",
            Description = "Has Description",
            OwnerId = ownerId,
            CreatedAtUtc = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new WorkItemService(dbContext, Mock.Of<ILogger<WorkItemService>>());
        var request = new UpdateWorkItemRequestDto("New Title", "   ", WorkItemStatus.Done, WorkItemPriority.Low, null);

        // Act
        var result = await service.UpdateAsync(itemId, ownerId, request);

        // Assert
        result.Should().NotBeNull();
        result!.Description.Should().BeNull();
        var persisted = await dbContext.WorkItems.FindAsync(itemId);
        persisted!.Description.Should().BeNull();
    }
}

