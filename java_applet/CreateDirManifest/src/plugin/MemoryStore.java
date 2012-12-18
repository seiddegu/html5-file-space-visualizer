//Author: Lou Montulli
//Released under the BSD License
//http://opensource.org/licenses/BSD-3-Clause
//Year: 2012

// functions to convert a manifest file to a tree structure

package plugin;

import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import com.google.gson.Gson;



public class MemoryStore {
	static private int GlobalIdCounter = 0;
	
	// a very simple struct to hold the final JSON object that we create
	// We have to create the JSON object with a very specific structure
	// and this is it
	private class JSONroot {
		@SuppressWarnings("unused")
		public FileTreeObject rootItemByType;
		@SuppressWarnings("unused")
		public FileTreeObject rootItemBySize;
		@SuppressWarnings("unused")
		public FileTreeObject rootItemByDate;
	}
	
	private class ManifestObject {
		public String name;
		public String path;
		public String type;
		public Long st_size;
		public Long st_mtime;
		
		public ManifestObject() {
			st_size = 0L;
		}
	}

	private class FileTreeObject  {

		@SuppressWarnings("unused")
		public String id;
		public String name;
		@SuppressWarnings("unused")
		public String type;
		@SuppressWarnings("unused")
		public int depth;
		public Long totalSizeAtLevel;
		public Long totalSizeWithChildren;
		@SuppressWarnings("unused")
		public int itemCountAtLevel;
		@SuppressWarnings("unused")
		public int itemCountWithChildren;
		@SuppressWarnings("unused")
		public int containerCountWithChildren;
		public ArrayList<FileTreeObject> children;
		public String levelPath;
		
		public FileTreeObject() {
			id = Integer.toString(GlobalIdCounter++);
			name = "";
			depth = 0;
			totalSizeAtLevel = 0L;
			totalSizeWithChildren = 0L;
			itemCountAtLevel = 0;
			itemCountWithChildren = 0;
			containerCountWithChildren = 0;
		}
	}
	
	
	private ManifestObject m_manObj = new ManifestObject();  // reuse the same one for memory efficiency
	private FileTreeObject m_rootNodeBySize = new FileTreeObject();
	private FileTreeObject m_rootNodeByType = new FileTreeObject();
	private FileTreeObject m_rootNodeByDate = new FileTreeObject();
	private Gson m_gson = new Gson();
	FileTreeObject m_extsTree = null;
	HashMap<String, FileTreeObject> m_extsMap = new HashMap<String, FileTreeObject>();
	
	
	public MemoryStore(String rootDirName) {
		m_rootNodeBySize.name = rootDirName;
		m_rootNodeBySize.id = "root";
		m_rootNodeBySize.depth = 0;
		m_rootNodeBySize.type = "directory";

		m_rootNodeByType.name = rootDirName;
		m_rootNodeByType.id = "root";
		m_rootNodeByType.depth = 0;
		m_rootNodeByType.type = "directory";
		
		m_rootNodeByDate.name = rootDirName;
		m_rootNodeByDate.id = "root";
		m_rootNodeByDate.depth = 0;
		m_rootNodeByDate.type = "directory";
		
		loadExts();
	}
	
	// use recursion to create a string at the root of each node that represents its full depth
	// looks like   "/all types/media/audio"
	private void create_level_string( FileTreeObject type_tree_node, String root_string) {

		// only add a node name if we have children
		if(type_tree_node.children != null && !(type_tree_node.children.isEmpty()))
		{
			if(root_string == "")
				type_tree_node.levelPath = type_tree_node.name;
			else
				type_tree_node.levelPath = root_string + "/" + type_tree_node.name;

			for( FileTreeObject i : type_tree_node.children) {

				// we only need level strings for containers (things with children)
				if(i.children != null && !(i.children.isEmpty()))
				{
					create_level_string( i, type_tree_node.levelPath );	
				}
			}
		}
	}

