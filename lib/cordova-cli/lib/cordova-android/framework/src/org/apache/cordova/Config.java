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

package org.apache.cordova;

import java.io.IOException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.cordova.api.LOG;

import org.xmlpull.v1.XmlPullParserException;

import android.app.Activity;

import android.content.res.XmlResourceParser;

import android.util.Log;

public class Config {

    public static final String TAG = "Config";

    private ArrayList<Pattern> whiteList = new ArrayList<Pattern>();
    private HashMap<String, Boolean> whiteListCache = new HashMap<String, Boolean>();
    private String startUrl;

    private static Config self = null;

    public static void init(Activity action) {
        if (self == null) {
            self = new Config(action);
        }
    }

    // Intended to be used for testing only; creates an empty configuration.
    public static void init() {
        if (self == null) {
            self = new Config();
        }
    }

    // Intended to be used for testing only; creates an empty configuration.
    private Config() {
    }

    private Config(Activity action) {
        if (action == null) {
            LOG.i("CordovaLog", "There is no activity. Is this on the lock screen?");
            return;
        }

        int id = action.getResources().getIdentifier("config", "xml", action.getPackageName());
        if (id == 0) {
            id = action.getResources().getIdentifier("cordova", "xml", action.getPackageName());
            LOG.i("CordovaLog", "config.xml missing, reverting to cordova.xml");
        }
        if (id == 0) {
            LOG.i("CordovaLog", "cordova.xml missing. Ignoring...");
            return;
        }

        XmlResourceParser xml = action.getResources().getXml(id);
        int eventType = -1;
        while (eventType != XmlResourceParser.END_DOCUMENT) {
            if (eventType == XmlResourceParser.START_TAG) {
                String strNode = xml.getName();

                if (strNode.equals("access")) {
                    String origin = xml.getAttributeValue(null, "origin");
                    String subdomains = xml.getAttributeValue(null, "subdomains");
                    if (origin != null) {
                        this._addWhiteListEntry(origin, (subdomains != null) && (subdomains.compareToIgnoreCase("true") == 0));
                    }
                }
                else if (strNode.equals("log")) {
                    String level = xml.getAttributeValue(null, "level");
                    LOG.i("CordovaLog", "Found log level %s", level);
                    if (level != null) {
                        LOG.setLogLevel(level);
                    }
                }
                else if (strNode.equals("preference")) {
                    String name = xml.getAttributeValue(null, "name");
                    String value = xml.getAttributeValue(null, "value");

                    LOG.i("CordovaLog", "Found preference for %s=%s", name, value);
                    Log.d("CordovaLog", "Found preference for " + name + "=" + value);

                    action.getIntent().putExtra(name, value);
                }
                else if (strNode.equals("content")) {
                    String src = xml.getAttributeValue(null, "src");

                    LOG.i("CordovaLog", "Found start page location: %s", src);

                    if (src != null) {
                        Pattern schemeRegex = Pattern.compile("^[a-z]+://");
                        Matcher matcher = schemeRegex.matcher(src);
                        if (matcher.find()) {
                            startUrl = src;
                        } else {
                            if (src.charAt(0) == '/') {
                                src = src.substring(1);
                            }
                            startUrl = "file:///android_asset/www/" + src;
                        }
                    }
                }

            }

            try {
                eventType = xml.next();
            } catch (XmlPullParserException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * Add entry to approved list of URLs (whitelist)
     *
     * @param origin        URL regular expression to allow
     * @param subdomains    T=include all subdomains under origin
     */
    public static void addWhiteListEntry(String origin, boolean subdomains) {
        if (self == null) {
            return;
        }

        self._addWhiteListEntry(origin, subdomains);
    }


    private void _addWhiteListEntry(String origin, boolean subdomains) {
        try {
            // Unlimited access to network resources
            if (origin.compareTo("*") == 0) {
                LOG.d(TAG, "Unlimited access to network resources");
                this.whiteList.add(Pattern.compile(".*"));
            } else { // specific access
                // check if subdomains should be included
                // TODO: we should not add more domains if * has already been added
                if (subdomains) {
                    // XXX making it stupid friendly for people who forget to include protocol/SSL
                    if (origin.startsWith("http")) {
                        this.whiteList.add(Pattern.compile(origin.replaceFirst("https?://", "^https?://(.*\\.)?")));
                    } else {
                        this.whiteList.add(Pattern.compile("^https?://(.*\\.)?" + origin));
                    }
                    LOG.d(TAG, "Origin to allow with subdomains: %s", origin);
                } else {
                    // XXX making it stupid friendly for people who forget to include protocol/SSL
                    if (origin.startsWith("http")) {
                        this.whiteList.add(Pattern.compile(origin.replaceFirst("https?://", "^https?://")));
                    } else {
                        this.whiteList.add(Pattern.compile("^https?://" + origin));
                    }
                    LOG.d(TAG, "Origin to allow: %s", origin);
                }
            }
        } catch (Exception e) {
            LOG.d(TAG, "Failed to add origin %s", origin);
        }
    }

    /**
     * Determine if URL is in approved list of URLs to load.
     *
     * @param url
     * @return
     */
    public static boolean isUrlWhiteListed(String url) {
        if (self == null) {
            return false;
        }

        // Check to see if we have matched url previously
        if (self.whiteListCache.get(url) != null) {
            return true;
        }

        // Look for match in white list
        Iterator<Pattern> pit = self.whiteList.iterator();
        while (pit.hasNext()) {
            Pattern p = pit.next();
            Matcher m = p.matcher(url);

            // If match found, then cache it to speed up subsequent comparisons
            if (m.find()) {
                self.whiteListCache.put(url, true);
                return true;
            }
        }
        return false;
    }

    public static String getStartUrl() {
        if (self == null || self.startUrl == null) {
            return "file:///android_asset/www/index.html";
        }
        return self.startUrl;
    }
}
