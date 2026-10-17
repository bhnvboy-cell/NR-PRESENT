using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using NR.Presentation.Api.Data;

namespace NR.Presentation.Api.Auth;

public static class SessionHelper
{
    public const string CookieName = "nr_sess";
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(30);

    public static async Task<string?> GetUserIdAsync(HttpContext http, PresentationDbContext db)
    {
        if (!http.Request.Cookies.TryGetValue(CookieName, out var token) || string.IsNullOrWhiteSpace(token))
            return null;
        var session = await db.Sessions.FirstOrDefaultAsync(s => s.Token == token);
        if (session is null || session.ExpiresAt < DateTime.UtcNow) return null;
        return session.UserId;
    }

    public static async Task CreateAsync(PresentationDbContext db, HttpContext http, string userId)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        db.Sessions.Add(new SessionRecord
        {
            Token = token,
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.Add(Lifetime),
        });
        await db.SaveChangesAsync();
        http.Response.Cookies.Append(CookieName, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            IsEssential = true,
            Expires = DateTimeOffset.UtcNow.Add(Lifetime),
        });
    }

    public static async Task ExpireAsync(PresentationDbContext db, HttpContext http)
    {
        if (http.Request.Cookies.TryGetValue(CookieName, out var token) && !string.IsNullOrWhiteSpace(token))
        {
            var session = await db.Sessions.FirstOrDefaultAsync(s => s.Token == token);
            if (session is not null) db.Sessions.Remove(session);
            await db.SaveChangesAsync();
        }
        http.Response.Cookies.Delete(CookieName);
    }
}
