/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
import org.junit.*;
import static org.junit.Assert.*;

import org.apache.cordova.PreferenceNode;

public class PreferenceNodeTest {
    @Test
        public void testConstructor() {
            PreferenceNode foo = new org.apache.cordova.PreferenceNode("fullscreen", "false", false);
            assertEquals("fullscreen", foo.name);
            assertEquals("false", foo.value);
            assertEquals(false, foo.readonly);
        }

    @Test
        public void testNameAssignment() {
            PreferenceNode foo = new org.apache.cordova.PreferenceNode("fullscreen", "false", false);
            foo.name = "widescreen";
            assertEquals("widescreen", foo.name);
        }

    @Test
        public void testValueAssignment() {
            PreferenceNode foo = new org.apache.cordova.PreferenceNode("fullscreen", "false", false);
            foo.value = "maybe";
            assertEquals("maybe", foo.value);
        }

    @Test
        public void testReadonlyAssignment() {
            PreferenceNode foo = new org.apache.cordova.PreferenceNode("fullscreen", "false", false);
            foo.readonly = true;
            assertEquals(true, foo.readonly);
        }
}
