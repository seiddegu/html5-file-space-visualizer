// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

function displayCirclePack (location, window_size, data) {


  var w = window_size.w,
      h = window_size.h,
      format = d3.format(",d"),
      totalSize = data.totalSizeWithChildren;
  
  var pack = d3.layout.pack()
      .size([w - 4, h - 4])
      .value(function(d) { return (d.totalSizeAtLevel ? (d.totalSizeAtLevel*100/totalSize) : "1"); });

  var vis = d3.select(location).append("div").attr("id", "cp_chart");
  
  var vis = d3.select("#cp_chart").append("svg:svg")
      .attr("width", w)
      .attr("height", h)
      .attr("class", "pack")
    .append("svg:g")
      .attr("transform", "translate(2, 2)");
  
    var node = vis.data([data]).selectAll("g.node")
        .data(pack.nodes)
      .enter().append("svg:g")
		.on("click", circlePackClick)
		.attr("cursor", "pointer")
        .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  
    node.append("svg:title")
        .text(function(d) { return d.name + (d.children ? "" : ": " + formatSizeAsString(d.totalSizeAtLevel) ); });
  
    node.append("svg:circle")
        .attr("r", function(d) { return d.r; });
  
	// filter out parent nodes
    node.filter(function(d) { return !d.children; }).append("svg:text")
        .attr("text-anchor", "middle")
        .attr("dy", ".3em")
        .text(function(d) { return d.name.substring(0, d.r / 3); });
}

function circlePackClick(d) {
    setSubTreeViaId(d.id);
}
