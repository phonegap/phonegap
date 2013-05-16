/*  
	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	
	http://www.apache.org/licenses/LICENSE-2.0
	
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

using System;
using System.Globalization;
using System.Runtime.Serialization;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Provides information about system locale, culture settings, number formats, ect.
    /// </summary>
    public class Globalization : BaseCommand
    {

        #region Globalization errors

        /// <summary>
        /// Globalization error codes.
        /// </summary>
        public enum ErrorCode : int
        {
            UnknownError = 0,
            FormattingError = 1,
            ParsingError = 2,
            PatternError = 3
        }

        /// <summary>
        /// Represents globalization error object.
        /// </summary>
        [DataContract]
        public class GlobalizationError
        {
            #region Error messages
            /// <summary>
            /// Error messages
            /// </summary>        
            public const string UnknownError = "UNKNOWN_ERROR";
            public const string FormattingError = "FORMATTIN_ERROR";
            public const string ParsingError = "PARSING_ERROR";
            public const string PatternError = "PATTERN_ERROR";

            #endregion

            /// <summary>
            /// Error code
            /// </summary>
            [DataMember(Name = "code", IsRequired = false)]
            public ErrorCode Code { get; set; }

            /// <summary>
            /// Error message
            /// </summary>
            [DataMember(Name = "message", IsRequired = false)]
            public string Message { get; set; }

            /// <summary>
            /// Default constructor
            /// </summary>
            public GlobalizationError()
            {
                this.Code = ErrorCode.UnknownError;
                this.Message = UnknownError;
            }

            /// <summary>
            /// Constructor setting error code
            /// </summary>
            public GlobalizationError(ErrorCode error)
            {
                this.Code = error;

                switch (error)
                {
                    case ErrorCode.ParsingError:
                        {
                            this.Message = ParsingError;
                            break;
                        }
                    case ErrorCode.FormattingError:
                        {
                            this.Message = FormattingError;
                            break;
                        }
                    case ErrorCode.PatternError:
                        {
                            this.Message = PatternError;
                            break;
                        }
                    default:
                        {
                            this.Message = UnknownError;
                            break;
                        }
                }
            }
        }

        #endregion

        #region Globalization options

        /// <summary>
        /// Represents globalization options.
        /// </summary>
        [DataContract]
        public class GlobalizationOptions
        {
            #region available option values
            /// <summary>
            /// Number pattern types.
            /// </summary>        
            public const string Percent = "percent";
            public const string Currency = "currency";
            public const string Decimal = "decimal";

            /// <summary>
            /// Format length types
            /// </summary>        
            public const string Short = "short";
            public const string Medium = "medium";
            public const string Long = "long";
            public const string Full = "full";

            /// <summary>
            /// Selector types
            /// </summary>        
            public const string TimeSelector = "time";
            public const string DateSelector = "date";
            public const string DateAndTimeSelector = "date and time";

            /// <summary>
            /// Date name types
            /// </summary>        
            public const string Narrow = "narrow";
            public const string Wide = "wide";

            /// <summary>
            /// Date name items
            /// </summary>        
            public const string Months = "months";
            public const string Days = "days";

            #endregion

            /// <summary>
            /// Additional options
            /// </summary>
            [DataMember(Name = "options", IsRequired = false)]
            public Options AdditionalOptions { get; set; }

            /// <summary>
            /// Date to convert
            /// </summary>
            [DataMember(Name = "date", IsRequired = false)]
            public long Date { get; set; }

            /// <summary>
            /// Date as stirng
            /// </summary>
            [DataMember(Name = "dateString", IsRequired = false)]
            public string DateString { get; set; }

            /// <summary>
            /// Currency code
            /// </summary>
            [DataMember(Name = "currencyCode", IsRequired = false)]
            public string CurrencyCode { get; set; }

            /// <summary>
            /// Number as string
            /// </summary>
            [DataMember(Name = "numberString", IsRequired = false)]
            public string NumberString { get; set; }

            /// <summary>
            /// Number to convert
            /// </summary>
            [DataMember(Name = "number", IsRequired = false)]
            public double Number { get; set; }
        }

        /// <summary>
        /// Represents additional options
        /// </summary>
        [DataContract]
        public class Options
        {
            /// <summary>
            /// Pattern type
            /// </summary>
            [DataMember(Name = "type", IsRequired = false)]
            public string Type { get; set; }

            /// <summary>
            /// Format length
            /// </summary>
            [DataMember(Name = "formatLength", IsRequired = false)]
            public string FormatLength { get; set; }

            /// <summary>
            /// Selector
            /// </summary>
            [DataMember(Name = "selector", IsRequired = false)]
            public string Selector { get; set; }

            /// <summary>
            /// Date name item
            /// </summary>
            [DataMember(Name = "item", IsRequired = false)]
            public string Item { get; set; }
        }

        #endregion

        #region returned objects

        #region Number pattern object

        /// <summary>
        /// Represents number pattern
        /// </summary>
        [DataContract]
        public class NumberPattern
        {
            /// <summary>
            /// Pattern
            /// </summary>
            [DataMember(Name = "pattern", IsRequired = false)]
            public string Pattern { get; set; }

            /// <summary>
            /// Symbol
            /// </summary>
            [DataMember(Name = "symbol", IsRequired = false)]
            public string Symbol { get; set; }

            /// <summary>
            /// Fraction
            /// </summary>
            [DataMember(Name = "fraction", IsRequired = false)]
            public int Fraction { get; set; }

            /// <summary>
            /// Positive
            /// </summary>
            [DataMember(Name = "positive", IsRequired = false)]
            public string Positive { get; set; }

            /// <summary>
            /// Negative
            /// </summary>
            [DataMember(Name = "negative", IsRequired = false)]
            public string Negative { get; set; }

            /// <summary>
            /// Rounding
            /// </summary>
            [DataMember(Name = "rounding", IsRequired = false)]
            public int Rounding { get; set; }

            /// <summary>
            /// Decimal
            /// </summary>
            [DataMember(Name = "decimal", IsRequired = false)]
            public string Decimal { get; set; }

            /// <summary>
            /// Grouping
            /// </summary>
            [DataMember(Name = "grouping", IsRequired = false)]
            public string Grouping { get; set; }

            /// <summary>
            /// Constructor of the class
            /// </summary>
            /// <param name="pattern"></param>
            /// <param name="symbol"></param>
            /// <param name="fraction"></param>
            /// <param name="positive"></param>
            /// <param name="negative"></param>
            /// <param name="rounding"></param>
            /// <param name="dec"></param>
            /// <param name="grouping"></param>
            public NumberPattern(string pattern, string symbol, int fraction, string positive, string negative, int rounding, string dec, string grouping)
            {
                this.Pattern = pattern;
                this.Symbol = symbol;
                this.Fraction = fraction;
                this.Positive = positive;
                this.Negative = negative;
                this.Rounding = rounding;
                this.Decimal = dec;
                this.Grouping = grouping;
            }
        }
        #endregion

        #region Date format object

        /// <summary>
        /// Represents date format
        /// </summary>
        [DataContract]
        public class DateFormat
        {
            /// <summary>
            /// Year
            /// </summary>
            [DataMember(Name = "year", IsRequired = false)]
            public int Year { get; set; }

            /// <summary>
            /// Month
            /// </summary>
            [DataMember(Name = "month", IsRequired = false)]
            public int Month { get; set; }

            /// <summary>
            /// Day
            /// </summary>
            [DataMember(Name = "day", IsRequired = false)]
            public int Day { get; set; }

            /// <summary>
            /// Hour
            /// </summary>
            [DataMember(Name = "hour", IsRequired = false)]
            public int Hour { get; set; }

            /// <summary>
            /// Minute
            /// </summary>
            [DataMember(Name = "minute", IsRequired = false)]
            public int Minute { get; set; }

            /// <summary>
            /// Second
            /// </summary>
            [DataMember(Name = "second", IsRequired = false)]
            public int Second { get; set; }

            /// <summary>
            /// Millisecond
            /// </summary>
            [DataMember(Name = "millisecond", IsRequired = false)]
            public int Millisecond { get; set; }

            public DateFormat(int year, int month, int day, int hour, int minute, int second, int millisecond)
            {
                this.Year = year;
                this.Month = month;
                this.Day = day;
                this.Hour = hour;
                this.Minute = minute;
                this.Millisecond = millisecond;
            }

        }
        #endregion

        #region Date pattern object

        /// <summary>
        /// Represents date pattern object
        /// </summary>
        [DataContract]
        public class DatePattern
        {

            /// <summary>
            /// Date pattern
            /// </summary>
            [DataMember(Name = "pattern", IsRequired = false)]
            public string Pattern { get; set; }

            /// <summary>
            /// TimeZone
            /// </summary>
            [DataMember(Name = "timezone", IsRequired = false)]
            public string TimeZone { get; set; }

            /// <summary>
            /// UTC offset
            /// </summary>
            [DataMember(Name = "utc_offset", IsRequired = false)]
            public double UtcOffset { get; set; }

            /// <summary>
            /// Dst offset
            /// </summary>
            [DataMember(Name = "dst_offset", IsRequired = false)]
            public double DstOffset { get; set; }

            /// <summary>
            /// Constructor of the class
            /// </summary>
            /// <param name="pattern"></param>
            /// <param name="timezone"></param>
            /// <param name="utcOffset"></param>
            /// <param name="dstOffset"></param>
            public DatePattern(string pattern, string timezone, double utcOffset, double dstOffset)
            {
                this.Pattern = pattern;
                this.TimeZone = timezone;
                this.UtcOffset = utcOffset;
                this.DstOffset = dstOffset;
            }

        }

        #endregion

        #endregion

        #region Locale info

        /// <summary>
        /// Gets the string identifier for the client's current locale setting.
        /// </summary>
        /// <param name="options"></param>               
        public void getLocaleName(string options)
        {
            try
            {
                var locale = RegionInfo.CurrentRegion.TwoLetterISORegionName;
                PluginResult result = new PluginResult(PluginResult.Status.OK, this.WrapIntoJSON(locale));
                this.DispatchCommandResult(result);
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError()));
            }
        }

        /// <summary>
        /// Gets the string identifier for the client's current language.
        /// </summary>
        /// <param name="options"></param>               
        public void getPreferredLanguage(string options)
        {
            try
            {
                var language = CultureInfo.CurrentCulture.TwoLetterISOLanguageName;
                PluginResult result = new PluginResult(PluginResult.Status.OK, this.WrapIntoJSON(language));
                this.DispatchCommandResult(result);
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError()));
            }
        }

        #endregion

        #region Date and time info

        /// <summary>
        /// Gets whether daylight savings time is in effect for a given date using the client's 
        /// time zone and calendar.        
        /// </summary>
        /// <param name="opitons">Date to daylight savings check.</param>
        public void isDayLightSavingsTime(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                DateTime start = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                DateTime date = start.AddMilliseconds(globalOptions.Date).ToLocalTime();
                TimeZoneInfo localZone = TimeZoneInfo.Local;
                bool isDaylightSavingTime = localZone.IsDaylightSavingTime(date);
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, this.WrapIntoJSON(isDaylightSavingTime, "dst")));
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError()));
            }
        }

        /// <summary>
        /// Gets the first day of the week according to the client's user preferences and calendar.
        /// The days of the week are numbered starting from 1 where 1 is considered to be Sunday.
        /// </summary>
        /// <param name="options"></param>
        public void getFirstDayOfWeek(string options)
        {
            try
            {
                // DateTimeFormat returns days of the week numbered from zero, so we have to increase returned value by one.
                var firstDayOfWeek = (int)CultureInfo.CurrentCulture.DateTimeFormat.FirstDayOfWeek + 1;
                PluginResult result = new PluginResult(PluginResult.Status.OK, this.WrapIntoJSON(firstDayOfWeek));
                this.DispatchCommandResult(result);
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError()));
            }
        }

        #endregion

        #region Formatting

        /// <summary>
        /// Gets a date formatted as a string according to the client's user preferences and calendar using the time zone of the client. 
        /// </summary>
        /// <param name="options"></param>
        public void dateToString(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                DateTime start = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                DateTime date = start.AddMilliseconds(globalOptions.Date).ToLocalTime();

                string format = "{0:M/dd/yy H:m:s}"; //short datetime by default
                int formatLength = 0; //default format
                int selector = 0; //default selector 

                if (globalOptions.AdditionalOptions != null)
                {
                    if (globalOptions.AdditionalOptions.FormatLength != null)
                    {
                        string t = globalOptions.AdditionalOptions.FormatLength;

                        if (t.Equals(GlobalizationOptions.Full))
                        {
                            formatLength++;
                        }
                    }

                    if (globalOptions.AdditionalOptions.Selector != null)
                    {
                        string t = globalOptions.AdditionalOptions.Selector;

                        if (t.Equals(GlobalizationOptions.DateSelector))
                        {
                            selector += 10;
                        }
                        else if (t.Equals(GlobalizationOptions.TimeSelector))
                        {
                            selector += 20;
                        }
                    }

                    //determine return value
                    int method = formatLength + selector;

                    switch (method)
                    {
                        case 1: // full datetime
                            {
                                format = "{0:MMMM/dddd/yyyy HH:mm:ss tt}";
                                break;
                            }
                        case 10: // short date
                            {
                                format = "{0:d}";
                                break;
                            }
                        case 11: // full date
                            {
                                format = "{0:D}";
                                break;
                            }
                        case 20: // short time
                            {
                                format = "{0:t}";
                                break;
                            }
                        case 21: // full time
                            {
                                format = "{0:T}";
                                break;
                            }
                        default: // short datetime
                            {
                                format = "{0:M/dd/yy H:m:s}";
                                break;
                            }
                    }
                }

                string formattedValue = string.Format(CultureInfo.CurrentCulture, format, date);
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, this.WrapIntoJSON(formattedValue)));
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError(ErrorCode.FormattingError)));
            }
        }

        /// <summary>
        /// Parses a date formatted as a string according to the client's user preferences and calendar using the time zone of the client and returns the corresponding date object
        /// </summary>
        /// <param name="options"></param>
        public void stringToDate(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                if (string.IsNullOrEmpty(globalOptions.DateString))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                    return;
                }

                string format = "M/dd/yy H:m:s"; // short datetime by default
                int formatLength = 0; //default format
                int selector = 0; //default selector 

                if (globalOptions.AdditionalOptions != null)
                {
                    if (globalOptions.AdditionalOptions.FormatLength != null)
                    {
                        string t = globalOptions.AdditionalOptions.FormatLength;

                        if (t.Equals(GlobalizationOptions.Full))
                        {
                            formatLength++;
                        }
                    }

                    if (globalOptions.AdditionalOptions.Selector != null)
                    {
                        string t = globalOptions.AdditionalOptions.Selector;

                        if (t.Equals(GlobalizationOptions.DateSelector))
                        {
                            selector += 10;
                        }
                        else if (t.Equals(GlobalizationOptions.TimeSelector))
                        {
                            selector += 20;
                        }
                    }

                    //determine return value
                    int method = formatLength + selector;

                    switch (method)
                    {
                        case 1: // full datetime
                            {
                                format = "MMMM/dddd/yyyy HH:mm:ss tt";
                                break;
                            }
                        case 10: // short date
                            {
                                format = "d";
                                break;
                            }
                        case 11: // full date
                            {
                                format = "D";
                                break;
                            }
                        case 20: // short time
                            {
                                format = "t";
                                break;
                            }
                        case 21: // full time
                            {
                                format = "T";
                                break;
                            }
                        default: // short datetime
                            {
                                format = "M/dd/yy H:m:s";
                                break;
                            }
                    }
                }

                DateTime date = DateTime.ParseExact(globalOptions.DateString, format, CultureInfo.CurrentCulture);
                DateFormat dateFormat = new DateFormat(date.Year, date.Month, date.Day, date.Hour, date.Minute, date.Second, date.Millisecond);
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, dateFormat));

            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError(ErrorCode.ParsingError)));
            }
        }

        /// <summary>
        /// Gets a pattern string for formatting and parsing dates according to the client's user preferences.
        /// </summary>
        /// <param name="options"></param>
        public void getDatePattern(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                DateTimeFormatInfo dateFormatInfo = DateTimeFormatInfo.CurrentInfo;
                string pattern = dateFormatInfo.FullDateTimePattern; // full datetime by default
                int formatLength = 0; //default format
                int selector = 0; //default selector 

                if (globalOptions.AdditionalOptions != null)
                {
                    if (globalOptions.AdditionalOptions.FormatLength != null)
                    {
                        string t = globalOptions.AdditionalOptions.FormatLength;

                        if (t.Equals(GlobalizationOptions.Full))
                        {
                            formatLength++;
                        }
                    }

                    if (globalOptions.AdditionalOptions.Selector != null)
                    {
                        string t = globalOptions.AdditionalOptions.Selector;

                        if (t.Equals(GlobalizationOptions.DateSelector))
                        {
                            selector += 10;
                        }
                        else if (t.Equals(GlobalizationOptions.TimeSelector))
                        {
                            selector += 20;
                        }
                    }

                    //determine return value
                    int method = formatLength + selector;

                    switch (method)
                    {
                        case 1: // full datetime
                            {
                                pattern = dateFormatInfo.FullDateTimePattern;
                                break;
                            }
                        case 10: // short date
                            {
                                pattern = dateFormatInfo.ShortDatePattern;
                                break;
                            }
                        case 11: // full date
                            {
                                pattern = dateFormatInfo.LongDatePattern;
                                break;
                            }
                        case 20: // short time
                            {
                                pattern = dateFormatInfo.ShortTimePattern;
                                break;
                            }
                        case 21: // full time
                            {
                                pattern = dateFormatInfo.LongTimePattern;
                                break;
                            }
                        default: // short datetime
                            {
                                // Seems like C# doesn't support short datetime pattern so we use full format
                                // http://msdn.microsoft.com/en-us/library/1at0z4ew%28v=vs.71%29.aspx
                                pattern = dateFormatInfo.FullDateTimePattern;
                                break;
                            }
                    }
                }

                TimeZoneInfo localZone = TimeZoneInfo.Local;
                DatePattern datePattern = new DatePattern(pattern, localZone.DisplayName, localZone.BaseUtcOffset.TotalSeconds, 0);
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, datePattern));
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError(ErrorCode.PatternError)));
            }
        }

        /// <summary>
        /// Gets an array of either the names of the months or days of the week according to the client's user preferences and calendar.
        /// </summary>
        /// <param name="options"></param>
        public void getDateNames(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                int type = 0; //default wide
                int item = 0; //default months 

                if (globalOptions.AdditionalOptions != null)
                {
                    if (globalOptions.AdditionalOptions.Type != null)
                    {
                        string t = globalOptions.AdditionalOptions.Type;

                        if (t.Equals(GlobalizationOptions.Narrow))
                        {
                            type++;
                        }
                    }

                    if (globalOptions.AdditionalOptions.Item != null)
                    {
                        string t = globalOptions.AdditionalOptions.Item;

                        if (t.Equals(GlobalizationOptions.Days))
                        {
                            item += 10;
                        }
                    }
                }

                //determine return value
                int method = item + type;
                string[] namesArray;
                CultureInfo currentCulture = CultureInfo.CurrentCulture;

                if (method == 1) //months and narrow
                {
                    namesArray = currentCulture.DateTimeFormat.AbbreviatedMonthNames;
                }
                else if (method == 10) //days and wide
                {
                    namesArray = currentCulture.DateTimeFormat.DayNames;
                }
                else if (method == 11) //days and narrow
                {
                    namesArray = currentCulture.DateTimeFormat.AbbreviatedDayNames;
                }
                else //default: months and wide
                {
                    namesArray = currentCulture.DateTimeFormat.MonthNames;
                }

                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, this.WrapIntoJSON(namesArray)));
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError()));
            }
        }

        /// <summary>
        /// Gets a number formatted as a string according to the client's user preferences. 
        /// </summary>
        /// <param name="options"></param>
        public void numberToString(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                string format = string.Empty;
                string numberFormatType = (globalOptions.AdditionalOptions == null || string.IsNullOrEmpty(globalOptions.AdditionalOptions.Type)) ?
                    GlobalizationOptions.Decimal : globalOptions.AdditionalOptions.Type;

                switch (numberFormatType)
                {
                    case GlobalizationOptions.Percent:
                        {
                            format = "{0:p}";
                            break;
                        }

                    case GlobalizationOptions.Currency:
                        {
                            format = "{0:c}";
                            break;
                        }

                    default:
                        {
                            format = "{0:f}";
                            break;
                        }
                }

                string formattedValue = string.Format(CultureInfo.CurrentCulture, format, globalOptions.Number);
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, this.WrapIntoJSON(formattedValue)));

            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError(ErrorCode.FormattingError)));
            }
        }

        /// <summary>
        /// Gets a number formatted as a string according to the client's user preferences and returns the corresponding number.
        /// </summary>
        /// <param name="options"></param>
        public void stringToNumber(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                if (string.IsNullOrEmpty(globalOptions.NumberString))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                    return;
                }

                string numberString = globalOptions.NumberString;
                string numberFormatType = (globalOptions.AdditionalOptions == null || string.IsNullOrEmpty(globalOptions.AdditionalOptions.Type)) ?
                    GlobalizationOptions.Decimal : globalOptions.AdditionalOptions.Type;

                NumberStyles numberStyle;

                switch (numberFormatType)
                {
                    case GlobalizationOptions.Percent:
                        {
                            numberStyle = NumberStyles.Any;
                            numberString = numberString.Replace(System.Globalization.CultureInfo.CurrentCulture.NumberFormat.PercentSymbol, "");
                            break;
                        }

                    case GlobalizationOptions.Currency:
                        {
                            numberStyle = NumberStyles.Currency;
                            break;
                        }

                    default:
                        {
                            numberStyle = NumberStyles.Number;
                            break;
                        }
                }

                double value = double.Parse(numberString, numberStyle, CultureInfo.CurrentCulture);
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, this.WrapIntoJSON(value)));

            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError(ErrorCode.ParsingError)));
            }
        }


        /// <summary>
        /// Gets a pattern string for formatting and parsing numbers according to the client's user preferences.
        /// </summary>
        /// <param name="options"></param>
        public void getNumberPattern(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                CultureInfo cultureInfo = CultureInfo.CurrentCulture;
                NumberFormatInfo formatInfo = cultureInfo.NumberFormat;
                string numberFormatType = (globalOptions.AdditionalOptions == null || string.IsNullOrEmpty(globalOptions.AdditionalOptions.Type)) ?
                    GlobalizationOptions.Decimal : globalOptions.AdditionalOptions.Type;
                NumberPattern pattern = null;
                string symbol;

                // TODO find out how to get format pattern and the number of fraction digits
                switch (numberFormatType)
                {
                    case GlobalizationOptions.Percent:
                        {
                            symbol = formatInfo.PercentSymbol;
                            pattern = new NumberPattern("", symbol, 0, formatInfo.PercentPositivePattern.ToString(), formatInfo.PercentNegativePattern.ToString(), 0, formatInfo.PercentDecimalSeparator, formatInfo.PercentGroupSeparator);
                            break;
                        }
                    case GlobalizationOptions.Currency:
                        {
                            symbol = formatInfo.CurrencySymbol;
                            pattern = new NumberPattern("", symbol, 0, formatInfo.CurrencyPositivePattern.ToString(), formatInfo.CurrencyNegativePattern.ToString(), 0, formatInfo.CurrencyDecimalSeparator, formatInfo.CurrencyGroupSeparator);
                            break;
                        }
                    default:
                        {
                            symbol = formatInfo.NumberDecimalSeparator;
                            pattern = new NumberPattern("", symbol, 0, "", formatInfo.NumberNegativePattern.ToString(), 0, formatInfo.NumberDecimalSeparator, formatInfo.NumberGroupSeparator);
                            break;
                        }
                }

                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, pattern));
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError(ErrorCode.PatternError)));
            }
        }

        /// <summary>
        /// Gets a pattern string for formatting and parsing currency values according to the client's user preferences and ISO 4217 currency code.
        /// </summary>
        /// <param name="options"></param>
        public void getCurrencyPattern(string options)
        {
            GlobalizationOptions globalOptions;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                globalOptions = JSON.JsonHelper.Deserialize<GlobalizationOptions>(args[0]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                if (string.IsNullOrEmpty(globalOptions.CurrencyCode))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                    return;
                }

                string currencyCode = globalOptions.CurrencyCode;

                // temporary not supported via lack of api required
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.INVALID_ACTION, "Not supported"));
                return;

                // TODO find the way to get currency info from currency code
                // http://stackoverflow.com/questions/12373800/3-digit-currency-code-to-currency-symbol
                // http://stackoverflow.com/questions/6924067/how-to-get-specific-culture-currency-pattern
                // CultureInfo cultureInfo = new CultureInfo(currencyCode);
                // NumberFormatInfo numberFormat = cultureInfo.NumberFormat;
            }
            catch (Exception)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new GlobalizationError(ErrorCode.FormattingError)));
            }
        }

        #endregion

        #region private methods

        /// <summary>
        /// Wraps data into JSON format
        /// </summary>
        /// <param name="data">data</param>
        /// <returns>data formatted as JSON object</returns>
        private string WrapIntoJSON<T>(T data, string keyName = "value")
        {
            string param = "{0}";
            string stringifiedData = data.ToString();

            if (data.GetType() == typeof(string))
            {
                param = "\"" + param + "\"";
            }

            if (data.GetType() == typeof(bool))
            {
                stringifiedData = stringifiedData.ToLower();
            }

            if (data.GetType() == typeof(string[]))
            {
                stringifiedData = JSON.JsonHelper.Serialize(data);
            }

            var formattedData = string.Format("\"" + keyName + "\":" + param, stringifiedData);
            formattedData = "{" + formattedData + "}";

            return formattedData;
        }

        #endregion
    }
}