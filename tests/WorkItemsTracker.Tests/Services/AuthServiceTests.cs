using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using WorkItemsTracker.Core.DTOs;
using WorkItemsTracker.Core.Entities;
using WorkItemsTracker.Infrastructure.Data;
using WorkItemsTracker.Infrastructure.Security;
using WorkItemsTracker.Infrastructure.Services;

namespace WorkItemsTracker.Tests.Services;

public class AuthServiceTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"AuthTestDb_{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ReturnsConflictResult()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var existingUser = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            FullName = "Existing User",
            PasswordHash = "hashed",
            CreatedAtUtc = DateTime.UtcNow
        };
        dbContext.Users.Add(existingUser);
        await dbContext.SaveChangesAsync();

        var hasherMock = new Mock<IPasswordHasherService>();
        var jwtMock = new Mock<IJwtTokenService>();
        var loggerMock = new Mock<ILogger<AuthService>>();

        var authService = new AuthService(dbContext, hasherMock.Object, jwtMock.Object, loggerMock.Object);
        var request = new RegisterRequestDto("TEST@EXAMPLE.COM", "Password123!", "New User");

        // Act
        var result = await authService.RegisterAsync(request);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.IsConflict.Should().BeTrue();
        result.ErrorMessage.Should().Be("An account with this email address already exists.");
        hasherMock.Verify(h => h.HashPassword(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        jwtMock.Verify(j => j.GenerateToken(It.IsAny<AppUser>()), Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_ValidRequest_HashesPasswordPersistsAndReturnsToken()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var hasherMock = new Mock<IPasswordHasherService>();
        hasherMock.Setup(h => h.HashPassword(It.IsAny<AppUser>(), "Password123!"))
                  .Returns("secure_hashed_password");

        var jwtMock = new Mock<IJwtTokenService>();
        var fakeExpiry = DateTime.UtcNow.AddMinutes(60);
        jwtMock.Setup(j => j.GenerateToken(It.IsAny<AppUser>()))
               .Returns(("fake.jwt.token", fakeExpiry));

        var loggerMock = new Mock<ILogger<AuthService>>();
        var authService = new AuthService(dbContext, hasherMock.Object, jwtMock.Object, loggerMock.Object);
        var request = new RegisterRequestDto("NewUser@Example.com", "Password123!", "New User");

        // Act
        var result = await authService.RegisterAsync(request);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Response.Should().NotBeNull();
        result.Response!.Email.Should().Be("newuser@example.com");
        result.Response.Token.Should().Be("fake.jwt.token");

        var savedUser = await dbContext.Users.SingleOrDefaultAsync(u => u.Email == "newuser@example.com");
        savedUser.Should().NotBeNull();
        savedUser!.PasswordHash.Should().Be("secure_hashed_password");
    }

    [Fact]
    public async Task LoginAsync_InvalidPassword_ReturnsFailureResult()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            FullName = "Valid User",
            PasswordHash = "real_hash",
            CreatedAtUtc = DateTime.UtcNow
        };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var hasherMock = new Mock<IPasswordHasherService>();
        hasherMock.Setup(h => h.VerifyPassword(user, "WrongPassword", "real_hash"))
                  .Returns(false);

        var jwtMock = new Mock<IJwtTokenService>();
        var loggerMock = new Mock<ILogger<AuthService>>();
        var authService = new AuthService(dbContext, hasherMock.Object, jwtMock.Object, loggerMock.Object);

        // Act
        var result = await authService.LoginAsync(new LoginRequestDto("user@example.com", "WrongPassword"));

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.ErrorMessage.Should().Be("Invalid email or password.");
        jwtMock.Verify(j => j.GenerateToken(It.IsAny<AppUser>()), Times.Never);
    }

    [Fact]
    public async Task GetUserProfileAsync_ExistingUser_ReturnsProfile()
    {
        // Arrange
        using var dbContext = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var user = new AppUser
        {
            Id = userId,
            Email = "profile@example.com",
            FullName = "Profile User",
            PasswordHash = "hash",
            CreatedAtUtc = DateTime.UtcNow
        };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var authService = new AuthService(
            dbContext,
            Mock.Of<IPasswordHasherService>(),
            Mock.Of<IJwtTokenService>(),
            Mock.Of<ILogger<AuthService>>());

        // Act
        var profile = await authService.GetUserProfileAsync(userId);

        // Assert
        profile.Should().NotBeNull();
        profile!.Id.Should().Be(userId);
        profile.Email.Should().Be("profile@example.com");
        profile.FullName.Should().Be("Profile User");
    }
}

