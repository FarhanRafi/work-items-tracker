using WorkItemsTracker.Core.Entities;

namespace WorkItemsTracker.Infrastructure.Security;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAtUtc) GenerateToken(AppUser user);
}
