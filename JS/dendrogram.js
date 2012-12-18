// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

  function displayDendrogram(location, window_size, data) {


    // try and increase the height and width for very large data sets
    var totalItems = data.dirCount;

    // heuristic to increase size
    var h = window_size.h
    var scaleup_ratio = (totalItems*7) / h; 

    if(scaleup_ratio > 1) {

	// add buttons to allow us to scale up and down
   	d3.select(location).append("div").attr("id", "den_buttons");

    	d3.select("#den_buttons").html("<p>\
        	&nbsp;<button class='first active' id='compact'> \
                	Compact\
        	</button></button><button class='last' id='large'> \
                	&nbsp;Large&nbsp;\
        	</button><p />");
    }

    displayScaledDendrogram( location, window_size, data, 1 );

    d3.select("#large").on("click", function() {

	// remove old dend
	document.getElementById("dend_chart").innerHTML = "";
	displayScaledDendrogram( location, data, scaleup_ratio );

        d3.select("#large").classed("active", true);
        d3.select("#compact").classed("active", false);
     });

     d3.select("#compact").on("click", function() {

	// remove old dend
	document.getElementById("dend_chart").innerHTML = "";
	displayScaledDendrogram( location, data, 1 );

        d3.select("#compact").classed("active", true);
        d3.select("#large").classed("active", false);
     });

  }

  function displayScaledDendrogram( location, window_size, data, scaleFactor ) {

    var w = window_size.w
    var h = window_size.h * scaleFactor;

    d3.select(location).append("div").attr("id", "dend_chart");

    var cluster = d3.layout.cluster()
        .size([h - 40, w - 160]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    // load stylesheet
    var fileref=document.createElement("link");
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("href", 'http://mbostock.github.com/d3/ex/cluster.css');

    var vis = d3.select("#dend_chart").append("svg:svg")
	.attr("id", "dend_svg")
        .attr("width", w)
        .attr("height", h)
      .append("svg:g")
        .attr("transform", "translate(40, 0) scale(1,1)");

    var nodes = cluster.nodes(data);

    var link = vis.selectAll("path.link")
        .data(cluster.links(nodes))
        .enter().append("svg:path")
        .attr("class", "link")
        .attr("d", diagonal);

    var node = vis.selectAll("g.node")
        .data(nodes)
        .enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

    node.append("svg:circle")
        .attr("r", 4.5);

    node.append("svg:text")
		.attr("cursor", "pointer")
		.on("click", dendroClick)
        .attr("dx", function(d) { return d.children ? -8 : 8; })
        .attr("dy", 3)
        .attr("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) { return d.name; });
  }


  function dendroClick(d) {
  	setSubTreeViaId(d.id);
  }

