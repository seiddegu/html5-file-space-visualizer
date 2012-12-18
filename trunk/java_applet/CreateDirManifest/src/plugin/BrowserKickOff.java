package plugin;


import java.awt.Container;
import java.awt.event.*;
import javax.swing.*;

import java.io.*;
import java.applet.*;
import netscape.javascript.JSObject;


public class BrowserKickOff extends Applet implements ActionListener {

	/**
	 *  
	 */
	private static final long serialVersionUID = 1L;
	JButton btn; 
	JSObject jso;
	String path;
	Object actionResultFunction;


	public void actionPerformed(ActionEvent event) {
		try{
			String dirpath = null;
			JFileChooser jfc = new JFileChooser(new File(path));
			jfc.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);

			int cont = JOptionPane.showConfirmDialog(null, 
					"This Java Applet will traverse a directory of your choosing\n" +
					"and generate a list of files that can be analyzed.\n" +
					"The data will not be transferred over the network\n" +
					"and will not leave your computer.\n\n" +
					"Would you like to continue?", "Would you like to run?", JOptionPane.YES_NO_OPTION); 

			if(cont != 0)
				return;   // exit the app
			
			int result = jfc.showDialog(getParent(), "Select");
			dirpath = jfc.getSelectedFile().getPath();

			if (result == JFileChooser.APPROVE_OPTION) {		
				if(dirpath != null)
				{
					// set up a status dialog in case the traversal takes a long time.
					JFrame frmMain = new JFrame("Generating a manifest from your local file system");
					frmMain.setLocationRelativeTo(null);
					frmMain.setSize(800, 800); 
					Container pane = frmMain.getContentPane();
					pane.setLayout(null); // Use the null layout
					frmMain.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
					frmMain.setResizable(true); 
					SaveFile fileSaver = new SaveFile();
					MemoryStore memStore = new MemoryStore(dirpath);
					
					Boolean notDone = true;
					Boolean saveFile = false;
					Writer walkerResults = null;
					
					while(notDone) {
						saveFile = SaveFile.DoYouWantToSaveAsAFileQuestion();
						
						if(saveFile) 
							walkerResults = fileSaver.OpenFileToSave(dirpath);
						else 
							walkerResults = new StringWriter();
						
						if(walkerResults != null)
							notDone = false;
					}
					
					WalkAndPrintManifest wpm = new WalkAndPrintManifest(dirpath);
					wpm.setOpaque(true);
					wpm.setBounds(10,10,780,20);
					frmMain.setContentPane(wpm);
					frmMain.pack();
					frmMain.setVisible(true);
					
					wpm.walk(memStore);
					
					String JSONData = memStore.getJSONData();
					if(!saveFile && JSONData.length() > 2000000) {
						saveFile = SaveFile.DataTooBigWouldYouLikeToSaveAsAFileQuestion();
						if(saveFile) 
							walkerResults = fileSaver.OpenFileToSave(dirpath);
					}		
					
					if(saveFile) {
						PrintWriter printWriter = new PrintWriter(walkerResults);
						printWriter.println(memStore.getJSONData());
						fileSaver.CloseFileAndMessageUser((FileWriter) walkerResults);
					} else {
						
						jso.call("ManifestDataFromJava", new String[] { memStore.getJSONData() });
					}

					frmMain.dispose();
				}

				
			}
			jso.call("java_finished", new String[] { "Finished Action performed" });
		} catch (Exception e) {
			jso.call("java_error", new String[] {e.getMessage()});
			System.out.println("Exception: " + e.getMessage());  
			JOptionPane.showMessageDialog(this,"Applet Error: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
		}
	}


	public void init () {
		btn = new JButton("Browse");
		btn.addActionListener(this);
		//add(btn);
		jso = JSObject.getWindow(this);
		path = getParameter("path");
		if (path == null) {
			path = "C:\\";
		}
		btn.doClick();
	}
}