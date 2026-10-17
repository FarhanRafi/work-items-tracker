namespace WorkItemsTracker.Core.Enums;

/// <summary>
/// Represents the lifecycle status of a work item.
/// Explicit integer values are assigned to prevent database value shifts
/// if enum member names are renamed in future refactorings.
/// </summary>
public enum WorkItemStatus
{
    Todo = 1,
    InProgress = 2,
    InReview = 3,
    Done = 4,
    Blocked = 5
}
