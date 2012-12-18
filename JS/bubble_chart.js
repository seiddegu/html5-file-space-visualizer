// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

function displayBubbleChart(location, window_size, data) {

	d3.select(location).append("div").attr("id", "bc_buttons");
	d3.select(location).append("div").attr("id", "bc_chart");

	d3.select("#bc_buttons").html("<table><tr>\
                 <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Layout: \
                 &nbsp;<button class='first active' id='bubbleChart'> \
                 Bubble Chart\
                 </button></button><button class='last' id='circlePack'> \
                 Circle Pack\
                 </button></td></tr></table>");

	// subtract the space for the controls
	var controls = document.getElementById("bc_buttons");
	if(controls && controls.offsetHeight > 0)
		window_size.h -= controls.offsetHeight;
	else
		window_size.h -= 30;

	d3.select("#bubbleChart").on("click", function() {
			d3.select("#bc_chart").html("");	
			d3.select("#bubbleChart").classed("active", true);
			d3.select("#circlePack").classed("active", false);
			layoutBubbleChart("#bc_chart", window_size, data);
	});
	d3.select("#circlePack").on("click", function() {
			d3.select("#bc_chart").html("");	
			d3.select("#bubbleChart").classed("active", false);
			d3.select("#circlePack").classed("active", true);
			displayCirclePack("#bc_chart", window_size, data);
	});

	layoutBubbleChart("#bc_chart", window_size, data);
}


function layoutBubbleChart(location, window_size, data) {
  // show all nodes
  hideChildrenAtDepth(data, -1);

  var r = Math.min(window_size.w, window_size.h),
      format = d3.format(",d"),
      fill = d3.scale.category20c();
  
  var bubble = d3.layout.pack()
      .sort(null)
      .size([r, r]);

  var vis = d3.select(location).append("div").attr("id", "bubble_chart");
  
  var vis = d3.select("#bubble_chart").append("svg:svg")
      .attr("width", r)
      .attr("height", r)
      .attr("class", "bubble");
  
    var node = vis.selectAll("g.node")
        .data(bubble.nodes(classes(data))
          .filter(function(d) { return !d.children; }))
      .enter().append("svg:g")
		.on("click", bubbleClick)
        .attr("cursor", "pointer")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  
    node.append("svg:title")
        .text(function(d) { return d.className + ": " + formatSizeAsString(d.value); });
  
    node.append("svg:circle")
        .attr("r", function(d) { return d.r; })
        .style("fill", function(d) { return fill(d.packageName); });
  
    node.append("svg:text")
        .attr("text-anchor", "middle")
        .attr("dy", ".3em")
        .text(function(d) { return d.className.substring(0, d.r / 3); });
  
  // Returns a flattened hierarchy containing all leaf nodes under the root.
  function classes(root) {
    var classes = [];
  
    function recurse(name, node) {
      if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
      
	  // don't push parents
	  //else classes.push({packageName: name, className: node.name, value: (node.totalSizeAtLevel ? node.totalSizeAtLevel : 1)});
      
	  // push parents because they can have data too
      classes.push({packageName: name, className: node.name, id: node.id, value: (node.totalSizeAtLevel ? node.totalSizeAtLevel : 1)});
    }
  
    recurse(null, root);
    return {children: classes};
  }
}

function bubbleClick(d) {
     setSubTreeViaId(d.id);
}

