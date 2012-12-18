// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

var g_w;
var g_h;
var g_data;
var g_partitionFunction;
var g_location;
var g_totalSize;

function treeMapDepthButton ( depth ) {
  hideChildrenAtDepth(g_data, depth);
  LayoutTreeMap(g_location, g_data, g_w, g_h);
}


function displayTreeMap(location, window_size, data) {

  var defaultDisplayDepth = 4;

  if(g_runBenchmark)
     defaultDisplayDepth = 4;

  d3.select(location).append("div").attr("id", "tm_buttons");

  if(data.totalSizeWithChildren != undefined)
  {
        g_hozSliderId += "0";

        d3.select("#tm_buttons").html("<table><tr>\
                <td>&nbsp;&nbsp;&nbsp;Tree Display Depth:</td>\
        <td><div id=\"" + g_hozSliderId + "\"></div>&nbsp; </td> \
                 <td> Layout: \
                 &nbsp;<button class='first' id='equal'> \
                 &nbsp;Even Slices&nbsp;\
                 </button></button><button class='middle' id='count'> \
                 Slice By File Count\
                 </button></button><button class='last active' id='size'> \
                 Slice By Size\
                 </button></td></tr></table>");

        // the default depth action  (checked above in the input tag)
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
                                                                                onChange: function(val) { treeMapDepthButton(val); }
                                                                                },
                                                                                g_hozSliderId);
        slider.startup();
        sliderRules.startup();
        sliderLabels.startup();

    // subtract the space for the controls
    var controls = document.getElementById("tm_buttons");
    if(controls && controls.offsetHeight > 0)
        window_size.h -= controls.offsetHeight;
    else
        window_size.h -= 30;
  }

  g_h = window_size.h;
  g_w = window_size.w;
  g_location = location;
  g_data = data;
  g_partitionFunction = function(d) { return d.totalSizeAtLevel ? d.totalSizeAtLevel : 1; };

  LayoutTreeMap(g_location, g_data, g_w, g_h);
}

function LayoutTreeMap(location, data, w, h) {

  d3.select("#tm_chart").remove();
  d3.select(location).append("div").attr("id", "tm_chart");

  if(data.totalSizeAtLevel)
  	g_totalSize = data.totalSizeAtLevel;
  else
	g_totalSize = 1;

  var color = d3.scale.category20c();

  var treemap = d3.layout.treemap()
	  .padding(12)
      .size([w-10, h-10])
      .sticky(true)
      .value(g_partitionFunction);
  
  var div = d3.select("#tm_chart").append("div")
      .style("position", "relative")
      .style("width", w-10 + "px")
      .style("height", h-10 + "px");
  
    div.data([data]).selectAll("div")
        .data(treemap.nodes)
       .enter().append("div")
		.attr("cursor", "pointer")
		.on("click", treeMapClick)
        .attr("class", "cell")
        //.style("background", function(d) { return d.children ? color(d.name) : null; })
        .style("background", function(d) { return color(d.name) })
        .call(cell)
        //.text(function(d) { return d.children ? null : d.name; });
        .text(function(d) { return d.name; });
  
    d3.select("#size").on("click", function() {
      g_partitionFunction = function(d) { return d.totalSizeAtLevel; };
      div.selectAll("div")
          .data(treemap.value(g_partitionFunction))
        .transition()
          .duration(1500)
          .call(cell);
  
      d3.select("#size").classed("active", true);
      d3.select("#count").classed("active", false);
      d3.select("#equal").classed("active", false);
    });
  
    d3.select("#equal").on("click", function() {
      g_partitionFunction = function(d) { return 1; };
      div.selectAll("div")
          .data(treemap.value(g_partitionFunction))
        .transition()
          .duration(1500)
          .call(cell);
  
      d3.select("#size").classed("active", false);
      d3.select("#count").classed("active", false);
      d3.select("#equal").classed("active", true);
    });

    d3.select("#count").on("click", function() {
      g_partitionFunction = function(d) { return d.itemCountAtLevel; };
      div.selectAll("div")
          .data(treemap.value(g_partitionFunction))
        .transition()
          .duration(1500)
          .call(cell);
  
      d3.select("#size").classed("active", false);
      d3.select("#count").classed("active", true);
      d3.select("#equal").classed("active", false);
    });
}
  
function cell() {
    this
        .style("left", function(d) { return d.x + "px"; })
        .style("top", function(d) { return d.y + "px"; })
        .style("width", function(d) { return d.dx - 1 + "px"; })
        .style("height", function(d) { return d.dy - 1 + "px"; });
}
  
function treeMapClick(d) {
	 setSubTreeViaId(d.id);
}
