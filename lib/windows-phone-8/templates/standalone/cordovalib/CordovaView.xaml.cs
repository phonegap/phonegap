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
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using Microsoft.Phone.Controls;
using System.IO.IsolatedStorage;
using System.Windows.Resources;
using System.Windows.Interop;
using System.Runtime.Serialization.Json;
using System.IO;
using System.ComponentModel;
using System.Xml.Linq;
using WPCordovaClassLib.Cordova.Commands;
using System.Diagnostics;
using System.Text;
using WPCordovaClassLib.Cordova;
using System.Threading;
using Microsoft.Phone.Shell;
using WPCordovaClassLib.Cordova.JSON;
using WPCordovaClassLib.CordovaLib;



namespace WPCordovaClassLib
{
    public partial class CordovaView : UserControl
    {

        /// <summary>
        /// Indicates whether web control has been loaded and no additional initialization is needed.
        /// Prevents data clearing during page transitions.
        /// </summary>
        private bool IsBrowserInitialized = false;

        /// <summary>
        /// Set when the user attaches a back button handler inside the WebBrowser
        /// </summary>
        private bool OverrideBackButton = false;

        /// <summary>
        /// Sentinal to keep track of page changes as a result of the hardware back button
        /// Set to false when the back-button is pressed, which calls js window.history.back()
        /// If the page changes as a result of the back button the event is cancelled.
        /// </summary>
        private bool PageDidChange = false;

        private static string AppRoot = "";


        /// <summary>
        /// Handles native api calls
        /// </summary>
        private NativeExecution nativeExecution;

        protected BrowserMouseHelper bmHelper;
        protected DOMStorageHelper domStorageHelper;
        protected OrientationHelper orientationHelper;

        private ConfigHandler configHandler;

        public System.Windows.Controls.Grid _LayoutRoot
        {
            get
            {
                return ((System.Windows.Controls.Grid)(this.FindName("LayoutRoot")));
            }
        }

        public WebBrowser Browser
        {
            get
            {
                return CordovaBrowser;
            }
        }

        /*
         * Setting StartPageUri only has an effect if called before the view is loaded.
         **/
        protected Uri _startPageUri = null;
        public Uri StartPageUri
        {
            get
            {
                if (_startPageUri == null)
                {
                    // default
                    return new Uri(AppRoot + "www/index.html", UriKind.Relative);
                }
                else
                {
                    return _startPageUri;
                }
            }
            set
            {
                if (!this.IsBrowserInitialized)
                {
                    _startPageUri = value;
                }
            }
        }
       
        /// <summary>
        /// Gets or sets whether to suppress bouncy scrolling of
        /// the WebBrowser control;
        /// </summary>
        public bool DisableBouncyScrolling
        {
            get;
            set;
        }

        public CordovaView()
        {

            InitializeComponent();

            if (DesignerProperties.IsInDesignTool)
            {
                return;
            }


            StartupMode mode = PhoneApplicationService.Current.StartupMode;

            if (mode == StartupMode.Launch)
            {
                PhoneApplicationService service = PhoneApplicationService.Current;
                service.Activated += new EventHandler<Microsoft.Phone.Shell.ActivatedEventArgs>(AppActivated);
                service.Launching += new EventHandler<LaunchingEventArgs>(AppLaunching);
                service.Deactivated += new EventHandler<DeactivatedEventArgs>(AppDeactivated);
                service.Closing += new EventHandler<ClosingEventArgs>(AppClosing);
            }
            else
            {

            }

            // initializes native execution logic
            configHandler = new ConfigHandler();
            configHandler.LoadAppPackageConfig();

            nativeExecution = new NativeExecution(ref this.CordovaBrowser);
            bmHelper = new BrowserMouseHelper(ref this.CordovaBrowser);
        }



        void AppClosing(object sender, ClosingEventArgs e)
        {
            Debug.WriteLine("AppClosing");
        }

        void AppDeactivated(object sender, DeactivatedEventArgs e)
        {
            Debug.WriteLine("INFO: AppDeactivated");

            try
            {
                CordovaBrowser.InvokeScript("eval", new string[] { "cordova.fireDocumentEvent('pause');" });
            }
            catch (Exception)
            {
                Debug.WriteLine("ERROR: Pause event error");
            }
        }

        void AppLaunching(object sender, LaunchingEventArgs e)
        {
            Debug.WriteLine("INFO: AppLaunching");
        }

        void AppActivated(object sender, Microsoft.Phone.Shell.ActivatedEventArgs e)
        {
            Debug.WriteLine("INFO: AppActivated");
            try
            {
                CordovaBrowser.InvokeScript("eval", new string[] { "cordova.fireDocumentEvent('resume');" });
            }
            catch (Exception)
            {
                Debug.WriteLine("ERROR: Resume event error");
            }
        }

