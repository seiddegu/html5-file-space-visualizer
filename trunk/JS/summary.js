// Author: Lou Montulli
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012


function displaySummary(location, window_size, data) {

 sumary_div = d3.select(location).append("div").attr("id", "summary_div");

 sumary_div.html("<p><br><ul><table class='summary_table' >\
	<tr>\
	<th>Summary</th><th>Value</th>\
	<tr>\
	<td>Total number of folders: &nbsp; </td>\
	<td>" + data.containerCountWithChildren + "</td>\
	</tr>\
	<tr>\
	<td>Total number of items: &nbsp; </td>\
	<td>" + data.itemCountWithChildren + "</td>\
	</tr>\
	<tr>\
	<td>Total data set size: &nbsp; </td>\
	<td>" + formatSizeAsString(data.totalSizeWithChildren) + "</td>\
	</tr>\
	<tr>\
	<td>Average file size: &nbsp; </td>\
	<td>" + formatSizeAsString(data.totalSizeWithChildren/data.itemCountWithChildren) + "</td>\
	</tr>\
	</table>\
	</ul>\
    <p style='color:orange;font-size:20px;text-align:center'>\
    Please select another visualization from the row of icons at the top of the page</p>");
/**
	<p><hr width='75%'><p>\
	<div id='help_section' style='margin: 5px 50px 0px 50px'>\
	<h2>Explaination and Help</h2>\
	This is a good spot to explain the purpose of this tool and to provide help in how to navigate\
	the UI.  (Work in progress, sample shown)\
	<p>\
	Welcome to the HTML/Javascript file system visualizer tool.   This tool runs entirely in the \
	browser and will help you visualize your file system.   You can very easily find out what \
	directories and file types are using the most space. \
	\
	<table width=500 border=0> \
	<tr> \
	<td align=middle width=50%> <h3>Visual Tree:</h3> \
	     A pictoral representation of the structure of the folder tree. \
	     Clicking on individual nodes will narrow the view of the data down \
	     to a smaller sub tree.  \
	</td> \
	<td align=middle> <IMG SRC='IMAGES/VisualTree.SVG'></td> \
	</tr> \
	<tr> \
	<td align=middle width=50%> <h3>Hierarchical List:</h3> \
	    A table layout with summary data.  (Unsortable) \
	</td> \
	<td align=middle> <IMG SRC='IMAGES/HierarchicalList.PNG'> </td> \
	</tr> \
	<tr> \
	<td align=middle width=50%> <h3>Flattened List:</h3> \
	    A table layout with summary data.  (Sortable) \
	</td> \
	<td align=middle> <IMG SRC='IMAGES/FlattenedList.PNG'> </td> \
	</tr> \
	<tr> \
	<tr> \
	<td align=middle width=50%> <h3>Zoomable Sunburst:</h3> \
	    Folders are represented as arcs on a series of concentric circles \
	    parents and children are aligned to show hierarchy. \
	</td> \
	<td align=middle> <IMG SRC='IMAGES/ZoomSunburst.SVG'> </td> \
	</tr> \
	<tr> \
	<td align=middle width=50%> <h3>Tree Map:</h3> \
	    A rectangle devided into smaller rectangles.  The area of each rectangle represents the size of each folder. \
	</td> \
	<td align=middle> <IMG SRC='IMAGES/TreeMap.PNG'> </td> \
	</tr> \
	<tr> \
	<td align=middle width=50%> <h3>Circle Pack:</h3> \
	    A nested set of circles in which the area of each circle \
	    represents the total size of the items \
	    within each folder.   Each circle is nexted within the circle of \
	    its parent folder.   Circles may appear behind other circles. \
	</td> \
	<td align=middle> <IMG SRC='IMAGES/CirclePack.SVG'> </td> \
	</tr> \
	<tr> \
	<td align=middle width=50%> <h3>Bubble Chart:</h3> \
	    An unnested set of circles in which the area of the circle represents the size of the folder. \
	</td> \
	<td align=middle> <IMG SRC='IMAGES/Bubble.SVG'> </td> \
	</tr> \
	 ");
 **/
 
} 
