using WorkItemsTracker.Core.Entities;

namespace WorkItemsTracker.Infrastructure.Security;

public interface IPasswordHasherService
{
    string HashPassword(AppUser user, string password);
    bool VerifyPassword(AppUser user, string password, string hashedPassword);
}
