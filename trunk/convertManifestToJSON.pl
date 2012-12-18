#!/usr/bin/perl

#use English;
use FileHandle;
use strict;
use JSON;

my $g_GlobalIdCounter = 0;
my $g_rootItemBySize = createFileArrayObject();
$g_rootItemBySize->{name} = "ALL";
$g_rootItemBySize->{id} = "root";
$g_rootItemBySize->{depth} = 0;
$g_rootItemBySize->{type} = "directory";

my $g_rootItemByType = createFileArrayObject();
$g_rootItemByType->{name} = "ALL";
$g_rootItemByType->{id} = "root";
$g_rootItemByType->{depth} = 0;
$g_rootItemByType->{type} = "directory";

my $g_rootItemByDate = createFileArrayObject();
$g_rootItemByDate->{name} = "ALL";
$g_rootItemByDate->{id} = "root";
$g_rootItemByDate->{depth} = 0;
$g_rootItemByDate->{type} = "directory";

my $g_RootItemAllExtensions = {};
my %g_TypeReverseIndex = ();

# these hashes store summaries by path key
my %g_pathHash = ();
my %g_typeHash = ();
my %g_dateHash = ();

my $g_unique_id = 0;

# at each parent node add a string that represents the full path. eg "ALL/known types/media/images/rastor"
sub flatten_types($$) {
	my($type_tree_node, $root_string) = @_;

    # only add a node name if we have children
    if($type_tree_node->{children})
    {
		if($root_string ne "") {
        	$type_tree_node->{levelPath} = $root_string . "/" . $type_tree_node->{name};
		} else {
        	$type_tree_node->{levelPath} = $type_tree_node->{name};
		}

		foreach my $i (@{$type_tree_node->{children}}) {

			# only recurse into nodes with children
			if( ($i->{children}) != undef ) {
                flatten_types( $i, $type_tree_node->{levelPath} );
			}
        }
    }
}

# use recursion to create a flat index of all extensions pointing to their root object
sub create_type_reverse_index($) {
	my($type_tree_node) = @_;

	foreach my $i (@{$type_tree_node->{children}}) {

		# extensions begin with "." and don't have children
		if( ($i->{children}) == undef )
		{
			# point the index to the parent rather than the object itself
			# this makes it easy to get the levelPath
			$g_TypeReverseIndex{ $i->{name} } = $type_tree_node;
		}
		else
		{
			create_type_reverse_index( $i );
		}
	}
}


sub load_all_extensions() {

	# read json file from local disk
	open(FH, "exts/all_exts.json") or die "$!";
	my $json_txt = do{local $/; <FH>;};
	close FH;

	#print($json_txt);

	# parse json
	$g_RootItemAllExtensions = JSON->new->utf8->decode ( $json_txt );

	# add levelPath to all parent nodes using flatten
	flatten_types($g_RootItemAllExtensions, "");

	# create reverse index
	create_type_reverse_index($g_RootItemAllExtensions);

	#my $recode = JSON->new->utf8->pretty->encode ( $g_RootItemAllExtensions );
	#print("JSON parsed: ");
	#print($recode);
	#print("\n");
}

sub main() {

	load_all_extensions();

	my($i);
 	foreach $i (@ARGV) {
 		handle_file($i);
 	}
}


sub handle_file($) {
	my($infile) = @_;
	#print(" handle_file($infile)");
	if ($infile eq "-") {
		read_file(\*STDIN, "[stdin]");  # \*STDIN=input stream for STDIN.
	} else {
		my($IN) = new FileHandle "$infile";
		if (! defined($IN)) {
			fyi("Can't open spec file $infile: $!\n");
			return;
		}
		read_file($IN, "$infile");      # $IN = file handle for $infile
		$IN->close();           # done, close the file.
	}
}

# read_file (INPUT_STREAM, filename);
#   
sub read_file ($$) {
	my($IN, $filename) = @_;
	my($line, $from) = ("", "");
	my $lineno = 0;                        # reset line number for this file
		while ( defined($line = <$IN>) ) {
			$lineno++;
			chomp($line);                   # strip off trailing '\n' (newline)
			parse_line($line, $lineno, $filename);
	}

    # now all the data is summarized by path, turn it into a tree

	while( my ($k, $v) = each %g_pathHash) {
		my @pathArr = split('\/', $k);
    	loadFileItemInNestedFileArray(1, $g_rootItemBySize, $v, \@pathArr);
    }

	while( my ($k, $v) = each %g_typeHash) {
		my @pathArr = split('\/', $k);
    	loadFileItemInNestedFileArray(1, $g_rootItemByType, $v, \@pathArr);
    }

	while( my ($k, $v) = each %g_dateHash) {
		my @pathArr = split('\/', $k);
    	loadFileItemInNestedFileArray(1, $g_rootItemByDate, $v, \@pathArr);
    }

	# create a bogus root that can contain both root Items
	my $fakeRoot = {};
	#$fakeRoot->{SizeHash} = \%g_pathHash;   #debug out
	#$fakeRoot->{TypeHash} = \%g_typeHash;   #debug out
	#$fakeRoot->{DateHash} = \%g_dateHash;   #debug out
	$fakeRoot->{rootItemBySize} = $g_rootItemBySize;
	$fakeRoot->{rootItemByType} = $g_rootItemByType;
	$fakeRoot->{rootItemByDate} = $g_rootItemByDate;

	open FILE, ">JSON_out.txt" or die $!;
	my $json_txt = JSON->new->pretty(1)->utf8->encode ($fakeRoot);
	print FILE $json_txt . "\n";
}


