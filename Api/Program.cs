using Api.Application;

var builder = WebApplication.CreateBuilder(args);

/// <summary>
/// Configures services and middleware for the Pokémon Tournament API.
/// This API simulates battles between 16 random Pokémon and returns statistics.
/// </summary>

// Add essential services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register TournamentService and HttpClient
builder.Services.AddHttpClient<ITournamentService, TournamentService>();


// Configure CORS for Angular frontend (localhost:4200)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAngular");

/// <summary>
/// GET endpoint that simulates a Pokémon tournament and returns calculated statistics.
/// </summary>
app.MapGet("/pokemon/tournament/statistics", async (
    string? sortBy,
    string? sortDirection,
    ITournamentService service) =>
{
    // Validate required query parameter: sortBy
    if (string.IsNullOrWhiteSpace(sortBy))
        return Results.BadRequest(new { error = "sortBy parameter is required" });

    // Validate sort field
    var validSorts = new[] { "wins", "losses", "ties", "name", "id" };
    if (!validSorts.Contains(sortBy.ToLower()))
        return Results.BadRequest(new { error = "sortBy parameter is invalid" });

    // Validate sort direction
    if (!string.IsNullOrWhiteSpace(sortDirection))
    {
        var validDirections = new[] { "asc", "desc" };
        if (!validDirections.Contains(sortDirection.ToLower()))
            return Results.BadRequest(new { error = "sortDirection parameter is invalid" });
    }

    try
    {
        // Execute the tournament simulation service
        var result = await service.GetTournamentStatistics(sortBy, sortDirection ?? "asc");
        return Results.Ok(result);
    }
    catch (Exception)
    {
        return Results.Problem("An unexpected error occurred", statusCode: 500);
    }
})
.WithName("GetPokemonTournamentStatistics")
.WithOpenApi(op =>
{
    op.Summary = "Simulates a Pokémon tournament and returns calculated statistics.";
    op.Description = "Fetches 16 random Pokémon, simulates all-versus-all battles, and returns sorted results.";
    op.Parameters[0].Description = "Field used for sorting results (wins, losses, ties, name, id).";
    op.Parameters[1].Description = "Sorting direction (asc or desc). Defaults to asc.";
    return op;
});

app.Run();
