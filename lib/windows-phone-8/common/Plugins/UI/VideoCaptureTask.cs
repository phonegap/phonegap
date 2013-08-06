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
using System.IO;
using System.Windows;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Tasks;

namespace WPCordovaClassLib.Cordova.UI
{
    /// <summary>
    /// Allows an application to launch the Video Recording application. 
    /// Use this to allow users to record video from your application.
    /// </summary>
    public class VideoCaptureTask
    {
        /// <summary>
        /// Represents recorded video returned from a call to the Show method of
        /// a WPCordovaClassLib.Cordova.Controls.VideoCaptureTask object
        /// </summary>
        public class VideoResult : TaskEventArgs
        {
            /// <summary>
            /// Initializes a new instance of the VideoResult class.
            /// </summary>
            public VideoResult()
            { }

            /// <summary>
            /// Initializes a new instance of the VideoResult class
            /// with the specified Microsoft.Phone.Tasks.TaskResult.
            /// </summary>
            /// <param name="taskResult">Associated Microsoft.Phone.Tasks.TaskResult</param>
            public VideoResult(TaskResult taskResult)
                : base(taskResult)
            { }

            /// <summary>
            ///  Gets the file name of the recorded Video.
            /// </summary>
            public Stream VideoFile { get; internal set; }

            /// <summary>
            /// Gets the stream containing the data for the recorded Video.
            /// </summary>
            public string VideoFileName { get; internal set; }
        }

        /// <summary>
        /// Occurs when a Video recording task is completed.
        /// </summary>
        public event EventHandler<VideoResult> Completed;

        /// <summary>
        /// Shows Video Recording application
        /// </summary>
        public void Show()
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                var root = Application.Current.RootVisual as PhoneApplicationFrame;

                root.Navigated += new System.Windows.Navigation.NavigatedEventHandler(NavigationService_Navigated);

                string baseUrl = WPCordovaClassLib.Cordova.Commands.BaseCommand.GetBaseURL();
                // dummy parameter is used to always open a fresh version
                root.Navigate(new System.Uri( baseUrl + "CordovaLib/UI/VideoRecorder.xaml?dummy=" + Guid.NewGuid().ToString(), UriKind.Relative));
            });
        }

        /// <summary>
        /// Performs additional configuration of the recording application.
        /// </summary>
        private void NavigationService_Navigated(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            if (!(e.Content is VideoRecorder)) return;

            (Application.Current.RootVisual as PhoneApplicationFrame).Navigated -= NavigationService_Navigated;

            VideoRecorder VideoRecorder = (VideoRecorder)e.Content;

            if (VideoRecorder != null)
            {
                VideoRecorder.Completed += this.Completed;
            }
            else if (this.Completed != null)
            {
                this.Completed(this, new VideoResult(TaskResult.Cancel));
            }
        }

    }
}
