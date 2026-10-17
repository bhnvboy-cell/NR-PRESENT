namespace NR.Presentation.Api.Data;

public class ProjectRecord
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public string Document { get; set; } = "{}";
    public string? UserId { get; set; }
    public string? ShareToken { get; set; }
}
