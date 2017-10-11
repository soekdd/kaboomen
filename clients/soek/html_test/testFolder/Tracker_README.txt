Tracker 4.9x 
Copyright (c) 2017 Douglas Brown, Wolfgang Christian


Contents
========
 - General description
 - Features
 - System requirements
 - Installed files
 - Uninstalling
 - Licensing and redistribution
 - Contact information


General description
===================

Tracker is a free video analysis and modeling tool built on the Open Source Physics (OSP) Java framework. It is designed to be used in introductory physics courses.
 

Features
============

Tracking:
 - Manual and automated object tracking with position, velocity and acceleration overlays and data. 
 - Center of mass tracks. 
 - Interactive graphical vectors and vector sums. 
 - RGB line profiles at any angle, time-dependent RGB regions. 

Modeling:
 - Model Builder creates kinematic and dynamic models of point mass particles and two-body systems. 
 - Model overlays are automatically synchronized and scaled to the video for direct visual comparison with the real world. 
 - External Models use data from separate modeling programs such as spreadsheets and EjsS simulations. 

Video:
 - Free Xuggle video engine plays and records most formats (mov/avi/flv/mp4/wmv etc) on Windows/OSX/Linux. 
 - QuickTime video engine also supported on Windows and OSX (but not recommended). 
 - Video filters, including brightness/contrast, strobe, ghost trails, and deinterlace filters. 
 - Perspective filter corrects distortion when objects are photographed at an angle rather than straight-on. 
 - Radial distortion filter corrects distortion associated with fisheye lenses. 
 - Export Video wizard enables editing and transcoding videos, with or without overlay graphics, using Tracker itself. 
 - Video Properties dialog shows video dimensions, path, frame rate, frame count, more. 

Data generation and analysis:
 - Fixed or time-varying coordinate system scale, origin and tilt. 
 - Multiple calibration options: tape, stick, calibration points and/or offset origin. 
 - Switch easily to center of mass and other reference frames. 
 - Protractors and tape measures provide easy distance and angle measurements. 
 - Circle fitter tool fits circles to multiple points, steps and tracks. 
 - Define custom variables for plotting and analysis. 
 - Add editable text columns for comments or manually entered data. 
 - Data analysis tool includes powerful automatic and manual curve fitting. 
 - Export formatted or raw data to a delimited text file or the clipboard. 

Digital Library resources:
 - OSP Digital Library Browser provides easy access to online collections of videos and Tracker resources. 
 - Use the DL Browser to find resources by name, author, keywords or other metadata. 
 - Use the DL Browser to create, edit and share your own video and resource libraries. 
 - Use Tracker to export self-documenting TRZ ("Tracker Zip") files ideal for the Digital Library Browser. 

Other:
 - Full undo/redo with multiple steps. 
 - Page view displays html instructions or student notes. 
 - User preferences: GUI configuration, video engine, default language, font size, more. 


System requirements: Windows (XP, 7, 8, 10)
=========================================

You must run Tracker in a 32-bit Java 1.6+ VM to use both the Xuggle and QuickTime video engines, even on a 64-bit Windows machine. To see which Java VM you are running in, choose Help|About Java. The first line shows the Java version and bitness. Note: the 32-bit Java VM must be installed separately--for help, see Tracker Help: Installation.

On Windows 8, you may need to run the Tracker installer as administrator.


System requirements: Mac OSX (10.5+)
============================

You must run Tracker in a 64-bit Java 1.6+ VM to use the Xuggle video engine or a 32-bit Java VM to use the QuickTime video engine. To see which Java VM you are running in, choose Help|About Java. The first line shows the Java version and bitness. The Java VM installed by default with OSX can be used in both 32-bit and 64-bit modes; no separate installation is required.  


System requirements: Linux (tested on Ubuntu)
============================

There are separate Tracker installers for 32-bit and 64-bit Linux machines. You must run Tracker in a Java 1.6+ VM. To see which Java VM you are running in, choose Help|About Java. The first line shows the Java version and bitness.

A permissions issue for /usr/share/mime has been reported after installation on Ubuntu Server. You may have to restore permissions to 644(?). 


Installed files: Windows
========================

In the Tracker home directory (Program Files (x86)\Tracker by default): 
 - Tracker.exe
 - tracker.jar
 - tracker-4.xx.jar
 - tracker.ico
 - tracker_icon.png
 - tracker_install.log
 - Tracker_README.txt
 - uninstall_Tracker.exe
 - uninstall_Tracker.dat
 - .tracker.prefs
 - xuggle-xuggler.jar
 - logback-core.jar 
 - logback-classic.jar
 - slf4j-api.jar
 - tracker_start.log (only after Tracker is launched)
 - Xuggle directory

