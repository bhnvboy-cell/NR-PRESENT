using Npgsql;

namespace NR.Presentation.Api.Data;

/// <summary>
/// Idempotent upgrades for databases created before new tables/columns existed
/// (EnsureCreated only builds the full schema on a brand-new database).
/// </summary>
public static class SchemaMigrator
{
    private static readonly string[] Statements =
    [
        """
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            email VARCHAR(320) NOT NULL UNIQUE,
            name VARCHAR(200) NOT NULL,
            password_hash VARCHAR(300) NOT NULL,
            created_at TIMESTAMP(6) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS sessions (
            token VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TIMESTAMP(6) NOT NULL
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_sessions_expires_at ON sessions(expires_at)",
        """
        CREATE TABLE IF NOT EXISTS assets (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
            content_type VARCHAR(100) NOT NULL,
            path VARCHAR(500) NOT NULL,
            created_at TIMESTAMP(6) NOT NULL
        )
        """,
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id VARCHAR(64)",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_token VARCHAR(64)",
        "CREATE INDEX IF NOT EXISTS ix_projects_user_id ON projects(user_id)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_projects_share_token ON projects(share_token) WHERE share_token IS NOT NULL",
    ];

    public static void Apply(string connectionString)
    {
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        foreach (var sql in Statements)
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.ExecuteNonQuery();
        }
    }
}