	// use recursion to create a flat index of all extensions pointing to their root object
	private void create_index( FileTreeObject type_tree_node ) {

		for(FileTreeObject i : type_tree_node.children) {

			// extensions begin with "." and don't have children
			if( i.children == null || i.children.isEmpty() )
			{
				// point the index to the parent rather than the object itself
				// this makes it easy to get the levelPath
				m_extsMap.put(i.name, type_tree_node);
			}
			else
			{
				create_index( i );
			}
		}
	}

	
	private void loadExts() {
		
		// load the extension data from a JSON txt file
		InputStream extStream = getClass().getResourceAsStream("all_exts.json.txt");
		if(extStream != null) {

			String extJSON = new java.util.Scanner(extStream).useDelimiter("\\A").next();   // one liner to convert stream to string

			FileTreeObject fto = new FileTreeObject();
			m_extsTree = m_gson.fromJson(extJSON, fto.getClass());
			
			if(!m_extsTree.children.isEmpty()) {
				
				// first iterate through the tree and create a string that represents the level in the hierarchy
				create_level_string(m_extsTree, "");

				// now load all the extensions into a hash table pointing to the levelPath string
				create_index( m_extsTree );
			}
		}

		//System.out.println(m_extsTree);
	}
	
	
	public String getJSONData() {
		
		JSONroot jsonroot = new JSONroot();
		//Gson gson = new GsonBuilder().setPrettyPrinting().create();
		Gson gson = new Gson();
		
		jsonroot.rootItemBySize = m_rootNodeBySize;
		jsonroot.rootItemByType = m_rootNodeByType;
		jsonroot.rootItemByDate = m_rootNodeByDate;
		
		String jsonString = gson.toJson(jsonroot);
		
		//System.out.println("jsonRoot: " + jsonString);
		
		return jsonString;
	}
	
	private void parseNameAndPathFromFullPath(String fullPath, ManifestObject manifestObject, int lengthOfPathToIgnore) {
		

		// parse out the directory name
		int index = fullPath.lastIndexOf('/');

		if(index >= lengthOfPathToIgnore)
		{
			manifestObject.path = fullPath.substring(lengthOfPathToIgnore, index);
			manifestObject.name = fullPath.substring(index + 1);
		}
		else
		{
			// look for "\" instead
			index = fullPath.lastIndexOf('\\');
			if(index >= lengthOfPathToIgnore)
			{
				manifestObject.path = fullPath.substring(lengthOfPathToIgnore, index);
				manifestObject.path = manifestObject.path.replace("\\", "/");  // convert "\" to "/"
				manifestObject.name = fullPath.substring(index + 1);
			}
			else
			{
				manifestObject.path = "";
				manifestObject.name = fullPath.substring(lengthOfPathToIgnore);
			}
		}
	}
	
	// use recursion to iterate to the correct nesting level and add the item to the array
	// this aggregates all the items into directories recording the sizes 
	private void loadFileItemInNestedFileArray(int depth, FileTreeObject fileTree, ManifestObject fileItem, List<String> directoryNestingArray)
	{
		// The directoryNestingArray represents a progressive depth.   
		// When it gets empty, we are at the right depth
		if(directoryNestingArray.size() == 0)
		{
			if(fileItem.type == "directory")
			{
				fileTree.containerCountWithChildren++;
			}
			else
			{
				fileTree.totalSizeAtLevel += fileItem.st_size;
				fileTree.totalSizeWithChildren += fileItem.st_size;
				fileTree.itemCountAtLevel++;
				fileTree.itemCountWithChildren++;
			}
		}
		else
		{
			String nextLevel = directoryNestingArray.get(0);
			directoryNestingArray.remove(nextLevel); // shift() remove first element

			FileTreeObject nextLevelObj = null;

			// since we are not pushing files, we don't want to create a children node
			// unless we are creating a directory

			// find the directory item if it exists
			if(fileTree.children == null)
			{
				fileTree.children = new ArrayList<FileTreeObject>();
			}
			else
			{
				for(FileTreeObject fto : fileTree.children)
				{
					if(fto.name.equals(nextLevel))
					{
						nextLevelObj = fto;
						break;
					}
				}
			}

			
			if( nextLevelObj == null )
			{
				nextLevelObj = new FileTreeObject();
				nextLevelObj.name = nextLevel;
				nextLevelObj.type = "directory";
				nextLevelObj.depth = depth;
				// put the item at the beginning of the list so that the next path that comes
				// through finds it right away due to locality.
				fileTree.children.add(0, nextLevelObj);
			}

			if(fileItem.type == "directory")
			{
				fileTree.containerCountWithChildren++;
			}
			else if(fileItem.type == "file")
			{
				fileTree.itemCountWithChildren++;
				fileTree.totalSizeWithChildren += fileItem.st_size;
			}
			loadFileItemInNestedFileArray(depth+1, nextLevelObj, fileItem, directoryNestingArray);
		}
	}
	
