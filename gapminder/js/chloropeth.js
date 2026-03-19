// ----------------------
// Choropleth Map Setup
// ----------------------
const mapMargin = { top: 20, right: 20, bottom: 20, left: 20 };
const mapWidth = 900 - mapMargin.left - mapMargin.right;
const mapHeight = 500 - mapMargin.top - mapMargin.bottom;

// Create SVG container
const mapSvg = d3.select("#mapChart")
    .append("svg")
    .attr("width", mapWidth + mapMargin.left + mapMargin.right)
    .attr("height", mapHeight + mapMargin.top + mapMargin.bottom);

const mapG = mapSvg.append("g")
    .attr("transform", `translate(${mapMargin.left}, ${mapMargin.top})`);

// Projection and path generator
const projection = d3.geoNaturalEarth1()
    .scale(160)
    .translate([mapWidth / 2, mapHeight / 2]);

const path = d3.geoPath().projection(projection);

// Color scale for life expectancy
const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
    .domain([30, 85]);

// Load GeoJSON world map
d3.json("data/world.geojson").then(world => {

    mapG.selectAll("path")
        .data(world.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#ccc")
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5);

    window.worldGeo = world.features;

    // Draw initial choropleth if CSV is loaded
    if (window.data) updateChoropleth(window.years[window.currentYearIndex]);

}).catch(err => console.error("GeoJSON load error:", err));

// ----------------------
// Update choropleth for a given year
// ----------------------
function updateChoropleth(year) {
    if (!window.data) return;

    const yearData = window.data.filter(d => d.year === year);

    // Map country name to life expectancy
    const lifeExpByName = {};
    yearData.forEach(d => lifeExpByName[d.name] = d.lifeExp);

    // Update colors
    mapG.selectAll("path")
        .transition()
        .duration(700)
        .attr("fill", d => {
            const val = lifeExpByName[d.properties.name];
            return val ? colorScale(val) : "#ccc";
        });
}

// ----------------------
// Zoom & Pan behavior
// ----------------------
const zoom = d3.zoom()
    .scaleExtent([1, 8]) // min 1x, max 8x zoom
    .on("zoom", (event) => {
        mapG.attr("transform", event.transform);
    });

// Attach zoom behavior to the map SVG
mapSvg.call(zoom);
