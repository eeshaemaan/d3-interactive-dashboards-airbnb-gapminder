// ----------------------
// MAP.JS: World map and power plant visualization
// ----------------------

// Tooltip for map
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("border-radius", "4px")
    .style("opacity", 0);

// Define all fuel types and assign colors dynamically
const allFuels = [
    "Hydro","Solar","Gas","Other","Oil","Wind","Nuclear","Coal",
    "Waste","Biomass","Wave and Tidal","Petcoke","Geothermal",
    "Storage","Cogeneration"
];
const fuelColors = d3.scaleOrdinal()
    .domain(allFuels)
    .range(d3.schemeTableau10.concat(d3.schemeSet3)); // ensures enough colors

// Initialize Map
function initMap(data) {

    const width = 900;
    const height = 500;

    const svg = d3.select("#map")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("width", "100%")
        .style("height", "auto");

    const projection = d3.geoNaturalEarth1()
        .scale(160)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const gMap = svg.append("g");
    const gCountryCircles = svg.append("g");
    const gPlants = svg.append("g");

    d3.json("world.geojson").then(world => {

        // Draw countries
        gMap.selectAll("path")
            .data(world.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#777");

        // Draw aggregated country bubbles
        drawCountryBubbles(gCountryCircles, projection, data);

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on("zoom", (event) => {
                gMap.attr("transform", event.transform);
                gCountryCircles.attr("transform", event.transform);
                gPlants.attr("transform", event.transform);

                if (event.transform.k > 3) {
                    gCountryCircles.style("display", "none");
                    drawPlantCircles(gPlants, projection, data);
                } else {
                    gCountryCircles.style("display", "block");
                    gPlants.selectAll("*").remove();
                }
            });

        svg.call(zoom);
    });

    // Add fuel type legend
    addMapLegend(svg);
}

// Draw aggregated country bubbles
function drawCountryBubbles(g, projection, data) {
    const countryCentroids = d3.rollup(
        data,
        v => ({
            lat: d3.mean(v, d => d.lat),
            lon: d3.mean(v, d => d.lon),
            capacity: d3.sum(v, d => d.capacity)
        }),
        d => d.country
    );

    const countryArray = Array.from(countryCentroids, ([country, d]) => ({
        country, lat: d.lat, lon: d.lon, capacity: d.capacity
    }));

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(countryArray, d => d.capacity)])
        .range([2, 20]);

    g.selectAll("circle")
        .data(countryArray)
        .enter()
        .append("circle")
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", d => radiusScale(d.capacity))
        .attr("fill", "orange")
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<strong>${d.country}</strong><br>Capacity: ${d.capacity} MW`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(200).style("opacity", 0);
        });
}

// Draw individual power plants
function drawPlantCircles(g, projection, data) {
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.capacity)])
        .range([1, 6]);

    g.selectAll("*").remove();

    g.selectAll("circle")
        .data(data, d => d.name)
        .enter()
        .append("circle")
        .attr("cx", d => projection([d.lon, d.lat])[0])
        .attr("cy", d => projection([d.lon, d.lat])[1])
        .attr("r", 0)
        .attr("fill", d => fuelColors(d.fuel))
        .attr("opacity", 0.8)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<strong>${d.name}</strong><br>${d.fuel}<br>Capacity: ${d.capacity} MW`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0))
        .transition()
        .duration(500)
        .attr("r", d => radiusScale(d.capacity));
}

// Filter map by fuel type
function filterByFuel(fuelType) {
    const filtered = window.globalData.filter(d => d.fuel === fuelType);
    const gPlants = d3.select("#map svg").select("g:nth-of-type(3)");
    const projection = d3.geoNaturalEarth1().scale(160).translate([900 / 2, 500 / 2]);
    drawPlantCircles(gPlants, projection, filtered);
}

// Legend
function addMapLegend(svg) {
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20,20)");

    allFuels.forEach((fuel, i) => {
        const g = legend.append("g").attr("transform", `translate(0, ${i*20})`);

        g.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", fuelColors(fuel))
            .attr("opacity", 0.8);

        g.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(fuel)
            .attr("font-size", "12px")
            .attr("fill", "black");
    });
}
