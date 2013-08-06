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
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Phone.Controls;
using System.Windows.Input;
using System.Diagnostics;
using System.Windows.Media;
using System;
using System.Collections.Generic;

namespace WPCordovaClassLib
{

    /// <summary>
    /// Suppresses pinch zoom and optionally scrolling of the WebBrowser control
    /// </summary>
    public class BrowserMouseHelper
    {
        private WebBrowser _browser;

        /// <summary>
        /// Gets or sets whether to suppress the scrolling of
        /// the WebBrowser control;
        /// </summary>
        public bool ScrollDisabled {
            get;
            set;
        }

        private bool userScalable = true;
        private double maxScale = 2.0;
        private double minScale = 0.5;
        protected Border border;

        /// <summary>
        /// Represent min delta value to consider event as a mouse move. Experimental calculated.
        /// </summary>
        private const int MouseMoveDeltaThreshold = 10;

        public BrowserMouseHelper(ref WebBrowser browser)
        {
            _browser = browser;
            browser.Loaded += new RoutedEventHandler(browser_Loaded);
        }

        private void browser_Loaded(object sender, RoutedEventArgs e)
        {
            var border0 = VisualTreeHelper.GetChild(_browser, 0);
            var border1 = VisualTreeHelper.GetChild(border0, 0);
            var panZoom = VisualTreeHelper.GetChild(border1, 0);
            var grid = VisualTreeHelper.GetChild(panZoom, 0);             
            var grid2 = VisualTreeHelper.GetChild(grid, 0);
            border = VisualTreeHelper.GetChild(grid2, 0) as Border;
            
            if (border != null)
            {
                border.ManipulationDelta += Border_ManipulationDelta;
                border.ManipulationCompleted += Border_ManipulationCompleted;
            }

            _browser.LoadCompleted += Browser_LoadCompleted;

        }

        void ParseViewportMeta()
        {
            string metaScript = "(function() { return document.querySelector('meta[name=viewport]').content; })()";

            try
            {
                string metaContent = _browser.InvokeScript("eval", new string[] { metaScript }) as string;
                string[] arr = metaContent.Split(new[] { ' ', ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
                Dictionary<string, string> metaDictionary = new Dictionary<string, string>();
                foreach (string val in arr)
                {
                    string[] keyVal = val.Split('=');
                    metaDictionary.Add(keyVal[0], keyVal[1]);
                }

                this.userScalable = false; // reset to default
                if (metaDictionary.ContainsKey("user-scalable"))
                {
                    this.userScalable = metaDictionary["user-scalable"] == "yes";
                }

                this.maxScale = 2.0;// reset to default
                if (metaDictionary.ContainsKey("maximum-scale"))
                {
                    this.maxScale = double.Parse(metaDictionary["maximum-scale"]);
                }

                this.minScale = 0.5;// reset to default
                if (metaDictionary.ContainsKey("minimum-scale"))
                {
                    this.minScale = double.Parse(metaDictionary["minimum-scale"]);
                }
            }
            catch (Exception)
            {

            }
        }

        void Browser_LoadCompleted(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            ParseViewportMeta();
        }

        #region ManipulationEvents

        private void Border_ManipulationDelta(object sender, ManipulationDeltaEventArgs e)
        {
            //Debug.WriteLine("Border_ManipulationDelta");
            // optionally suppress zoom
            if ((ScrollDisabled || !userScalable) && (e.DeltaManipulation.Scale.X != 0.0 || e.DeltaManipulation.Scale.Y != 0.0))
            {
                e.Handled = true;
            }
            // optionally suppress scrolling
            if (ScrollDisabled && (e.DeltaManipulation.Translation.X != 0.0 || e.DeltaManipulation.Translation.Y != 0.0))
            {
                e.Handled = true;
            }
        }

        private void Border_ManipulationCompleted(object sender, ManipulationCompletedEventArgs e)
        {
            //Debug.WriteLine("Border_ManipulationCompleted");
            // suppress zoom
            if (!userScalable && e.FinalVelocities != null)
            {
                if (e.FinalVelocities.ExpansionVelocity.X != 0.0 ||
                   e.FinalVelocities.ExpansionVelocity.Y != 0.0)
                {
                    e.Handled = true;
                }
            }
        }


        #endregion

    }
}
