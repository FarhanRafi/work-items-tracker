using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorkItemsTracker.Core.DTOs;
using WorkItemsTracker.Core.Entities;
using WorkItemsTracker.Core.Services;
using WorkItemsTracker.Infrastructure.Data;
using WorkItemsTracker.Infrastructure.Security;

namespace WorkItemsTracker.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext dbContext,
        IPasswordHasherService passwordHasher,
        IJwtTokenService jwtTokenService,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    public async Task<RegisterResult> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _dbContext.Users
            .AnyAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            return new RegisterResult(false, ErrorMessage: "An account with this email address already exists.", IsConflict: true);
        }

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            FullName = request.FullName.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        try
        {
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "Database unique constraint violation on registration for email {Email}", normalizedEmail);
            return new RegisterResult(false, ErrorMessage: "An account with this email address already exists.", IsConflict: true);
        }

        var (token, expiresAt) = _jwtTokenService.GenerateToken(user);

        var response = new AuthResponseDto(
            Token: token,
            UserId: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            ExpiresAtUtc: expiresAt
        );

        return new RegisterResult(true, Response: response);
    }

    public async Task<LoginResult> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .SingleOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (user is null || !_passwordHasher.VerifyPassword(user, request.Password, user.PasswordHash))
        {
            return new LoginResult(false, ErrorMessage: "Invalid email or password.");
        }

        var (token, expiresAt) = _jwtTokenService.GenerateToken(user);

        var response = new AuthResponseDto(
            Token: token,
            UserId: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            ExpiresAtUtc: expiresAt
        );

        return new LoginResult(true, Response: response);
    }

    public async Task<UserProfileDto?> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return null;
        }

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.FullName,
            user.CreatedAtUtc
        );
    }
}

