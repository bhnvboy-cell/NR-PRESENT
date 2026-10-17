using Npgsql;

namespace NR.Presentation.Api.Data;

public static class DatabaseBootstrapper
{
    public const string DatabaseName = "nr_presentation";

    public static string EnsureCreated(IConfiguration configuration)
    {
        var configured = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("Connection string 'Postgres' is missing from configuration.");

        var builder = new NpgsqlConnectionStringBuilder(configured);
        // Password is supplied via the POSTGRES_PASSWORD environment variable so it never
        // lives in appsettings.json (which gets committed). ConnectionStrings__Postgres
        // also works as a full override via standard ASP.NET Core env config.
        var envPassword = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");
        if (string.IsNullOrEmpty(builder.Password) && !string.IsNullOrEmpty(envPassword))
        {
            builder.Password = envPassword;
        }
        if (string.IsNullOrEmpty(builder.Password))
        {
            throw new InvalidOperationException(
                "Postgres password not set. Export POSTGRES_PASSWORD (or set ConnectionStrings__Postgres) before starting the API.");
        }

        var admin = new NpgsqlConnectionStringBuilder(builder.ConnectionString) { Database = "postgres" };
        var target = new NpgsqlConnectionStringBuilder(builder.ConnectionString) { Database = DatabaseName };

        using var connection = new NpgsqlConnection(admin.ConnectionString);
        connection.Open();

        using (var check = connection.CreateCommand())
        {
            check.CommandText = "SELECT 1 FROM pg_database WHERE datname = @name";
            check.Parameters.AddWithValue("name", DatabaseName);
            var exists = check.ExecuteScalar() is not null;
            if (!exists)
            {
                using var create = connection.CreateCommand();
                create.CommandText = $"CREATE DATABASE \"{DatabaseName}\"";
                create.ExecuteNonQuery();
            }
        }

        return target.ConnectionString;
    }
}
