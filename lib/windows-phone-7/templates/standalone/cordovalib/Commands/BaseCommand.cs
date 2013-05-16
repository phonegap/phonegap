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

namespace WPCordovaClassLib.Cordova.Commands
{
    public abstract class BaseCommand : IDisposable
    {
        /*
         *  All commands + plugins must extend BaseCommand, because they are dealt with as BaseCommands in PGView.xaml.cs
         *  
         **/

        public event EventHandler<PluginResult> OnCommandResult;

        public event EventHandler<ScriptCallback> OnCustomScript;

        public BaseCommand()
        {
            PhoneApplicationService service = PhoneApplicationService.Current;
            service.Activated += this.OnResume;
            service.Deactivated += this.OnPause;
        }

        /*
         *  InvokeMethodNamed will call the named method of a BaseCommand subclass if it exists and pass the variable arguments list along.
         **/

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

        public void DispatchCommandResult(PluginResult result)
        {
            if (this.OnCommandResult != null)
            {
                this.OnCommandResult(this, result);

                if (!result.KeepCallback)
                {
                    this.Dispose();
                }

            }
        }


        /// <summary>
        /// Occurs when the application is being deactivated.
        /// </summary>        
        public virtual void OnReset()
        {
        }

        /// <summary>
        /// Occurs when the application is being loaded, and the config.xml has an autoload entry
        /// </summary>    
        public virtual void OnInit()
        {

        }


        /// <summary>
        /// Occurs when the application is being deactivated.
        /// </summary>        
        public virtual void OnPause(object sender, DeactivatedEventArgs e)
        {
        }

        /// <summary>
        /// Occurs when the application is being made active after previously being put
        /// into a dormant state or tombstoned.
        /// </summary>        
        public virtual void OnResume(object sender, Microsoft.Phone.Shell.ActivatedEventArgs e)
        {
        }

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
