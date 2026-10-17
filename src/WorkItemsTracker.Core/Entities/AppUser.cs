namespace WorkItemsTracker.Core.Entities;

/// <summary>
/// Domain entity representing an authenticated user account.
/// </summary>
public class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Unique normalized email address for authentication.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// PBKDF2 with HMAC-SHA256 salted password hash.
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation collection for work items owned by this user.
    /// </summary>
    public ICollection<WorkItem> WorkItems { get; set; } = new List<WorkItem>();
}
