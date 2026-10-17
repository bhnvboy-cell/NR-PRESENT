using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NR.Presentation.Api.Data;

namespace NR.Presentation.Api.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapGet("/me", async (HttpContext http, PresentationDbContext db) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();
            var user = await db.Users.FindAsync(userId);
            return user is null ? Results.Unauthorized() : Results.Ok(Profile(user));
        });

        group.MapPost("/register", async (RegisterRequest request, HttpContext http, PresentationDbContext db) =>
        {
            var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
            var name = (request.Name ?? string.Empty).Trim();
            if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return Results.BadRequest(new { error = "Enter a valid email address." });
            if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 6)
                return Results.BadRequest(new { error = "Password must be at least 6 characters." });
            if (await db.Users.AnyAsync(u => u.Email == email))
                return Results.Conflict(new { error = "An account with this email already exists." });

            var user = new UserRecord
            {
                Id = NewId("usr"),
                Email = email,
                Name = string.IsNullOrEmpty(name) ? email.Split('@')[0] : name,
                PasswordHash = PasswordHasher.Hash(request.Password),
                CreatedAt = DateTime.UtcNow,
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            // Give the new account any anonymous legacy projects.
            await db.Projects.ExecuteUpdateAsync(p => p.SetProperty(x => x.UserId, user.Id));
            await SessionHelper.CreateAsync(db, http, user.Id);
            return Results.Ok(Profile(user));
        });

        group.MapPost("/login", async (LoginRequest request, HttpContext http, PresentationDbContext db) =>
        {
            var email = (request.Email ?? string.Empty).Trim().ToLowerInvariant();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null || !PasswordHasher.Verify(request.Password ?? string.Empty, user.PasswordHash))
                return Results.Unauthorized();
            await SessionHelper.CreateAsync(db, http, user.Id);
            return Results.Ok(Profile(user));
        });

        group.MapPost("/logout", async (HttpContext http, PresentationDbContext db) =>
        {
            await SessionHelper.ExpireAsync(db, http);
            return Results.Ok(new { ok = true });
        });
    }

    private static object Profile(UserRecord user) => new { id = user.Id, email = user.Email, name = user.Name };

    private static string NewId(string prefix) =>
        $"{prefix}_{Convert.ToHexString(RandomNumberGenerator.GetBytes(9)).ToLowerInvariant()}";

    public sealed record RegisterRequest(string? Email, string? Password, string? Name);
    public sealed record LoginRequest(string? Email, string? Password);
}
