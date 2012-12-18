// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

function S_formatName(d, limit) {

	if(d.totalSizeAtLevel == undefined)
                return d.name;
        else if(limit > 0 && d.name.length > limit)
                return d.name.substring(0,limit) + "...  " + formatSizeAsString(d.totalSizeAtLevel) + " size " + d.itemCountAtLevel + " files";
        else
                return d.name + "  " + formatSizeAsString(d.totalSizeAtLevel) + " size " + d.itemCountAtLevel + " files";
};

var g_hozSliderID = "sunburstHozSlider";
var g_w = 1;
var g_h = 1;
var g_data;
var g_location;
var g_color;
var g_restrictNames = false;
var g_partitionFunction;

// respond to slider that changes the depth of the display
function sunDepthButton( depth ) {

    hideChildrenAtDepth(g_data, depth);
    LayoutSunburst(g_location, g_data);
}


function displaySunburst(location, window_size, data) {

  var defaultDisplayDepth = 1;

  if(g_runBenchmark)
	defaultDisplayDepth = 4;

  g_w = window_size.w,
  g_h = window_size.h,
  g_location = location;
  g_color = d3.scale.category20c();
  g_data = data;

  // default partition function returns equal size slices
  g_partitionFunction = function(d) { return 1 };  

  d3.select(location).append("div").attr("id", "sb_buttons");

  if(data.totalSizeWithChildren != undefined)
  {

	g_hozSliderId += "0";
  
 	d3.select("#sb_buttons").html("<table><tr>\
 		<td>&nbsp;&nbsp;&nbsp;Tree Display Depth:</td>\
        <td><div id=\"" + g_hozSliderId + "\"></div>&nbsp; </td> \
		 <td> Layout: \
		 &nbsp;<button class='first active' id='equal'> \
		 &nbsp;Even Slices&nbsp;\
		 </button></button><button class='middle' id='count'> \
		 Slice By File Count\
		 </button></button><button class='last' id='size'> \
		 Slice By Size\
		 </button></td></tr></table>");

	hideChildrenAtDepth( data, defaultDisplayDepth );

	var rulesNode = dojo.create("div", {}, dojo.byId(g_hozSliderId), "first");
	var sliderRules = new dijit.form.HorizontalRule({
										count:7,
										container: "topDecoration",
										style:{height:"5px"}
										}, rulesNode);
	var labelsNode = dojo.create("div", {}, dojo.byId(g_hozSliderId), "first");
	var sliderLabels = new dijit.form.HorizontalRuleLabels( {
										count: 7,
										labels: [1,2,3,4,5,6,7],
										container: "bottomDecoration",
										style:{height:"5px"}
										}, labelsNode);

	var slider = new dijit.form.HorizontalSlider({
										name: "slider",
										value: defaultDisplayDepth,
										minimum: 1,
										maximum: 7,
										discreteValues: 7,
										intermediateChanges: true,
										showButtons:"true",
										slideDuration: 200,
										style: "width:200px;",
										onChange: function(val) { sunDepthButton(val); }
										},
										g_hozSliderId);
	slider.startup();
	sliderRules.startup();
	sliderLabels.startup();

	if(data.itemCountWithChildren && data.itemCountWithChildren > 200)
     		g_restrictNames = true;

	 // subtract the space for the controls
    var controls = document.getElementById("sb_buttons");
	if(controls && controls.offsetHeight > 0)
		g_h -= controls.offsetHeight;
	else
		g_h -= 40;
  }

  LayoutSunburst(location, data);
}

