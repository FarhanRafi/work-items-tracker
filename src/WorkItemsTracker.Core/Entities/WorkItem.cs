using WorkItemsTracker.Core.Enums;

namespace WorkItemsTracker.Core.Entities;

/// <summary>
/// Domain entity representing a tracked work item.
/// </summary>
public class WorkItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public WorkItemStatus Status { get; set; } = WorkItemStatus.Todo;

    public WorkItemPriority Priority { get; set; } = WorkItemPriority.Medium;

    public DateTime? DueDateUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    /// <summary>
    /// Foreign key referencing the AppUser who owns this item.
    /// Strict ownership prevents cross-tenant access.
    /// </summary>
    public Guid OwnerId { get; set; }

    public AppUser Owner { get; set; } = null!;
}
