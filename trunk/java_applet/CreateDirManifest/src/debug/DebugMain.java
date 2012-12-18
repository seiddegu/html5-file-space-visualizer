package debug;



import java.awt.Container;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.Writer;

import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JOptionPane;

import plugin.MemoryStore;
import plugin.WalkAndPrintManifest;
import plugin.SaveFile;


public class DebugMain extends JFrame {

	/**
	 * 
	 */
	private static final long serialVersionUID = -602612672762502218L;

	/**
	 * @param args
	 */
	public static void main (String[] args) {
		Boolean writeFullManifest = false;   // if false use the memory based JSON aggregate
			
		JFileChooser jfc = new JFileChooser();
		jfc.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);

		int chooserResult = jfc.showDialog(null, "Select");
		String dirpath = jfc.getSelectedFile().getPath();

		if (chooserResult == JFileChooser.APPROVE_OPTION) {		
			if(dirpath != null)
			{
				SaveFile fileSaver = new SaveFile();
				JFrame frmMain = new JFrame("Generating a manifest from your local file system");
				frmMain.setLocationRelativeTo(null);
				frmMain.setSize(300, 300); 
				Container pane = frmMain.getContentPane();
				pane.setLayout(null); // Use the null layout
				frmMain.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
				frmMain.setResizable(true); 
				
				Boolean loopDone = false;
				Boolean saveFile = false;
				Writer walkerResults = null;
				
				MemoryStore memStore = new MemoryStore(dirpath);
				
				while(!loopDone) {
					saveFile = SaveFile.DoYouWantToSaveAsAFileQuestion();
					
					if(saveFile) { 
						walkerResults = fileSaver.OpenFileToSave(dirpath);
						if(walkerResults != null)
							loopDone = true;
					} else { 
						loopDone = true;
					}
				}
				
				WalkAndPrintManifest wpm = new WalkAndPrintManifest(dirpath);
				wpm.setOpaque(true);
				wpm.setBounds(10,10,780,20);
				frmMain.setContentPane(wpm);
				frmMain.pack();
				frmMain.setVisible(true);
				
				
				if(saveFile && writeFullManifest)
				{
					// legacy format with one entry for each file and directory.  Slow to parse for the javascript
					// not currently used
					PrintWriter printWriter = new PrintWriter(walkerResults);
					wpm.walk(printWriter);
				}
				else 
				{
					wpm.walk(memStore);
				}
				
				if(!saveFile) {
					String JSONData = memStore.getJSONData();
					JOptionPane.showMessageDialog(
						null,
						"Walk complete.   Output : "
								+ JSONData.substring(0, 400) + "...",
						"Success", JOptionPane.PLAIN_MESSAGE);
				} else {
					
					if(!writeFullManifest) {
						// we are using the in memory aggregated representation, we still need to write it out to disk
						PrintWriter printWriter = new PrintWriter(walkerResults);
						printWriter.println(memStore.getJSONData());
					}
					
					fileSaver.CloseFileAndMessageUser((FileWriter) walkerResults);
				}
				
				frmMain.dispose();
				
			}
		}
	}

}
