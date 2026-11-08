using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorkItemsTracker.Core.DTOs;
using WorkItemsTracker.Core.Entities;
using WorkItemsTracker.Core.Enums;
using WorkItemsTracker.Core.Services;
using WorkItemsTracker.Infrastructure.Data;

namespace WorkItemsTracker.Infrastructure.Services;

public class WorkItemService : IWorkItemService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<WorkItemService> _logger;

    public WorkItemService(AppDbContext dbContext, ILogger<WorkItemService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<IReadOnlyList<WorkItemResponseDto>> GetAllAsync(
        Guid ownerId,
        WorkItemStatus? status = null,
        WorkItemPriority? priority = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.WorkItems
            .AsNoTracking()
            .Where(w => w.OwnerId == ownerId);

        if (status.HasValue)
        {
            query = query.Where(w => w.Status == status.Value);
        }

        if (priority.HasValue)
        {
            query = query.Where(w => w.Priority == priority.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmedSearch = search.Trim();
            query = query.Where(w =>
                w.Title.Contains(trimmedSearch) ||
                (w.Description != null && w.Description.Contains(trimmedSearch)));
        }

        return await query
            .OrderByDescending(w => w.CreatedAtUtc)
            .ThenBy(w => w.Id)
            .Select(w => WorkItemResponseDto.FromEntity(w))
            .ToListAsync(cancellationToken);
    }

    public async Task<WorkItemResponseDto?> GetByIdAsync(
        Guid id,
        Guid ownerId,
        CancellationToken cancellationToken = default)
    {
        var item = await _dbContext.WorkItems
            .AsNoTracking()
            .SingleOrDefaultAsync(w => w.Id == id && w.OwnerId == ownerId, cancellationToken);

        return item is null ? null : WorkItemResponseDto.FromEntity(item);
    }

    public async Task<WorkItemResponseDto> CreateAsync(
        Guid ownerId,
        CreateWorkItemRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ArgumentException("Title cannot be empty or whitespace.", nameof(request));
        }

        var item = new WorkItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Status = request.Status,
            Priority = request.Priority,
            DueDateUtc = NormalizeUtc(request.DueDateUtc),
            CreatedAtUtc = DateTime.UtcNow,
            OwnerId = ownerId
        };

        _dbContext.WorkItems.Add(item);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return WorkItemResponseDto.FromEntity(item);
    }

    public async Task<WorkItemResponseDto?> UpdateAsync(
        Guid id,
        Guid ownerId,
        UpdateWorkItemRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ArgumentException("Title cannot be empty or whitespace.", nameof(request));
        }

        var item = await _dbContext.WorkItems
            .SingleOrDefaultAsync(w => w.Id == id && w.OwnerId == ownerId, cancellationToken);

        if (item is null)
        {
            return null;
        }

        item.Title = request.Title.Trim();
        item.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        item.Status = request.Status;
        item.Priority = request.Priority;
        item.DueDateUtc = NormalizeUtc(request.DueDateUtc);
        item.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return WorkItemResponseDto.FromEntity(item);
    }

    public async Task<bool> DeleteAsync(
        Guid id,
        Guid ownerId,
        CancellationToken cancellationToken = default)
    {
        var item = await _dbContext.WorkItems
            .SingleOrDefaultAsync(w => w.Id == id && w.OwnerId == ownerId, cancellationToken);

        if (item is null)
        {
            return false;
        }

        _dbContext.WorkItems.Remove(item);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static DateTime? NormalizeUtc(DateTime? dateTime)
    {
        if (!dateTime.HasValue)
        {
            return null;
        }

        return dateTime.Value.Kind switch
        {
            DateTimeKind.Utc => dateTime.Value,
            DateTimeKind.Local => dateTime.Value.ToUniversalTime(),
            // When kind is Unspecified, treat as UTC per the DueDateUtc contract
            _ => DateTime.SpecifyKind(dateTime.Value, DateTimeKind.Utc)
        };
    }
}

