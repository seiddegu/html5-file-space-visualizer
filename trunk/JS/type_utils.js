// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012


// the data file for the file types is a tree.
// in order to look up file extensions quickly we need to create a reverse index and
// load it into a hash table (or something approximating a hash table)
//
// The tree looks like this:
//
//{ "name" : "all types"
//  "children" : [
//  { "name" : "media",
//    "children" : [
//        { "name" : "audio",
//                "children" : [
//                           {"name" : ".aa" , "desc" : "Audible Audio Book File" },
//       {"name" : "images",
//                "children" : [
//                { "name" : "rastor",
//                        "children" : [
//                                   {"name" : ".abm" , "desc" : "Photo Album" },
//                                   {"name" : ".afx" , "desc" : "Auto FX Photo/Graphic Edges Image" },

function create_type_reverse_index( type_tree ) {

   var index = []

   // first iterate through the tree and create a string that represents the level in the heirarchy
   create_level_string( type_tree, "");

   //alert(JSON.stringify( type_tree, null, 5 ));

   // now load all the extensions into a hash table pointing to the levelPath string
   create_index( index, type_tree );

console.log( type_tree );

   return index;
};


var g_unique_id = 1;

// use recursion to create a string at the root of each node that represents its full depth
// looks like   "/all types/media/audio"
function create_level_string( type_tree_node, root_string) {

	if(type_tree_node.id == undefined)
		type_tree_node.id = (g_unique_id++).toFixed(0);

	var count = {
	  "numContainersWithChildren" : 0,
	  "numItemsWithChildren" : 0
	};

	itemsAtThisLevel = 0;

	// only add a node name if we have children
	if(type_tree_node.children != undefined) 
	{
		var numSubChildren = 0;

		if(root_string == "")
    		type_tree_node.levelPath = type_tree_node.name;
		else
    		type_tree_node.levelPath = root_string + "/" + type_tree_node.name;

    	for(var i in type_tree_node.children) {

			// an item is anything without children
			if(type_tree_node.children[i].children == undefined)
			{
				type_tree_node.children[i].id = (g_unique_id++).toFixed(0);
				itemsAtThisLevel += 1;
				count.numItemsWithChildren += 1;
			}
			else
			{
				var subCount = create_level_string( type_tree_node.children[i], type_tree_node.levelPath );

				count.numContainersWithChildren += subCount.numContainersWithChildren;
				count.numContainersWithChildren++;  // count this one as a container
				count.numItemsWithChildren += subCount.numItemsWithChildren;
			}
    	}

		// add counts to tree
		type_tree_node.itemCountAtLevel = itemsAtThisLevel;	
		type_tree_node.itemCountWithChildren = count.numItemsWithChildren;	

		// HACK alert
		// treat all items as containers since extensions are bucket types
		//type_tree_node.containerCountWithChildren = count.numContainersWithChildren;	
		type_tree_node.containerCountWithChildren = count.numContainersWithChildren + count.numItemsWithChildren;
	}

	return count;
}

// use recursion to create a flat index of all extensions pointing to their root object
function create_index( index, type_tree_node ) {

    	for(var i in type_tree_node.children) {

			// extensions begin with "." and don't have children
			if( type_tree_node.children[i].children == undefined ) 
			{
				// point the index to the parent rather than the object itself
				// this makes it easy to get the levelPath
				index[type_tree_node.children[i].name] = type_tree_node;
			}
			else
			{
				create_index( index, type_tree_node.children[i] );
			}
    	}
}
