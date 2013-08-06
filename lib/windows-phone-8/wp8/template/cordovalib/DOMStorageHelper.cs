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
using System.IO.IsolatedStorage;
using System.Collections.Generic;
using Microsoft.Phone.Controls;
using System.Linq;
using WPCordovaClassLib.Cordova.JSON;

/*
 * Translates DOMStorage API between JS and Isolated Storage
 * Missing pieces : QUOTA_EXCEEDED_ERR  + StorageEvent  
 * */

namespace WPCordovaClassLib
{
    public class DOMStorageHelper
    {
        protected WebBrowser webBrowser1;

        public DOMStorageHelper(WebBrowser aBrowser)
        {
            this.webBrowser1 = aBrowser;
            // always clear session at creation
            UserSettings["sessionStorage"] = new Dictionary<string, string>();

            if (!UserSettings.Contains("localStorage"))
            {
                UserSettings["localStorage"] = new Dictionary<string, string>();
                UserSettings.Save();
            }
            Application.Current.Exit += new EventHandler(OnAppExit);
        }

        void OnAppExit(object sender, EventArgs e)
        {
            UserSettings.Remove("sessionStorage");
            UserSettings.Save();
        }

        protected IsolatedStorageSettings UserSettings
        {
            get
            {
                return IsolatedStorageSettings.ApplicationSettings;
            }
        }

        protected Dictionary<string, string> getStorageByType(string type)
        {
            if (!UserSettings.Contains(type))
            {
                UserSettings[type] = new Dictionary<string, string>();
                UserSettings.Save();
            }
            return UserSettings[type] as Dictionary<string, string>;
        }


        public void HandleStorageCommand(string commandStr)
        {

            string[] split = commandStr.Split('/');
            if (split.Length > 3)
            {
                string api = split[0];
                string type = split[1]; // localStorage || sessionStorage
                string command = split[2];
                string param = split[3];

                Dictionary<string, string> currentStorage = getStorageByType(type);

                switch (command)
                {
                    case "get":
                        {

                            if (currentStorage.Keys.Contains(param))
                            {
                                string value = currentStorage[param];
                                webBrowser1.InvokeScript("execScript", "window." + type + ".onResult('" + param + "','" + value + "');");
                            }
                            else
                            {
                                webBrowser1.InvokeScript("execScript", "window." + type + ".onResult('" + param + "');");
                            }

                        }
                        break;
                    case "load":
                        {
                            string[] keys = currentStorage.Keys.ToArray();
                            string jsonString = JsonHelper.Serialize(keys);
                            string callbackJS = "window." + type + ".onKeysChanged('" + jsonString + "');";
                            webBrowser1.InvokeScript("execScript", callbackJS);
                        }
                        break;
                    case "set":
                        {
                            // TODO: check that length is not out of bounds
                            currentStorage[param] = split[4];
                            UserSettings.Save();
                            string[] keys = currentStorage.Keys.ToArray();
                            string jsonString = JsonHelper.Serialize(keys);
                            string callbackJS = "window." + type + ".onKeysChanged('" + jsonString + "');";
                            webBrowser1.InvokeScript("execScript", callbackJS);
                        }
                        break;
                    case "remove":
                        currentStorage.Remove(param);
                        UserSettings.Save();
                        break;
                    case "clear":
                        currentStorage = new Dictionary<string, string>();
                        UserSettings[type] = currentStorage;
                        UserSettings.Save();
                        break;
                }

            }

        }
    }
}
