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

public class Resources {
    // Globalization Plugin Actions
    public static final String GETLOCALENAME = "getLocaleName";
    public static final String DATETOSTRING = "dateToString";
    public static final String STRINGTODATE = "stringToDate";
    public static final String GETDATEPATTERN = "getDatePattern";
    public static final String GETDATENAMES = "getDateNames";
    public static final String ISDAYLIGHTSAVINGSTIME = "isDayLightSavingsTime";
    public static final String GETFIRSTDAYOFWEEK = "getFirstDayOfWeek";
    public static final String NUMBERTOSTRING = "numberToString";
    public static final String STRINGTONUMBER = "stringToNumber";
    public static final String GETNUMBERPATTERN = "getNumberPattern";
    public static final String GETCURRENCYPATTERN = "getCurrencyPattern";
    public static final String GETPREFERREDLANGUAGE = "getPreferredLanguage";

    // Globalization Option Parameters
    public static final String OPTIONS = "options";
    public static final String FORMATLENGTH = "formatLength";
    public static final String MEDIUM = "medium";
    public static final String LONG = "long";
    public static final String FULL = "full";
    public static final String SELECTOR = "selector";
    public static final String DATE = "date";
    public static final String TIME = "time";
    public static final String DATESTRING = "dateString";
    public static final String TYPE = "type";
    public static final String ITEM = "item";
    public static final String NARROW = "narrow";
    public static final String WIDE = "wide";
    public static final String MONTHS = "months";
    public static final String DAYS = "days";
    public static final String SPACE = " ";
    public static final String DATEDELIMITER = "-";
    public static final String TIMEDELIMITER = ":";
    public static final String[] AM_PMFORMATS = { "a", "aa" };
    public static final String NUMBER = "number";
    public static final String NUMBERSTRING = "numberString";
    public static final String PERCENT = "percent";
    public static final String CURRENCY = "currency";
    public static final String CURRENCYCODE = "currencyCode";

    // JSON File: JSONObject
    public static final String JSON_CURRENCY = "currency";
    public static final String JSON_LOCALE = "locale";
    public static final String JSON_NAME = "name";

    // JSON File: parameters
    // locale:
    public static final String JSON_PATTERN = "pattern";
    public static final String JSON_DECIMAL = "decimal";
    public static final String JSON_FRACTION = "fraction";
    public static final String JSON_ROUNDING = "rounding";
    public static final String JSON_GROUPING = "grouping";
    public static final String JSON_NEGATIVE = "negative";
    public static final String JSON_FIRISTDAYOFWEEK = "firstDayOfWeek";
    public static final String JSON_POSITIVE = "positive";
    public static final String JSON_PERCENTSYMBOL = "percentSymbol";
    public static final String JSON_CURRENCYSYMBOL = "currencySymbol";
    public static final String JSON_DECIMALSYMBOL = "decimalSymbol";
    public static final String JSON_DISPLAYNAME = "displayName";

    // currency
    public static final String JSON_CURRENCYCODE = "currencyCode";
    public static final String JSON_CURRENCYPATTERN = "currencyPattern";
    public static final String JSON_CURRENCYDECIMAL = "currencyDecimal";
    public static final String JSON_CURRENCYFRACTION = "currencyFraction";
    public static final String JSON_CURRENCYGROUPING = "currencyGrouping";
    public static final String JSON_CURRENCYROUNDING = "currencyRounding";

    // class paths:
    public static final String LOCALEINFOPATH = "/res/resourceBundles/";
    public static final String LOCALEINFOPATHEND = ".js.gz";

    // locale resource key identifiers
    public static final int LOCALENAME = 0;

    // Persistent Store ID:
    public static final long PERSISTENTSTORE_ID = 0x10001;
}
