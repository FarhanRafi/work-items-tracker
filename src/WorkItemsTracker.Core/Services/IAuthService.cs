using WorkItemsTracker.Core.DTOs;

namespace WorkItemsTracker.Core.Services;

public interface IAuthService
{
    Task<RegisterResult> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<LoginResult> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<UserProfileDto?> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);
}

