package plugin;
import java.awt.FileDialog;
import java.awt.Frame;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.FilenameFilter;
import java.io.IOException;

import javax.swing.JOptionPane;


public class SaveFile {
	
	String mFileName;
	
	static public Boolean DoYouWantToSaveAsAFileQuestion() {
		
		Object[] options = { "Save A File", "Use Memory instead (may fail for large listings)" };
		int rv = JOptionPane.showOptionDialog(null, "Would you like to save the data as a file?\n\n" +
		        "Only small directory listings can be saved in memory and transferred back to the browser.\n" +
		        "Saving to a file allows for larger listings and for reloading the file on subsequent runs.",
		        "Save directory listing to a file\n\n",
		        JOptionPane.DEFAULT_OPTION, JOptionPane.INFORMATION_MESSAGE, null,
		        options, options[0]);
		 
		if(rv == 0)
			return true;
		
		return false;    
	}
	
	static public Boolean DataTooBigWouldYouLikeToSaveAsAFileQuestion() {
		
		Object[] options = { "Save A File", "Cancel" };
		int rv = JOptionPane.showOptionDialog(null, "Please save to a file\n\n" +
		        "The data set size is too large to tranfer in memory back to the browser.   You can\n" +
		        "save it to a file instead and load it into the browser manually.\n\n",
		        "Save directory listing to a file?\n\n", 
		        JOptionPane.DEFAULT_OPTION, JOptionPane.INFORMATION_MESSAGE, null,
		        options, options[0]);
		 
		if(rv == 0)
			return true;
		
		return false;   
	}
	
	public void SaveFileIfDesired(String dataToSave, String filenameHintIn) {
	
		int n = JOptionPane.showConfirmDialog(null, "Would you like to save the manifest as a file for future use? ", "Save Manifest?", JOptionPane.YES_NO_OPTION); 

		if(n == 0) {
			FileWriter fw = OpenFileToSave(filenameHintIn);
	        
	        if(fw != null) {
		        try {
		            BufferedWriter out = new BufferedWriter(fw);
		            out.write(dataToSave);
		            out.close();
		        } catch (IOException e) {
		        	JOptionPane.showMessageDialog(null, 
							"Unable to write output file.   Error: " + e.getMessage(),
							"Error", JOptionPane.ERROR_MESSAGE); 
		        }
	        }
		}
	}
	
	public FileWriter OpenFileToSave(String filenameHintIn) {
		String replaceThis = "[:/\\\\]";  // regex to replace any fs separator
		String filenameHint = filenameHintIn.replaceAll(replaceThis, "_") + "_manifest.txt";  // replace the separators in the path with something else to create a filename

		FileDialog fileDialog = new FileDialog(new Frame(), "Save", FileDialog.SAVE);
        fileDialog.setFilenameFilter(new FilenameFilter() {
            public boolean accept(File dir, String name) {
                return name.endsWith(".txt");
            }
        });
        fileDialog.setFile(filenameHint);
        fileDialog.setVisible(true);

        mFileName = fileDialog.getDirectory();
        //filenameOut += System.getProperty("path.separator");
        mFileName += fileDialog.getFile();
        
        //JOptionPane.showMessageDialog(null, "Filename: " + filenameOut, "alert", JOptionPane.ERROR_MESSAGE); 
        
        if(mFileName.length() > 0) {
        	try {
				return new FileWriter(mFileName);
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return null;
			}
        }
        
        return null;
	}
	
	 public void CloseFileAndMessageUser(FileWriter fw) {
		
		 try {
				fw.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		 
		JOptionPane.showMessageDialog(null, "The data has been saved to a file.\n" +
					"Please use the \"Load an existing manifest file from your machine\" option to load the file in the browser.\n" +
					"The filename is: " + mFileName, "Data Saved to file", JOptionPane.PLAIN_MESSAGE); 

	}
	
	
	static public void CloseFile(FileWriter fw) {
	
		try {
			fw.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	
	}
}
