function initTimeline(data) {
    const margin = {top: 20, right: 20, bottom: 30, left: 50};
    const width = 900 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select("#timeline")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Aggregate capacity per year per fuel
    const nested = d3.rollup(
        data,
        v => d3.sum(v, d => d.capacity),
        d => d.year,
        d => d.fuel
    );

    const years = Array.from(nested.keys()).sort((a,b) => a-b);

    const stackedData = years.map(year => {
        const obj = {year};
        allFuels.forEach(fuel => {
            obj[fuel] = nested.get(year)?.get(fuel) || 0;
        });
        return obj;
    });

    // Scales
    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(stackedData, d => d3.sum(allFuels, f => d[f]))]).range([height, 0]);

    // Stack generator
    const stack = d3.stack().keys(allFuels);
    const series = stack(stackedData);

    // Draw areas
    svg.selectAll(".layer")
        .data(series)
        .enter()
        .append("path")
        .attr("class", "layer")
        .attr("fill", d => fuelColors(d.key))
        .attr("opacity", 0.7)
        .attr("d", d3.area()
            .x(d => x(d.data.year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
        );

    // Axes
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("g").call(d3.axisLeft(y));

    // Brush
    const brush = d3.brushX()
        .extent([[0,0],[width,height]])
        .on("brush end", brushed);

    svg.append("g").attr("class","brush").call(brush);

    function brushed(event) {
        if(!event.selection) return;
        const [x0, x1] = event.selection;
        const minYear = Math.round(x.invert(x0));
        const maxYear = Math.round(x.invert(x1));
        applyTimeFilter(minYear, maxYear);
    }
}
