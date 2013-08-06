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

import org.apache.cordova.json4j.JSONArray;
import org.apache.cordova.json4j.JSONObject;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;

import net.rim.device.api.i18n.Locale;
import net.rim.device.api.i18n.SimpleDateFormat;
import net.rim.device.api.util.TimeZoneUtilities;
import javax.microedition.global.Formatter;

import java.util.Date;
import java.util.Calendar;
import java.util.TimeZone;
import java.lang.Long;

public class Globalization extends Plugin {

    /**
     * Executes the requested action and returns a PluginResult.
     *
     * @param action
     *            The action to execute.
     * @param data
     *            JSONArry of arguments for the action.
     * @param callbackId
     *            The callback ID to be invoked upon action completion
     * @return A PluginResult object with a status and message.
     */
    public PluginResult execute(String action, JSONArray data, String callbackId) {
        JSONObject obj = new JSONObject();

        try {
            if (action.equals(Resources.GETLOCALENAME)) {
                obj = getLocaleName();
            } else if (action.equals(Resources.GETPREFERREDLANGUAGE)) {
                obj = getPreferredLanguage();
            } else if (action.equalsIgnoreCase(Resources.DATETOSTRING)) {
                obj = getDateToString(data);
            } else if (action.equalsIgnoreCase(Resources.STRINGTODATE)) {
                obj = getStringToDate(data);
            } else if (action.equalsIgnoreCase(Resources.GETDATEPATTERN)) {
                obj = getDatePattern(data);
            } else if (action.equalsIgnoreCase(Resources.GETDATENAMES)) {
                obj = getDateNames(data);
            } else if (action.equalsIgnoreCase(Resources.ISDAYLIGHTSAVINGSTIME)) {
                obj = getIsDayLightSavingsTime(data);
            } else if (action.equalsIgnoreCase(Resources.GETFIRSTDAYOFWEEK)) {
                obj = getFirstDayOfWeek(data);
            } else if (action.equalsIgnoreCase(Resources.NUMBERTOSTRING)) {
                obj = getNumberToString(data);
            } else if (action.equalsIgnoreCase(Resources.STRINGTONUMBER)) {
                obj = getStringToNumber(data);
            } else if (action.equalsIgnoreCase(Resources.GETNUMBERPATTERN)) {
                obj = getNumberPattern(data);
            } else if (action.equalsIgnoreCase(Resources.GETCURRENCYPATTERN)) {
                obj = getCurrencyPattern(data);
            } else {
                return new PluginResult(PluginResult.Status.INVALID_ACTION);
            }
        } catch (GlobalizationError ge) {
            return new PluginResult(PluginResult.Status.ERROR, ge.toJson());
        } catch (Exception e) {
            return new PluginResult(PluginResult.Status.JSON_EXCEPTION);
        }

        return new PluginResult(PluginResult.Status.OK, obj);
    }

    /**
     * Returns the string identifier for the client's current locale setting.
     *
     * @return JSONObject Object.value {String}: The locale identifier
     *
     * @throws GlobalizationError.UNKNOWN_ERROR
     */
    private JSONObject getLocaleName() throws GlobalizationError {
        JSONObject obj = new JSONObject();
        try {
            return obj.put("value", Locale.getDefault().toString());
        } catch (Exception e) {
            throw new GlobalizationError(GlobalizationError.UNKNOWN_ERROR);
        }
    }

    /**
     * Returns the string identifier for the client's current language
     *
     * @return JSONObject Object.value {String}: The language identifier
     *
     * @throws GlobalizationError.UNKNOWN_ERROR
     */
    private JSONObject getPreferredLanguage() throws GlobalizationError {
        JSONObject obj = new JSONObject();
        try {
            return obj.put("value", Locale.getDefault().getDisplayLanguage()
                    .toString());
        } catch (Exception e) {
            throw new GlobalizationError(GlobalizationError.UNKNOWN_ERROR);
        }
    }

