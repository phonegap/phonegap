/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.cordova.globalization;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Calendar;
import java.util.Date;
import java.util.Hashtable;
import java.util.TimeZone;

import net.rim.device.api.i18n.DateFormat;
import net.rim.device.api.i18n.Locale;
import net.rim.device.api.i18n.SimpleDateFormat;
import net.rim.device.api.system.NonPersistableObjectException;
import net.rim.device.api.system.PersistentObject;
import net.rim.device.api.system.PersistentStore;
import net.rim.device.api.util.StringMatch;
import net.rim.device.api.util.StringUtilities;
import net.rim.device.api.compress.GZIPInputStream;

import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONObject;
import org.apache.cordova.json4j.internal.Parser;
import org.apache.cordova.util.StringUtils;
import org.apache.cordova.util.Logger;

public class Util {

    /**
     * Provides manual date string parsing
     *
     * @param d
     *            Date string
     * @param p
     *            Pattern string
     * @return Calendar
     */
    public static Calendar dateParserBB(String d, String p) {
        String time = "";
        String date = d;
        String delimiter = Resources.DATEDELIMITER; // "-"
        try {
            // replace '/' with '-' (to compensate for delimiters '/' and '-' in
            // string)
            date = date.replace('/', '-');

            // extract time first
            if (date.indexOf(':') > 0) {
                time = date.substring(date.indexOf(':') - 2, date.length())
                        .trim();
                date = date.substring(0, date.indexOf(':') - 2).trim();
            }

            // determine string delimiter
            if (date.indexOf(delimiter) == -1) { // is not in short format
                delimiter = Resources.SPACE; // " "
            }

            // split date into sections
            JSONArray str = Util.split(date, delimiter);
            if (str == null) {
                throw new Exception(); // incorrect format
            }

            // remove day of week and other unwanted characters -- will
            // automatically be set in calendar object
            str = Util.removeDayOfWeek(str);

            // convert month string into integer: if applicable
            str = Util.convertMonthString(str);

            // use pattern to determine order of dd, mm, yyyy. If no pattern
            // will use Locale Default order
            Hashtable patternFmt = Util.getDatePattern(p);

            // create calendar object
            Calendar c = Calendar.getInstance(TimeZone.getDefault());

            // set calendar instance:
            c.set(Calendar.YEAR, Integer.parseInt(removeSymbols(str
                    .getString(Integer.parseInt(patternFmt.get("year")
                            .toString())))));
            c.set(Calendar.MONTH, Integer.parseInt(removeSymbols(str
                    .getString(Integer.parseInt(patternFmt.get("month")
                            .toString())))));
            c.set(Calendar.DAY_OF_MONTH, Integer.parseInt(removeSymbols(str
                    .getString(Integer.parseInt(patternFmt.get("day")
                            .toString())))));

            // set time if applicable
            if (time.length() > 0) {
                JSONArray t = Util.split(time, Resources.TIMEDELIMITER);
                // determine if 12hour or 24hour clock
                int am_pm = getAmPm(t.getString(t.length() - 1).toString());
                if (!t.isNull(0)) {
                    c.set(Calendar.HOUR,
                            Integer.parseInt(removeSymbols(t.getString(0))));
                }
                if (!t.isNull(1)) {
                    c.set(Calendar.MINUTE,
                            Integer.parseInt(removeSymbols(t.getString(1))));
                }
                if (!t.isNull(2)) {
                    c.set(Calendar.SECOND,
                            Integer.parseInt(removeSymbols(t.getString(2))));
                }
                if (am_pm != -1) {
                    c.set(Calendar.AM_PM, am_pm);
                }
            }
            return c;
        } catch (Exception e) {
        }
        return null;
    }

