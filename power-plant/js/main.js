// ----------------------
// MAIN.JS: Load, clean, and coordinate data
// ----------------------

// Step 1: Load CSV and clean data
d3.csv("global_power_plant_database.csv").then(raw => {

    const data = raw.map(d => ({
        country: d.country_long,
        lat: +d.latitude,
        lon: +d.longitude,
        fuel: d.primary_fuel,
        capacity: +d.capacity_mw,
        year: +d.commissioning_year
    }))
    .filter(d =>
        !isNaN(d.lat) &&
        !isNaN(d.lon) &&
        !isNaN(d.capacity)
    );

    console.log("Cleaned dataset:", data);

    window.globalData = data; // Make globally accessible

    // Step 2: Send data to all visualization modules
    initMap(data);          // Map visualization
    initForceLayout(data);  // Force layout for fuel types
    initTimeline(data);     // Timeline chart
});


// ----------------------
// Apply year filter from timeline brush
// ----------------------
function applyTimeFilter(minYear, maxYear) {

    const filtered = window.globalData.filter(d =>
        d.year >= minYear && d.year <= maxYear
    );

    console.log("Filtered by time:", minYear, maxYear, filtered.length, "plants");

    // --- Update map ---
    d3.select("#map").html("");  // Clear previous map
    initMap(filtered);           // Draw filtered map

    // --- Update force layout ---
    d3.select("#force").html(""); // Clear previous force layout
    initForceLayout(filtered);    // Draw updated force layout
}
