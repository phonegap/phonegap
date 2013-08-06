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
using Microsoft.Phone.Controls;
using System.Diagnostics;
using System.Runtime.Serialization;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;
using Microsoft.Phone.Shell;
using Microsoft.Phone.Tasks;

namespace WPCordovaClassLib.Cordova.Commands
{
    [DataContract]
    public class BrowserOptions
    {
        [DataMember]
        public string url;

        [DataMember]
        public bool isGeolocationEnabled;
    }

    public class InAppBrowser : BaseCommand
    {

        private static WebBrowser browser;
        private static ApplicationBarIconButton backButton;
        private static ApplicationBarIconButton fwdButton;

        public void open(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            //BrowserOptions opts = JSON.JsonHelper.Deserialize<BrowserOptions>(options);
            string urlLoc = args[0];
            string target = args[1];
            /*
                _self - opens in the Cordova WebView if url is in the white-list, else it opens in the InAppBrowser 
                _blank - always open in the InAppBrowser 
                _system - always open in the system web browser 
            */
            switch (target)
            {
                case "_blank":
                    ShowInAppBrowser(urlLoc);
                    break;
                case "_self":
                    ShowCordovaBrowser(urlLoc);
                    break;
                case "_system":
                    ShowSystemBrowser(urlLoc);
                    break;
            }


        }

        private void ShowCordovaBrowser(string url)
        {
            Uri loc = new Uri(url, UriKind.RelativeOrAbsolute);
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                if (frame != null)
                {
                    PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                    if (page != null)
                    {
                        CordovaView cView = page.FindName("CordovaView") as CordovaView;
                        if (cView != null)
                        {
                            WebBrowser br = cView.Browser;
                            br.Navigate(loc);
                        }
                    }

                }
            });
        }

        private void ShowSystemBrowser(string url)
        {
            WebBrowserTask webBrowserTask = new WebBrowserTask();
            webBrowserTask.Uri = new Uri(url, UriKind.Absolute);
            webBrowserTask.Show();
        }


        private void ShowInAppBrowser(string url)
        {
            Uri loc = new Uri(url);

            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                if (browser != null)
                {
                    //browser.IsGeolocationEnabled = opts.isGeolocationEnabled;
                    browser.Navigate(loc);
                }
                else
                {
                    PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                    if (frame != null)
                    {
                        PhoneApplicationPage page = frame.Content as PhoneApplicationPage;

                        string baseImageUrl = "Images/";

                        if (page != null)
                        {
                            Grid grid = page.FindName("LayoutRoot") as Grid;
                            if (grid != null)
                            {
                                browser = new WebBrowser();
                                browser.IsScriptEnabled = true;
                                browser.LoadCompleted += new System.Windows.Navigation.LoadCompletedEventHandler(browser_LoadCompleted);

                                browser.Navigating += new EventHandler<NavigatingEventArgs>(browser_Navigating);
                                browser.NavigationFailed += new System.Windows.Navigation.NavigationFailedEventHandler(browser_NavigationFailed);
                                browser.Navigated += new EventHandler<System.Windows.Navigation.NavigationEventArgs>(browser_Navigated);
                                browser.Navigate(loc);
                                //browser.IsGeolocationEnabled = opts.isGeolocationEnabled;
                                grid.Children.Add(browser);
                            }

                            ApplicationBar bar = new ApplicationBar();
                            bar.BackgroundColor = Colors.Gray;
                            bar.IsMenuEnabled = false;

                            backButton = new ApplicationBarIconButton();
                            backButton.Text = "Back";

                            backButton.IconUri = new Uri(baseImageUrl + "appbar.back.rest.png", UriKind.Relative);
                            backButton.Click += new EventHandler(backButton_Click);
                            bar.Buttons.Add(backButton);


                            fwdButton = new ApplicationBarIconButton();
                            fwdButton.Text = "Forward";
                            fwdButton.IconUri = new Uri(baseImageUrl + "appbar.next.rest.png", UriKind.Relative);
                            fwdButton.Click += new EventHandler(fwdButton_Click);
                            bar.Buttons.Add(fwdButton);

                            ApplicationBarIconButton closeBtn = new ApplicationBarIconButton();
                            closeBtn.Text = "Close";
                            closeBtn.IconUri = new Uri(baseImageUrl + "appbar.close.rest.png", UriKind.Relative);
                            closeBtn.Click += new EventHandler(closeBtn_Click);
                            bar.Buttons.Add(closeBtn);

                            page.ApplicationBar = bar;
                        }

                    }
                }
            });
        }

        void browser_LoadCompleted(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {

        }

        void fwdButton_Click(object sender, EventArgs e)
        {
            if (browser != null)
            {
                try
                {
#if WP8
                    browser.GoForward();
#else
                    browser.InvokeScript("execScript", "history.forward();");
#endif
                }
                catch (Exception)
                {

                }
            }
        }

        void backButton_Click(object sender, EventArgs e)
        {
            if (browser != null)
            {
                try
                {
#if WP8
                    browser.GoBack();
#else           
                    browser.InvokeScript("execScript", "history.back();");
#endif
                }
                catch (Exception)
                {

                }
            }
        }

        void closeBtn_Click(object sender, EventArgs e)
        {
            this.close();
        }


        public void close(string options = "")
        {
            if (browser != null)
            {
                Deployment.Current.Dispatcher.BeginInvoke(() =>
                {
                    PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                    if (frame != null)
                    {
                        PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                        if (page != null)
                        {
                            Grid grid = page.FindName("LayoutRoot") as Grid;
                            if (grid != null)
                            {
                                grid.Children.Remove(browser);
                            }
                            page.ApplicationBar = null;
                        }
                    }
                    browser = null;
                    string message = "{\"type\":\"exit\"}";
                    PluginResult result = new PluginResult(PluginResult.Status.OK, message);
                    result.KeepCallback = false;
                    this.DispatchCommandResult(result);
                });
            }
        }

        void browser_Navigated(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
#if WP8
            if (browser != null)
            {
                backButton.IsEnabled = browser.CanGoBack;
                fwdButton.IsEnabled = browser.CanGoForward;

            }
#endif
            string message = "{\"type\":\"loadstop\", \"url\":\"" + e.Uri.AbsoluteUri + "\"}";
            PluginResult result = new PluginResult(PluginResult.Status.OK, message);
            result.KeepCallback = true;
            this.DispatchCommandResult(result);
        }

        void browser_NavigationFailed(object sender, System.Windows.Navigation.NavigationFailedEventArgs e)
        {
            string message = "{\"type\":\"error\",\"url\":\"" + e.Uri.AbsoluteUri + "\"}";
            PluginResult result = new PluginResult(PluginResult.Status.ERROR, message);
            result.KeepCallback = true;
            this.DispatchCommandResult(result);
        }

        void browser_Navigating(object sender, NavigatingEventArgs e)
        {
            string message = "{\"type\":\"loadstart\",\"url\":\"" + e.Uri.AbsoluteUri + "\"}";
            PluginResult result = new PluginResult(PluginResult.Status.OK, message);
            result.KeepCallback = true;
            this.DispatchCommandResult(result);
        }

    }
}
