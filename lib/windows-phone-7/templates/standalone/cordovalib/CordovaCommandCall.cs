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
using System.Linq;

namespace WPCordovaClassLib.Cordova
{
    /// <summary>
    /// Represents Cordova native command call: action callback, etc
    /// </summary>
    public class CordovaCommandCall
    {
        public String Service { get; private set; }
        public String Action { get; private set; }
        public String CallbackId { get; private set; }
        public String Args { get; private set; }

        /// <summary>
        /// Retrieves command call parameters and creates wrapper for them
        /// </summary>
        /// <param name="commandStr">Command string in the form 'service/action/callback/args'</param>
        /// <returns>New class instance or null of string does not represent Cordova command</returns>
        public static CordovaCommandCall Parse(string commandStr)
        {
            if (string.IsNullOrEmpty(commandStr))
            {
                return null;
                //throw new ArgumentNullException("commandStr");
            }

            string[] split = commandStr.Split('/');
            if (split.Length < 3)
            {
                return null;
            }

            CordovaCommandCall commandCallParameters = new CordovaCommandCall();

            commandCallParameters.Service = split[0];
            commandCallParameters.Action = split[1];
            commandCallParameters.CallbackId = split[2];
            commandCallParameters.Args = split.Length <= 3 ? String.Empty : String.Join("/", split.Skip(3));

            // sanity check for illegal names
            // was failing with ::
            // CordovaCommandResult :: 1, Device1, {"status":1,"message":"{\"name\":\"XD.....
            if (commandCallParameters.Service.IndexOfAny(new char[] { '@', ':', ',', '!', ' ' }) > -1)
            {
                return null;
            }


            return commandCallParameters;
        }


        /// <summary>
        /// Private ctr to disable class creation.
        /// New class instance must be initialized via CordovaCommandCall.Parse static method.
        /// </summary>
        private CordovaCommandCall() { }


    }
}
