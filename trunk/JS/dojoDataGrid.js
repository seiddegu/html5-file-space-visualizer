
dojo.require("dojox.grid.DataGrid");
dojo.require("dojo.data.ItemFileReadStore");

var g_dataGridId = "dataGrid";

function displayDojoDataGrid(location, window_size, data) {

	// restore the data
        hideChildrenAtDepth(data, -1);
        removeParentRefs(data);

	g_dataGridId += "0";

	d3.select(location).append("div").attr("id",g_dataGridId);

	var TotalSizeOfFileSystem = 1;
	var dataGrid1;

	function formatSize(value) {
		var output;
		if(value > 10000000000)
			output = (value/1000000000).toFixed(1) + " G";
		else if(value > 10000000)
			output = (value/1000000).toFixed(1) + " M";
		else if(value > 10000)
			output = (value/1000).toFixed(1) + " K";
		else
			output = value.toFixed(0) + " ";

		return output;
	}

	function formatPercent(value) {
		var rv =  (parseInt(value)/TotalSizeOfFileSystem)*100 ;
		return rv.toFixed(1) + "%";
	};

	var layout =  [
		//{ name: "File Name", field: "name",     width: "100%", formatter: formatName },
	{ name: "File Name", field: "name",     width: "100%"},
		//{ name: "type",      field: "type",     width: "60px", formatter: formatType },
	{ name: "Size in dir", field: "totalSizeAtLevel",  width: "90px", formatter: formatSize },
	{ name: "% in dir",   field: "totalSizeAtLevel",   width: "90px", formatter: formatPercent },
	{ name: "Size w/ children", field: "totalSizeWithChildren",  width: "90px", formatter: formatSize },
	{ name: "% w/ children",   field: "totalSizeWithChildren",   width: "90px", formatter: formatPercent },
	{ name: "Items", field: "itemCountAtLevel",  width: "90px", formatter: formatSize },
	{ name: "Items w/ children", field: "itemCountWithChildren",  width: "90px", formatter: formatSize },
	{ name: "Dirs w/ children", field: "containerCountWithChildren",  width: "90px", formatter: formatSize },
	];

	var noSizeLayout =  [
		{ name: "File Name", field: "name",     width: "40%"},
		{ name: "Description", field: "desc",   width: "60%" },
	];

	var our_data = {
		//identifier: 'id',
		//label: 'name',
	};

	our_data.items = flattenTree(data);

	//alert(JSON.stringify(our_data, null, 5));

	var store = new dojo.data.ItemFileReadStore({ data: our_data });

	TotalSizeOfFileSystem = parseInt(data.totalSizeWithChildren);

	dataGrid1 = new dojox.grid.DataGrid({
		query: {id: '*'},
		store: store,
		structure: (data.totalSizeWithChildren ? layout : noSizeLayout),
		height : window_size.h,
		//autoHeight: true,
		}, g_dataGridId);

	dataGrid1.startup();

	dojo.connect(window, "onresize", dataGrid1, "resize");
}