    /**
     * Returns a pattern string for formatting and parsing dates according to
     * the client's user preferences.
     *
     * @param options
     *            JSONArray options (user pattern)
     *
     * @return String (String}: The date and time pattern for formatting and
     *         parsing dates. The patterns follow Unicode Technical Standard #35
     *         http://unicode.org/reports/tr35/tr35-4.html
     *
     * @throws GlobalizationError
     */
    public static String getBlackBerryDatePattern(JSONArray options)
            throws GlobalizationError {

        try {
            // default user preference for date
            String fmtDate = ((SimpleDateFormat) DateFormat
                    .getInstance(DateFormat.DATE_SHORT)).toPattern();
            // default user preference for time
            String fmtTime = ((SimpleDateFormat) DateFormat
                    .getInstance(DateFormat.TIME_SHORT)).toPattern();
            // default SHORT date/time format. ex. dd/MM/yyyy h:mma
            String fmt = fmtDate + Resources.SPACE + fmtTime;

            // get Date value + options (if available)
            if (options.getJSONObject(0).length() > 1) {
                // options were included. get formatLength option
                if (!((JSONObject) options.getJSONObject(0).get(
                        Resources.OPTIONS)).isNull(Resources.FORMATLENGTH)) {
                    String fmtOpt = (String) ((JSONObject) options
                            .getJSONObject(0).get(Resources.OPTIONS))
                            .get(Resources.FORMATLENGTH);
                    // medium
                    if (fmtOpt.equalsIgnoreCase(Resources.MEDIUM)) {
                        // default user preference for date
                        fmtDate = ((SimpleDateFormat) DateFormat
                                .getInstance(DateFormat.DATE_MEDIUM))
                                .toPattern();
                        // default user preference for time
                        fmtTime = ((SimpleDateFormat) DateFormat
                                .getInstance(DateFormat.TIME_MEDIUM))
                                .toPattern();
                    } else if (fmtOpt.equalsIgnoreCase(Resources.LONG)) { // long/full
                        // default user preference for date
                        fmtDate = ((SimpleDateFormat) DateFormat
                                .getInstance(DateFormat.DATE_LONG)).toPattern();
                        // default user preference for time
                        fmtTime = ((SimpleDateFormat) DateFormat
                                .getInstance(DateFormat.TIME_LONG)).toPattern();
                    } else if (fmtOpt.equalsIgnoreCase(Resources.FULL)) { // long/full
                        // default user preference for date
                        fmtDate = ((SimpleDateFormat) DateFormat
                                .getInstance(DateFormat.DATE_FULL)).toPattern();
                        // default user preference for time
                        fmtTime = ((SimpleDateFormat) DateFormat
                                .getInstance(DateFormat.TIME_FULL)).toPattern();
                    }
                }

                // return pattern type
                fmt = fmtDate + Resources.SPACE + fmtTime;
                if (!((JSONObject) options.getJSONObject(0).get(
                        Resources.OPTIONS)).isNull(Resources.SELECTOR)) {
                    String selOpt = (String) ((JSONObject) options
                            .getJSONObject(0).get(Resources.OPTIONS))
                            .get(Resources.SELECTOR);
                    if (selOpt.equalsIgnoreCase(Resources.DATE)) {
                        fmt = fmtDate;
                    } else if (selOpt.equalsIgnoreCase(Resources.TIME)) {
                        fmt = fmtTime;
                    }
                }
            }
            return fmt;
        } catch (Exception ge) {
        }
        return null;
    }

    /**
     * Returns a JSONArray of either the names of the months or days of the week
     * according to the client's user preferences and calendar. Note: Months
     * will be in order from Jan - Dec, while days of week will begin on random
     * day due to Locale time differences of defined long date values
     *
     * @param item
     *            String item (days of week or months)
     * @param pattern
     *            String pattern (pattern to parse item)
     * @return JSONArray The array of names starting from either the first month
     *         in the year or the first day of the week.
     */
    public static JSONArray getDateNameString(String item, String pattern) {
        JSONArray value = new JSONArray();

        // multipliers
        long day = 1000 * 60 * 60 * 24; // 86,400,000
        long startDay = day * 3; // starting three days in to avoid locale
                                 // differences
        long month = day * 31; // 2,678,400,000

        SimpleDateFormat fmt = new SimpleDateFormat(pattern,
                Locale.getDefault());
        Date d = new Date();
        try {
            if (item.equalsIgnoreCase(Resources.MONTHS)) {
                for (int x = 0; x < 13; x++) {
                    d = new Date(startDay + (month * x));
                    // testing short Month first
                    if (!value.contains(fmt.format(d).toString())
                            && !value.isEmpty()) {
                        // add day into array
                        value.put(fmt.format(d).toString());
                    } else if (value.isEmpty()) {
                        // Initialize array
                        value.put(fmt.format(d).toString());
                    }
                }
            } else { // Days
                for (int x = 3; x < 11; x++) {
                    d = new Date(day * x);
                    // testing short day first
                    if (!value.contains(fmt.format(d).toString())
                            && !value.isEmpty()) {
                        // add day into array
                        value.put(fmt.format(d).toString());
                    } else if (value.isEmpty()) {
                        // Initialize array
                        value.put(fmt.format(d).toString());
                    }
                }
            }
            return value;
        } catch (Exception e) {
        }
        return null;
    }

