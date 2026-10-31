using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WorkItemsTracker.Core.Services;
using WorkItemsTracker.Infrastructure.Data;
using WorkItemsTracker.Infrastructure.Security;
using WorkItemsTracker.Infrastructure.Services;

namespace WorkItemsTracker.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseSqlServer(connectionString);
            }
        });

        // Security services
        services.AddSingleton<IPasswordHasherService, PasswordHasherService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // Application services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWorkItemService, WorkItemService>();

        return services;
    }
}
