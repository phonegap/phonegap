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
using System.Diagnostics;
using System.Threading;
using Microsoft.Devices;
using Microsoft.Phone.Controls;
using WPCordovaClassLib.Cordova.Commands;
using System.Windows;

namespace WPCordovaClassLib.Cordova
{
    /// <summary>
    /// Implements logic to execute native command and return result back.
    /// All commands are executed asynchronous.
    /// </summary>
    public class NativeExecution
    {
        /// <summary>
        /// Reference to web part where application is hosted
        /// </summary>
        private readonly WebBrowser webBrowser;

        /// <summary>
        /// Creates new instance of a NativeExecution class. 
        /// </summary>
        /// <param name="browser">Reference to web part where application is hosted</param>
        public NativeExecution(ref WebBrowser browser)
        {
            if (browser == null)
            {
                throw new ArgumentNullException("browser");
            }

            this.webBrowser = browser;
        }

        /// <summary>
        /// Returns where application is running on emulator
        /// </summary>
        /// <returns>True if running on emulator, otherwise False</returns>
        public static bool IsRunningOnEmulator()
        {
            return Microsoft.Devices.Environment.DeviceType == DeviceType.Emulator;
        }

        public void ResetAllCommands()
        {
            CommandFactory.ResetAllCommands();
        }

        public void AutoLoadCommand(string commandService)
        {
            BaseCommand bc = CommandFactory.CreateByServiceName(commandService);
            if (bc != null)
            {
                bc.OnInit();
            }

        }

        /// <summary>
        /// Executes command and returns result back.
        /// </summary>
        /// <param name="commandCallParams">Command to execute</param>
        public void ProcessCommand(CordovaCommandCall commandCallParams)
        {

            if (commandCallParams == null)
            {
                throw new ArgumentNullException("commandCallParams");
            }

            try
            {
                BaseCommand bc = CommandFactory.CreateByServiceName(commandCallParams.Service);

                if (bc == null)
                {
                    this.OnCommandResult(commandCallParams.CallbackId, new PluginResult(PluginResult.Status.CLASS_NOT_FOUND_EXCEPTION));
                    return;
                }

                EventHandler<PluginResult> OnCommandResultHandler = delegate(object o, PluginResult res)
                {
                    this.OnCommandResult(commandCallParams.CallbackId, res);
                };

                bc.OnCommandResult += OnCommandResultHandler;

                EventHandler<ScriptCallback> OnCustomScriptHandler = delegate(object o, ScriptCallback script)
                {
                    this.InvokeScriptCallback(script);
                };


                bc.OnCustomScript += OnCustomScriptHandler;

                ThreadStart methodInvocation = () =>
                {

                    try
                    {
                        bc.InvokeMethodNamed(commandCallParams.Action, commandCallParams.Args);
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine("ERROR: Exception in ProcessCommand :: " + ex.Message);
                        bc.OnCommandResult -= OnCommandResultHandler;
                        bc.OnCustomScript -= OnCustomScriptHandler;

                        Debug.WriteLine("ERROR: failed to InvokeMethodNamed :: " + commandCallParams.Action + " on Object :: " + commandCallParams.Service);

                        this.OnCommandResult(commandCallParams.CallbackId, new PluginResult(PluginResult.Status.INVALID_ACTION));

                        return;
                    }
                };

                if ((bc is File) || (bc is Accelerometer))
                {
                    // Due to some issues with the IsolatedStorage in current version of WP8 SDK we have to run all File Api commands synchronously.
                    // TODO: test this in WP8 RTM
                    methodInvocation.Invoke();
                }
                else
                {
                    new Thread(methodInvocation).Start();
                }

                    
            }
            catch (Exception ex)
            {
                // ERROR
                Debug.WriteLine(String.Format("ERROR: Unable to execute command :: {0}:{1}:{2} ",
                    commandCallParams.Service, commandCallParams.Action, ex.Message));

                this.OnCommandResult(commandCallParams.CallbackId, new PluginResult(PluginResult.Status.ERROR));
                return;
            }
        }

        /// <summary>
        /// Handles command execution result.
        /// </summary>
        /// <param name="callbackId">Command callback identifier on client side</param>
        /// <param name="result">Execution result</param>
        private void OnCommandResult(string callbackId, PluginResult result)
        {
            #region  args checking

            if (result == null)
            {
                Debug.WriteLine("ERROR: OnCommandResult missing result argument");
                return;
            }

            if (String.IsNullOrEmpty(callbackId))
            {
                Debug.WriteLine("ERROR: OnCommandResult missing callbackId argument");
                return;
            }

            #endregion

            string jsonResult = result.ToJSONString();

            string callback;
            string args = string.Format("('{0}',{1});", callbackId, jsonResult);

            if (result.Result == PluginResult.Status.NO_RESULT ||
               result.Result == PluginResult.Status.OK)
            {
                callback = @"(function(callbackId,args) {
                try { args.message = JSON.parse(args.message); } catch (ex) { }
                cordova.callbackSuccess(callbackId,args);
                })" + args;
            }
            else
            {
                callback = @"(function(callbackId,args) {
                try { args.message = JSON.parse(args.message); } catch (ex) { }
                cordova.callbackError(callbackId,args);
                })" + args;
            }
            this.InvokeScriptCallback(new ScriptCallback("eval", new string[] { callback }));

        }

        /// <summary>
        /// Executes client java script
        /// </summary>
        /// <param name="script">Script to execute on client side</param>
        private void InvokeScriptCallback(ScriptCallback script)
        {
            if (script == null)
            {
                throw new ArgumentNullException("script");
            }

            if (String.IsNullOrEmpty(script.ScriptName))
            {
                throw new ArgumentNullException("ScriptName");
            }

            //Debug.WriteLine("INFO:: About to invoke ::" + script.ScriptName + " with args ::" + script.Args[0]);
            this.webBrowser.Dispatcher.BeginInvoke((ThreadStart)delegate()
            {
                try
                {
                    //Debug.WriteLine("INFO:: InvokingScript::" + script.ScriptName + " with args ::" + script.Args[0]);
                    this.webBrowser.InvokeScript(script.ScriptName, script.Args);
                }
                catch (Exception ex)
                {
                    Debug.WriteLine("ERROR: Exception in InvokeScriptCallback :: " + ex.Message);
                }

            });
        }

    }
}