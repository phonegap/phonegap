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
using System.Reflection;
using Microsoft.Phone.Shell;
using System.Diagnostics;
using System.Collections;
using System.Collections.Generic;

namespace WPCordovaClassLib.Cordova.Commands
{
    public abstract class BaseCommand : IDisposable
    {
        /*
         *  All commands + plugins must extend BaseCommand, because they are dealt with as BaseCommands in CordovaView.xaml.cs
         *  
         **/

        public event EventHandler<PluginResult> OnCommandResult;

        public event EventHandler<ScriptCallback> OnCustomScript;

        public string CurrentCommandCallbackId { get; set; }

        public BaseCommand()
        {
            ResultHandlers = new Dictionary<string, EventHandler<PluginResult>>();
            PhoneApplicationService service = PhoneApplicationService.Current;
            service.Activated += this.OnResume;
            service.Deactivated += this.OnPause;
        }

        protected Dictionary<string, EventHandler<PluginResult>> ResultHandlers;
        public void AddResultHandler(string callbackId, EventHandler<PluginResult> handler)
        {
            ResultHandlers.Add(callbackId, handler);
        }
        public bool RemoveResultHandler(string callbackId)
        {
            return ResultHandlers.Remove(callbackId);
        }

        /*
         *  InvokeMethodNamed will call the named method of a BaseCommand subclass if it exists and pass the variable arguments list along.
         **/

        public object InvokeMethodNamed(string callbackId, string methodName, params object[] args)
        {
            //Debug.WriteLine(string.Format("InvokeMethodNamed:{0} callbackId:{1}",methodName,callbackId));
            this.CurrentCommandCallbackId = callbackId;
            return InvokeMethodNamed(methodName, args);
        }

        public object InvokeMethodNamed(string methodName, params object[] args)
        {
            MethodInfo mInfo = this.GetType().GetMethod(methodName);

            if (mInfo != null)
            {
                // every function handles DispatchCommandResult by itself
                return mInfo.Invoke(this, args);
            }

            // actually methodName could refer to a property
            if (args == null || args.Length == 0 ||
               (args.Length == 1 && "undefined".Equals(args[0])))
            {
                PropertyInfo pInfo = this.GetType().GetProperty(methodName);
                if (pInfo != null)
                {
                    object res = pInfo.GetValue(this, null);

                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, res));

                    return res;
                }
            }

            throw new MissingMethodException(methodName);

        }

        [Obsolete]
        public void InvokeCustomScript(ScriptCallback script, bool removeHandler)
        {
            if (this.OnCustomScript != null)
            {
                this.OnCustomScript(this, script);
                if (removeHandler)
                {
                    this.OnCustomScript = null;
                }
            }
        }

        public void DispatchCommandResult()
        {
            this.DispatchCommandResult(new PluginResult(PluginResult.Status.NO_RESULT));
        }

        public void DispatchCommandResult(PluginResult result,string callbackId="")
        {
            if (!string.IsNullOrEmpty(callbackId)) 
            {
                result.CallbackId = callbackId;
            }
            else
            {
                result.CallbackId = this.CurrentCommandCallbackId;
            }

            if (ResultHandlers.ContainsKey(result.CallbackId))
            {
                ResultHandlers[result.CallbackId](this, result);
            }
            else if (this.OnCommandResult != null)
            {
                OnCommandResult(this, result);
            }
            else
            {
                Debug.WriteLine("Failed to locate callback for id : " + result.CallbackId);
            }

            if (!result.KeepCallback)
            {
                this.Dispose();
            }

        }


        /// <summary>
        /// Occurs when the application is being deactivated.
        /// </summary>        
        public virtual void OnReset() {}

        /// <summary>
        /// Occurs when the application is being loaded, and the config.xml has an autoload entry
        /// </summary>    
        public virtual void OnInit() {}


        /// <summary>
        /// Occurs when the application is being deactivated.
        /// </summary>        
        public virtual void OnPause(object sender, DeactivatedEventArgs e) {}

        /// <summary>
        /// Occurs when the application is being made active after previously being put
        /// into a dormant state or tombstoned.
        /// </summary>        
        public virtual void OnResume(object sender, Microsoft.Phone.Shell.ActivatedEventArgs e) {}

        public void Dispose()
        {
            PhoneApplicationService service = PhoneApplicationService.Current;
            service.Activated -= this.OnResume;
            service.Deactivated -= this.OnPause;
            this.OnCommandResult = null;
        }

        public static string GetBaseURL()
        {
#if CORDOVA_CLASSLIB
            return "/WPCordovaClassLib;component/";
#else
            return "./";
#endif
        }
    }



}
