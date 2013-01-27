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
import org.apache.cordova.PreferenceSet;

public class PreferenceSetTest {
    private PreferenceSet preferences;
    private PreferenceNode screen;

    @Before
        public void setUp() {
            preferences = new PreferenceSet();
            screen = new PreferenceNode("fullscreen", "true", false);
        }

    @Test
        public void testAddition() {
            preferences.add(screen);
            assertEquals(1, preferences.size());
        }

    @Test
        public void testClear() {
            preferences.add(screen);
            preferences.clear();
            assertEquals(0, preferences.size());
        }

    @Test
        public void testPreferenceRetrieval() {
            preferences.add(screen);
            assertEquals("true", preferences.pref("fullscreen"));
        }

    @Test
        public void testNoPreferenceRetrieval() {
            // return null if the preference is not defined
            assertEquals(null, preferences.pref("antigravity"));
        }

    @Test
        public void testUnsetPreferenceChecking() {
            PreferenceSet emptySet = new PreferenceSet();
            boolean value = emptySet.prefMatches("fullscreen", "true");
            assertEquals(false, value);
        }

    @Test
        public void testSetPreferenceChecking() {
            preferences.add(screen);
            boolean value = preferences.prefMatches("fullscreen", "true");
            assertEquals(true, value);
        }
}
