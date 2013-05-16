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
using System.Windows;
using System.Windows.Controls;
using Microsoft.Devices;
using System.Runtime.Serialization;
using System.Threading;
using System.Windows.Resources;
using Microsoft.Phone.Controls;
using Microsoft.Xna.Framework.Audio;
using WPCordovaClassLib.Cordova.UI;


namespace WPCordovaClassLib.Cordova.Commands
{
    public class Notification : BaseCommand
    {
        static ProgressBar progressBar = null;
        const int DEFAULT_DURATION = 5;

        private NotificationBox notifyBox;

        private PhoneApplicationPage Page
        {
            get
            {
                PhoneApplicationPage page = null;
                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                if (frame != null)
                {
                    page = frame.Content as PhoneApplicationPage;
                }
                return page;
            }
        }

        // blink api - doesn't look like there is an equivalent api we can use...
        
        [DataContract]
        public class AlertOptions
        {
            [OnDeserializing]
            public void OnDeserializing(StreamingContext context)
            {
                // set defaults
                this.message = "message";
                this.title = "Alert";
                this.buttonLabel = "ok";
            }

            /// <summary>
            /// message to display in the alert box
            /// </summary>
            [DataMember]
            public string message;

            /// <summary>
            /// title displayed on the alert window
            /// </summary>
            [DataMember]
            public string title;

            /// <summary>
            /// text to display on the button
            /// </summary>
            [DataMember]
            public string buttonLabel;
        }

