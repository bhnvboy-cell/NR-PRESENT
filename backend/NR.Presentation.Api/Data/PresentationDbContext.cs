using Microsoft.EntityFrameworkCore;

namespace NR.Presentation.Api.Data;

public class PresentationDbContext(DbContextOptions<PresentationDbContext> options) : DbContext(options)
{
    public DbSet<ProjectRecord> Projects => Set<ProjectRecord>();
    public DbSet<UserRecord> Users => Set<UserRecord>();
    public DbSet<SessionRecord> Sessions => Set<SessionRecord>();
    public DbSet<AssetRecord> Assets => Set<AssetRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectRecord>(entity =>
        {
            entity.ToTable("projects");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(64);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(400);
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasPrecision(6);
            entity.Property(x => x.Document).HasColumnName("document").HasColumnType("jsonb");
            entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(64);
            entity.Property(x => x.ShareToken).HasColumnName("share_token").HasMaxLength(64);
            entity.HasIndex(x => x.UpdatedAt);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => x.ShareToken).IsUnique();
        });

        modelBuilder.Entity<UserRecord>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(64);
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(320);
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
            entity.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(300);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasPrecision(6);
            entity.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<SessionRecord>(entity =>
        {
            entity.ToTable("sessions");
            entity.HasKey(x => x.Token);
            entity.Property(x => x.Token).HasColumnName("token").HasMaxLength(64);
            entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(64);
            entity.Property(x => x.ExpiresAt).HasColumnName("expires_at").HasPrecision(6);
            entity.HasIndex(x => x.ExpiresAt);
        });

        modelBuilder.Entity<AssetRecord>(entity =>
        {
            entity.ToTable("assets");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasMaxLength(64);
            entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(64);
            entity.Property(x => x.ContentType).HasColumnName("content_type").HasMaxLength(100);
            entity.Property(x => x.Path).HasColumnName("path").HasMaxLength(500);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasPrecision(6);
        });
    }
}