    /**
     * Parses a String formatted as a percent or currency removing the symbol
     * returns the corresponding number.
     *
     * @return String Corresponding number
     *
     * @throws Exception
     */
    public static String removeSymbols(String s) throws Exception {
        StringBuffer sb = new StringBuffer(s.trim());
        try {
            // begin removing all characters before string
            for (int x = 0; x < sb.length(); x++) {
                if (Character.isDigit(sb.charAt(x))) {
                    x = sb.length() - 1; // end loop
                } else {
                    sb.deleteCharAt(x);
                }
            }
            // begin removing all characters after string
            for (int x = sb.length() - 1; x > -1; x--) {
                if (Character.isDigit(sb.charAt(x))) {
                    x = 0; // end loop
                } else {
                    sb.deleteCharAt(x);
                }
            }
            return sb.toString().trim();
        } catch (Exception e) {
        }
        return null;
    }

    /**
     * Splits string into a JSONArray Note: Other options are to use
     * org.apache.cordova.util.StringUtils.split(String strString, String
     * strDelimiter)
     *
     * @param s
     *            String s (String to split)
     * @param delimiter
     *            String delimiter (String used to split s)
     * @return JSONArray: String objects
     */
    public static JSONArray split(String s, String delimiter) {
        JSONArray result = new JSONArray();
        String str = s;
        try {
            int p = s.indexOf(delimiter);
            if (p != -1) {
                while (p != -1) {
                    result.put(str.substring(0, p).trim());
                    if (p + 1 <= str.length()) {
                        str = str.substring(p + 1);
                    } else {
                        // delimiter is the last character in the string
                        str = "";
                        break;
                    }
                    p = str.indexOf(delimiter);
                }
                // add remaining characters if any
                if (str.length() > 0) {
                    result.put(str);
                }
                return result;
            }
            return null; // incorrect delimiter
        } catch (Exception e) {
        }
        return null; // error thrown
    }

    /**
     * If applicable; removes day of week and other unwanted characters from
     * JSONArray
     *
     * @param s
     *            JSONArray s (List of date properties)
     *
     * @return JSONArray:
     *          [key: day], [int: position]
     *          [key: month], [int: position]
     *          [key: year], [int: position]
     */
    public static JSONArray removeDayOfWeek(JSONArray s) {
        JSONArray str = s;
        JSONArray list;
        try {
            // get week names in short format //$NON-NLS-1$
            list = getDateNameString(Resources.DAYS, "EEE");

            // remove day of week from JSONArray
            for (int x = 0; x < str.length(); x++) {
                // do manual checking due to short or long version of week
                // validate entry is not already an int
                if (!Character.isDigit(str.getString(x).charAt(0))) {
                    // run though short weeks to get match and remove
                    StringMatch sm;
                    for (int y = 0; y < list.length(); y++) {
                        sm = new StringMatch(list.getString(y));
                        if (sm.indexOf(str.getString(x)) != -1) {// week found
                            str.removeElementAt(x); // remove day of week
                            return str;
                        }
                        // if end of list reached, load long version of names
                        // and rerun loop
                        if (y == list.length() - 1) {
                            y = -1;
                            // get week names in long format//$NON-NLS-1$
                            list = getDateNameString(Resources.DAYS, "EEEE");
                        }
                    }
                }
            }
        } catch (Exception e) {
        }// exception caught, return initial JSONArray
        return s;
    }

    /**
     * If applicable; converts Month String into number
     *
     * @param s
     *            JSONArray s (List of date properties)
     *
     * @return JSONArray:
     *          [key: day], [int: position]
     *          [key: month], [int: position]
     *          [key: year], [int: position]
     */
    public static JSONArray convertMonthString(JSONArray s) {
        JSONArray str = s;
        JSONArray list;
        try {
            // get month names in short format
            list = getDateNameString(Resources.MONTHS, "MMM");

            // convert month string into integer if applicable
            for (int x = 0; x < str.length(); x++) {
                // do manual checking due to short or long version of months
                // validate entry is not already an int
                if (!Character.isDigit(str.getString(x).charAt(0))) {
                    // run though short format months to get index number
                    StringMatch sm;
                    for (int y = 0; y < list.length(); y++) {
                        sm = new StringMatch(list.getString(y));
                        if (sm.indexOf(str.getString(x)) != -1) {// month found
                            // replace string with integer
                            str.setElementAt(String.valueOf(y), x);
                            return str;
                        }
                        // if end of list reached load long version of names and
                        // rerun loop
                        if (y == list.length() - 1) {
                            y = -1;
                            // get month names in long format
                            list = getDateNameString(Resources.MONTHS, "MMMM");
                        }
                    }
                }
            }
            return str;
        } catch (Exception e) {
        }// exception caught, return initial JSONArray
        return s;
    }

