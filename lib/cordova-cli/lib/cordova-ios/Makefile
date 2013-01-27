#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

##   You can set these environment variables: 
##         XC_APP (path to your Xcode.app)
##         DEVELOPER (path to your Developer folder)
##              - don't need to set this if  you use 'xcode-select'
##              - in Xcode 4.3+, this is within your app bundle: Xcode.app/Contents/Developer

SHELL = /bin/bash
CP = cp
RM_F = rm -f
RM_RF = rm -rf
PWD = `pwd`
CORDOVA_LIB = $(PWD)/CordovaLib
DEVELOPER ?= '$(shell xcode-select -print-path)'
XC_APP ?= '$(shell mdfind "kMDItemFSName=='Xcode.app' && kMDItemKind=='Application'" | head -1)'
XC = $(DEVELOPER)/usr/bin/xcodebuild
XCODE4_TEMPLATE_FOLDER=$(HOME)/Library/Developer/Xcode/Templates/Project\ Templates/Application
EXISTING_XCODE4_TEMPLATE=$(XCODE4_TEMPLATE_FOLDER)/Cordova-based\ Application.xctemplate
RENAMED_XCODE4_TEMPLATE=$(XCODE4_TEMPLATE_FOLDER)/Cordova-based\ \(pre\ 2.0\)\ Application.xctemplate

all :: install

clean-cordova-lib:
		@$(RM_RF) CordovaLib/build/
		@$(RM_F) CordovaLib/CordovaLib.xcodeproj/*.mode1v3
		@$(RM_F) CordovaLib/CordovaLib.xcodeproj/*.perspectivev3
		@$(RM_F) CordovaLib/CordovaLib.xcodeproj/*.pbxuser

clean-bin:
		@$(RM_RF) bin/templates/project/build/
		@$(RM_RF) bin/templates/project/__TESTING__.xcodeproj/*.xcworkspace
		@$(RM_RF) bin/templates/project/__TESTING__.xcodeproj/xcuserdata
		@$(RM_F) bin/templates/project/__TESTING__.xcodeproj/*.perspectivev3
		@$(RM_F) bin/templates/project/__TESTING__.xcodeproj/*.pbxuser

clean: clean-cordova-lib clean-bin

check-utils:
		@if [[ ! -e $(XC_APP) ]]; then \
				echo -e '\033[31mError: Xcode.app at "$(XC_APP)" was not found. Please download from the Mac App Store.\033[m'; exit 1;  \
		fi
		@if [[ ! -d $(DEVELOPER) ]]; then \
				echo -e '\033[31mError: The Xcode folder at "$(DEVELOPER)" was not found. Please set it to the proper one using xcode-select. For Xcode >= 4.3.1, set it using "sudo xcode-select -switch /Applications/Xcode.app/Contents/Developer".\033[m'; exit 1;  \
		fi
		@echo -e "Xcode.app: \t\t\033[33m$(XC_APP)\033[m";
		@echo -e "Using Developer folder: \033[33m$(DEVELOPER)\033[m";
		@if [ -n "$(shell ps aux | grep -i "Xcode.*.app/Contents/MacOS/Xcode" | grep -v grep)" ]; then \
			  echo -e "\033[31mError: Xcode is running! Please close Xcode and try again.\033[m" ; exit 1; \
		fi

install: check-utils clean
		@# rename the existing Xcode 4 template
		@if [ -d $(EXISTING_XCODE4_TEMPLATE) ]; then \
				mv $(EXISTING_XCODE4_TEMPLATE) $(RENAMED_XCODE4_TEMPLATE) ; \
		fi
		@make clean

uninstall:
		@# uninstall previous Cordova versions < 2.0.0
		@$(RM_RF) ~/Library/Application\ Support/Developer/Shared/Xcode/Project\ Templates/Cordova
		@$(RM_RF) ~/Library/Developer/Xcode/Templates/Project\ Templates/Application/Cordova-based\ Application.xctemplate
		@read -p "Delete all files in ~/Documents/CordovaLib/?: " ; \
		if [ "$$REPLY" == "y" ]; then \
			$(RM_RF) ~/Documents/CordovaLib/ ; \
		fi	
		@read -p "Delete the Cordova framework /Users/Shared/Cordova/Frameworks/Cordova.framework?: " ; \
		if [ "$$REPLY" == "y" ]; then \
				$(RM_RF) /Users/Shared/Cordova/Frameworks/Cordova.framework/ ; $(RM_RF) ~/Library/Frameworks/Cordova.framework ; \
		fi	
