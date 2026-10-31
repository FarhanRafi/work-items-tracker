using System.ComponentModel.DataAnnotations;

namespace WorkItemsTracker.Core.DTOs;

public record RegisterRequestDto(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8), MaxLength(100)] string Password,
    [Required, MaxLength(150)] string FullName
);

public record LoginRequestDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponseDto(
    string Token,
    Guid UserId,
    string Email,
    string FullName,
    DateTime ExpiresAtUtc
);

public record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    DateTime CreatedAtUtc
);

public record RegisterResult(
    bool IsSuccess,
    AuthResponseDto? Response = null,
    string? ErrorMessage = null,
    bool IsConflict = false
);

public record LoginResult(
    bool IsSuccess,
    AuthResponseDto? Response = null,
    string? ErrorMessage = null
);
