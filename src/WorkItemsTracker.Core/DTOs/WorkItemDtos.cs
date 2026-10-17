using System.ComponentModel.DataAnnotations;
using WorkItemsTracker.Core.Entities;
using WorkItemsTracker.Core.Enums;

namespace WorkItemsTracker.Core.DTOs;

public record CreateWorkItemRequestDto(
    [Required, MaxLength(200)] string Title,
    [MaxLength(4000)] string? Description,
    WorkItemStatus Status = WorkItemStatus.Todo,
    WorkItemPriority Priority = WorkItemPriority.Medium,
    DateTime? DueDateUtc = null
);

public record UpdateWorkItemRequestDto(
    [Required, MaxLength(200)] string Title,
    [MaxLength(4000)] string? Description,
    WorkItemStatus Status,
    WorkItemPriority Priority,
    DateTime? DueDateUtc
);

public record WorkItemResponseDto(
    Guid Id,
    string Title,
    string? Description,
    WorkItemStatus Status,
    WorkItemPriority Priority,
    DateTime? DueDateUtc,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    Guid OwnerId
)
{
    public static WorkItemResponseDto FromEntity(WorkItem item) =>
        new(
            item.Id,
            item.Title,
            item.Description,
            item.Status,
            item.Priority,
            item.DueDateUtc,
            item.CreatedAtUtc,
            item.UpdatedAtUtc,
            item.OwnerId
        );
}
