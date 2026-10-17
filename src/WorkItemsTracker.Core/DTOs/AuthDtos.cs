using System.ComponentModel.DataAnnotations;

namespace WorkItemsTracker.Core.DTOs;

public record RegisterRequestDto(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8, ErrorMessage = "Password must be at least 8 characters long."), MaxLength(100)] string Password,
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