    /**
     * Returns a date formatted as a string according to the client's user
     * preferences and calendar using the time zone of the client.
     *
     * @return JSONObject Object.value {String}: The localized date string
     *
     * @throws GlobalizationError.FORMATTING_ERROR
     */
    private JSONObject getDateToString(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        try {
            Date date = new Date(Long.parseLong(options.getJSONObject(0)
                    .get(Resources.DATE).toString()));
            // get formatting pattern from BB device
            SimpleDateFormat fmt = new SimpleDateFormat(
                    Util.getBlackBerryDatePattern(options));

            // return formatted date
            return obj.put("value", fmt.format(date));
        } catch (Exception ge) {
            throw new GlobalizationError(GlobalizationError.FORMATTING_ERROR);
        }
    }

    /**
     * Parses a date formatted as a string according to the client's user
     * preferences and calendar using the time zone of the client and returns
     * the corresponding date object
     *
     * @return JSONObject
     *          Object.year {Number}: The four digit year
     *          Object.month {Number}: The month from (0 - 11)
     *          Object.day {Number}: The day from (1 - 31)
     *          Object.hour {Number}: The hour from (0 - 23)
     *          Object.minute {Number}: The minute from (0 - 59)
     *          Object.second {Number}: The second from (0 - 59)
     *          Object.millisecond {Number}: The milliseconds (from 0 - 999),
     *                                      not available on all platforms
     *
     * @throws GlobalizationError.PARSING_ERROR
     */
    private JSONObject getStringToDate(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        try {
            // get formatting pattern from BB device
            SimpleDateFormat fmt = new SimpleDateFormat(
                    Util.getBlackBerryDatePattern(options));

            // Manually parse string based on user preferences or Locale default
            String userDate = options.getJSONObject(0)
                    .get(Resources.DATESTRING).toString().trim();

            Calendar date = Util.dateParserBB(userDate, fmt.toPattern());
            if (date == null) { // date was unparsable
                throw new Exception();
            }

            // return properties;
            obj.put("year", date.get(Calendar.YEAR));
            obj.put("month", date.get(Calendar.MONTH)); // returns 0-11
            obj.put("day", date.get(Calendar.DAY_OF_MONTH));
            obj.put("hour", date.get(Calendar.HOUR));
            obj.put("minute", date.get(Calendar.MINUTE));
            obj.put("second", date.get(Calendar.SECOND));
            obj.put("millisecond", date.get(Calendar.MILLISECOND));
            return obj;
        } catch (Exception ge) {
            throw new GlobalizationError(GlobalizationError.PARSING_ERROR);
        }
    }

