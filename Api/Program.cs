using Api.Application;
using Api.Domain;
using Api.Infrastructure;
using Api.Shared;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configures services and middleware for the Pokémon Tournament API.
// This API simulates battles between 16 random Pokémon and returns statistics.

// Add Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to convert enums to strings
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Add API documentation services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Pokémon Tournament API",
        Version = "v1",
        Description = "API for simulating Pokémon tournaments and retrieving battle statistics"
    });
    
    // Include XML comments for better API documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Register application services
builder.Services.AddHttpClient<IPokemonApiClient, PokemonApiClient>();
builder.Services.AddScoped<BattleSimulator>();
builder.Services.AddScoped<ITournamentService, TournamentService>();

// Configure rate limiting
builder.Services.AddRateLimiter(options =>
{
    // Rejected requests default to 503; 429 tells clients to slow down rather than that the service is down
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Each policy's numbers live in the RateLimiting section of appsettings.json
builder.Services.AddFixedWindowRateLimitPolicy("TournamentPolicy");

// Configure CORS for Angular frontend (localhost:4200)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Pokémon Tournament API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAngular");

app.UseRateLimiter();

app.UseAuthorization();

app.MapControllers();

app.Run();
