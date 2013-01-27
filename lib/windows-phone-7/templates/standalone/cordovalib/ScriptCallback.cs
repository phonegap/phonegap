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
using WPCordovaClassLib.Cordova.JSON;
using System.Diagnostics;

namespace WPCordovaClassLib.Cordova
{
    /// <summary>
    /// Represents client script function to execute
    /// </summary>
    public class ScriptCallback : EventArgs
    {
        /// <summary>
        /// The scripting function to execute.
        /// </summary>
        public string ScriptName { get; private set; }

        /// <summary>
        /// A variable number of strings to pass to the function as parameters.
        /// </summary>
        public string[] Args { get; private set; }

        /// <summary>
        /// Creates new instance of a ScriptCallback class.
        /// </summary>
        /// <param name="function">The scripting function to execute</param>
        /// <param name="args">A variable number of strings to pass to the function as parameters</param>
        public ScriptCallback(string function, string[] args)
        {
            this.ScriptName = function;
            this.Args = args;
        }

        /// <summary>
        /// Creates new instance of a ScriptCallback class.
        /// </summary>
        /// <param name="function">The scripting function to execute</param>
        /// <param name="id">The id argument</param>
        /// <param name="msg">The message argument</param>
        /// <param name="value">The value argument</param>
        public ScriptCallback(string function, string id, object msg, object value)
        {
            this.ScriptName = function;

            String arg = String.Format("{{\"id\": {0}, \"msg\": {1}, \"value\": {2}}}",
                 JsonHelper.Serialize(id), JsonHelper.Serialize(msg), JsonHelper.Serialize(value));

            this.Args = new string[] { arg };
        }


    }
}