    /**
     * Returns a pattern string for formatting and parsing dates according to
     * the client's user preferences.
     *
     * @return JSONObject
     *          Object.pattern {String}: The date and time pattern for
     *                  formatting and parsing dates. The patterns follow
     *                  Unicode Technical Standard #35
     *                  http://unicode.org/reports/tr35/tr35-4.html
     *          Object.timezone {String}: The abbreviated name of the time
     *                  zone on the client
     *          Object.utc_offset {Number}: The current difference in seconds
     *                  between the client's time zon and coordinated universal
     *                  time.
     *          Object.dst_offset {Number}: The current daylight saving time
     *                  offset in seconds between the client's non-daylight
     *                  saving's time zone and the client's daylight saving's
     *                  time zone.
     *
     * @throws GlobalizationError.PATTERN_ERROR
     */
    private JSONObject getDatePattern(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        try {
            // TimeZone from users device
            TimeZone tz = Calendar.getInstance().getTimeZone();

            // Daylight
            boolean daylight = tz.useDaylightTime();

            // set dst_offset
            int dst_offset = 0; // defaulted to zero
            if (daylight) {
                Calendar c = Calendar.getInstance();
                dst_offset = (tz.getOffset(1, c.get(Calendar.YEAR),
                        c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH),
                        c.get(Calendar.DAY_OF_WEEK),
                        c.get(Calendar.MILLISECOND))) / 1000;
            }

            obj.put("pattern", Util.getBlackBerryDatePattern(options));
            obj.put("timezone", TimeZoneUtilities.getDisplayName(tz,
                    TimeZoneUtilities.SHORT));
            obj.put("utc_offset", tz.getRawOffset() / 1000);
            obj.put("dst_offset", dst_offset);
            return obj;
        } catch (Exception ge) {
            throw new GlobalizationError(GlobalizationError.PATTERN_ERROR);
        }
    }

    /**
     * Returns an array of either the names of the months or days of the week
     * according to the client's user preferences and calendar
     *
     * @return JSONObject
     *          Object.value {Array{String}}: The array of names starting from
     *                      either the first month in the year or the first day
     *                      of the week.
     *
     * @throws GlobalizationError.UNKNOWN_ERROR
     */
    private JSONObject getDateNames(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        JSONArray value = new JSONArray();
        try {
            int type = 0; // default wide
            int item = 0; // default months

            // get options if available
            if (options.getJSONObject(0).length() > 0) {
                // get type if available
                if (!((JSONObject) options.getJSONObject(0).get(
                        Resources.OPTIONS)).isNull(Resources.TYPE)) {
                    String t = (String) ((JSONObject) options.getJSONObject(0)
                            .get(Resources.OPTIONS)).get(Resources.TYPE);
                    if (t.equalsIgnoreCase(Resources.NARROW)) {
                        type++;
                    } // DateUtils.LENGTH_MEDIUM
                }
                // get item if available
                if (!((JSONObject) options.getJSONObject(0).get(
                        Resources.OPTIONS)).isNull(Resources.ITEM)) {
                    String t = (String) ((JSONObject) options.getJSONObject(0)
                            .get(Resources.OPTIONS)).get(Resources.ITEM);
                    if (t.equalsIgnoreCase(Resources.DAYS)) {
                        item += 10;
                    } // Days of week start at 1
                }
            }
            // determine return value

            int method = item + type;
            if (method == 1) {
                value = Util.getDateNameString(Resources.MONTHS, "MMM");
            }// months and narrow
            else if (method == 10) {
                value = Util.getDateNameString(Resources.DAYS, "EEEE");
            }// days and wide
            else if (method == 11) {
                value = Util.getDateNameString(Resources.DAYS, "EEE");
            }// days and narrow
            else {
                value = Util.getDateNameString(Resources.MONTHS, "MMMM");
            }// default: months and wide

            if (value == null) {
                throw new Exception();
            }

            // return array of names
            return obj.put("value", value);
        } catch (Exception ge) {
            throw new GlobalizationError(GlobalizationError.UNKNOWN_ERROR);
        }
    }

    /**
     * Returns whether daylight savings time is in effect for a given date using
     * the client's time zone and calendar.
     *
     * @return JSONObject
     *          Object.dst {Boolean}: The value "true" indicates that daylight
     *                      savings time is in effect for the given date and
     *                      "false" indicates that it is not.
     *
     * @throws GlobalizationError.UNKNOWN_ERROR
     *
     *             Note: Functionality to determine if date is within day light
     *             savings time is not available in this API version
     */
    private JSONObject getIsDayLightSavingsTime(JSONArray options)
            throws GlobalizationError {
        throw new GlobalizationError(GlobalizationError.UNKNOWN_ERROR);
    }

    /**
     * Returns the first day of the week according to the client's user
     * preferences and calendar. The days of the week are numbered starting from
     * 1 where 1 is considered to be Sunday.
     *
     * @return JSONObject
     *          Object.value {Number}: The number of the first day of the week.
     *
     * @throws GlobalizationError.UNKNOWN_ERROR
     */
    private JSONObject getFirstDayOfWeek(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        try {
            JSONObject result = Util.getLocaleData(Locale.getDefault()
                    .toString());

            if (result == null || result.length() <= 0) {
                throw new Exception();
            }
            return obj.put("value", Integer.valueOf(result
                    .getString(Resources.JSON_FIRISTDAYOFWEEK)));
        } catch (Exception e) {
            throw new GlobalizationError(GlobalizationError.UNKNOWN_ERROR);
        }
    }

    /**
     * Returns a number formatted as a string according to the client's user
     * preferences.
     *
     * @return JSONObject
     *          Object.value {String}: The formatted number string.
     *
     * @throws GlobalizationError.FORMATTING_ERROR
     */
    private JSONObject getNumberToString(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        String value;
        try {
            // Initialize formatter
            Formatter fmt = new Formatter(Locale.getDefault().toString());

            // obtain user supplied number
            double num = Double.parseDouble(options.getJSONObject(0)
                    .get(Resources.NUMBER).toString());
            // format based on options if available
            value = fmt.formatNumber(num);
            if (options.getJSONObject(0).length() > 1) {
                // options were included
                if (!((JSONObject) options.getJSONObject(0).get(
                        Resources.OPTIONS)).isNull(Resources.TYPE)) {
                    String fmtOpt = (String) ((JSONObject) options
                            .getJSONObject(0).get(Resources.OPTIONS))
                            .get(Resources.TYPE);
                    if (fmtOpt.equalsIgnoreCase(Resources.CURRENCY)) {
                        value = fmt.formatCurrency(num);
                    } else if (fmtOpt.equalsIgnoreCase(Resources.PERCENT)) {
                        // convert double to long
                        // used 1 decimal places as a default
                        value = fmt.formatPercentage((float) num, 1);
                    }
                }
            }
            return obj.put("value", value);
        } catch (Exception ge) {
            throw new GlobalizationError(GlobalizationError.FORMATTING_ERROR);
        }

    }

    /**
     * Parses a number formatted as a string according to the client's user
     * preferences and returns the corresponding number.
     *
     * @return JSONObject
     *          Object.value {Number}: The parsed number.
     *
     * @throws GlobalizationError.PARSING_ERROR
     */
    private JSONObject getStringToNumber(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        double value = 0;
        try {
            // format based on options if available
            String num = options.getJSONObject(0).get(Resources.NUMBERSTRING)
                    .toString().trim();
            if (options.getJSONObject(0).length() > 1) {
                // options were included
                if (!((JSONObject) options.getJSONObject(0).get(
                        Resources.OPTIONS)).isNull(Resources.TYPE)) {
                    String fmtOpt = (String) ((JSONObject) options
                            .getJSONObject(0).get(Resources.OPTIONS))
                            .get(Resources.TYPE);
                    // remove unwanted symbols
                    if (fmtOpt.equalsIgnoreCase(Resources.CURRENCY)) {
                        value = (Double.parseDouble(Util.removeSymbols(num)));
                    } else if (fmtOpt.equalsIgnoreCase(Resources.PERCENT)) {
                        value = (Double.parseDouble(Util.removeSymbols(num)) / 100);
                    }
                }
            } else {
                value = Double.parseDouble(num); // decimal default
            }

            return obj.put("value", value);
        } catch (Exception ge) {
            throw new GlobalizationError(GlobalizationError.PARSING_ERROR);
        }
    }

    /**
     * Returns a pattern string for formatting and parsing numbers according to
     * the client's user preferences.
     *
     * @return JSONObject
     *          Object.pattern {String}: The number pattern for formatting and
     *                      parsing numbers. The patterns follow Unicode
     *                      Technical Standard #35.
     *                      http://unicode.org/reports/tr35/tr35-4.html
     *          Object.symbol {String}: The symbol to be used when formatting
     *                      and parsing e.g., percent or currency symbol.
     *          Object.fraction {Number}: The number of fractional digits to use
     *                      when parsing and formatting numbers.
     *          Object.rounding {Number}: The rounding increment to use when
     *                      parsing and formatting.
     *          Object.positive {String}: The symbol to use for positive numbers
     *                      when parsing and formatting.
     *          Object.negative: {String}: The symbol to use for negative
     *                      numbers when parsing and formatting.
     *          Object.decimal: {String}: The decimal symbol to use for parsing
     *                      and formatting.
     *          Object.grouping: {String}: The grouping symbol to use for
     *                      parsing and formatting.
     *
     * @throws GlobalizationError.PATTERN_ERROR
     */
    private JSONObject getNumberPattern(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        try {
            JSONObject result = Util.getLocaleData(Locale.getDefault()
                    .toString());

            String symbol = Resources.JSON_DECIMALSYMBOL;
            // get Date value + options (if available)
            if (options.getJSONObject(0).length() > 0) {
                // options were included
                if (!((JSONObject) options.getJSONObject(0).get(
                        Resources.OPTIONS)).isNull(Resources.TYPE)) {
                    String fmtOpt = (String) ((JSONObject) options
                            .getJSONObject(0).get(Resources.OPTIONS))
                            .get(Resources.TYPE);
                    if (fmtOpt.equalsIgnoreCase(Resources.CURRENCY)) {
                        symbol = Resources.JSON_CURRENCYSYMBOL;
                    } else if (fmtOpt.equalsIgnoreCase(Resources.PERCENT)) {
                        symbol = Resources.JSON_PERCENTSYMBOL;
                    }
                }
            }

            // return properties
            obj.put("pattern", result.getString(Resources.JSON_PATTERN));
            obj.put("symbol", result.getString(symbol));
            obj.put("fraction",
                    Integer.valueOf(result.getString(Resources.JSON_FRACTION)));
            obj.put("rounding",
                    Integer.valueOf(result.getString(Resources.JSON_ROUNDING)));
            obj.put("positive", result.getString(Resources.JSON_POSITIVE));
            obj.put("negative", result.getString(Resources.JSON_NEGATIVE));
            obj.put("decimal", result.getString(Resources.JSON_DECIMALSYMBOL));
            obj.put("grouping", result.getString(Resources.JSON_GROUPING));
            return obj;
        } catch (Exception ge) {
            throw new GlobalizationError(GlobalizationError.PATTERN_ERROR);
        }
    }

    /**
     * Returns a pattern string for formatting and parsing currency values
     * according to the client's user preferences and ISO 4217 currency code.
     *
     * @return JSONObject =
     *          Object.pattern {String}: The currency pattern for formatting and
     *                      parsing currency values. The patterns follow
     *                      Unicode Technical Standard #35
     *                      http://unicode.org/reports/tr35/tr35-4.html
     *          Object.code {String}: The ISO 4217 currency code for the pattern.
     *          Object.fraction {Number}: The number of fractional digits to use
     *                      when parsing and formatting currency.
     *          Object.rounding {Number}: The rounding increment to use when
     *                      parsing and formatting.
     *          Object.decimal: {String}: The decimal symbol to use for parsing
     *                      and formatting.
     *          Object.grouping: {String}: The grouping symbol to use for
     *                      parsing and formatting.
     *
     * @throws GlobalizationError.FORMATTING_ERROR
     */
    private JSONObject getCurrencyPattern(JSONArray options)
            throws GlobalizationError {
        JSONObject obj = new JSONObject();
        try {
            JSONObject result = Util.getCurrencyData(Locale.getDefault()
                    .toString(),
                    options.getJSONObject(0).getString(Resources.CURRENCYCODE));

            // return properties
            obj.put("pattern", result.getString(Resources.JSON_CURRENCYPATTERN));
            obj.put("code", result.getString(Resources.JSON_CURRENCYCODE));
            obj.put("fraction", Integer.valueOf(result
                    .getString(Resources.JSON_CURRENCYFRACTION)));
            obj.put("rounding", Integer.valueOf(result
                    .getString(Resources.JSON_CURRENCYROUNDING)));
            obj.put("decimal", result.getString(Resources.JSON_CURRENCYDECIMAL));
            obj.put("grouping",
                    result.getString(Resources.JSON_CURRENCYGROUPING));
            return obj;
        } catch (Exception ge) {
            throw new GlobalizationError(GlobalizationError.FORMATTING_ERROR);
        }
    }
}
