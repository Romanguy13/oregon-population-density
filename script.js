
// Margin definitions
var margin = {left: 0, right: 0, top: 0, bottom: 0 }
    width = 900,
    height = 550;


// Object to hold csv data in an organized way
var csvData = {densities: {}, states: {}, counties: {}};

// Loading csv data and storing it in an object
d3.csv("pop-density.csv", function(d) {
    csvData.densities[d["GCT_STUB.target-geo-id2"]] = d["Density per square mile of land area"];
    csvData.states[d["GCT_STUB.target-geo-id2"]] = d["GEO.display-label"];
    csvData.counties[d["GCT_STUB.target-geo-id2"]] = d["GCT_STUB.display-label"];
});

// Read and store the data from the json file
var dataUS = d3.json("us-10m.json");

// Red color scheme
var reds = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000])
    .range(d3.schemeReds[7]);
    
// Green color scheme
var greens = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000])
    .range(d3.schemeGreens[7]);

// Color array to switch between
var color = [greens, reds];

// Color scheme initially starts at green when the currColor = 0
// if currColor = 1, then the color scheme is red
var currColor = 0;

// The boarder opacity is initially 1,
// will siwtch to 0 with button click
var currBoarder = 1;
    
// Projection
var projection = d3.geoAlbers()
    .scale(4000)
    .translate([1.6*width, 1.4*height]);

// Creates the County boarder lines
var boarderPath = d3.geoPath()
    .projection(projection);
    
// Tooltip definition
var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

// Define SVG object
var svg = d3.select("body").append("svg")
    .attr("viewBox", [0, 0, width, height])
    
// Function to render everyhthing on the screen.
function render(obj) {
    // Append counties to the svg body and color them appropriately
    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(obj, obj.objects.counties).features)
        .enter()
        .append("path")
        .filter(function(d) {return csvData.states[d.id] == "Oregon";})
        .attr("fill", function(d) { return color[currColor](csvData.densities[d.id]); })
        .attr("d", boarderPath)
        .on("mouseover", d => onMouseOver(d))
        .on("mouseout", d => onMouseOut(d));

    // Creates the lines on the boarders of the counties
    var boarders = topojson.feature(obj, obj.objects.counties);
    boarders.features = boarders.features.filter(function(d) {return csvData.states[d.id] == "Oregon";});

    // Appends the boarder paths to the svg
    svg.append("path")
      .datum(boarders)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", currBoarder)
      .attr("d", boarderPath);

    // Scale for reference 
    var legend = d3.scaleSqrt()
        .domain([0, 4500])
        .rangeRound([100, 500]);

    // Append the legend
    var legendObj = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(" + width/2 + ",100)");

    // Color the legend and add the rectangle
    legendObj.selectAll("rect")
        .data(color[currColor].range().map(function(d) {
          d = color[currColor].invertExtent(d);
          if (d[0] == undefined) d[0] = 0;
          return d;
        }))
        .enter()
        .append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return legend(d[0]); })
        .attr("width", function(d) { return legend(d[1]) - legend(d[0]); })
        .attr("fill", function(d) { return color[currColor](d[0]); });

    // Add the text label to the legend
    legendObj.append("text")
        .attr("class", "caption")
        .attr("x", 0)
        .attr("y", -6)
        .attr("fill", "black")
        .attr("text-anchor", "start")
        .attr('font-size', 'large')
        .attr("font-weight", "bold")
        .text("Population per square mile");

    // Add the tick marks to the legend
    legendObj.call(d3.axisBottom(legend)
        .tickSize(15)
        .tickValues(color[currColor].domain()))
        .select(".domain")
        .remove();
}

// Function to display the tooltip on hover
function onMouseOver(d) {
    tooltip.transition().duration(100).style("opacity", 0.9);
    tooltip.html(
        `<table>
            <caption>
                Oregon
            </caption>
            <tr>
                <td class='left'>County</td>
                <td>:</td>
                <td class='right'>${csvData.counties[d.id]}</td>
            </tr>
            <tr>
                <td class='left'>Density</td>
                <td>:</td>
                <td class='right'>${csvData.densities[d.id]}</td>
            </tr>
        </table>`
    )
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY) + "px");
}

// Function to get rid of the tooltip off hover
function onMouseOut(d) {
    tooltip.transition()
    .duration(100)
    .style("opacity", 0);
}

// Function to update the color on button click
// Uses the render function to re render the state and counties
function updateColor() {
    if (currColor == 0) {
        currColor = 1;
    } else {
        currColor = 0;
    }
    dataUS.then(render);
}

// Function to Update the boarder opacity
// Uses the render function to re render the state and counties
function updateBoarder() {
    if (currBoarder == 1) {
        currBoarder = 0;
    } else {
        currBoarder = 1;
    }
    dataUS.then(render);
}

// Initial call of the render function
dataUS.then(render);
    