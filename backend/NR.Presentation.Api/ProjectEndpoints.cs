using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using NR.Presentation.Api.Auth;
using NR.Presentation.Api.Data;

namespace NR.Presentation.Api;

public static class ProjectEndpoints
{
    public static void MapProjectEndpoints(this WebApplication app)
    {
        app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

        var group = app.MapGroup("/api/projects");

        // ---- shared (public, read-only) ----
        app.MapGet("/api/shared/{token}", async (string token, PresentationDbContext db) =>
        {
            var project = await db.Projects.AsNoTracking()
                .FirstOrDefaultAsync(p => p.ShareToken == token);
            if (project is null) return Results.NotFound();
            return Results.Ok(new
            {
                name = project.Name,
                updatedAt = project.UpdatedAt.ToUniversalTime().ToString("o"),
                document = JsonNode.Parse(project.Document),
            });
        });

        // ---- meta list ----
        group.MapGet("/meta", async (HttpContext http, PresentationDbContext db) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();
            var rows = await db.Projects.AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.UpdatedAt)
                .Select(x => new { id = x.Id, name = x.Name, updatedAt = x.UpdatedAt, shared = x.ShareToken != null })
                .ToListAsync();
            return Results.Ok(rows.Select(x => new
            {
                id = x.id,
                name = x.name,
                updatedAt = x.updatedAt.ToUniversalTime().ToString("o"),
                shared = x.shared,
            }));
        });

        // ---- list (full documents) ----
        group.MapGet("", async (HttpContext http, PresentationDbContext db) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();
            var rows = await db.Projects.AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.UpdatedAt)
                .ToListAsync();
            return Results.Ok(rows.Select(ToClient));
        });

        // ---- save / upsert ----
        group.MapPost("", async (SaveRequest request, HttpContext http, PresentationDbContext db) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request?.Id)) return Results.BadRequest(new { error = "Project id is required." });

            var doc = request.Document?.ToJsonString() ?? "{}";
            var now = DateTime.UtcNow;
            var existing = await db.Projects.FirstOrDefaultAsync(x => x.Id == request.Id);
            if (existing is null)
            {
                existing = new ProjectRecord { Id = request.Id!, UserId = userId };
                db.Projects.Add(existing);
            }
            else if (existing.UserId != userId)
            {
                return Results.Forbid();
            }
            existing.Name = string.IsNullOrWhiteSpace(request.Name) ? existing.Name : request.Name!;
            existing.Document = doc;
            existing.UpdatedAt = now;
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                id = existing.Id,
                name = existing.Name,
                updatedAt = existing.UpdatedAt.ToUniversalTime().ToString("o"),
                document = JsonNode.Parse(existing.Document),
            });
        });

        // ---- get ----
        group.MapGet("/{id}", async (string id, HttpContext http, PresentationDbContext db) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();
            var project = await db.Projects.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            return project is null ? Results.NotFound() : Results.Ok(ToClient(project));
        });

        // ---- delete ----
        group.MapDelete("/{id}", async (string id, HttpContext http, PresentationDbContext db) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();
            var project = await db.Projects.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (project is null) return Results.NotFound();
            db.Projects.Remove(project);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // ---- share links ----
        group.MapPost("/{id}/share", async (string id, HttpContext http, PresentationDbContext db) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();
            var project = await db.Projects.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (project is null) return Results.NotFound();
            if (project.ShareToken is null)
            {
                project.ShareToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
                await db.SaveChangesAsync();
            }
            return Results.Ok(new { token = project.ShareToken });
        });

        group.MapDelete("/{id}/share", async (string id, HttpContext http, PresentationDbContext db) =>
        {
            var userId = await SessionHelper.GetUserIdAsync(http, db);
            if (userId is null) return Results.Unauthorized();
            var project = await db.Projects.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
            if (project is null) return Results.NotFound();
            project.ShareToken = null;
            await db.SaveChangesAsync();
            return Results.Ok(new { ok = true });
        });
    }

    private static object ToClient(ProjectRecord project) => new
    {
        id = project.Id,
        name = project.Name,
        createdAt = JsonNode.Parse(project.Document)?["createdAt"]?.GetValue<string>(),
        updatedAt = project.UpdatedAt.ToUniversalTime().ToString("o"),
        document = JsonNode.Parse(project.Document),
    };

    public sealed record SaveRequest(string? Id, string? Name, JsonNode? Document);
}