In the user home directory: 
 - .tracker.prefs

In the videos and experiments directory (My Documents\Tracker by default): 
 - experiments subdirectory 
 - videos subdirectory
 - tracker_start.log (only after Tracker is launched)

In the Start Menu Tracker folder:
 - Tracker shortcut
 - Uninstall Tracker shortcut

In the current Java extensions directory (jreHome/lib/ext): 
 - QTJava.zip (only if QuickTime is installed)


Installed files: Mac OSX
========================

In the Tracker home folder (hidden /usr/local/tracker by default):
 - Tracker_README.txt
 - tracker_install.log
 - uninstall_Tracker.app
 - .tracker.prefs (hidden file)
 - share folder (only if videos and experiments installed--see below)

In the /Applications folder:
 - Tracker.app (contains the following hidden folders and files)
 - Contents folder 
 	- Info.plist
	- MacOS folder
		- JavaApplicationStub
	- Resources folder
		- tracker.icns
		- Java folder
			- tracker_starter.jar
 			- tracker.jar
 			- tracker-4.xx.jar
			- xuggle-xuggler.jar
			- logback-core.jar 
			- logback-classic.jar
			- slf4j-api.jar
		- Xuggle folder

In the videos and experiments folder (hidden /usr/local/tracker/share by default): 
 - videos folder containing video files 
 - experiments folder containing .trk experiment files 

In addition, if installed by a user rather than a superuser (root):

In the user home (~): 
 - .tracker.prefs (hidden file)

In the user Documents folder (~/Documents):
 - Tracker folder
 	- Tracker.app symlink
	- tracker_start.log (only after Tracker is launched)
 	- resources symlink to videos and experiments folder

In the Java extensions directory (/Library/Java/Extensions): 
 - QTJava.zip
 - libQTJNative.jnilib


Installed files: Linux
======================

In the Tracker home folder (/opt/tracker by default):
 - tracker.jar
 - tracker-4.xx.jar
 - tracker_starter.jar
 - Tracker_README.txt
 - tracker_install.log
 - tracker.desktop
 - tracker.sh
 - tracker_icon48.png
 - uninstall_Tracker
 - uninstall_Tracker.dat
 - .tracker.prefs (hidden file)
 - xuggle-xuggler.jar
 - logback-core.jar 
 - logback-classic.jar
 - slf4j-api.jar
 - share folder (only if videos and experiments installed--see below)
 - Xuggle folder

In the videos and experiments folder (/opt/tracker/share by default): 
 - videos folder containing video files 
 - experiments folder containing .trk experiment files

In the applications folder (/usr/share/applications):
 - tracker.desktop

In addition, if installed by a user (i.e., using sudo) rather than a superuser (root):

In the user home (~): 
 - .tracker.prefs (hidden file)

In the user Documents folder (~/Documents):
 - Tracker folder
 	- tracker.desktop
	- tracker_start.log (only after Tracker is launched)
 	- resources symlink to videos and experiments folder


Uninstalling Tracker: Windows
=============================

The "uninstall_Tracker.exe" file is in the Tracker home folder (Program Files\Tracker by default). To run the uninstaller, double-click it. You can also run this uninstaller from the Add/Remove Programs control panel or by choosing the Uninstall Tracker menu item in the Start Menu.

Uninstalling Tracker: Mac OSX
=============================

The "uninstall_Tracker.app" file is in the Tracker home folder (/usr/local/tracker/ by default). To run the uninstaller, double-click it. Enter your password to complete the uninstallation. 

Uninstalling Tracker: Linux
===========================

The "uninstall_Tracker" file is in the Tracker home folder (/opt/tracker/ by default). To run the uninstaller, open a terminal window and type "sudo /opt/tracker/uninstall_Tracker". Enter your password to complete the uninstallation. Note: the uninstaller requires the data file "uninstall_Tracker.dat" in the same folder to operate.


Licensing and redistribution
============================

Tracker is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.
 
Tracker is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.


Contact information
=====================

Tracker developer: Douglas Brown, dobrown@cabrillo.edu

Tracker home: http://www.cabrillo.edu/~dbrown/tracker/

OSP development team: Wolfgang Christian (leader), Mario Belloni, Douglas Brown, Anne Cox, Francisco Esquembre, Harvey Gould, Bill Junkin, Aaron Titus and Jan Tobochnik.

OSP home: http://www.opensourcephysics.org/

I appreciate and welcome any comments, feature requests and bug reports.
