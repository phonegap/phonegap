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

using Microsoft.Phone.Info;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Listens for changes to the state of the battery on the device.
    /// Currently only the "isPlugged" parameter available via native APIs.
    /// </summary>
    public class Battery : BaseCommand
    {
        private bool isPlugged = false;
        private EventHandler powerChanged;

        public Battery()
        {
            powerChanged = new EventHandler(DeviceStatus_PowerSourceChanged);
            isPlugged = DeviceStatus.PowerSource.ToString().CompareTo("External") == 0;
        }

        public void start(string options)
        {
            // Register power changed event handler
            DeviceStatus.PowerSourceChanged += powerChanged;

            PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
            result.KeepCallback = true;
            DispatchCommandResult(result);
        }
        public void stop(string options)
        {
            // Unregister power changed event handler
            DeviceStatus.PowerSourceChanged -= powerChanged;
        }

        private void DeviceStatus_PowerSourceChanged(object sender, EventArgs e)
        {
            isPlugged = DeviceStatus.PowerSource.ToString().CompareTo("External") == 0;
            PluginResult result = new PluginResult(PluginResult.Status.OK, GetCurrentBatteryStateFormatted());
            result.KeepCallback = true;
            DispatchCommandResult(result);
        }

        private string GetCurrentBatteryStateFormatted()
        {
            string batteryState = String.Format("\"level\":{0},\"isPlugged\":{1}",
                                                    "null",
                                                    isPlugged ? "true" : "false"
                            );
            batteryState = "{" + batteryState + "}";
            return batteryState;
        }

    }
}
