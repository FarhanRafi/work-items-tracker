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
}

