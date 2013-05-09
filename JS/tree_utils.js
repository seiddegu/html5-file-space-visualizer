// Author: Lou Montulli
// Derived from example code from d2.js  http://d3js.org/
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012


function recurseThroughTreeAndAddToList(subtree, list, rootName) {

	if(subtree && subtree.name) {

		var newNode = {};

		// clone the props of the obj 
		for(var i in subtree) {
			if(i != "children")
				newNode[i] = subtree[i];
		}

		if(rootName.length > 0)
			newNode.name = rootName + "/" + subtree.name;
		else
			newNode.name = subtree.name;
   		if(subtree.children != undefined) {
   			var children = subtree.children;
			//newNode.children = undefined;
	
			//console.log(newNode);
			list.push(newNode);
			//console.log(list.length);
	
			for(var i in children) {
				recurseThroughTreeAndAddToList(children[i], list, newNode.name);
			}

			//newNode.children = children;
  		}
		else
		{
			list.push(newNode);
		}
	}
}
	

// take a tree of the form:
// id:
// etc...
// children:  [ id: ***, etc...: ***, children: [ ... ]
//
// and flatten it to a list with the id properly exploded
function flattenTree(data) {

   newList = [];

   //console.log("Data in: ");
   //console.log(data);

   recurseThroughTreeAndAddToList(data, newList, "");

   //console.log("List out: ");
   //console.log(newList);
   //console.log("flattenTree is done!");

   return newList;
};


// go through the tree and remove any leaf nodes smaller than min_size
// and any parent nodes with total size with children smaller than min_size
// This makes the tree smaller 
function removeLeafNodesSmallerThan(data, min_size) {

	var totalRemoved = 0;

	for(var i=0; i < data.children.length; i++) {

		if(data.children[i].children)
		{
			// also remove parents with small subtrees
			if(data.children[i].totalSizeWithChildren < min_size)
			{
				if(data.children[i].containerCountWithChildren)
					totalRemoved += data.children[i].containerCountWithChildren;
				else
					totalRemoved++;
				data.children.splice(i, 1);  // remove this child
				i--;   // account for the splice and the for loop
			}
			else
			{
				totalRemoved += removeLeafNodesSmallerThan(data.children[i], min_size);
			}
		}
		else
		{
			// child is a leaf node
			if(data.children[i].totalSizeAtLevel < min_size)
			{
				data.children.splice(i, 1);  // remove this child
				i--;   // account for the splice and the for loop
				totalRemoved++;
			}
		}
	}

	return totalRemoved;
}


// go through the tree and remove any parent references.   These are added by d3 for certain things,
// but they cause circular references that screw up dojo
function removeParentRefs(data) {

	if(data.parent)
		data.parent = null;

	for(var i in data.children) {
	    removeParentRefs(data.children[i]);
	}
}

// go through the entire tree and unhide anything lower than the depth and hide anything
// above the given depth
// if depthToHide == -1, the whole tree is shown
function hideChildrenAtDepth( treeRoot, depthToHide )
{
	if(depthToHide == 0)
	{
		if(treeRoot.children)
		{
			treeRoot._children = treeRoot.children;
			treeRoot.children = null;
		}
		return;
	}
	else if(treeRoot._children)
	{
		// toggle this node back on if necessary
		treeRoot.children = treeRoot._children;
		treeRoot._children = null;
	}

	for(var i in treeRoot.children)
	{
		hideChildrenAtDepth( treeRoot.children[i], depthToHide-1 );
	}

	return;
}

