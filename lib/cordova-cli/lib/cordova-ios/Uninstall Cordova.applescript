-- Licensed to the Apache Software Foundation (ASF) under one
-- or more contributor license agreements.  See the NOTICE file
-- distributed with this work for additional information
-- regarding copyright ownership.  The ASF licenses this file
-- to you under the Apache License, Version 2.0 (the
-- "License"); you may not use this file except in compliance
-- with the License.  You may obtain a copy of the License at
-- 
--   http://www.apache.org/licenses/LICENSE-2.0
-- 
-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License.

set question to display dialog "Uninstall Cordova?" buttons {"Yes", "No"} default button 2 with icon caution
set answer to button returned of question

if answer is equal to "Yes" then
	tell application "Finder" to set home_path to home as text
	tell application "Finder" to set startup_hd to startup disk as string
	
	-- delete Xcode 3 Template
	set source to (home_path & "Library:Application Support:Developer:Shared:Xcode:Project Templates:Cordova")
	tell application "Finder"
		if exists folder source then
			delete source
		end if
	end tell
	-- delete Xcode 4 Template
	set source to (home_path & "Library:Developer:Xcode:Templates:Project Templates:Application:Cordova-based Application.xctemplate")
	tell application "Finder"
		if exists folder source then
			delete source
		end if
	end tell
	-- delete CordovaLib (used by Xcode 3 Template, and generating Cordova.framework if need be)
	set source to (home_path & "Documents:CordovaLib")
	tell application "Finder"
		if exists folder source then
			delete source
		end if
	end tell
	-- delete Cordova.framework (used by Xcode 4 Template) and its parent directories
	set source to (startup_hd & "Users:Shared:Cordova")
	tell application "Finder"
		if exists folder source then
			delete source
		end if
	end tell
	-- delete symlink to Cordova.framework
	set source to (home_path & "Library:Frameworks:Cordova.framework")
	tell application "Finder"
		if exists file source then
			delete source
		end if
	end tell
	-- end
	display dialog "Cordova uninstalled." buttons {"Goodbye ☹"} with icon note
else
	display dialog "Phew!" buttons {"That was close ☺"} with icon note
end if
