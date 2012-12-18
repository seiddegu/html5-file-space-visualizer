// Author: Lou Montulli
// Released under the BSD License
// http://opensource.org/licenses/BSD-3-Clause
// Year: 2012

  // functions to convert a manifest file to a tree structure

  var GlobalIdCounter = 0;

  var g_TypeReverseIndex = [];
  var g_ParseByType = 1;

  function formatSizeAsString(value) {
        var output;

	if(value == undefined)
		return "";
        else if(value > 10000000000)
            output = (value/1000000000).toFixed(1) + " G";
        else if(value > 10000000)
            output = (value/1000000).toFixed(1) + " M";
        else if(value > 10000)
            output = (value/1000).toFixed(1) + " K";
        else
            output = value.toFixed(0) + " ";

        return output;
  }

  
  function createFileArrayObject()
  {
  	var fileArray = {};
  	fileArray.id = (GlobalIdCounter++).toString();
  	fileArray.name = "";
  	fileArray.totalSizeAtLevel = 0;
  	fileArray.totalSizeWithChildren = 0;
  	fileArray.itemCountAtLevel = 0;
  	fileArray.itemCountWithChildren = 0;
  	fileArray.containerCountWithChildren = 0;

  	return fileArray;
  }

  // ReadProgress class
  function ProgressClass(bar_element, status_element) {

	var my_progress_bar = document.querySelector(bar_element);
	var my_status_element = status_element;

  	this.start = function() {
    	// Reset progress indicator on new file selection.
    	if(my_progress_bar) {
    		my_progress_bar.style.width = '0%';
    		my_progress_bar.textContent = '0%';
  			setTimeout("document.getElementById(\'" + my_status_element + "\').className='loading';", 2000);
		}
  	};

	// called when the file starts loading
	this.loading = function() {
        document.getElementById('read_progress_bar').className = 'loading';
	};

    this.updateFileEvent = function(evt) {
      // evt is an ProgressEvent.
      if (evt.lengthComputable) {
        var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
        // Increase the progress bar length.
        if (percentLoaded < 100) {
          my_progress_bar.style.width = percentLoaded + '%';
          my_progress_bar.textContent = percentLoaded + '%';
        }
      }
    };

    this.updateManual = function(progress, total) {
        var percentLoaded = Math.round((progress / total) * 100);
        // Increase the progress bar length.
        if (percentLoaded < 100) {
          my_progress_bar.style.width = percentLoaded + '%';
          my_progress_bar.textContent = percentLoaded + '%';
        }
    };

    this.end = function() {
        // Ensure that the progress bar displays 100% at the end.
        if(my_progress_bar) {
        	my_progress_bar.style.width = '100%';
        	my_progress_bar.textContent = '100%';
  			setTimeout("document.getElementById(\'" + my_status_element + "\').className='';", 2000);
		}
    };
  }
 
  var g_ReadProgress = new ProgressClass('.read_percent', 'read_progress_bar');
  var g_ParseProgress = new ProgressClass('.parse_percent', 'parse_progress_bar');

  // parse a manifest line and return the requested data in an object
  function parseItem(item) {

	//var includeFilter = ["name", "st_size", "st_ctime", "st_mtime", "st_mode", "type"];
	var includeFilter = ["name", "st_size", "st_mtime", "type"];
	var dirName;
	elements = item.split(",");

		// parse elements into associative array, throw out unneeded elements
		var fileItem = {};
		for(var j=0, association; association = elements[j]; j++)
		{
			var pair = association.split("=",2);	

			if(j==0 && pair[1])
			{
				pair[0] = "name";

				// parse out the directory name
				var index = pair[1].lastIndexOf("/");
	
				if(index > -1)
				{
					dirName = pair[1].substring(0, index);
					pair[1] = pair[1].substring(index + 1);
				}
				else
				{
					// look for "\" instead
					index = pair[1].lastIndexOf("\\");
					if(index > -1)
					{
						dirName = pair[1].substring(0, index).replace(/\\/g, "/");
						pair[1] = pair[1].substring(index + 1);
					}
					else
					{
						dirName = "";
					}
				}
			}
			else if(j==0)
			{
				//alert("Item is missing a name: ", item);
				return null;
			}

			for(var x in includeFilter)
			{
				if(pair[0] == includeFilter[x])
					fileItem[pair[0]] = pair[1];
			}
		}

		return {'dirName' : dirName, 'fileItem' : fileItem };
  }


  // use recursion to iterate to the correct nesting level and add the item to the array
  function loadFileItemInNestedFileArray(depth, fileArray, fileItem, directoryNestingArray)
  {
		// The directoryNestingArray represents a progressive depth.   
		// When it gets empty, we are at the right depth
		if(directoryNestingArray.length == 0)
		{
			if(fileItem["type"] == "directory")
			{
				fileArray.containerCountWithChildren++;
			}
			else
			{
				// don't push files, we just want to aggregate the dirs
				//fileArray.children.push(fileItem);
				var size = parseInt(fileItem["st_size"]);
	
				if(size > 0) {
					fileArray.totalSizeAtLevel += size;
					fileArray.totalSizeWithChildren += size;
				}
				fileArray.itemCountAtLevel++;
				fileArray.itemCountWithChildren++;
			}
		}
		else
		{
			var nextLevel = directoryNestingArray[0];
			directoryNestingArray.shift();  // remove first element

			var nextLevelObj = undefined;

			// since we are not pushing files, we don't want to create a children node
			// unless we are creating a directory
			
			// find the directory item if it exists
			if(fileArray.children != undefined)
			{
				for(var i in fileArray.children)
				{
					if(fileArray.children[i].name == nextLevel)
					{
						nextLevelObj = fileArray.children[i];
						break;
					}
				}
			}
			else
			{
				fileArray.children = [];
			}

			if( nextLevelObj == undefined )
			{
				nextLevelObj = createFileArrayObject();
				nextLevelObj.name = nextLevel;
				nextLevelObj.type = "directory";
				nextLevelObj.depth = depth;
				// put the item at the beginning of the list so that the next path that comes
				// through finds it right away due to locality.
				fileArray.children.unshift(nextLevelObj);
			}

			if(fileItem["type"] == "directory")
			{
				fileArray.containerCountWithChildren++;
			}
			else if(fileItem["type"] == "file")
			{
				var size = parseInt(fileItem["st_size"]);
				fileArray.itemCountWithChildren++;
				if(size > 0)
					fileArray.totalSizeWithChildren += size;
			}
			loadFileItemInNestedFileArray(depth+1, nextLevelObj, fileItem, directoryNestingArray);
		}
  }

  // take a File object and return a date category
  function categorizeByDate(fileItem) {

		var todays_date = new Date();
		var todays_time_t = todays_date.getTime()/1000;   // UTC returns milliseconds since the epoch 
		var hour = 60*60;
		var day = hour * 24;
		var week = day * 7;
		var month = day * 30;
		var year = day * 365;
	
		var file_time_t = parseInt(fileItem.st_mtime);

		var category;

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
			var diff = Math.floor((todays_time_t -  file_time_t) / year);
			category = "1 year and older/" + diff + " to " + (diff+1) + " years";
		}

		return category;
  }


  // loop over the manifest fileArray
  // this function can yeild so that the UI can update

  // very hacky global variables to support incremental iteration over the list
  // I originally did this with a generator and yield, but chrome doesnt have support.
  // Ideally we pass arguments, but apparently setTimeout with arguments is broken on IE

  var g_CurArrayIndex = 1;
  var g_ManifestArray = [];
  var g_RootItemByType = {};
  var g_RootItemBySize = {};
  var g_RootItemByDate = {};
  var g_RootItemAllExtensions = {};

  function iterateManifest() {

	// skip first one, since it is a header
	// skip last two as well
	for(var line ; (g_CurArrayIndex < g_ManifestArray.length-2) && (line = g_ManifestArray[g_CurArrayIndex]) ; g_CurArrayIndex++)
	{
		var dirName, fileItem;

  		var pi_rv = parseItem(line);

		if(pi_rv)
		{

			// Do work for type lookup using the extension
			{
				// lookup the extension in the index and use the LevelPath to set it into the tree, instead of the dirName
				var index = pi_rv.fileItem.name.lastIndexOf(".");
				var LevelPath = undefined;
				var ext = "";
				if(index > -1)
				{
					ext = pi_rv.fileItem.name.substring(index);
					ext = ext.toLowerCase();
					var ext_parent_node = g_TypeReverseIndex[ext];

 					if(ext_parent_node != undefined) {
                         if(ext.length > 4)
                             LevelPath = ext_parent_node.levelPath + "/Extension_More_Than_4_Chars";
                         else
                             LevelPath = ext_parent_node.levelPath + "/" + ext;
                    }

				}

 				if(LevelPath == undefined) {
					if(ext == "")
                        LevelPath = "uncatagorized/No Extention";
                    else if(ext.length > 4)
                        LevelPath = "uncatagorized/Extension_More_Than_4_Chars";
                    else
                        LevelPath = "uncatagorized/" + ext;
				}

				var typePathArray = LevelPath.split("/");
			}

			// split the directory name
			var dirNameArray = [];
			if(pi_rv.dirName.length > 0)
				dirNameArray = pi_rv.dirName.split("/");

			// empty directories wont get counted correctly unless we use the whole name as the path
			if(pi_rv.fileItem.type == "directory")
			{
				dirNameArray.push(pi_rv.fileItem.name);
			}
				
			// kill empty object at the beginning
			if(dirNameArray[0] == "")
				dirNameArray.shift();

			var dateCategoryArray = categorizeByDate(pi_rv.fileItem).split("/");

			// build the type and size trees in parrallel
			loadFileItemInNestedFileArray(1, g_RootItemByType, pi_rv.fileItem, typePathArray);
			loadFileItemInNestedFileArray(1, g_RootItemBySize, pi_rv.fileItem, dirNameArray);
			loadFileItemInNestedFileArray(1, g_RootItemByDate, pi_rv.fileItem, dateCategoryArray);

			// update the progress occationally, by returning but setting a timer 
			// to come back
			if( (g_CurArrayIndex % 1000) == 0)
			{
				g_ParseProgress.updateManual( g_CurArrayIndex, g_ManifestArray.length-2 );
				g_CurArrayIndex++;  // increment since we will not hit the for loop due to early return
				window.setTimeout(iterateManifest, 20);     
				return true;
			}
		}
	} 

	// when we get here, we are done.
	g_ParseProgress.end();
	manifestLoadCallbackFunction(g_RootItemBySize, g_RootItemByType, g_RootItemByDate, g_RootItemAllExtensions);
	return false;
  }

  function parseManifest(fileLoadResult) {

	g_ParseProgress.start();

    document.getElementById("status").innerHTML = ' Data Read, Parsing... ';

	g_ManifestArray = fileLoadResult.split("\n");

	// only one item and it is our root directory object
	g_RootItemBySize = createFileArrayObject();
	g_RootItemBySize.name = "ALL";
	g_RootItemBySize.id = "root";
	g_RootItemBySize.depth = 0;
	g_RootItemBySize.type = "directory";

	g_RootItemByType = createFileArrayObject();
	g_RootItemByType.name = "ALL";
	g_RootItemByType.id = "root";
	g_RootItemByType.depth = 0;
	g_RootItemByType.type = "directory";

	g_RootItemByDate = createFileArrayObject();
	g_RootItemByDate.name = "ALL";
	g_RootItemByDate.id = "root";
	g_RootItemByDate.depth = 0;
	g_RootItemByDate.type = "directory";

	// load type data  (and start the manifest iteration when done 
  	g_CurArrayIndex = 1;
  	loadFileFromURL("exts/all_exts.json", function (stringData) {
				g_RootItemAllExtensions = JSON.parse(stringData);
				g_TypeReverseIndex = create_type_reverse_index( g_RootItemAllExtensions );
				// use an timer function to iterate through the list asyncronously
  				g_CurArrayIndex = 1;
  				iterateManifest();
			});
  }


  // functions to display a progress bar

  function errorHandler(evt) {
    switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
      case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
      default:
        alert('An error occurred reading this file.');
    };
  };


  function readFile(f, type) {

    var reader = new FileReader();

	g_ReadProgress.start();
    document.getElementById("status").innerHTML = ' Reading File... ';

    reader.onerror = errorHandler;
    reader.onprogress = g_ReadProgress.updateFileEvent;
    reader.onabort = function(e) {
      alert('File read cancelled');
    };

    reader.onloadstart = function(e) {
		g_ReadProgress.loading();
    };

    reader.onloadend = function(fileLoadResult) {
	  g_ReadProgress.end();

      if(fileLoadResult.target.result != undefined) {
		if(type == "MANIFEST")
      		parseManifest(fileLoadResult.target.result);
		else if(type == "JSON")
			loadJSONTreeFromMemory(fileLoadResult.target.result);
		else
			alert("Bad Type passed to 'readFile'");
	  }
    }

    reader.readAsText(f);
  }

  function handleFileSelect(evt) {

    var files = evt.target.files; // FileList object

    for (var i = 0, f; f = files[i]; i++) {
	    readFile(f, "JSON");
    }
  }

  function loadManifestFromFile() {

    var files = document.getElementById('files').files;
    if (!files.length) {
      alert('Please select a file!');
      return;
    }

    var file = files[0];

    readFile(file, "MANIFEST");
  }

  function loadManifestFromURL(url) {

	startLoadingCallback(url);

  	if (window.XMLHttpRequest) {
    		req = new XMLHttpRequest();
  	} else if (window.ActiveXObject) {
    		req = new ActiveXObject("Microsoft.XMLHTTP");
  	}
  	if (req != undefined) {

    	req.onreadystatechange = function() {myManifestFromURLDone(url);};
		req.onprogress = g_ReadProgress.update;
    	req.open("GET", url, true);
    	req.send("");
	
		g_ReadProgress.start();
		g_ReadProgress.loading();

    	document.getElementById("status").innerHTML = ' Reading File... ';

  	}
  }  

  function myManifestFromURLDone(url) {
    if (req.readyState == 4) { // only if req is "loaded"
  	  g_ReadProgress.end();
      if (req.status == 200) { // only if "OK"
        parseManifest(req.responseText);
      } else {
  	    document.getElementById("status").innerHTML = ' Error loading URL: <b>' + req.responseText + "</b>";
	    //alert("Could not load URL: " + url);
      }
    }
  }


  function loadFileFromURL(url, callback) {
  	if (window.XMLHttpRequest) {
    		req = new XMLHttpRequest();
  	} else if (window.ActiveXObject) {
    		req = new ActiveXObject("Microsoft.XMLHTTP");
  	}
  	if (req != undefined) {

    	req.onreadystatechange = function() { 
	    if (req.readyState == 4) { // only if req is "loaded"
		    if (req.status == 200) { // only if "OK"
			    callback(req.responseText);
		    } else {
  	    		document.getElementById("status").innerHTML = ' Error loading URL: <b>' + req.responseText + "</b>";
			    //alert("Could not load URL: " + url);
		    }
	    }
	};

    	req.open("GET", url, true);
    	req.send("");
  	}
  }

  function loadJSONTreeFromURL(url) {

	startLoadingCallback(url);

  	loadFileFromURL(url, function (stringData) {
				loadJSONTreeFromMemory(stringData);
			});
  }

  function loadJSONTreeFromMemory(JSONData) {

	  var fakeroot = JSON.parse(JSONData);
	  g_RootItemBySize = fakeroot.rootItemBySize;
	  g_RootItemByType = fakeroot.rootItemByType;
	  g_RootItemByDate = fakeroot.rootItemByDate;
	  //console.log(fakeroot);
	  manifestLoadCallbackFunction(g_RootItemBySize, g_RootItemByType, g_RootItemByDate, g_RootItemAllExtensions);
  }

  // load a manifest from an in memory string
  function loadManifestFromMemory(data) {

	startLoadingCallback(url);

	g_ReadProgress.start();
	g_ReadProgress.end();
	parseManifest(data);
  }
