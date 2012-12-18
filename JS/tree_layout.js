// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

		dojo.require("dijit.dijit");
		dojo.require("dijit.form.HorizontalSlider");
		dojo.require("dijit.form.HorizontalRule");
		dojo.require("dijit.form.HorizontalRuleLabels");
		dojo.require("dojo.parser");

var g_treeLayoutRoot, g_treeLayoutTree, g_treeLayoutVis, g_treeLayoutDiagonal;
var g_treeLayoutDuration = 500;
//var g_treeLayoutDuration = 0;
var g_hozSliderId = "hoz_slider";

// respond to radio buttons that change the depth of the display
function depthButton( depth ) {

	hideChildrenAtDepth(g_treeLayoutRoot, depth);
    //displayScaledTreeLayout("#tree_chart", data, w, h * scaleup_ratio );
	layoutTree(g_treeLayoutRoot);
}
	

function displayTreeLayout(location, window_size, data) {

    var w = window_size.w,
		i = 0,
		root = data,
		starting_slider_value = 2;

	// try and increase the height and width for very large data sets
    var totalItems = data.containerCountWithChildren;

    // heuristic to increase size
    var h = window_size.h;
    var scaleup_ratio = (totalItems*7 / h);


	// add buttons to allow us to scale up and down
	d3.select(location).append("div").attr("id", "tree_buttons");

	g_hozSliderId += "0";

	var tree_buttons_html = "<table><tr> \
				<td>&nbsp;&nbsp;&nbsp;Tree Display Depth:</td> \
				<td><div id=\"" + g_hozSliderId + "\"></div>&nbsp; </td> ";

	if(scaleup_ratio > 1) {
		tree_buttons_html += " \
				<td>&nbsp; &nbsp; Chart Size</td> \
				<td>&nbsp;<button class='first active' id='compact'> \
				Fit Window\
				</button></button><button class='last' id='large'> \
				&nbsp;Long&nbsp;\
				</button>\
				</td>";
	}

	
	tree_buttons_html += "</tr> </table>";

	d3.select("#tree_buttons").html(tree_buttons_html);

	// if there are a lot of items, start the slider at one to get it to render fast
    if(g_runBenchmark)
		starting_slider_value = 4;
	else if(totalItems > 2000)
		starting_slider_value = 1;
	else if(scaleup_ratio <= 1)
		starting_slider_value = 7;


	// the default depth action  (checked above in the input tag)
  	hideChildrenAtDepth( data, starting_slider_value );

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
      							value: starting_slider_value,
      							minimum: 1,
      							maximum: 7,
							discreteValues: 7,
      							intermediateChanges: true,
							showButtons:"true",
							slideDuration: 200,
      							style: "width:200px;",
      							onChange: function(val) { depthButton(val); }
							},
							g_hozSliderId);
	slider.startup();
	sliderRules.startup();
	sliderLabels.startup();

	// subtract the space for the controls
	var controls = document.getElementById("tree_buttons");
	if(controls && controls.offsetHeight > 0)
		h -= controls.offsetHeight;
	else
		h -= 30;

  	d3.select(location).append("div").attr("id", "tree_chart");

    // display the data for debug usage
    // d3.select("#tree_chart").append("xmp").attr("id", "debug").text(JSON.stringify(data, null, 5));

    displayScaledTreeLayout( "#tree_chart", data, w, h );

    d3.select("#large").on("click", function() {

        // remove old 
        document.getElementById("tree_chart").innerHTML = "";
        displayScaledTreeLayout("#tree_chart", data, w, h * scaleup_ratio );

        d3.select("#large").classed("active", true);
        d3.select("#compact").classed("active", false);
     });

     d3.select("#compact").on("click", function() {

        // remove old 
        document.getElementById("tree_chart").innerHTML = "";
        displayScaledTreeLayout("#tree_chart", data, w, h );

        d3.select("#compact").classed("active", true);
        d3.select("#large").classed("active", false);
     });
}

function displayScaledTreeLayout(location, data, w, h) {


	g_treeLayoutTree = d3.layout.tree()
			.size([h-20, w - 200]);


	g_treeLayoutDiagonal = d3.svg.diagonal()
			.projection(function(d) { return [d.y, d.x]; });

	g_treeLayoutVis = d3.select(location).append("svg:svg")
			.attr("width", w)
			.attr("height", h)
			.append("svg:g")
			.attr("transform", "translate(40,0)");

	// add start points to our data
	data.x0 = 800;
	data.y0 = 0;

	g_treeLayoutRoot = data;
	layoutTree(data);

}

function layoutTree(source) {


  // Compute the new tree layout.
  var nodes = g_treeLayoutTree.nodes(g_treeLayoutRoot).reverse();
  //console.log(nodes)
  // Update the nodes.
  	var node = g_treeLayoutVis.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

	var nodeEnter = node.enter().append("svg:g")
    	.attr("class", "node")
	.attr("cursor", "pointer")
    	.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });
    	//.style("opacity", 1e-6);
 
  // Enter any new nodes at the parent's previous position.
 
  	nodeEnter.append("svg:circle")
      //.attr("class", "node")
      //.attr("cx", function(d) { return source.x0; })
      //.attr("cy", function(d) { return source.y0; })
      .attr("r", 4.5)
      //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
      .on("click", treeLayoutClick);

	nodeEnter.append("svg:text")
      	//.attr("x", function(d) { return d._children ? -8 : 8; })
      		.attr("x", 8)
		.attr("y", "-.2em")
      	//.attr("fill","#ccc")
      	//.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
        	.on("click", treeLayoutClick)
      		.text(function(d) { return d.name + "(" + formatSizeAsString(d.totalSizeWithChildren) + ")"; })

  // Transition nodes to their new position.
	nodeEnter.transition()
		.duration(g_treeLayoutDuration)
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      	.style("opacity", 1)
      .select("circle")
    	//.attr("cx", function(d) { return d.x; })
		//.attr("cy", function(d) { return d.y; })
        .style("fill", function(d) { return d._children || d.children ? "lightgreen" : "red"; });
      
    node.transition()
      .duration(g_treeLayoutDuration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .style("opacity", 1);
    

	node.exit().transition()
      .duration(g_treeLayoutDuration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .style("opacity", 1e-6)
      .remove();
/*
	var nodeTransition = node.transition()
		.duration(g_treeLayoutDuration);
  
  nodeTransition.select("circle")
      .attr("cx", function(d) { return d.y; })
      .attr("cy", function(d) { return d.x; })
      //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
  
  nodeTransition.select("text")
      .attr("dx", function(d) { return d._children ? -8 : 8; })
	  .attr("dy", 3)
      //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#5babfc"; });

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit();
  
  nodeExit.select("circle").transition()
      .duration(g_treeLayoutDuration)
      .attr("cx", function(d) { return source.y; })
      .attr("cy", function(d) { return source.x; })
      .remove();
  
  nodeExit.select("text").transition()
      .duration(g_treeLayoutDuration)
      .remove();
*/
  // Update the links.
  var link = g_treeLayoutVis.selectAll("path.link")
      .data(g_treeLayoutTree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return g_treeLayoutDiagonal({source: o, target: o});
      })
    .transition()
      .duration(g_treeLayoutDuration)
      .attr("d", g_treeLayoutDiagonal);

  // Transition links to their new position.
  link.transition()
      .duration(g_treeLayoutDuration)
      .attr("d", g_treeLayoutDiagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(g_treeLayoutDuration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return g_treeLayoutDiagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

  // select a sub tree on click.
  function treeLayoutClick(d) {

    setSubTreeViaId(d.id);
  }