sub loadFileItemInHash($$$) {
	my($rootHash, $fileItem, $path) =  @_;

	my $itemRef = $rootHash->{ $path };

	my $isDirectory = 0;
	if($fileItem->{type} eq "directory") {
		$isDirectory = 1;
	}

	if($itemRef == undef)
	{
		# create item
    	my $hashItem = {};
		$hashItem->{totalSizeAtLevel} = $fileItem->{st_size};
		if($isDirectory == 1) {
			$hashItem->{containerCountAtLevel}++;
		} else {
			$hashItem->{itemCountAtLevel} = 1;
		}

		$rootHash->{ $path } = $hashItem;
	}
	else
	{
		# increment since the item exists
		$itemRef->{totalSizeAtLevel} += $fileItem->{st_size};

		if($isDirectory == 1) {
			$itemRef->{containerCountAtLevel}++;
		} else {
			$itemRef->{itemCountAtLevel}++;
		}
	}
}

# parse_line(line of text data, line number, filename);
#   process a line of text.  
sub parse_line ($$$) {
	my($line, $lineno, $filename) = @_;
	my($heading, $htype) = undef;

	chomp( $line );   
    my $item = parseItem( $line );

	if(defined($item)) {
		#print "Line in -> " . $line . "\n";
		#print "Item" . $item . "\n";

		#my $json_txt = JSON->new->utf8->encode ($item);
		#print "JSON: " . $json_txt . "\n";

		# split on the "/"

		if($item->{st_size} == undef) {
			$item->{st_size} = 0;
		}
	
		#my @path = @{$item->{path}};
		my $path = $item->{path};

		# empty directories wont get counted correctly unless we use the whole name as the path
		if($item->{type} eq "directory") {
			if($path eq "") {
				$path = $item->{name};
			} else {
				$path = $path . "/" . $item->{name};
			}
		}

		#my @pathArr = split('\/', $path);

		#print "First DirNameArray: ";
		#print @pathArr;
		#print "\n";

		# create a path for types by looking up the type in the reverse index
		# lookup the extension in the index and use the typeCategory to set it into the tree, instead of the dirName
		my $dot = rindex($item->{name}, '.');
		my $typeCategory = "";
		my $ext = "";
		if($dot > -1)
		{
			$ext = substr($item->{name}, $dot);
			$ext = lc($ext);
			my $ext_parent_node = $g_TypeReverseIndex{$ext};

			if($ext_parent_node != undef)
			{
				$typeCategory = $ext_parent_node->{levelPath} . "/" . $ext;
			}
		}

		if($typeCategory eq "") {
			if($ext eq "") {
				$ext = "No Extension";
			}
			$typeCategory = "uncatagorized/" . $ext;
		}

		# categorize by date
		my $dateCategory = categorizeByDate($item);

		#my @typePathArr = split('\/', $typeCategory);

#print "\nPATH: " . $path . "\n\n";
		loadFileItemInHash(\%g_pathHash, $item, $path);
		loadFileItemInHash(\%g_typeHash, $item, $typeCategory);
		loadFileItemInHash(\%g_dateHash, $item, $dateCategory);
	}
}

# take a File object and return a date category
sub categorizeByDate($) {
	my( $manObj ) = @_;

	my $todays_time_t = time;
	my $hour  = 60*60;  # secs in an hour
	my $day   = $hour * 24;
	my $week  = $day * 7;
	my $month = $day * 30;
	my $year  = $day * 365;

	my $file_time_t = int($manObj->{st_mtime});

	my $category;

	if( $file_time_t == 0 ) {
		$category = "unknown date";
	} elsif( $file_time_t > $todays_time_t ) {
		$category = "Incorrect future date";
	} elsif( $file_time_t > $todays_time_t - $hour ) {
		$category = "within 1 year/within 1 hour";
	} elsif( $file_time_t > $todays_time_t - $day ) {
		$category = "within 1 year/1 hour to 1 day";
	} elsif( $file_time_t > $todays_time_t - $week ) {
		$category = "within 1 year/1 day to 1 week";
	} elsif( $file_time_t > $todays_time_t - $month ) {
		$category = "within 1 year/1 week to 1 month";
	} elsif( $file_time_t > $todays_time_t - $year ) {
		$category = "within 1 year/1 month to 1 year";
	} else {
		my $diff = int(($todays_time_t -  $file_time_t) / $year);
		$category = "1 year and older/" . $diff . " to " . ($diff+1) . " years";
	}

	return $category;
}