function LayoutSunburst(location, data) {

  var r = Math.min(g_w, g_h) / 2;

  // clear any old data
  d3.select("#sunburstGraph").remove();

  var graphLocation = d3.select(location).append("div").attr("id", "sunburstGraph");
  var vis = graphLocation.append("svg:svg")
     .attr("width", g_w)
     .attr("height", g_h)
   .append("svg:g")
     .attr("transform", "translate(" + g_w / 2 + "," + g_h / 2 + ")");
 
  var partition = d3.layout.partition()
     .sort(null)
     .size([2 * Math.PI, r * r])
     .value(g_partitionFunction);
 
  var arc = d3.svg.arc()
     .startAngle(function(d) { return d.x; })
     .endAngle(function(d) { return d.x + d.dx; })
     .innerRadius(function(d) { return Math.sqrt(d.y); })
     .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
 
   var nodes = partition.nodes(data);

   var path = vis.data([data]).selectAll("path").data(nodes);
   var pathEnter = path.enter()
     .append("svg:path")
       .attr("d", arc)
       .attr("stroke", "#fff")
       .attr("fill", function(d) { return g_color(d.name); })
       .attr("fill-rule", "evenodd")
       .each(stash);

   pathEnter.append("svg:title")
       .text( function(d) { return S_formatName(d, -1) });

   function calcRotation( d ) {
	// don't rotate the root element, otherwise the result is 90 deg
	return  d.depth > 0 ? ( ( (d.x + d.dx / 2 - Math.PI / 2) / Math.PI ) * 180 ) : 0;
   }

   function shouldFlip(d) {
	var rotation = calcRotation(d);
	if(rotation > 90 && rotation < 270)
		return true;
   }

   var text = vis.data([data]).selectAll("text").data(nodes);
   var textEnter = text.enter()
      .append("svg:text")
	  .on("click", sunburstClick)
	  .attr("cursor", "pointer")
      .attr("transform", function(d) { 
		return "rotate(" + (shouldFlip(d) ? calcRotation(d) - 180 : calcRotation(d)) + ")"; 
		})
      .attr("x", function(d) { 
		return Math.sqrt(d.y) * ( shouldFlip(d) ? -1 : 1); 
		})
      .attr("dx", function(d) {   // margin
		// this really doesn't work in firefox since the text-anchor "end" doesn't respect dx
		return shouldFlip(d) ? "-6" : "6"; 
		})
      .attr("dy", ".35em") // vertical-align
      .attr("text-anchor", function(d) {
		return shouldFlip(d) ? "end" : "start"; 
		})
      .style("visibility", function(d) { return (g_restrictNames && d.depth > 2 ? "none" : "visible"); })
      .text(function(d) { return d.name; });
          

   d3.select("#size").on("click", function() {

     // new partition function lays out by size
     g_partitionFunction = function(d) { return d.totalSizeWithChildren; };
     path
        .data(partition.value(g_partitionFunction))
        .transition()
         .duration(1500)
         .attrTween("d", arcTween);

     text
        .transition()
         .duration(1500)
      		.attr("transform", function(d) { 
				return "rotate(" + (shouldFlip(d) ? calcRotation(d) - 180 : calcRotation(d)) + ")"; 
				})
      		.attr("x", function(d) { 
				return Math.sqrt(d.y) * ( shouldFlip(d) ? -1 : 1); 
				})
      		.attr("dx", function(d) {   // margin
				return shouldFlip(d) ? "-6" : "6"; 
				})
      		.attr("dy", ".35em") // vertical-align
      		.attr("text-anchor", function(d) {
				return shouldFlip(d) ? "end" : "start"; 
				});
 
     d3.select("#size").classed("active", true);
     d3.select("#equal").classed("active", false);
     d3.select("#count").classed("active", false);
   });
 
   d3.select("#count").on("click", function() {
     // new partition function lays out by count
     g_partitionFunction = function(d) { return d.itemCountWithChildren; };
     path
        .data(partition.value(g_partitionFunction))
        .transition()
         .duration(1500)
         .attrTween("d", arcTween);
     text
        .transition()
         .duration(1500)
      		.attr("transform", function(d) { 
				return "rotate(" + (shouldFlip(d) ? calcRotation(d) - 180 : calcRotation(d)) + ")"; 
				})
      		.attr("x", function(d) { 
				return Math.sqrt(d.y) * ( shouldFlip(d) ? -1 : 1); 
				})
      		.attr("dx", function(d) {   // margin
				return shouldFlip(d) ? "-6" : "6"; 
				})
      		.attr("dy", ".35em") // vertical-align
      		.attr("text-anchor", function(d) {
				return shouldFlip(d) ? "end" : "start"; 
				});
 

     d3.select("#size").classed("active", false);
     d3.select("#equal").classed("active", false);
     d3.select("#count").classed("active", true);
 });

   d3.select("#equal").on("click", function() {
     // new partition function lays out even slices 
     g_partitionFunction = function(d) { return 1; };
     path
        .data(partition.value(g_partitionFunction))
        .transition()
         .duration(1500)
         .attrTween("d", arcTween);
     text
        .transition()
         .duration(1500)
      		.attr("transform", function(d) { 
				return "rotate(" + (shouldFlip(d) ? calcRotation(d) - 180 : calcRotation(d)) + ")"; 
				})
      		.attr("x", function(d) { 
				return Math.sqrt(d.y) * ( shouldFlip(d) ? -1 : 1); 
				})
      		.attr("dx", function(d) {   // margin
				return shouldFlip(d) ? "-6" : "6"; 
				})
      		.attr("dy", ".35em") // vertical-align
      		.attr("text-anchor", function(d) {
				return shouldFlip(d) ? "end" : "start"; 
				});
 

     d3.select("#size").classed("active", false);
     d3.select("#count").classed("active", false);
     d3.select("#equal").classed("active", true);
 });
 
 // Stash the old values for transition.
 function stash(d) {
   d.x0 = d.x;
   d.dx0 = d.dx;
 }
 
 // Interpolate the arcs in data space.
 function arcTween(a) {
   var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
   return function(t) {
     var b = i(t);
     a.x0 = b.x;
     a.dx0 = b.dx;
     return arc(b);
   };
 }

 function sunburstClick(d) {
	setSubTreeViaId(d.id);
  }
 
} 
