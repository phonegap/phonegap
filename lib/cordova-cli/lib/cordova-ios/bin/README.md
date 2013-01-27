<!--
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
-->

Updating the template project
-----------------------------

1. Generate the tagged JavaScript file from the **cordova-js** repo
2. Delete the **cordova-X.X.X.js** file in **templates/project/www**
3. Copy the file from (1) into **templates/project/www**
4. Rename the file in (3) to **cordova-X.X.X.js** where X.X.X is the current Cordova version
5. Update the **&lt;script&gt;** tag reference for the **templates/project/www/index.html** file to point to (4)
