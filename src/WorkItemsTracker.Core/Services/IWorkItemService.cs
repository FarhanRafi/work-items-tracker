using WorkItemsTracker.Core.DTOs;
using WorkItemsTracker.Core.Enums;

namespace WorkItemsTracker.Core.Services;

public interface IWorkItemService
{
    Task<IReadOnlyList<WorkItemResponseDto>> GetAllAsync(
        Guid ownerId,
        WorkItemStatus? status = null,
        WorkItemPriority? priority = null,
        string? search = null,
        CancellationToken cancellationToken = default);

    Task<WorkItemResponseDto?> GetByIdAsync(
        Guid id,
        Guid ownerId,
        CancellationToken cancellationToken = default);

    Task<WorkItemResponseDto> CreateAsync(
        Guid ownerId,
        CreateWorkItemRequestDto request,
        CancellationToken cancellationToken = default);

    Task<WorkItemResponseDto?> UpdateAsync(
        Guid id,
        Guid ownerId,
        UpdateWorkItemRequestDto request,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        Guid id,
        Guid ownerId,
        CancellationToken cancellationToken = default);
}