sub parsePath ($) {
	my( $fullPath ) = @_;

	my $fileName;
	my $dirName;

	# parse out the directory name
	my $index = rindex($fullPath, '/');

	if($index > -1)
	{
		$dirName = substr($fullPath, 0, $index);
		$fileName = substr($fullPath, $index+1);
	}
	else
	{
		$index = rindex($fullPath, '\\');

	 	if($index > -1) {
			$dirName = substr($fullPath, 0, $index);
			$fileName = substr($fullPath, $index+1);
		}
		else
		{
			$dirName = "";
			$fileName = $fullPath;
		}
	}

	return ($fileName, $dirName);
}

# take a line of text comma delimited and turn it into an object
# line looks something like this:
# =DIR_NAME/FILENAME,acl_list=WINDOWS_ACLS,\
# attrs=8224&amp;,st_ctime=1248231694,st_ino=56054,st_mode=100000,st_mtime=1226216052,st_nlink=3,\
# st_size=10526256,type=file,version=1,win_encrypted_size=0,_internal_record_crc=dc0e928c\
#
sub parseItem ($) {
	my($line) = @_;

	my @elements = split(',', $line);


	my $fileItem = {};
	my $association;
	foreach $association ( @elements ) {
	
		my ($name, $value) = split('=', $association, 2);

		#my $equal = index($association, '=');
		#my $name = substr($association, 0, $equal);

		if($name eq "")    # the first one has an empty name and is the name field
		{
			#my $value = substr($association, $equal+1);

			if($value eq "header" || $value eq "trailer" || $value eq "") {
				return undef;
			}

			my ($fileName, $path) = parsePath($value);
			$fileItem->{name} = $fileName;
			$fileItem->{path} = $path;
		}
		elsif ($name eq "st_size")
		{
			#my $value = substr($association, $equal+1);

			$fileItem->{st_size} = int $value;
		}
		elsif ($name eq "st_mtime")
		{
			#my $value = substr($association, $equal+1);

			$fileItem->{st_mtime} = int $value;
		}
		elsif ($name eq "type")
		{
			#my $value = substr($association, $equal+1);

			$fileItem->{type} = $value;
		}
	}

	return $fileItem;
}


sub createFileArrayObject() {
    my $fileArray = {};
    $fileArray->{id} = sprintf ("%d", ($g_GlobalIdCounter++));
    $fileArray->{name} = "";
    $fileArray->{totalSizeAtLevel} = 0;
    $fileArray->{totalSizeWithChildren} = 0;
    $fileArray->{itemCountAtLevel} = 0;
    $fileArray->{itemCountWithChildren} = 0;
    $fileArray->{containerCountWithChildren} = 0;

    return $fileArray;
  }


sub loadFileItemInNestedFileArray( $$$$ ) {
	my($depth, $rootObj, $fileItem, $directoryNestingArray) =  @_;

#print "Recurse level: " . $depth . " item name: " . $fileItem->{name} . "\n";
#print "dirNestingArray: " . @{$directoryNestingArray} . " d: " . scalar(@{$directoryNestingArray}) . "\n";


	# The directoryNestingArray represents a progressive depth.
	# When it gets empty, we are at the right depth
	if(!$directoryNestingArray || $directoryNestingArray->[0])
	{
		# array is not empty
		#
		my $nextLevel = shift @{$directoryNestingArray};  # remove first element

		#print "NextLevel: " . $nextLevel . "\n";

		my $nextLevelObj;

		# since we are not pushing files, we don't want to create a children node
		# unless we are creating a directory

		# find the directory item if it exists
		if(defined($rootObj->{children}))
		{
			my $i;
			foreach $i (@{$rootObj->{children}})
			{
				if($i->{name} eq $nextLevel)
				{
					$nextLevelObj = $i;
					last;  # perl "break"
				}
			}
		}
		else
		{
			# create array
			$rootObj->{children} = [];
		}

		if( !defined($nextLevelObj) )
		{
			$nextLevelObj = createFileArrayObject();
			$nextLevelObj->{name} = $nextLevel;
			$nextLevelObj->{type} = "directory";
			$nextLevelObj->{depth} = $depth;
			# add to the beginning of the array
			# This should be faster since the next path that comes through
			# is likely to have the same sub path.  Since it will be at the beginning of
			# the list it will be found on the first compare instead of the last.
			unshift(@{$rootObj->{children}}, $nextLevelObj);  
		}

		$rootObj->{itemCountWithChildren} += $fileItem->{itemCountAtLevel};
		$rootObj->{totalSizeWithChildren} += $fileItem->{totalSizeAtLevel};
		$rootObj->{containerCountWithChildren} += $fileItem->{containerCountAtLevel};
		loadFileItemInNestedFileArray($depth+1, $nextLevelObj, $fileItem, $directoryNestingArray);
	}
	else
	{
		$rootObj->{itemCountAtLevel} = $fileItem->{itemCountAtLevel};
		$rootObj->{totalSizeAtLevel} = $fileItem->{totalSizeAtLevel};
		$rootObj->{itemCountWithChildren} += $fileItem->{itemCountAtLevel};
		$rootObj->{totalSizeWithChildren} += $fileItem->{totalSizeAtLevel};
		$rootObj->{containerCountWithChildren} += $fileItem->{containerCountAtLevel};
	}
}

main();
0;
