namespace WorkItemsTracker.Core.Enums;

/// <summary>
/// Represents the priority ranking of a work item.
/// Explicit integer values ensure stable persistence in the database.
/// </summary>
public enum WorkItemPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}