    /**
     * Determine if am_pm present and return value. if not return -1
     *
     * @param time
     *            String time (time string of date object)
     *
     * @return int
     *          -1 = am_pm not present
     *           0 = am
     *           1 = pm
     */
    public static int getAmPm(String time) {
        // multipliers
        long am_pm = 0; // pm
        long am_pm_12 = 43200000; // am
        int value = 1;
        boolean reloop = true;

        Date d = new Date(am_pm);

        for (int x = 0; x < Resources.AM_PMFORMATS.length; x++) {
            SimpleDateFormat fmt = new SimpleDateFormat(
                    Resources.AM_PMFORMATS[x], Locale.getDefault());

            StringMatch sm = new StringMatch(fmt.format(d).toString());

            if (sm.indexOf(time) != -1) {
                return value;
            }

            if (x == Resources.AM_PMFORMATS.length - 1 && reloop) {
                d = new Date(am_pm_12);
                value = 0;
                x = -1;
                reloop = false;
            }
        }
        return -1;
    }

    /**
     * Returns Hashtable indicating position of dd, MM, and yyyy in string.
     * Position will either be 0, 1, or 2
     *
     * @param p
     *            String pattern
     *
     * @return Hashtable:
     *          [key: day], [int: position]
     *          [key: month], [int: position]
     *          [key: year], [int: position]
     *
     * @throws Exception
     */
    public static Hashtable getDatePattern(String p) {
        Hashtable result = new Hashtable();

        if (p.length() <= 0) {
            // default device preference for date
            p = ((SimpleDateFormat) DateFormat
                    .getInstance(DateFormat.DATE_SHORT)).toPattern();
        }

        // get positions
        int day = p.indexOf('d'); //$NON-NLS-1$
        int month = p.indexOf('M'); //$NON-NLS-1$
        int year = p.indexOf('y'); //$NON-NLS-1$
        // int weekDay = p.indexOf('E'); //removed in removeDayOfWeek()

        if (year < day && day < month) { // yyyy/dd/mmmm
            year = 0;
            day = 1;
            month = 2;
        } else if (day < month && month < year) { // dd/mm/yyyy
            year = 2;
            day = 0;
            month = 1;
        } else if (year < month && month < day) {// yyyy/mm/dd
            year = 0;
            day = 2;
            month = 1;
        } else if (month < day && day < year) { // mm/dd/yyyy
            year = 2;
            day = 1;
            month = 0;
        } else if (month < year && year < day) { // mm/yyyy/dd
            year = 1;
            day = 2;
            month = 0;
        } else if (day < year && year < month) { // dd/yyyy/mm
            year = 1;
            day = 0;
            month = 2;
        } else {
            return null; // an error has occurred
        }
        result.put("day", String.valueOf(day)); //$NON-NLS-1$
        result.put("month", String.valueOf(month)); //$NON-NLS-1$
        result.put("year", String.valueOf(year)); //$NON-NLS-1$
        return result;
    }

    /**
     * Returns JSONObject of returnType('currency')
     *
     * @param _locale
     *            String _locale (user supplied Locale.toString())
     * @param code
     *            String code (The ISO 4217 currency code)
     *
     * @return JSONObject: 'currency':
     *              [key: currencyCodes], [String]
     *              [key: currencyPattern], [String]
     *              [key: currencyDecimal], [String]
     *              [key: currencyFraction], [String]
     *              [key: currencyGrouping], [String]
     *              [key: currencyRounding], [String]
     *
     * @throws: Exception
     */
    public static JSONObject getCurrencyData(String _locale, String code) {
        JSONObject result = null;
        try {
            JSONArray jsonArray;
            result = getPersistentResourceBundle(_locale);
            if (result == null) {
                jsonArray = getResourceBundle(_locale).getJSONArray(
                        Resources.JSON_CURRENCY);
            } else {
                jsonArray = result.getJSONArray(Resources.JSON_CURRENCY);
            }

            for (int x = 0; x < jsonArray.length(); x++) {
                JSONObject temp = jsonArray.getJSONObject(x);
                if (temp.get(Resources.CURRENCYCODE).toString()
                        .equalsIgnoreCase(code)) {
                    result = temp;
                }
            }
        } catch (Exception e) {

        }
        return result;
    }

