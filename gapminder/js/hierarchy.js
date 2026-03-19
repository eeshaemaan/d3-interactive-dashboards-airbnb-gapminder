// ----------------------
// Create Sunburst/Hierarchy
// ----------------------
function createHierarchy(year) {
    console.log("HIERARCHY CALLED FOR YEAR:", year);

    if (!window.data || window.data.length === 0) return;

    // Clear previous chart
    d3.select("#hierarchy").selectAll("*").remove();

    // Filter data for the year
    const yearData = window.data.filter(d => d.year === year);
    if (yearData.length === 0) return;

    // Dimensions
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    // Create SVG container
    const svg = d3.select("#hierarchy")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Aggregate data by continent and country
    const hierarchyData = d3.rollup(
        yearData,
        v => v.length,
        d => d.Continent || "Unknown",
        d => d.name || "Unknown"
    );

    // Convert to D3 hierarchy
    const root = d3.hierarchy({
        name: "World",
        children: Array.from(hierarchyData, ([continent, countries]) => ({
            name: continent,
            children: Array.from(countries, ([country, count]) => ({
                name: country,
                value: count
            }))
        }))
    }).sum(d => d.value);

    // Partition layout
    const partition = d3.partition().size([2 * Math.PI, radius]);
    partition(root);

    // Arc generator
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Draw arcs
    svg.selectAll("path")
        .data(root.descendants().filter(d => d.depth > 0))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "#fff")
        .on("mouseover", function(event, d) {
            if (d.depth === 1 && window.g) { // highlight continent in scatter plot
                window.g.selectAll("circle")
                    .transition().duration(200)
                    .attr("opacity", c => c.Continent === d.data.name ? 0.8 : 0.1);
            }
        })
        .on("mouseout", function() {
            if (window.g) {
                window.g.selectAll("circle")
                    .transition().duration(200)
                    .attr("opacity", 0.8);
            }
        });

    // Tooltip
    const tooltip = d3.select("#hierarchy")
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    svg.selectAll("path")
        .on("mousemove", function(event, d) {
            tooltip.style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 25 + "px")
                .style("opacity", 1)
                .html(d.data.name + (d.depth === 2 ? ` (${d.value})` : ""));
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));
}
