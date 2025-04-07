const width = 960,
    height = 500;

const svg = d3.select("#mapContainer")
    .append("svg")
    .attr("width", width + 100)  // Increased width for legend space
    .attr("height", height);

const colorScale = d3.scaleSequential(d3.interpolateGreens);

d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(world => {
    console.log("World map data loaded");

    const projection = d3.geoMercator().scale(130).translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);

    const countries = svg.selectAll("path")
        .data(world.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#f0f0f0")
        .attr("stroke", "black");

    d3.csv("region_10-2.csv").then(data => {
        console.log("Dataset loaded!");

        const yearSlider = document.getElementById("yearSlider");
        const sliderValue = document.getElementById("sliderValue");

        function updateMap(year) {
            sliderValue.textContent = year;

            const filteredData = data.filter(d => +d.iyear === +year);
            const countryIncidents = d3.rollup(filteredData, v => v.length, d => d.country_txt);

            const maxIncidents = d3.max(Array.from(countryIncidents.values()) || [1]);
            const logMax = Math.log10(maxIncidents);
            colorScale.domain([0, logMax]);

            countries.transition().duration(500)
                .attr("fill", d => {
                    let countryName = d.properties.name;
                    const incidents = countryIncidents.get(countryName) || 0;
                    return incidents > 0 ? colorScale(Math.log10(incidents)) : "#f0f0f0";
                });

            countries.on("mouseover", function (event, d) {
                const countryName = d.properties.name;
                const incidents = countryIncidents.get(countryName) || 0;
            
                d3.select("#mapTooltip").remove(); // Remove existing map tooltip
            
                d3.select("body").append("div")
                    .attr("id", "mapTooltip")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background", "#fff")
                    .style("padding", "5px")
                    .style("border", "1px solid black")
                    .style("pointer-events", "none")
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .html(`${countryName}: ${incidents} incidents`);
            }).on("mouseout", function () {
                d3.select("#mapTooltip").remove();
            });
            updateLegend(logMax);
        }

        function createLegend() {
            const legendWidth = 20, legendHeight = 200;
            const legendSvg = svg.append("g")
                .attr("id", "legend")
                .attr("transform", `translate(${width - 50}, 50)`);  // Positioned on the right

            const defs = legendSvg.append("defs");
            const linearGradient = defs.append("linearGradient")
                .attr("id", "legendGradient")
                .attr("x1", "0%").attr("y1", "100%")
                .attr("x2", "0%").attr("y2", "0%");

            linearGradient.selectAll("stop")
                .data([
                    { offset: "0%", color: colorScale(0) },
                    { offset: "100%", color: colorScale(1) }
                ])
                .enter().append("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d => d.color);

            legendSvg.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#legendGradient)")
                .style("stroke", "black");

            const legendScale = d3.scaleLinear()
                .domain([0, 1])
                .range([legendHeight, 0]);

            const legendAxis = d3.axisRight(legendScale)
                .ticks(5)
                .tickFormat(d3.format(".1f"));

            legendSvg.append("g")
                .attr("transform", `translate(${legendWidth}, 0)`)
                .call(legendAxis);
        }

        // function updateLegend(maxValue) {
        //     const legendScale = d3.scaleLinear()
        //         .domain([0, maxValue])
        //         .range([200, 0]);

        //     d3.select("#legend").select("g").call(d3.axisRight(legendScale).ticks(5).tickFormat(d3.format(".1f")));
        // }
        function updateLegend(maxValue) {
            const legendScale = d3.scaleLinear()
                .domain([0, maxValue])
                .range([200, 0]);
        
            // Creating a new scale to map the log scale to actual incident values
            const logScale = d3.scaleLog()
                .domain([1, Math.pow(10, maxValue)]) // log10(1) maps to actual incidents
                .range([200, 0]);
        
            // Update legend ticks to be powers of 10 (1, 10, 100, 1000, etc.)
            d3.select("#legend").select("g").call(d3.axisRight(logScale)
                .ticks(4, d3.format("~s"))  // Use the format to scale values to 1k, 1M, etc.
                .tickValues([1, 10, 100, 1000, 10000, 100000]) // Specify your desired values
            );
        }
        
        

        createLegend();
        yearSlider.addEventListener("input", function() {
            updateMap(+this.value);
        });

        updateMap(2019);
    }).catch(error => console.error("Error loading dataset:", error));  //error handling
}).catch(error => console.error("Error loading world map:", error));

// BAR CHART LOGIC
const barMargin = { top: 20, right: 220, bottom: 40, left: 100 },
    barWidth = 800 - barMargin.left - barMargin.right,
    barHeight = 500 - barMargin.top - barMargin.bottom;

const barSvg = d3.select("#barChart")
    .append("svg")
    .attr("width", barWidth + barMargin.left + barMargin.right)
    .attr("height", barHeight + barMargin.top + barMargin.bottom)
    .append("g")
    .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

const xScale = d3.scaleLinear().range([0, barWidth]);
const yScale = d3.scaleBand().range([barHeight, 0]).padding(0.1);
const colorScaleBar = d3.scaleSequential(d3.interpolateViridis);

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid black")
    .style("padding", "5px")
    .style("font-size", "12px");

barSvg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${barHeight})`);

barSvg.append("text")
    .attr("class", "y-axis-title")
    .attr("transform", "rotate(-90)") // Rotate to align with Y-axis
    .attr("x", -barHeight / 2) // Center vertically
    .attr("y", -barMargin.left + 80) // Adjust position to the left
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Group Names");

d3.csv("region_10-2.csv").then(data => {
    const years = Array.from(new Set(data.map(d => d.iyear))).sort();

    d3.select("#yearSelectBar")
        .selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

        function updateBarChart(year) {
            const filteredData = data.filter(d => +d.iyear === +year);
            const groupData = d3.rollup(filteredData, v => v.length, d => d.gname);
        
            let groups = Array.from(groupData, ([key, value]) => ({ group: key, count: value }))
                .sort((a, b) => b.count - a.count).filter(d => d.group !== "Unknown")
                .slice(0, 10);
        
            xScale.domain([0, d3.max(groups, d => d.count) || 1]);
            yScale.domain(groups.map(d => d.group));
        
            colorScaleBar.domain([0, d3.max(groups, d => d.count)]);
        
            barSvg.select(".x-axis").transition().duration(500).call(d3.axisBottom(xScale));

            //barSvg.select(".y-axis").transition().duration(500).call(d3.axisLeft(yScale).tickFormat("")); 
            barSvg.select(".y-axis").transition().duration(500).call(d3.axisLeft(yScale));

        
            const bars = barSvg.selectAll(".bar").data(groups, d => d.group);
        
            bars.exit().remove();
        
            // Add the bars
            bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars) // Ensures existing bars update
            .attr("x", 0)
            .attr("y", d => yScale(d.group))
            .attr("width", d => xScale(d.count))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScaleBar(d.count))
            .on("mouseover", function (event, d) {
                event.stopPropagation(); // Prevent interference from map events
                d3.select(this).attr("opacity", 0.7);

                d3.select("#barTooltip").remove(); // Remove existing tooltip
                d3.select("body").append("div")
                    .attr("id", "barTooltip")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background-color", "white")
                    .style("border", "1px solid black")
                    .style("padding", "5px")
                    .style("font-size", "12px")
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .html("Incidents: " + d.count);
            })
            .on("mouseout", function (event, d) {
                event.stopPropagation();
                d3.select(this).attr("opacity", 1);
                d3.select("#barTooltip").remove();
            });

        
            // text labels at the end of the bars
            const labels = barSvg.selectAll(".bar-label").data(groups, d => d.group);

            labels.exit().remove(); // Remove labels that are no longer needed

            labels.enter()
                .append("text")
                .attr("class", "bar-label")
                .merge(labels) 
                .transition().duration(500)
                .attr("x", d => xScale(d.count) + 5) // Position the text slightly after the bar
                .attr("y", d => yScale(d.group) + yScale.bandwidth() / 2) // Vertically center the text
                .attr("dy", ".35em") // Vertical alignment adjustment
                .text(d => `${d.group}: ${d.count}`) // Update text
                .style("font-size", "12px")
                .style("fill", "#000")
                .style("text-anchor", "start");

        }

    // Year selection change handler
    d3.select("#yearSelectBar").on("change", function() {
        updateBarChart(this.value);
    });

    // Initial chart update for the default year
    updateBarChart(2019);
}).catch(error => console.error(error));