	// take a File object and return a date category
	  private String categorizeByDate(ManifestObject manObj) {

	        Date todays_date = new Date();
	        Long todays_time_t = todays_date.getTime();   // UTC returns milliseconds since the epoch
	        Long hour = 60L*60L*1000L;  // millisecs in an hour
	        Long day = hour * 24L;
	        Long week = day * 7L;
	        Long month = day * 30L;
	        Long year = day * 365L;

	        Long file_time_t = (manObj.st_mtime);

	        String category;

	        if( file_time_t == 0 ) {
	            category = "unknown date";
	  		} else if( file_time_t > todays_time_t ) {
	  			category = "Incorrect future date";
	  		} else if( file_time_t > todays_time_t - hour ) {
	            category = "within 1 year/within 1 hour";
	        } else if( file_time_t > todays_time_t - day ) {
	            category = "within 1 year/1 hour to 1 day";
	        } else if( file_time_t > todays_time_t - week ) {
	            category = "within 1 year/1 day to 1 week";
	        } else if( file_time_t > todays_time_t - month ) {
	            category = "within 1 year/1 week to 1 month";
	        } else if( file_time_t > todays_time_t - year ) {
	            category = "within 1 year/1 month to 1 year";
	        } else {  // >= year
	            Long diff = ((todays_time_t -  file_time_t) / year);
	            category = "1 year and older/" + diff + " to " + (diff+1) + " years";
	        }

	        return category;
	  }

	
	
	private void addManifestObject(ManifestObject manObj) {
		
		// Do work for type lookup using the extension
		List<String> typePathArray = null;
		
		// lookup the extension in the index and use the LevelPath to set it into the tree, instead of the dirName
		int index = manObj.name.lastIndexOf(".");
		String LevelPath = null;
		String ext = null;
		if(index > -1)
		{
			ext = manObj.name.substring(index);
			ext = ext.toLowerCase();
			FileTreeObject ext_parent_node = m_extsMap.get(ext);

			if(ext_parent_node != null) {
				LevelPath = ext_parent_node.levelPath + "/" + ext;
			}

		}

		if(LevelPath == null) {
			if(ext == null)
				LevelPath = "uncatagorized/No Extension";
			else if(ext.length() > 4)
				LevelPath = "uncatagorized/Extension_More_Than_4_Chars";
			else
				LevelPath = "uncatagorized/" + ext;
		}

		String[] typePathSplit = LevelPath.split("/");
		typePathArray = new ArrayList<String>(Arrays.asList(typePathSplit));
			

		List<String> dirNameArray = null;

		// split the directory name
		String[] dirNameSplit = null;
		if(manObj.path.length() > 0) {
			dirNameSplit = manObj.path.split("/");
		    dirNameArray = new ArrayList<String>(Arrays.asList(dirNameSplit));
		}
		else
		{
			dirNameArray = new ArrayList<String>();
		}


			
		// empty directories wont get counted correctly unless we use the whole name as the path
		if(manObj.type == "directory")
		{
			dirNameArray.add(manObj.name);
		}

		// kill empty object at the beginning (if it exists due to a leading slash)
		if(dirNameArray.size() > 0 && dirNameArray.get(0).equals(""))
			dirNameArray.remove(dirNameArray.get(0)); // shift() remove first element

		// build the type and size trees in parallel
		if(typePathArray != null)
			loadFileItemInNestedFileArray(1, m_rootNodeByType, manObj, typePathArray);
		loadFileItemInNestedFileArray(1, m_rootNodeBySize, manObj, dirNameArray);
		
		// build the Date tree as well
		String[] dateCategorySplit = categorizeByDate(manObj).split("/");
		List<String> dateCategoryArray = new ArrayList<String>(Arrays.asList(dateCategorySplit));
		loadFileItemInNestedFileArray(1, m_rootNodeByDate, manObj, dateCategoryArray);

	}

	// take a fileObj from the walker and store it in memory
	// @lengthOfPathToIgnore specifies the number of places that we should skip in the path since we are not traversing that portion.
	public void AddFileToStore(File fileObj, int lengthOfPathToIgnore) {
		
		// Turn a fileObj into a ManifestObject
		parseNameAndPathFromFullPath(fileObj.getPath(), m_manObj, lengthOfPathToIgnore);
		m_manObj.st_size = fileObj.length();
		m_manObj.st_mtime = fileObj.lastModified();
		
		if(fileObj.isDirectory())
			m_manObj.type = "directory";
		else if(fileObj.isFile())
			m_manObj.type = "file";
		else
			return;
		
		addManifestObject(m_manObj);
	}
	

	

}









