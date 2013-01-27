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

import java.io.File;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.*;

/**
 * This class implements the HTML5 database support to work around a bug for
 * Android 3.0 devices. It is not used for other versions of Android, since
 * HTML5 database is built in to the browser.
 */
public class Storage extends CordovaPlugin {

    // Data Definition Language
    private static final String ALTER = "alter";
    private static final String CREATE = "create";
    private static final String DROP = "drop";
    private static final String TRUNCATE = "truncate";

    SQLiteDatabase myDb = null; // Database object
    String path = null; // Database path
    String dbName = null; // Database name

    /**
     * Constructor.
     */
    public Storage() {
    }

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action
     *            The action to execute.
     * @param args
     *            JSONArry of arguments for the plugin.
     * @param callbackContext
     *            The callback context used when calling back into JavaScript.
     * @return True if the action was valid, false otherwise.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("openDatabase")) {
            this.openDatabase(args.getString(0), args.getString(1),
                    args.getString(2), args.getLong(3));
        } else if (action.equals("executeSql")) {
            String[] s = null;
            if (args.isNull(1)) {
                s = new String[0];
            } else {
                JSONArray a = args.getJSONArray(1);
                int len = a.length();
                s = new String[len];
                for (int i = 0; i < len; i++) {
                    s[i] = a.getString(i);
                }
            }
            this.executeSql(args.getString(0), s, args.getString(2));
        }
        else {
            return false;
        }
        callbackContext.success();
        return true;
    }

    /**
     * Clean up and close database.
     */
    @Override
    public void onDestroy() {
        if (this.myDb != null) {
            this.myDb.close();
            this.myDb = null;
        }
    }

    /**
     * Clean up on navigation/refresh.
     */
    public void onReset() {
        this.onDestroy();
    }

    // --------------------------------------------------------------------------
    // LOCAL METHODS
    // --------------------------------------------------------------------------

    /**
     * Open database.
     *
     * @param db
     *            The name of the database
     * @param version
     *            The version
     * @param display_name
     *            The display name
     * @param size
     *            The size in bytes
     */
    public void openDatabase(String db, String version, String display_name,
            long size) {

        // If database is open, then close it
        if (this.myDb != null) {
            this.myDb.close();
        }

        // If no database path, generate from application package
        if (this.path == null) {
            this.path = this.cordova.getActivity().getApplicationContext().getDir("database", Context.MODE_PRIVATE).getPath();
        }

        this.dbName = this.path + File.separator + db + ".db";

        /*
         * What is all this nonsense? Well the separator was incorrect so the db was showing up in the wrong 
         * directory. This bit of code fixes that issue and moves the db to the correct directory.
         */
        File oldDbFile = new File(this.path + File.pathSeparator + db + ".db");
        if (oldDbFile.exists()) {
            File dbPath = new File(this.path);
            File dbFile = new File(dbName);
            dbPath.mkdirs();
            oldDbFile.renameTo(dbFile);
        }
        
        this.myDb = SQLiteDatabase.openOrCreateDatabase(this.dbName, null);
    }

    /**
     * Execute SQL statement.
     *
     * @param query
     *            The SQL query
     * @param params
     *            Parameters for the query
     * @param tx_id
     *            Transaction id
     */
    public void executeSql(String query, String[] params, String tx_id) {
        try {
            if (isDDL(query)) {
                this.myDb.execSQL(query);
                this.webView.sendJavascript("cordova.require('cordova/plugin/android/storage').completeQuery('" + tx_id + "', '');");
            }
            else {
                Cursor myCursor = this.myDb.rawQuery(query, params);
                this.processResults(myCursor, tx_id);
                myCursor.close();
            }
        }
        catch (SQLiteException ex) {
            ex.printStackTrace();
            System.out.println("Storage.executeSql(): Error=" +  ex.getMessage());

            // Send error message back to JavaScript
            this.webView.sendJavascript("cordova.require('cordova/plugin/android/storage').failQuery('" + ex.getMessage() + "','" + tx_id + "');");
        }
    }

    /**
     * Checks to see the the query is a Data Definition command
     *
     * @param query to be executed
     * @return true if it is a DDL command, false otherwise
     */
    private boolean isDDL(String query) {
        String cmd = query.toLowerCase();
        if (cmd.startsWith(DROP) || cmd.startsWith(CREATE) || cmd.startsWith(ALTER) || cmd.startsWith(TRUNCATE)) {
            return true;
        }
        return false;
    }

    /**
     * Process query results.
     *
     * @param cur
     *            Cursor into query results
     * @param tx_id
     *            Transaction id
     */
    public void processResults(Cursor cur, String tx_id) {

        String result = "[]";
        // If query result has rows

        if (cur.moveToFirst()) {
            JSONArray fullresult = new JSONArray();
            String key = "";
            String value = "";
            int colCount = cur.getColumnCount();

            // Build up JSON result object for each row
            do {
                JSONObject row = new JSONObject();
                try {
                    for (int i = 0; i < colCount; ++i) {
                        key = cur.getColumnName(i);
                        value = cur.getString(i);
                        row.put(key, value);
                    }
                    fullresult.put(row);

                } catch (JSONException e) {
                    e.printStackTrace();
                }

            } while (cur.moveToNext());

            result = fullresult.toString();
        }

        // Let JavaScript know that there are no more rows
        this.webView.sendJavascript("cordova.require('cordova/plugin/android/storage').completeQuery('" + tx_id + "', " + result + ");");
    }

}
