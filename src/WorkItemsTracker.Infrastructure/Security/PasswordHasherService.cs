using Microsoft.AspNetCore.Identity;
using WorkItemsTracker.Core.Entities;

namespace WorkItemsTracker.Infrastructure.Security;

/// <summary>
/// Provides secure password hashing using ASP.NET Core's built-in PasswordHasher,
/// which applies salted PBKDF2 with HMAC-SHA256 and 100,000 iterations.
/// </summary>
public class PasswordHasherService : IPasswordHasherService
{
    private readonly PasswordHasher<AppUser> _hasher = new();

    public string HashPassword(AppUser user, string password)
    {
        return _hasher.HashPassword(user, password);
    }

    public bool VerifyPassword(AppUser user, string password, string hashedPassword)
    {
        var result = _hasher.VerifyHashedPassword(user, hashedPassword, password);
        return result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}
