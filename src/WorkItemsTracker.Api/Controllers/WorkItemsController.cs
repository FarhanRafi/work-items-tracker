using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkItemsTracker.Core.DTOs;
using WorkItemsTracker.Core.Entities;
using WorkItemsTracker.Core.Enums;
using WorkItemsTracker.Infrastructure.Data;

namespace WorkItemsTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkItemsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<WorkItemsController> _logger;

    public WorkItemsController(AppDbContext dbContext, ILogger<WorkItemsController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves work items owned exclusively by the authenticated user.
    /// Supports optional filtering by status, priority, and text search.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<WorkItemResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(
        [FromQuery] WorkItemStatus? status,
        [FromQuery] WorkItemPriority? priority,
        [FromQuery] string? search)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized();
        }

        var query = _dbContext.WorkItems
            .AsNoTracking()
            .Where(w => w.OwnerId == currentUserId);

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

        var items = await query
            .OrderByDescending(w => w.CreatedAtUtc)
            .Select(w => WorkItemResponseDto.FromEntity(w))
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>
    /// Retrieves a single work item by ID with strict ownership validation.
    /// Returns 404 if the item does not exist or belongs to another user.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(WorkItemResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized();
        }

        var item = await _dbContext.WorkItems
            .AsNoTracking()
            .SingleOrDefaultAsync(w => w.Id == id && w.OwnerId == currentUserId);

        if (item is null)
        {
            return NotFound();
        }

        return Ok(WorkItemResponseDto.FromEntity(item));
    }

    /// <summary>
    /// Creates a new work item owned by the authenticated user.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkItemResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateWorkItemRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized();
        }

        var item = new WorkItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Status = request.Status,
            Priority = request.Priority,
            DueDateUtc = request.DueDateUtc,
            CreatedAtUtc = DateTime.UtcNow,
            OwnerId = currentUserId
        };

        _dbContext.WorkItems.Add(item);
        await _dbContext.SaveChangesAsync();

        var responseDto = WorkItemResponseDto.FromEntity(item);

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, responseDto);
    }

    /// <summary>
    /// Updates an existing work item owned by the authenticated user.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(WorkItemResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWorkItemRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized();
        }

        var item = await _dbContext.WorkItems
            .SingleOrDefaultAsync(w => w.Id == id && w.OwnerId == currentUserId);

        if (item is null)
        {
            return NotFound();
        }

        item.Title = request.Title.Trim();
        item.Description = request.Description?.Trim();
        item.Status = request.Status;
        item.Priority = request.Priority;
        item.DueDateUtc = request.DueDateUtc;
        item.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return Ok(WorkItemResponseDto.FromEntity(item));
    }

    /// <summary>
    /// Deletes a work item owned by the authenticated user.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!TryGetCurrentUserId(out var currentUserId))
        {
            return Unauthorized();
        }

        var item = await _dbContext.WorkItems
            .SingleOrDefaultAsync(w => w.Id == id && w.OwnerId == currentUserId);

        if (item is null)
        {
            return NotFound();
        }

        _dbContext.WorkItems.Remove(item);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue("sub");
        return Guid.TryParse(claimValue, out userId);
    }
}
