
dojo.require("dojox.grid.DataGrid");
//dojo.require("dojox.grid.LazyTreeGrid");
dojo.require("dojox.grid.TreeGrid");
dojo.require("dijit.Tree");
dojo.require("dojo.data.ItemFileReadStore");

var numTimesCalled = 0;

function displayDojoTreeGrid(location, window_size, data) {

	// restore the data
	hideChildrenAtDepth(data, -1);
	removeParentRefs(data);

	ourData = dojo.clone(data);

	var treeGridDivId = "treeGridDiv" + numTimesCalled++;

	// create a div to attach the tree
	d3.select(location).append("div").attr("id", "treeGridOuterDiv").attr("class","claro");
	d3.select("#treeGridOuterDiv").append("div").attr("id", treeGridDivId);

	// display the data for debug usage
	//d3.select("#treeGridOuterDiv").append("xmp").attr("id", "debug").text(JSON.stringify(ourData, null, 5));

	var TotalSizeOfFileSystem = 1;
	var treeGrid1;

	// function to open or close a grid
	function foldingAll(state, levels) {
		// state: boolean, expand all rows if true, collapse all rows if false
		// level: integer, how many levels will be affected
		for (var i = 0; i < levels; i++) {
			var v = treeGrid1.views.views[treeGrid1.views.views.length - 1];
			for (var e in v._expandos) {
				for (var a in v._expandos[e]) {
					var expando = (v._expandos[e])[a];
					if (expando.open != state) {
						expando.setOpen(state);
					}
				}
			}
		}
	}

	function formatName(value) {
		return "<img src='icons/folder.gif'> <b>" + value + "</b>";
	};

	function formatType(value) {
		if(value == undefined)
			return "";

		if(value == "directory")
			return "<img src='icons/folder.gif'>";
		else
			return "<img src='icons/f.gif'>";
	};

	function formatPercent(value) {
		if(value == undefined)
			return "";

		var rv =  (parseInt(value)/TotalSizeOfFileSystem)*100 ;
		return rv.toFixed(1) + "%";
	};

	//dojo.ready(function(){

	var layout =  [
		{ name: "File Name", field: "name",     width: "100%"},
		//{ name: "type",      field: "type",     width: "60px", formatter: formatType },
		{ name: "Size in Dir", field: "totalSizeAtLevel",  width: "120px", formatter: formatSizeAsString },
		{ name: "Total Size", field: "totalSizeWithChildren",  width: "120px", formatter: formatSizeAsString },
		{ name: "% w/ children",   field: "totalSizeWithChildren",   width: "120px", formatter: formatPercent },
	];

	var noSizeLayout =  [
		{ name: "File Name", field: "name",     width: "100%"},
              	{ name: "Description", field: "desc",   width: "60%" },
	];

	// add the tree data to a container obj for DOJO
	our_root_data = { label: "FileList", identifier: "id" };
	our_root_data.items = [];
	our_root_data.items.push(ourData);

	//alert(JSON.stringify(ourData, null, 5));
	//alert(JSON.stringify(our_root_data, null, 5));

	var store = new dojo.data.ItemFileReadStore({ data: our_root_data });

	if(ourData.totalSizeWithChildren != undefined)
		TotalSizeOfFileSystem = parseInt(ourData.totalSizeWithChildren);


	var treeModel2 = new dijit.tree.ForestStoreModel({
		store: store,
		query: { id: ourData.id },
		rootId: 'Root2',
		rootLabel: 'Root2',
		childrenAttrs: ['children']
		});

	treeGrid1 = new dojox.grid.TreeGrid({
		treeModel: treeModel2,
		structure: (ourData.totalSizeWithChildren ? layout : noSizeLayout),
		openAtLevels: [true, false, 10],
		//expandoCell: 2
		//autoHeight: 1,
		height: window_size.h,
		}, treeGridDivId);

	treeGrid1.startup();

	dojo.connect(window, "onresize", treeGrid1, "resize");
	firstTime = 0;

	foldingAll(true, 1);

	//alert(JSON.stringify(json_data, null, 5));
}
