namespace NR.Presentation.Api.Data;

public class UserRecord
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SessionRecord
{
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class AssetRecord
{
    public string Id { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string ContentType { get; set; } = "application/octet-stream";
    public string Path { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
