using Microsoft.EntityFrameworkCore;
using NR.Presentation.Api.Auth;
using NR.Presentation.Api.Data;

namespace NR.Presentation.Api;

public static class AssetEndpoints
{
    public static void MapAssetEndpoints(this WebApplication app, IWebHostEnvironment env)
    {
        var root = Path.Combine(env.ContentRootPath, "storage", "assets");
        Directory.CreateDirectory(root);

        app.MapPost("/api/assets", async (HttpContext http, PresentationDbContext db, IWebHostEnvironment env2) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();

            var contentType = http.Request.ContentType?.Split(';')[0].Trim();
            if (string.IsNullOrWhiteSpace(contentType) || !contentType.StartsWith("image/", StringComparison.Ordinal))
                return Results.BadRequest(new { error = "Only image uploads are supported." });
            if (http.Request.ContentLength is null or > 25 * 1024 * 1024)
                return Results.BadRequest(new { error = "Asset too large (max 25MB)." });

            var id = $"ast_{Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(9)).ToLowerInvariant()}";
            var filePath = Path.Combine(root, id);
            await using (var file = File.Create(filePath))
            {
                await http.Request.Body.CopyToAsync(file);
            }
            if (new FileInfo(filePath).Length == 0)
            {
                File.Delete(filePath);
                return Results.BadRequest(new { error = "Empty upload." });
            }

            db.Assets.Add(new AssetRecord
            {
                Id = id,
                UserId = userId,
                ContentType = contentType,
                Path = filePath,
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
            return Results.Ok(new { id, url = $"/api/assets/{id}" });
        });

        app.MapGet("/api/assets/{id}", async (string id, PresentationDbContext db) =>
        {
            var asset = await db.Assets.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
            if (asset is null || !File.Exists(asset.Path)) return Results.NotFound();
            return Results.File(asset.Path, asset.ContentType);
        });
    }
}
