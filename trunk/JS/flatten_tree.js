// Author: Lou Montulli
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012


function recurseThroughTreeAndAddToList(subtree, list, rootName) {

	if(subtree && subtree.name) {

		if(rootName.length() > 0)
			subtree.name = rootName + "/" + subtree.name;
		else
			subtree.name = subtree.name;
   		if(subtree.children != undefined) {
   			var children = subtree.children;
			delete(subtree.children); // remove the prop from the object
	
			list.push(subtree);
	
			for(var i in children) {
				recurseThroughTreeAndAddToList(children[i], list, subtree.name);
			}
  		}
		else
		{
			list.push(subtree);
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

   recurseThroughTreeAndAddToList(data, newList, "");

   return newList;
};



