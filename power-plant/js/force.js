function initForceLayout(data) {
    const width = 600, height = 500;

    const svg = d3.select("#force")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "6px")
        .style("background", "white")
        .style("border", "1px solid #999")
        .style("display", "none");

    // Fuel counts
    const fuelMap = d3.rollup(data, v => v.length, d => d.fuel);
    const fuelNodes = Array.from(fuelMap, ([fuel, count]) => ({
        fuel, count, radius: Math.sqrt(count)*2
    }));

    // Force simulation
    const simulation = d3.forceSimulation(fuelNodes)
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("charge", d3.forceManyBody().strength(10))
        .force("collision", d3.forceCollide().radius(d => d.radius + 10))
        .on("tick", ticked);

    // Circles
    const circles = svg.selectAll("circle")
        .data(fuelNodes)
        .enter()
        .append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => fuelColors(d.fuel))
        .attr("opacity", 0.8)
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block").html(`<b>${d.fuel}</b><br>Plants: ${d.count}`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", event.pageX + 10 + "px")
                   .style("top", event.pageY + "px");
        })
        .on("mouseout", () => tooltip.style("display", "none"))
        .on("click", (event, d) => filterByFuel(d.fuel));

    // Labels
    const labels = svg.selectAll("text")
        .data(fuelNodes)
        .enter()
        .append("text")
        .text(d => d.fuel)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "black");

    // Legend
    const legend = svg.append("g")
        .attr("class", "force-legend")
        .attr("transform", "translate(10,10)");
    fuelNodes.forEach((d, i) => {
        const g = legend.append("g").attr("transform", `translate(0, ${i*20})`);
        g.append("circle").attr("r", 6).attr("fill", fuelColors(d.fuel)).attr("opacity", 0.8);
        g.append("text").attr("x", 15).attr("y", 4).text(d.fuel).attr("font-size", "12px").attr("fill", "black");
    });

    function ticked() {
        circles.attr("cx", d => d.x).attr("cy", d => d.y);
        labels.attr("x", d => d.x).attr("y", d => d.y + 3);
    }
}
