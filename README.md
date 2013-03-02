PhoneGap
========

> PhoneGap is a web platform that exposes native mobile device apis and data to JavaScript. PhoneGap is a distribution of [Apache Cordova](http://cordova.io).


Get Started
-----------

[Getting Started Guides](http://docs.phonegap.com/guide_getting-started_index.md.html)


How to add PhoneGap in Visual Studio project templates
------------------------------------------------------
This distribution includes a ready to use Visual Studio project template.

However, is still required a bit of manual operations:
- Locate the folder where you expanded the PhoneGap distribution, that is cordova-X.Y.Z
  (where X, Y and Z represent the version number of your Cordova).
- Zip the all content of the \lib\windows8\template sub folder.
- Move this zip file to \path\to\your\Documents\Visual Studio 2012\Templates\ProjectTemplates\JavaScript\ folder.
When you open a new instance of Visual Studio 2012 and select File->New->Project, you will see the PhoneGap project template.

Community
---------

- [Website](http://phonegap.com)
- [Documentation](http://docs.phonegap.com/)
- [Twitter](http://twitter.com/phonegap)
- [Facebook](http://facebook.com/phonegap)
- [Wiki](http://wiki.phonegap.com/)
- [Mailing List](http://groups.google.com/group/phonegap)
- [Issue Tracker](https://issues.apache.org/jira/browse/CB)
- [IRC](http://webchat.freenode.net/?channels=#phonegap)

Directory Structure
-------------------

	  |-doc/ ........... source documentation
	  |-lib/ ........... platform code for supported operating systems
	  | |-android/
	  | |-bada/
	  | |-blackberry/
	  | |-ios/
	  | |-symbian/
	  | |-webos/
      | |-windows-phone-7
      | |-windows-phone-8
	  | |-windows8/
	  |-changelog ..... a changelog compiled from comments and authors
	  |-license ....... the Apache Software License v2
	  |-version ....... release version in plain text
	  '-readme.md ..... release readme

