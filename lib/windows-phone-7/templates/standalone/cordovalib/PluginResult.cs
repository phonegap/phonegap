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
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using System.Text;
using System.Diagnostics;

namespace WPCordovaClassLib.Cordova
{
    /// <summary>
    /// Represents command execution result
    /// </summary>
    public class PluginResult : EventArgs
    {
        /// <summary>
        /// Predefined resultant messages
        /// </summary>
        public static string[] StatusMessages = new string[] 
		{
			"No result",
			"OK",
			"Class not found",
			"Illegal access",
			"Instantiation error",
			"Malformed url",
			"IO error",
			"Invalid action",
			"JSON error",
			"Error"
		};

        /// <summary>
        /// Possible command results status codes
        /// </summary>
        public enum Status : int
        {
            NO_RESULT = 0,
            OK,
            CLASS_NOT_FOUND_EXCEPTION,
            ILLEGAL_ACCESS_EXCEPTION,
            INSTANTIATION_EXCEPTION,
            MALFORMED_URL_EXCEPTION,
            IO_EXCEPTION,
            INVALID_ACTION,
            JSON_EXCEPTION,
            ERROR
        };

        public Status Result { get; private set; }
        public string Message { get; set; }
        public bool KeepCallback { get; set; }

        /// <summary>
        /// Whether command succeded or not
        /// </summary>
        public bool IsSuccess
        {
            get
            {
                return this.Result == Status.OK || this.Result == Status.NO_RESULT;
            }
        }

        /// <summary>
        /// Creates new instance of the PluginResult class.
        /// </summary>
        /// <param name="status">Execution result</param>
        public PluginResult(Status status)
            : this(status, PluginResult.StatusMessages[(int)status])
        {
        }

        /// <summary>
        /// Creates new instance of the PluginResult class.
        /// </summary>
        /// <param name="status">Execution result</param>
        /// <param name="message">The message</param>
        public PluginResult(Status status, object message)
        {
            this.Result = status;
            this.Message = JSON.JsonHelper.Serialize(message);
        }

        public string ToJSONString()
        {
            string res = String.Format("\"status\":{0},\"message\":{1},\"keepCallback\":{2}",
                (int)this.Result,
                this.Message,
                this.KeepCallback.ToString().ToLower());

            res = "{" + res + "}";
            return res;

        }

        public string ToCallbackString(string callbackId, string successCallback, string errorCallback)
        {
            if (this.IsSuccess)
            {
                StringBuilder buf = new StringBuilder("");
                buf.Append(String.Format("{0}('{1}',{2});", successCallback, callbackId, this.ToJSONString()));
                return buf.ToString();
            }
            else
            {
                return String.Format("{0}('{1}',{2});", errorCallback, callbackId, this.ToJSONString());
            }
        }

        public override String ToString()
        {
            return this.ToJSONString();
        }

    }

}
