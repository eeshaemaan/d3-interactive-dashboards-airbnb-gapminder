// ----------------------
// Scatter Plot Setup
// ----------------------
const margin = { top: 50, right: 50, bottom: 80, left: 80 };
const width = 900 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Create SVG container for scatter plot
const svg = d3.select("#scatterChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

// Group to contain all chart elements
const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Make g globally accessible for hierarchy interactions
window.g = g;

let data, years, currentYearIndex = 0;
let timer;

// ----------------------
// Load CSV Data
// ----------------------
d3.csv("data/gapminder_combined.csv").then(raw => {

    console.log("CSV LOADED:", raw);

    // Convert numeric values
    raw.forEach(d => {
        d.year = +d.year;
        d.pop = +d.pop;
        d.gdp = +d.gdp;
        d.lifeExp = +d.lifeExp;
    });

    // Save globally
    window.data = raw;
    years = [...new Set(raw.map(d => d.year))].sort((a, b) => a - b);
    window.years = years;
    window.currentYearIndex = 0;

    // ----------------------
    // Scales
    // ----------------------
    g.xScale = d3.scaleLog()
        .domain([100, d3.max(raw, d => d.gdp)])
        .range([0, width]);

    g.yScale = d3.scaleLinear()
        .domain([d3.min(raw, d => d.lifeExp) - 5, d3.max(raw, d => d.lifeExp) + 5])
        .range([height, 0]);

    g.rScale = d3.scaleSqrt()
        .domain([0, d3.max(raw, d => d.pop)])
        .range([2, 40]);

    g.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // ----------------------
    // Axes
    // ----------------------
    // Define specific ticks for log-scale X-axis
    const xTicks = [
        100, 200, 300,
        1000, 2000, 3000,
        10000, 20000, 30000,
        100000, 200000, 300000
    ];

    g.xAxis = g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(
            d3.axisBottom(g.xScale)
                .tickValues(xTicks)
                .tickFormat(d3.format("~s"))
        );

    // Rotate X-axis labels for readability
    g.xAxis.selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    g.yAxis = g.append("g")
        .call(d3.axisLeft(g.yScale));

    // ----------------------
    // Initial Draw
    // ----------------------
    draw(years[currentYearIndex]);

    // Draw choropleth if already loaded
    if (window.worldGeo) {
        updateChoropleth(years[currentYearIndex]);
    }

    // ----------------------
    // Draggable Year Slider
    // ----------------------
    const sliderWidth = 500;
    const sliderHeight = 50;
    const sliderMargin = { left: 30, right: 30 };

    // Append slider SVG
    const sliderSvg = d3.select("#controls")
        .append("svg")
        .attr("id", "yearSlider")
        .attr("width", sliderWidth)
        .attr("height", sliderHeight)
        .style("margin-top", "15px")
        .style("display", "block");

    // Scale to map slider position to years
    const xSliderScale = d3.scaleLinear()
        .domain([d3.min(years), d3.max(years)])
        .range([sliderMargin.left, sliderWidth - sliderMargin.right]);

    // Draw slider track
    sliderSvg.append("line")
        .attr("x1", sliderMargin.left)
        .attr("x2", sliderWidth - sliderMargin.right)
        .attr("y1", sliderHeight / 2)
        .attr("y2", sliderHeight / 2)
        .attr("stroke", "#ccc")
        .attr("stroke-width", 6)
        .attr("stroke-linecap", "round");

    // Draw draggable handle
    const handle = sliderSvg.append("circle")
        .attr("cx", xSliderScale(years[currentYearIndex]))
        .attr("cy", sliderHeight / 2)
        .attr("r", 10)
        .attr("fill", "#69b3a2")
        .attr("cursor", "pointer");

    // Drag behavior
    const drag = d3.drag()
        .on("start drag", (event) => {

            // Stop animation while dragging
            if (timer) {
                timer.stop();
                timer = null;
                document.getElementById("playBtn").innerText = "Play";
            }

            // Find closest year
            const yearValue = xSliderScale.invert(event.x);
            const closestYear = years.reduce((a, b) =>
                Math.abs(b - yearValue) < Math.abs(a - yearValue) ? b : a
            );
            currentYearIndex = years.indexOf(closestYear);

            // Move handle
            handle.attr("cx", xSliderScale(closestYear));

            // Update scatter plot, hierarchy, and choropleth
            draw(closestYear);
        });

    handle.call(drag);

}).catch(err => console.error("CSV load error:", err));

// ----------------------
// Draw scatter plot function
// ----------------------
function draw(year) {
    if (!window.data) return;

    const yearData = window.data.filter(d => d.year === year);

    // Update year label
    document.getElementById("yearLabel").innerText = year;

    const circles = g.selectAll("circle")
        .data(yearData, d => d.geo);

    // Remove old circles
    circles.exit().remove();

    // Enter + update
    circles.enter()
        .append("circle")
        .merge(circles)
        .transition()
        .duration(700)
        .attr("cx", d => g.xScale(d.gdp))
        .attr("cy", d => g.yScale(d.lifeExp))
        .attr("r", d => g.rScale(d.pop))
        .attr("fill", d => g.colorScale(d.Continent)) 
        .attr("opacity", 0.8);

    // Update hierarchy and choropleth
    createHierarchy(year);
    if (window.worldGeo) updateChoropleth(year);
}

// ----------------------
// Play/Pause Button
// ----------------------
document.getElementById("playBtn").onclick = () => {
    const btn = document.getElementById("playBtn");

    if (timer) {
        timer.stop();
        timer = null;
        btn.innerText = "Play";
    } else {
        btn.innerText = "Pause";
        timer = d3.interval(() => {
            currentYearIndex = (currentYearIndex + 1) % years.length;
            draw(years[currentYearIndex]);
            handle.attr("cx", d3.scaleLinear()
                .domain([d3.min(years), d3.max(years)])
                .range([30, 500 - 30])(years[currentYearIndex])
            );
        }, 1200);
    }
};
