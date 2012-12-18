// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

function ZS_formatName(d, limit) { 
	if(d.totalSizeWithChildren == undefined)
		return d.name;
	else if(limit > 0 && d.name.length > limit)
		return d.name.substring(0,limit) + "...  " + formatSizeAsString(d.totalSizeWithChildren)
	else
		return d.name + "  " + formatSizeAsString(d.totalSizeWithChildren)
};

function displayZoomSunburst(location, window_size, data) {

var w = Math.min(window_size.w, window_size.h),
    h = w,
    r = w / 2,
    x = d3.scale.linear().range([0, 2 * Math.PI]),
    y = d3.scale.pow().exponent(1.3).domain([0, 1]).range([0, r]),
    p = 5,
    duration = 1000,
    color = d3.scale.category20c(),
    maxNumberOfNamesToShow = 200;


  // add some buttons if we have sizes in the data
  if(data.totalSizeWithChildren != undefined)
  {
    var buttons = d3.select(location).append("div").attr("id", "sb_buttons");
  
    buttons.html("<p>\
                 &nbsp;<button class='first active' id='equal'> \
                 &nbsp;Even Slices&nbsp;\
                 </button></button><button class='middle' id='count'> \
                 Slice By File Count\
                 </button></button><button class='last' id='size'> \
                 Slice By Size\
                 </button><p />");
  }

  var div = d3.select(location);

  var vis = div.append("svg:svg")
      .attr("width", w + p * 2)
      .attr("height", h + p * 2)
    .append("svg:g")
      .attr("transform", "translate(" + (r + p) + "," + (r + p) + ")");
      //.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

  var partition = d3.layout.partition()
      .sort(null)
      //  default size based even layout 
      .value(function(d) { return 1; });

  var arc = d3.svg.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
      .innerRadius(function(d) { return Math.max(0, d.y ? y(d.y) : d.y); })
      .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

  if(data.containerCountWithChildren > maxNumberOfNamesToShow)
	  displayNames = false;
  else
	  displayNames = true;

  var nodes = partition.nodes(data);

  //var path = vis.selectAll("path").data(nodes);
  var path = vis.data([data]).selectAll("path").data(nodes);
  var pathEnter = path.enter().append("svg:path")
      .attr("d", arc)
      .attr("id", function(d, i) { return "path-" + i; })
      .attr("fill-rule", "evenodd")
	  .attr("cursor", "pointer")
      //.style("fill", function(d) { return color((d.children ? d : d.parent).name); })
      .style("fill", function(d) { return color(d.name); })
	  .each(stash)
      .on("click", zoomClick);

  pathEnter.append("svg:title")
	.text( function(d) { return ZS_formatName(d, -1) });
  

  var text = vis.data([data]).selectAll("text").data(nodes);
  var textEnter = text.enter().append("svg:text")
      .style("opacity", 1)
      //.style("visibility", displayNames ? null : "hidden")
      .style("visibility", function (d) { return (d.dx > .03) ? null : "hidden"; })
      .style("fill", function(d) {
        return brightness(d3.rgb(colour(d))) < 125 ? "#eee" : "#000";
      })
      .attr("text-anchor", function(d) {
        return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
      })
      .attr("dy", ".2em")
      .attr("transform", function(d) {
        var multiline = (ZS_formatName(d, 20) || "").split("  ").length > 1,
            angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
            rotate = angle + (multiline ? -.5 : 0);
        return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
      })
	  .attr("cursor", "pointer")
      .on("click", zoomClick);
  textEnter.append("svg:tspan")
      .attr("x", 0)
      .text(function(d) { return d.depth ? ZS_formatName(d, 20).split("  ")[0] : ""; });
  textEnter.append("svg:tspan")
      .attr("x", 0)
      .attr("dy", "1em")
      .text(function(d) { return d.depth ? ZS_formatName(d, 20).split("  ")[1] || "" : ""; });

  function zoomClick(d) {
    if(d.containerCountWithChildren > maxNumberOfNamesToShow)
	  displayNames = false;
    else
	  displayNames = true;

    path.transition()
      .duration(duration)
      .attrTween("d", arcTweenForZoom(d));

    // Somewhat of a hack as we rely on arcTweenForZoom updating the scales.
    text
/*
      .style("visibility", function(e) {
        return (displayNames ? (isParentOf(d, e) ? null : d3.select(this).style("visibility")) : "hidden");
      })
*/
      .transition().duration(duration)
      .attrTween("text-anchor", function(d) {
        return function() {
          return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
        };
      })
      .attrTween("transform", function(d) {
        var multiline = (ZS_formatName(d, 20) || "").split("  ").length > 1;
        return function() {
          var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
              rotate = angle + (multiline ? -.5 : 0);
          return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
        };
      })
      .style("opacity", function(e) { return isParentOf(d, e) ? 1 : 1e-6; })
      .each("end", function(e) {
        d3.select(this).style("visibility", (displayNames || e.dx > .03) ? ( isParentOf(d, e) ? null : "hidden" ) : "hidden");
      });
  }


  d3.select("#size").on("click", function() {
     path
        .data(partition.value(function(d) { return d.totalSizeWithChildren; }))
        .transition()
         .duration(duration)
         .attrTween("d", arcTweenForSizeChange);

	 // hide it so it fades back in with the transition
     text.style("opacity", 0)

     text
      .transition().duration(duration*2)
      .style("opacity", 1)
      .attrTween("text-anchor", function(d) {
        return function() {
          return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
        };
      })
      .attrTween("transform", function(d) {
        var multiline = (ZS_formatName(d, 20) || "").split("  ").length > 1;
        return function() {
          var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
              rotate = angle + (multiline ? -.5 : 0);
          return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
        };
      });

     d3.select("#size").classed("active", true);
     d3.select("#equal").classed("active", false);
     d3.select("#count").classed("active", false);
   });

  d3.select("#count").on("click", function() {
     path
        .data(partition.value(function(d) { return d.itemCountAtLevel; }))
        .transition()
         .duration(duration)
         .attrTween("d", arcTweenForSizeChange);

	 // hide it so it fades back in with the transition
     text.style("opacity", 0)

     text
      .transition().duration(duration*2)
      .style("opacity", 1)
      .attrTween("text-anchor", function(d) {
        return function() {
          return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
        };
      })
      .attrTween("transform", function(d) {
        var multiline = (ZS_formatName(d, 20) || "").split("  ").length > 1;
        return function() {
          var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
              rotate = angle + (multiline ? -.5 : 0);
          return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
        };
      });

     d3.select("#size").classed("active", false);
     d3.select("#equal").classed("active", false);
     d3.select("#count").classed("active", true);
  });

  d3.select("#equal").on("click", function() {
     path
        .data(partition.value(function(d) { return 1; }))
        .transition()
         .duration(duration)
         .attrTween("d", arcTweenForSizeChange);

	 // hide it so it fades back in with the transition
     text.style("opacity", 0)

     text
      .transition().duration(duration*2)
      .style("opacity", 1)
      .attr("text-anchor", function(d) {
        return function() {
          return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
        };
      })
      .attrTween("transform", function(d) {
        var multiline = (ZS_formatName(d, 20) || "").split("  ").length > 1;
        return function() {
          var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
              rotate = angle + (multiline ? -.5 : 0);
          return "rotate(" + rotate + ")translate(" + (y(d.y) + p) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
        };
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

  function isParentOf(p, c) {
    if (p === c) return true;
    if (p.children) {
      return p.children.some(function(d) {
        return isParentOf(d, c);
      });
    }
    return false;
  }

  function colour(d) {
    /*
    if (d.children) {
      // There is a maximum of two children!
      var colours = d.children.map(colour),
          a = d3.hsl(colours[0]),
          b = d3.hsl(colours[1]);
      // L*a*b* might be better here...
      return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
    }
    return d.colour || "#fff";
    */
    return d.colour || "#999";
  }

  // Interpolate the arcs in data space.
  function arcTweenForSizeChange(a) {
    var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
    return function(t) {
      var b = i(t);
      a.x0 = b.x;
      a.dx0 = b.dx;
      return arc(b);
    };
  }

  // Interpolate the scales!
  function arcTweenForZoom(d) {
    var my = maxY(d),
        xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
        yd = d3.interpolate(y.domain(), [d.y, my]),
        yr = d3.interpolate(y.range(), [d.y ? 20 : 0, r]);
    return function(d) {
      return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
    };
  }

  function maxY(d) {
    return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
  }

  // http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
  function brightness(rgb) {
    return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
  }

}
