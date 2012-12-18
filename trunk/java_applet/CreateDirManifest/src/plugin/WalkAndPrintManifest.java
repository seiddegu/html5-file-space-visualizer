package plugin;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.Insets;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;
import java.io.File;
import java.io.PrintWriter;

import javax.swing.BorderFactory;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.SwingWorker;


/*
 *  Class to recursively walk a directory tree and print the results as a manifest into any PrintWriter
 *  Somewhat complicated since we need to implement a background thread and a JPanel for progress info
 */
public class WalkAndPrintManifest extends JPanel implements PropertyChangeListener  {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private String m_rootDirName;
	private File m_root;
	private JProgressBar m_progressBar;
	private JTextArea m_taskOutput;
	private MessageConsole m_messageConsole;

	public WalkAndPrintManifest(String dirName) {
		super(new BorderLayout());

		m_rootDirName = dirName;
		m_root = new File(m_rootDirName);
		
		createGUI();
	}
	
	 
    private void createGUI() {
        //Create and set up the window.
        JFrame frame = new JFrame("ProgressBarDemo");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        m_progressBar = new JProgressBar();
		m_progressBar.setIndeterminate(true);
		m_progressBar.setStringPainted(true);
		m_progressBar.setString("Traversing Directories...");
        m_progressBar.setSize(300, 40);
		
		m_taskOutput = new JTextArea(10, 100);
        m_taskOutput.setMargin(new Insets(5,5,5,5));
        m_taskOutput.setEditable(false);
		
		JPanel panel = new JPanel();
        panel.add(m_progressBar);
        add(panel, BorderLayout.PAGE_START);
        add(new JScrollPane(m_taskOutput), BorderLayout.CENTER);
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        m_messageConsole = new MessageConsole(m_taskOutput);
        m_messageConsole.redirectOut();
        m_messageConsole.redirectErr(Color.RED, null);
        m_messageConsole.setMessageLines(100);
       
    }

	private void addHeader(PrintWriter pw) {
		pw.println("=FILENAME,type=[file|directory],st_mtime=INT,st_size=TIME_T");
	}
	
	private void addFooter(PrintWriter pw) {
		pw.println("END OF FILE LIST");
		pw.println("END OF FILE");
	}

	// This version of walk prints the results to a serialized printWriter
	public void walk(PrintWriter printWriter) {

		if(!m_root.exists())
		{
			JOptionPane.showMessageDialog(null, 
					"Unable to open selected directory.  Cannot continue.   Directory Name: " + m_rootDirName,
					"Error", JOptionPane.ERROR_MESSAGE); 
		}
		
		setCursor(Cursor.getPredefinedCursor(Cursor.WAIT_CURSOR));
	  	
		addHeader(printWriter);
		
		recurseDirectoryTask task = new recurseDirectoryTask();
		task.setArguments( m_root.getPath().length(), m_root, printWriter, null);
		task.addPropertyChangeListener(this);
		task.execute();
		try {
			task.get();    // wait for the background thread to finish
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		addFooter(printWriter);

		printWriter.close();
		
		setCursor(Cursor.getPredefinedCursor(Cursor.DEFAULT_CURSOR));
	    		
	}
	
	// This version of walk outputs the results into a structured memory store
	public void walk(MemoryStore memStore) {
		
		if(!m_root.exists())
		{
			JOptionPane.showMessageDialog(null, 
					"Unable to open selected directory.  Cannot continue.   Directory Name: " + m_rootDirName,
					"Error", JOptionPane.ERROR_MESSAGE); 
		}
		
		setCursor(Cursor.getPredefinedCursor(Cursor.WAIT_CURSOR));
	  	
		
		recurseDirectoryTask task = new recurseDirectoryTask();
		task.setArguments( m_root.getPath().length(), m_root, null, memStore);
		task.addPropertyChangeListener(this);
		task.execute();
		try {
			task.get();    // wait for the background thread to finish
		} catch (Exception e) {
			e.printStackTrace();
		}
				
		setCursor(Cursor.getPredefinedCursor(Cursor.DEFAULT_CURSOR));
		
	}
	
	/**
	 * Receive the progress events from the background thread
	 */
	@Override
	public void propertyChange(PropertyChangeEvent evt) {
		if ("progressString" == evt.getPropertyName()) {
            String progress = (String) evt.getNewValue();
            m_taskOutput.append(progress + "\n");
            //m_progressBar.setString(progress.substring(progress.lastIndexOf(File.separator)));
        } 
		
	}

	
	/**
	 * A separate class to do the background walk in a separate task thread
	 **/
	class recurseDirectoryTask extends SwingWorker<Void, Void> {
	
		int m_rootDirLength;
		File m_rootDir;
		PrintWriter m_pwriter;
		MemoryStore m_memStore;
		int m_totalDirectories = 1;
		
		/**
		 * @param rootDirLength the length of the base directory, used to subtract the root directory from the abs path of each file
		 * @param dir A file object defining the current top directory
		 * @param pw A write location.
		 **/
		public void setArguments(int rootDirLength, File rootDir, PrintWriter pw, MemoryStore ms) {
			m_rootDirLength = rootDirLength;
			m_rootDir = rootDir;
			m_pwriter = pw;
			m_memStore = ms;
		}
		
		/**
		 * Recursive function to descend into the directory tree and find all the files 
		 * that end with ".mp3"
		**/
		 @Override
	     public Void doInBackground() {
			 
			 walkDirectory(m_rootDir);
			 
			 String update = "Done walking directories.   Found: " + m_totalDirectories + " directories.";
			 firePropertyChange("progressString", "", update);
			 firePropertyChange("progressString", "", "Generating JSON data for the browser...");
			 
			 return null;
		 }
	
		 private void walkDirectory(File dir) {
			 
			firePropertyChange("progressString", "", dir.getPath());
			
			File listFile[] = dir.listFiles();
			if(listFile != null) {
				for(int i=0; i<listFile.length; i++) {

					if(listFile[i].isDirectory()) {
						m_totalDirectories++;
						if(m_pwriter != null) {
							m_pwriter.println("="+listFile[i].getPath().substring(m_rootDirLength)+",type=directory,st_mtime="+listFile[i].lastModified()+",st_size="+listFile[i].length());
						} else {
							m_memStore.AddFileToStore(listFile[i], m_rootDirLength);
						}

						walkDirectory(listFile[i]);
					} else {

						if(m_pwriter != null) {
							m_pwriter.println("="+listFile[i].getPath().substring(m_rootDirLength)+",type=file,st_mtime="+listFile[i].lastModified()+",st_size="+listFile[i].length());
						} else {
							m_memStore.AddFileToStore(listFile[i], m_rootDirLength);
						}
					}
				}
			}
		}
	}


}
