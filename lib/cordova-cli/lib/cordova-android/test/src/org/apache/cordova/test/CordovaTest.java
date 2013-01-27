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
package org.apache.cordova.test;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.api.PluginManager;
import org.apache.cordova.test.actions.CordovaWebViewTestActivity;

import android.app.Instrumentation;
import android.test.ActivityInstrumentationTestCase2;
import android.view.View;

public class CordovaTest extends
    ActivityInstrumentationTestCase2<CordovaWebViewTestActivity> {

  private static final long TIMEOUT = 1000;
  private CordovaWebViewTestActivity testActivity;
  private View testView;
  private String rString;

  public CordovaTest() {
    super("org.apache.cordova.test.activities", CordovaWebViewTestActivity.class);
  }

  protected void setUp() throws Exception {
    super.setUp();
    testActivity = this.getActivity();
    testView = testActivity.findViewById(R.id.cordovaWebView);
  }

  public void testPreconditions() {
    assertNotNull(testView);
  }

  public void testForCordovaView() {
    //Sleep for no reason!!!!
    sleep();
    String className = testView.getClass().getSimpleName();
    assertTrue(className.equals("CordovaWebView"));
  }

  /*
  public void testForPluginManager() {
    CordovaWebView v = (CordovaWebView) testView;
    PluginManager p = v.getPluginManager();
    assertNotNull(p);
    String className = p.getClass().getSimpleName();
    assertTrue(className.equals("PluginManager"));
  }

  public void testBackButton() {
    CordovaWebView v = (CordovaWebView) testView;
    assertFalse(v.checkBackKey());
  }

  public void testLoadUrl() {
    CordovaWebView v = (CordovaWebView) testView;
    v.loadUrlIntoView("file:///android_asset/www/index.html");
    sleep();
    String url = v.getUrl();
    boolean result = url.equals("file:///android_asset/www/index.html");
    assertTrue(result);
    int visible = v.getVisibility();
    assertTrue(visible == View.VISIBLE);
  }

  public void testBackHistoryFalse() {
    CordovaWebView v = (CordovaWebView) testView;
    // Move back in the history
    boolean test = v.backHistory();
    assertFalse(test);
  }

  // Make sure that we can go back
  public void testBackHistoryTrue() {
    this.testLoadUrl();
    CordovaWebView v = (CordovaWebView) testView;
    v.loadUrlIntoView("file:///android_asset/www/compass/index.html");
    sleep();
    String url = v.getUrl();
    assertTrue(url.equals("file:///android_asset/www/compass/index.html"));
    // Move back in the history
    boolean test = v.backHistory();
    assertTrue(test);
    sleep();
    url = v.getUrl();
    assertTrue(url.equals("file:///android_asset/www/index.html"));
  }
  */
  

  private void sleep() {
    try {
      Thread.sleep(TIMEOUT);
    } catch (InterruptedException e) {
      fail("Unexpected Timeout");
    }
  }
}
