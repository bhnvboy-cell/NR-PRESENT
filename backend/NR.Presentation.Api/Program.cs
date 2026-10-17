using Microsoft.EntityFrameworkCore;
using NR.Presentation.Api;
using NR.Presentation.Api.Auth;
using NR.Presentation.Api.Data;

var builder = WebApplication.CreateBuilder(args);

string connectionString;
try
{
    connectionString = DatabaseBootstrapper.EnsureCreated(builder.Configuration);
}
catch (Exception ex)
{
    throw new InvalidOperationException(
        "Could not reach PostgreSQL. Check ConnectionStrings:Postgres in appsettings.json " +
        $"(host, user, password). Details: {ex.Message}",
        ex);
}

builder.Services.AddDbContext<PresentationDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins("http://localhost:5174", "http://127.0.0.1:5174")
    .AllowCredentials()
    .AllowAnyHeader()
    .AllowAnyMethod()));
builder.WebHost.ConfigureKestrel(kestrel => kestrel.Limits.MaxRequestBodySize = 100 * 1024 * 1024);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PresentationDbContext>();
    db.Database.EnsureCreated();
    SchemaMigrator.Apply(connectionString);
}

app.UseCors();
app.MapAuthEndpoints();
app.MapProjectEndpoints();
app.MapAssetEndpoints(app.Environment);

app.Run();