        void CordovaBrowser_Loaded(object sender, RoutedEventArgs e)
        {
            this.bmHelper.ScrollDisabled = this.DisableBouncyScrolling;

            if (DesignerProperties.IsInDesignTool)
            {
                return;
            }

            // prevents refreshing web control to initial state during pages transitions
            if (this.IsBrowserInitialized) return;



            this.domStorageHelper = new DOMStorageHelper(this.CordovaBrowser);

            try
            {

                // Before we possibly clean the ISO-Store, we need to grab our generated UUID, so we can rewrite it after.
                string deviceUUID = "";

                using (IsolatedStorageFile appStorage = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    try
                    {
                        IsolatedStorageFileStream fileStream = new IsolatedStorageFileStream("DeviceID.txt", FileMode.Open, FileAccess.Read, appStorage);

                        using (StreamReader reader = new StreamReader(fileStream))
                        {
                            deviceUUID = reader.ReadLine();
                        }
                    }
                    catch (Exception /*ex*/)
                    {
                        deviceUUID = Guid.NewGuid().ToString();
                    }

                    Debug.WriteLine("Updating IsolatedStorage for APP:DeviceID :: " + deviceUUID);
                    IsolatedStorageFileStream file = new IsolatedStorageFileStream("DeviceID.txt", FileMode.Create, FileAccess.Write, appStorage);
                    using (StreamWriter writeFile = new StreamWriter(file))
                    {
                        writeFile.WriteLine(deviceUUID);
                        writeFile.Close();
                    }

                }

                /*
                 * 11/08/12 Ruslan Kokorev
                 * Copying files to isolated storage is no more required in WP8. WebBrowser control now works with files located in XAP.
                */

                //StreamResourceInfo streamInfo = Application.GetResourceStream(new Uri("CordovaSourceDictionary.xml", UriKind.Relative));

                //if (streamInfo != null)
                //{
                //    StreamReader sr = new StreamReader(streamInfo.Stream);
                //    //This will Read Keys Collection for the xml file

                //    XDocument document = XDocument.Parse(sr.ReadToEnd());

                //    var files = from results in document.Descendants("FilePath")
                //                select new
                //                {
                //                    path = (string)results.Attribute("Value")
                //                };
                //    StreamResourceInfo fileResourceStreamInfo;

                //    using (IsolatedStorageFile appStorage = IsolatedStorageFile.GetUserStoreForApplication())
                //    {

                //        foreach (var file in files)
                //        {
                //            fileResourceStreamInfo = Application.GetResourceStream(new Uri(file.path, UriKind.Relative));

                //            if (fileResourceStreamInfo != null)
                //            {
                //                using (BinaryReader br = new BinaryReader(fileResourceStreamInfo.Stream))
                //                {
                //                    byte[] data = br.ReadBytes((int)fileResourceStreamInfo.Stream.Length);

                //                    string strBaseDir = AppRoot + file.path.Substring(0, file.path.LastIndexOf(System.IO.Path.DirectorySeparatorChar));

                //                    if (!appStorage.DirectoryExists(strBaseDir))
                //                    {
                //                        Debug.WriteLine("INFO: Creating Directory :: " + strBaseDir);
                //                        appStorage.CreateDirectory(strBaseDir);
                //                    }

                //                    // This will truncate/overwrite an existing file, or 
                //                    using (IsolatedStorageFileStream outFile = appStorage.OpenFile(AppRoot + file.path, FileMode.Create))
                //                    {
                //                        Debug.WriteLine("INFO: Writing data for " + AppRoot + file.path + " and length = " + data.Length);
                //                        using (var writer = new BinaryWriter(outFile))
                //                        {
                //                            writer.Write(data);
                //                        }
                //                    }
                //                }
                //            }
                //            else
                //            {
                //                Debug.WriteLine("ERROR: Failed to write file :: " + file.path + " did you forget to add it to the project?");
                //            }
                //        }
                //    }
                //}

                CordovaBrowser.Navigate(StartPageUri);
                IsBrowserInitialized = true;
                AttachHardwareButtonHandlers();
            }
            catch (Exception ex)
            {
                Debug.WriteLine("ERROR: Exception in CordovaBrowser_Loaded :: {0}", ex.Message);
            }
        }

        void AttachHardwareButtonHandlers()
        {
            PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
            if (frame != null)
            {
                PhoneApplicationPage page = frame.Content as PhoneApplicationPage;

                if (page != null)
                {
                    page.BackKeyPress += new EventHandler<CancelEventArgs>(page_BackKeyPress);

                    this.orientationHelper = new OrientationHelper(this.CordovaBrowser, page);

                }
            }
        }

