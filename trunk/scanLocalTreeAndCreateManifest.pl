#!/usr/bin/perl

#use English;
use FileHandle;
use strict;
use JSON;
use Cwd;
use File::stat;
use Fcntl ':mode';

my $outputFD;

sub main() {
    my ($dirToScan, $outputFile) = @ARGV;

	# strip the trail slash if it's there

	if ($#ARGV != 1 ) {
		print "usage: SCRIPT_NAME   [Directory to scan]  [Output file for MANIFEST Data]\n";
		exit;
	}

	open $outputFD, "> $outputFile" or die $!;

    print "Scanning directory: " . $dirToScan . " and printing to file: " . $outputFile . "\n";

    StartScanDirectory($dirToScan);
}

# this function starts off the directory scan.
# It is different so that we always pass "." into the base of the recursive function
# Otherwise the paths generated have the fullCWD info
sub StartScanDirectory($) {

    my ($newSubDir, $fullDir) = @_; 

    my($startdir) = &cwd; # keep track of where we began

    chdir($newSubDir) or die "Unable to enter dir $newSubDir:$!\n";

    ScanDirectory(".", "");

    chdir($startdir) or die "Unable to change to dir $startdir:$!\n";
}

sub ScanDirectory($$) {
    my ($newSubDir, $fullDir) = @_; 

    my($startdir) = &cwd; # keep track of where we began

    chdir($newSubDir) or die "Unable to enter dir $newSubDir:$!\n";

    opendir(DIR, ".") or die "Unable to open $newSubDir:$!\n";
    my @names = readdir(DIR);
    closedir(DIR);

	if($fullDir eq "") {
		if($newSubDir eq ".") {
			$fullDir = "";
		} else {
			$fullDir = $newSubDir;
 		} 
		#$fullDir = $newSubDir;
	} else {
		$fullDir = $fullDir . "/" . $newSubDir;
 	} 

    foreach my $name (@names){
        next if ($name eq "."); 
        next if ($name eq "..");
	
        if (-d $name){                     # is this a directory?
			DirectoryFound($name, $fullDir);
            &ScanDirectory($name, $fullDir);
            next;
        } else {
			FileFound($name, $fullDir);
		}
    }
    chdir($startdir) or die "Unable to change to dir $startdir:$!\n";
}

sub DirectoryFound($$) {
  my($name, $path) = @_;

  FileOrDirectoryFound($name, $path);
}

sub FileFound($$) {
  my($name, $path) = @_;

  FileOrDirectoryFound($name, $path);
}

sub FileOrDirectoryFound($$) {
  my($filename, $path) = @_;

  # attempt to read the stat entry for this file
  my $sb;
  eval { $sb = stat($filename) };
  if(@@) {
	warn "stat failed [$@]\n";
  }

  my $debug = 1;
  if($debug) {
  	print "found a ";
  	if (-d $filename){                     # is this a directory?
		print " DIRECTORY ";
  	} else {
		print " FILE ";
  	}
  	print "" . $path . " / " . $filename . "  Size: " . $sb->size . "\n";
  }
  add_file_item ($sb, $filename, $path);
}

# add_file_item(stat_info, filename, path);
sub add_file_item ($$$) {
	my($stat_info, $filename, $path) = @_;
    my($item);

    # print an entry in the manifest for this item
    # =DIR_NAME/FILENAME,acl_list=WINDOWS_ACLS,\
    # attrs=8224&amp;,st_ctime=1248231694,st_ino=56054,st_mode=100000,st_mtime=1226216052,st_nlink=3,\
    # st_size=10526256,type=file,version=1,win_encrypted_size=0,_internal_record_crc=dc0e928c\
   print $outputFD "=" . $path . "/" . $filename . ",st_mtime=" . $stat_info->mtime . ",st_size=" . $stat_info->size;

    if (-d $filename){                     # is this a directory?
       print $outputFD ",type=directory\n"
	} else {
       print $outputFD ",type=file\n"
	}
}

main();
0;
