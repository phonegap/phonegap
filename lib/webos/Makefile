#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

GREP = /usr/bin/grep
CUT = /usr/bin/cut
SHELL = /bin/sh
CHMOD = chmod
CP = cp
MV = mv
NOOP = $(SHELL) -c true
RM_F = rm -f
RM_RF = rm -rf
TEST_F = test -f
TOUCH = touch
UMASK_NULL = umask 0
DEV_NULL = > /dev/null 2>&1
MKPATH = mkdir -p
CAT = cat
MAKE = make
OPEN = open
ECHO = echo
ECHO_N = echo -n
JAVA = java
PGVERSION = 2.4.0
UNAME := $(shell uname)

NAME = `$(CAT) framework/appinfo.json | $(GREP) '"id"' | $(CUT) -d \" -f 4`
VERSION = `$(CAT) framework/appinfo.json | $(GREP) '"version"' | $(CUT) -d \" -f 4`

all :: copy_js package deploy run

custom :: copy_js package deploy

package:
ifeq ($(UNAME), Linux)
	palm-package framework/
else
ifeq ($(UNAME), Darwin)
# mac OSX
	palm-package framework/
else
# assume windows OS
	palm-package.bat framework/
endif
endif


deploy:
ifeq ($(UNAME), Linux)
	palm-install $(NAME)_$(VERSION)_all.ipk
else
ifeq ($(UNAME), Darwin)
# mac OSX
	palm-install $(NAME)_$(VERSION)_all.ipk
else
# assume windows OS
	palm-install.bat $(NAME)_$(VERSION)_all.ipk
endif
endif

run:
ifeq ($(UNAME), Linux)
	palm-launch $(NAME)
else
ifeq ($(UNAME), Darwin)
# mac OSX
	palm-launch $(NAME)
else
# assume windows OS
	palm-launch.bat $(NAME)
endif
endif

copy_js:
	cp lib/cordova.webos.js framework/cordova-$(PGVERSION).js