        void page_BackKeyPress(object sender, CancelEventArgs e)
        {

            if (OverrideBackButton)
            {
                try
                {
                    CordovaBrowser.InvokeScript("eval", new string[] { "cordova.fireDocumentEvent('backbutton');" });
                    e.Cancel = true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Exception while invoking backbutton into cordova view: " + ex.Message);
                }
            }
            else
            {
                try
                {
                    PageDidChange = false;

                    Uri uriBefore = this.Browser.Source;
                    // calling js history.back with result in a page change if history was valid.
                    CordovaBrowser.InvokeScript("eval", new string[] { "(function(){window.history.back();})()" });

                    Uri uriAfter = this.Browser.Source;

                    e.Cancel = PageDidChange || (uriBefore != uriAfter);
                }
                catch (Exception)
                {
                    e.Cancel = false; // exit the app ... ?
                }
            }
        }

        void CordovaBrowser_LoadCompleted(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            string[] autoloadPlugs = this.configHandler.AutoloadPlugins;
            foreach (string plugName in autoloadPlugs)
            {
               // nativeExecution.ProcessCommand(commandCallParams); 
            }

            string nativeReady = "(function(){ cordova.require('cordova/channel').onNativeReady.fire()})();";

            try
            {
                CordovaBrowser.InvokeScript("execScript", new string[] { nativeReady });
            }
            catch (Exception /*ex*/)
            {
                Debug.WriteLine("Error calling js to fire nativeReady event. Did you include cordova-x.x.x.js in your html script tag?");
            }

            if (this.CordovaBrowser.Opacity < 1)
            {
                this.CordovaBrowser.Opacity = 1;
                RotateIn.Begin();
            }
        }


        void CordovaBrowser_Navigating(object sender, NavigatingEventArgs e)
        {
            if (!configHandler.URLIsAllowed(e.Uri.ToString()))
            {
                Debug.WriteLine("Whitelist exception: Stopping browser from navigating to :: " + e.Uri.ToString());
                e.Cancel = true;
                return;
            }

            this.PageDidChange = true;
            this.nativeExecution.ResetAllCommands();
        }

        /*
         *  This method does the work of routing commands
         *  NotifyEventArgs.Value contains a string passed from JS 
         *  If the command already exists in our map, we will just attempt to call the method(action) specified, and pass the args along
         *  Otherwise, we create a new instance of the command, add it to the map, and call it ...
         *  This method may also receive JS error messages caught by window.onerror, in any case where the commandStr does not appear to be a valid command
         *  it is simply output to the debugger output, and the method returns.
         * 
         **/
        void CordovaBrowser_ScriptNotify(object sender, NotifyEventArgs e)
        {
            string commandStr = e.Value;

            if (commandStr.IndexOf("DOMStorage") == 0)
            {
                this.domStorageHelper.HandleStorageCommand(commandStr);
                return;
            }
            else if (commandStr.IndexOf("Orientation") == 0)
            {
                this.orientationHelper.HandleCommand(commandStr);
                return;
            }

            CordovaCommandCall commandCallParams = CordovaCommandCall.Parse(commandStr);

            if (commandCallParams == null)
            {
                // ERROR
                Debug.WriteLine("ScriptNotify :: " + commandStr);
            }
            else if (commandCallParams.Service == "CoreEvents")
            {
                switch (commandCallParams.Action.ToLower())
                {
                    case "overridebackbutton":
                        string arg0 = JsonHelper.Deserialize<string[]>(commandCallParams.Args)[0];
                        this.OverrideBackButton = (arg0 != null && arg0.Length > 0 && arg0.ToLower() == "true"); 
                        break;
                }
            }
            else
            {
                if (configHandler.IsPluginAllowed(commandCallParams.Service))
                {
                    nativeExecution.ProcessCommand(commandCallParams);
                }
                else
                {
                    Debug.WriteLine("Error::Plugin not allowed in config.xml. " + commandCallParams.Service); 
                }
            }
        }

        public void LoadPage(string url)
        {
            if (this.configHandler.URLIsAllowed(url))
            {
                this.CordovaBrowser.Navigate(new Uri(url, UriKind.RelativeOrAbsolute));
            }
            else
            {
                Debug.WriteLine("Oops, Can't load url based on config.xml :: " + url);
            }
        }

        private void CordovaBrowser_Unloaded(object sender, RoutedEventArgs e)
        {

        }

        private void CordovaBrowser_NavigationFailed(object sender, System.Windows.Navigation.NavigationFailedEventArgs e)
        {
            Debug.WriteLine("CordovaBrowser_NavigationFailed :: " + e.Uri.ToString());
        }

        private void CordovaBrowser_Navigated(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            Debug.WriteLine("CordovaBrowser_Navigated :: " + e.Uri.ToString());
        }


    }
}