    /**
     * Returns JSONObject of returnType('locale')
     *
     * @param _locale
     *            String _locale (user supplied Locale.toString())
     *
     * @return JSONObject: 'locale':
     *              [key: displayName], [String]
     *              [key: firstDayOfWeek], [String]
     *              [key: pattern], [String]
     *              [key: decimalSymbol], [String]
     *              [key: currencySymbol], [String]
     *              [key: percentSymbol], [String]
     *
     * @throws Exception
     */
    public static JSONObject getLocaleData(String _locale) {
        JSONObject result = null;
        try {
            result = getPersistentResourceBundle(_locale);
            if (result == null) {
                result = getResourceBundle(_locale).getJSONObject(
                        Resources.JSON_LOCALE);
            } else {
                result = result.getJSONObject(Resources.JSON_LOCALE);
            }
        } catch (Exception e) {
        }
        return result;
    }

    /**
     * Returns resourceBundle JSONObject cached in PersistentStore
     *
     * Note: Recursively searches JSONObject from persistentStore using
     * Resources.PERSISTENTSTORE_ID for locale by removing sub-parts (separated
     * by '_')
     *
     * @param _locale
     *            String _locale (user supplied Locale.toString())
     *
     * @return JSONObject
     */
    private static JSONObject getPersistentResourceBundle(String _locale) {
        JSONObject result = null;
        try {
            // load object
            result = (JSONObject) PersistentStore.getPersistentObject(
                    Resources.PERSISTENTSTORE_ID).getContents();
        } catch (Exception e) {
            if (StringUtilities.indexOf(_locale, '_', 0, _locale.length()) > 0) {
                result = getPersistentResourceBundle(removeSubPart(StringUtils
                        .split(_locale, "_"))); //$NON-NLS-1$
            } else {
                result = null;
            }
        }
        return result;
    }

    /**
     * Returns resourceBundle File as JSONObject from
     * /resource/resourceBundles/<Locale.toString()>.js.gz
     *
     * Note: Recursively searches for locale by removing sub-parts (separated by
     * '_')
     *
     * @param _locale
     *            String _locale (user supplied Locale.toString())
     *
     * @return JSONObject
     */
    private static JSONObject getResourceBundle(String _locale) {
        JSONObject result = null;

        try {
            if (_locale == null || _locale.length() <= 0) {
                return null;
            }

            InputStream is = Util.class.getClass().getResourceAsStream(
                    Resources.LOCALEINFOPATH + _locale
                            + Resources.LOCALEINFOPATHEND);
            Parser parser = new Parser(new InputStreamReader(
                    new GZIPInputStream(is), "UTF-8"));
            result = parser.parse();

            // cache resourceBundle as JSONOBJECT
            // store new object
            PersistentObject persist = PersistentStore
                    .getPersistentObject(Resources.PERSISTENTSTORE_ID);
            // Synchronize on the PersistentObject so that no other object can
            // acquire the lock before we finish our commit operation.
            synchronized (persist) {
                persist.setContents((Hashtable) result);
                persist.commit();
            }
        } catch (NonPersistableObjectException npoe) {
            Logger.log("Globalization: Failed to persist locale: "
                    + npoe.getMessage());
        } catch (Exception e) {
            // if resourceBundle not found, recursively search for file by
            // removing substrings from name
            if (StringUtilities.indexOf(_locale, '_', 0, _locale.length()) > 0) {
                result = getResourceBundle(removeSubPart(StringUtils.split(
                        _locale, "_"))); //$NON-NLS-1$
            } else {
                result = null;
            }
        }
        return result;
    }

    /**
     * Returns substring of resourceBundle with the last section removed. Ex.
     * cs_CZ_PREEURO -> cs_CZ
     *
     * @param s
     *            String[] s (Array of locale split by '_')
     *
     * @return JSONObject
     */
    private static String removeSubPart(String[] s) {
        String result = "";
        for (int x = 0; x < s.length - 1; x++) {
            result += s[x];
            if (x != s.length - 2) {// length - 2 to account for starting at
                                    // zero
                result += "_"; //$NON-NLS-1$
            }
        }
        return result;
    }

}