        public void alert(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                AlertOptions alertOpts = new AlertOptions();
                alertOpts.message = args[0];
                alertOpts.title = args[1];
                alertOpts.buttonLabel = args[2];

                PhoneApplicationPage page = Page;
                if (page != null)
                {
                    Grid grid = page.FindName("LayoutRoot") as Grid;
                    if (grid != null)
                    {
                        var previous = notifyBox;
                        notifyBox = new NotificationBox();
                        notifyBox.Tag = previous;
                        notifyBox.PageTitle.Text = alertOpts.title;
                        notifyBox.SubTitle.Text = alertOpts.message;
                        Button btnOK = new Button();
                        btnOK.Content = alertOpts.buttonLabel;
                        btnOK.Click += new RoutedEventHandler(btnOK_Click);
                        btnOK.Tag = 1;
                        notifyBox.ButtonPanel.Children.Add(btnOK);
                        grid.Children.Add(notifyBox);

                        if (previous == null)
                        {
                            page.BackKeyPress += page_BackKeyPress;
                        }
                    }
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.INSTANTIATION_EXCEPTION));
                }
            });
        }

        public void confirm(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                AlertOptions alertOpts = new AlertOptions();
                alertOpts.message = args[0];
                alertOpts.title = args[1];
                alertOpts.buttonLabel = args[2];

                PhoneApplicationPage page = Page;
                if (page != null)
                {
                    Grid grid = page.FindName("LayoutRoot") as Grid;
                    if (grid != null)
                    {
                        var previous = notifyBox;
                        notifyBox = new NotificationBox();
                        notifyBox.Tag = previous; 
                        notifyBox.PageTitle.Text = alertOpts.title;
                        notifyBox.SubTitle.Text = alertOpts.message;

                        string[] labels = JSON.JsonHelper.Deserialize<string[]>(alertOpts.buttonLabel);

                        if (labels == null)
                        {
                            labels = alertOpts.buttonLabel.Split(',');
                        }

                        for (int n = 0; n < labels.Length; n++)
                        {
                            Button btn = new Button();
                            btn.Content = labels[n];
                            btn.Tag = n;
                            btn.Click += new RoutedEventHandler(btnOK_Click);
                            notifyBox.ButtonPanel.Children.Add(btn);
                        }

                        grid.Children.Add(notifyBox);
                        if (previous == null)
                        {
                            page.BackKeyPress += page_BackKeyPress;
                        }
                    }
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.INSTANTIATION_EXCEPTION));
                }
            });
        }

        void page_BackKeyPress(object sender, System.ComponentModel.CancelEventArgs e)
        {
            PhoneApplicationPage page = sender as PhoneApplicationPage;

            if (page != null && notifyBox != null)
            {
                Grid grid = page.FindName("LayoutRoot") as Grid;
                if (grid != null)
                {
                    grid.Children.Remove(notifyBox);
                    notifyBox = notifyBox.Tag as NotificationBox;
                }
                if (notifyBox == null)
                {
                    page.BackKeyPress -= page_BackKeyPress;
                }
                e.Cancel = true;
            }

            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, 0));
        }

        void btnOK_Click(object sender, RoutedEventArgs e)
        {
            Button btn = sender as Button;
            FrameworkElement notifBoxParent = null;
            int retVal = 0;
            if (btn != null)
            {
                retVal = (int)btn.Tag + 1;

                notifBoxParent = btn.Parent as FrameworkElement;
                while ((notifBoxParent = notifBoxParent.Parent as FrameworkElement) != null &&
                       !(notifBoxParent is NotificationBox));
            }
            if (notifBoxParent != null)
            {
                PhoneApplicationPage page = Page;
                if (page != null)
                {
                    Grid grid = page.FindName("LayoutRoot") as Grid;
                    if (grid != null)
                    {
                        grid.Children.Remove(notifBoxParent);
                    }
                    notifyBox = notifBoxParent.Tag as NotificationBox;
                    if (notifyBox == null)
                    {
                        page.BackKeyPress -= page_BackKeyPress;
                    }
                }
                
            }
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, retVal));
        }



        public void beep(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            int times = int.Parse(args[0]);

            string resourcePath = BaseCommand.GetBaseURL() + "resources/notification-beep.wav";

            StreamResourceInfo sri = Application.GetResourceStream(new Uri(resourcePath, UriKind.Relative));

            if (sri != null)
            {
                SoundEffect effect = SoundEffect.FromStream(sri.Stream);
                SoundEffectInstance inst = effect.CreateInstance();
                ThreadPool.QueueUserWorkItem((o) =>
                {
                    // cannot interact with UI !!
                    do
                    {
                        inst.Play();
                        Thread.Sleep(effect.Duration + TimeSpan.FromMilliseconds(100));
                    }
                    while (--times > 0);

                });

            }

            // TODO: may need a listener to trigger DispatchCommandResult after the alarm has finished executing...
            DispatchCommandResult();
        }

        // Display an indeterminate progress indicator
        public void activityStart(string unused)
        {

            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;

                if (frame != null)
                {
                    PhoneApplicationPage page = frame.Content as PhoneApplicationPage;

                    if (page != null)
                    {
                        var temp = page.FindName("LayoutRoot");
                        Grid grid = temp as Grid;
                        if (grid != null)
                        {
                            if (progressBar != null)
                            {
                                grid.Children.Remove(progressBar);
                            }
                            progressBar = new ProgressBar();
                            progressBar.IsIndeterminate = true;
                            progressBar.IsEnabled = true;

                            grid.Children.Add(progressBar);
                        }
                    }
                }
            });
        }


        // Remove our indeterminate progress indicator
        public void activityStop(string unused)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                if (progressBar != null)
                {
                    progressBar.IsEnabled = false;
                    PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                    if (frame != null)
                    {
                        PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                        if (page != null)
                        {
                            Grid grid = page.FindName("LayoutRoot") as Grid;
                            if (grid != null)
                            {
                                grid.Children.Remove(progressBar);
                            }
                        }
                    }
                    progressBar = null;
                }
            });
        }

        public void vibrate(string vibrateDuration)
        {
            
            int msecs = 200; // set default

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(vibrateDuration);

                msecs = int.Parse(args[0]);
                if (msecs < 1)
                {
                    msecs = 1;
                }
            }
            catch (FormatException)
            {

            }

            VibrateController.Default.Start(TimeSpan.FromMilliseconds(msecs));

            // TODO: may need to add listener to trigger DispatchCommandResult when the vibration ends...
            DispatchCommandResult();
        }
    }
}
