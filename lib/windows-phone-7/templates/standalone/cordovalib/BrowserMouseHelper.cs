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

        /**
         * 
         * Full Script below, in use it is minified.
        */
        /*
        private static string mouseScript =
        @"(function(win,doc){
            var mPro = MouseEvent.prototype;
            var def = Object.defineProperty;
            def( mPro, 'pageX', {
               configurable: true,
               get: function(){ return this.clientX }
            });
            def( mPro, 'pageY', {
               configurable: true,
               get: function(){ return this.clientY }
            });

            win.onNativeMouseEvent = function(type,x,y){
                try {
                    var xMod = screen.logicalXDPI / screen.deviceXDPI;
                    var yMod = screen.logicalYDPI / screen.deviceYDPI;
                    var evt = doc.createEvent('MouseEvents');
                    var xPos =  doc.body.scrollLeft + Math.round(xMod * x);
                    var yPos =  doc.body.scrollTop + Math.round(yMod * y);
                    var element = doc.elementFromPoint(xPos,yPos);
                    
                    evt.initMouseEvent(type, true, true, win, 1, xPos, yPos, xPos, yPos, false, false, false, false, 0, element);
                    evt.timeStamp = +new Date;
                    evt.isCordovaEvent = true;
                    
                    var canceled = element ? !element.dispatchEvent(evt) : !doc.dispatchEvent(evt);
                    return canceled ? 'true' : 'false';
                }
                catch(e) { return e;}
            }
        })(window,document);";
        */

        private static string MinifiedMouseScript = "(function(g,a){var c=MouseEvent.prototype,d=Object.defineProperty;d(c,'pageX',{configurable:!0,get:function(){return this.clientX}});d(c,'pageY',{configurable:!0,get:function(){return this.clientY}});g.onNativeMouseEvent=function(c,d,i)"
        + "{try{var j=screen.logicalXDPI/screen.deviceXDPI,k=screen.logicalYDPI/screen.deviceYDPI,b=a.createEvent('MouseEvents'),e=a.body.scrollLeft+Math.round(j*d),f=a.body.scrollTop+Math.round(k*i),h=a.elementFromPoint(e,f);b.initMouseEvent(c,!0,!0,g,1,e,f,e,f,!1,!1,!1,!1,0,"
        + "h);b.timeStamp=+new Date;b.isCordovaEvent=!0;return(h?!h.dispatchEvent(b):!a.dispatchEvent(b))?'true':'false'}catch(l){return l}}})(window,document);";


        private WebBrowser _browser;

        /// <summary>
        /// Gets or sets whether to suppress the scrolling of
        /// the WebBrowser control;
        /// </summary>
        public bool ScrollDisabled { get; set; }

        private bool userScalable = true;
        private double maxScale = 2.0;
        private double minScale = 0.5;
        protected Border border;
        private bool firstMouseMove = false;

        /// <summary>
        /// Represents last known mouse down position. 
        /// Used to determine mouse move delta to avoid duplicate mouse events.
        /// </summary>
        private Point mouseDownPos;

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
            border = VisualTreeHelper.GetChild(grid, 0) as Border;

            if (border != null)
            {
                border.ManipulationStarted += Border_ManipulationStarted;
                border.ManipulationDelta += Border_ManipulationDelta;
                border.ManipulationCompleted += Border_ManipulationCompleted;
                border.DoubleTap += Border_DoubleTap;
                border.Tap += Border_Tap;
                border.Hold += Border_Hold;
                border.MouseLeftButtonDown += Border_MouseLeftButtonDown;
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

            try
            {
                _browser.InvokeScript("execScript", MinifiedMouseScript);
            }
            catch (Exception)
            {
                Debug.WriteLine("BrowserHelper Failed to install mouse script in WebBrowser");
            }
        }

        bool InvokeSimulatedMouseEvent(string eventName, Point pos)
        {
            bool bCancelled = false;
            try
            {
                string strCancelled = _browser.InvokeScript("onNativeMouseEvent", new string[] { eventName, pos.X.ToString(), pos.Y.ToString() }) as string;
                if (bool.TryParse(strCancelled, out bCancelled))
                {
                    return bCancelled;
                }
            }
            catch (Exception)
            {
                // script error
            }

            return bCancelled;
        }

        #region Hold

        void Border_Hold(object sender, GestureEventArgs e)
        {
            //Debug.WriteLine("Border_Hold");
            e.Handled = true;
        }

        #endregion

        #region DoubleTap

        void Border_DoubleTap(object sender, GestureEventArgs e)
        {
            //Debug.WriteLine("Border_DoubleTap");
            e.Handled = true;
        }

        #endregion

        #region Tap

        void Border_Tap(object sender, GestureEventArgs e)
        {
            // prevents generating duplicated mouse events
            // firstMouseMove == FALSE means we already handled this situation and generated mouse events
            e.Handled = !this.firstMouseMove;
        }
        #endregion

        #region MouseEvents

        void Border_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            //Debug.WriteLine("Border_MouseLeftButtonDown");
            border.MouseMove += new MouseEventHandler(Border_MouseMove);
            border.MouseLeftButtonUp += new MouseButtonEventHandler(Border_MouseLeftButtonUp);

            this.mouseDownPos = e.GetPosition(_browser);
            // don't fire the down event until we know if this is a 'move' or not
            firstMouseMove = true;
        }
        //
        void Border_MouseMove(object sender, MouseEventArgs e)
        {
            //Debug.WriteLine("Border_MouseMove");
            Point pos = e.GetPosition(_browser);
            // only the return value from the first mouse move event should be used to determine if scrolling is prevented.
            if (firstMouseMove)
            {
                // even for simple tap there are situations where ui control generates move with some little delta value
                // we should avoid such situations allowing to browser control generate native js mousedown/up/click events
                if (Math.Abs(pos.X - mouseDownPos.X) + Math.Abs(pos.Y - mouseDownPos.Y) <= MouseMoveDeltaThreshold)
                {
                    return;
                }

                InvokeSimulatedMouseEvent("mousedown", pos);
                firstMouseMove = false;
                ScrollDisabled = InvokeSimulatedMouseEvent("mousemove", pos);
            }
            else
            {
                InvokeSimulatedMouseEvent("mousemove", pos);
            }

        }

        void Border_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            //Debug.WriteLine("Border_MouseLeftButtonUp");
            border.MouseMove -= new MouseEventHandler(Border_MouseMove);
            border.MouseLeftButtonUp -= new MouseButtonEventHandler(Border_MouseLeftButtonUp);
            // if firstMouseMove is false, then we have sent our simulated mousedown, so we should also send a matching mouseup 
            if (!firstMouseMove)
            {
                Point pos = e.GetPosition(_browser);
                e.Handled = InvokeSimulatedMouseEvent("mouseup", pos);
            }
            ScrollDisabled = false;
        }


        #endregion

        #region ManipulationEvents

        void Border_ManipulationStarted(object sender, ManipulationStartedEventArgs e)
        {
            //Debug.WriteLine("Border_ManipulationStarted");

            if (ScrollDisabled)
            {
                e.Handled = true;
                e.Complete();
            }
        }

        private void Border_ManipulationDelta(object sender, ManipulationDeltaEventArgs e)
        {
            //Debug.WriteLine("Border_ManipulationDelta");
            // optionally suppress zoom
            if ((ScrollDisabled || !userScalable) && (e.DeltaManipulation.Scale.X != 0.0 || e.DeltaManipulation.Scale.Y != 0.0))
            {
                e.Handled = true;
                e.Complete();
            }
            // optionally suppress scrolling
            if (ScrollDisabled && (e.DeltaManipulation.Translation.X != 0.0 || e.DeltaManipulation.Translation.Y != 0.0))
            {
                e.Handled = true;
                e.Complete();
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
