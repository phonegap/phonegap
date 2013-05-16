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
using System.IO.IsolatedStorage;
using System.Windows.Media;
using System.Windows.Navigation;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;
using Microsoft.Phone.Tasks;
using VideoResult = WPCordovaClassLib.Cordova.UI.VideoCaptureTask.VideoResult;

namespace WPCordovaClassLib.Cordova.UI
{
    public partial class VideoRecorder : PhoneApplicationPage
    {

        #region Constants

        /// <summary>
        /// Caption for record button in ready state
        /// </summary>
        private const string RecordingStartCaption = "Record";

        /// <summary>
        /// Caption for record button in recording state
        /// </summary>
        private const string RecordingStopCaption = "Stop";

        /// <summary>
        /// Start record icon URI
        /// </summary>
        private const string StartIconUri = "/Images/appbar.feature.video.rest.png";

        /// <summary>
        /// Stop record icon URI
        /// </summary>
        private const string StopIconUri = "/Images/appbar.stop.rest.png";

        /// <summary>
        /// Folder to save video clips
        /// </summary>
        private const string LocalFolderName = "VideoCache";

        /// <summary>
        /// File name format
        /// </summary>
        private const string FileNameFormat = "Video-{0}.mp4";

        /// <summary>
        /// Temporary file name
        /// </summary>
        private const string defaultFileName = "NewVideoFile.mp4";

        #endregion

        #region Callbacks
        /// <summary>
        /// Occurs when a video recording task is completed.
        /// </summary>
        public event EventHandler<VideoResult> Completed;

        #endregion

        #region Fields

        /// <summary>
        /// Viewfinder for capturing video
        /// </summary>
        private VideoBrush videoRecorderBrush;

        /// <summary>
        /// Path to save video clip
        /// </summary>
        private string filePath;

        /// <summary>
        /// Source for capturing video. 
        /// </summary>
        private CaptureSource captureSource;

        /// <summary>
        /// Video device
        /// </summary>
        private VideoCaptureDevice videoCaptureDevice;

        /// <summary>
        /// File sink so save recording video in Isolated Storage
        /// </summary>
        private FileSink fileSink;

        /// <summary>
        /// For managing button and application state 
        /// </summary>
        private enum VideoState { Initialized, Ready, Recording, CameraNotSupported };

        /// <summary>
        /// Current video state
        /// </summary>
        private VideoState currentVideoState;

        /// <summary>
        /// Stream to return result
        /// </summary>
        private MemoryStream memoryStream;

        /// <summary>
        /// Recording result, dispatched back when recording page is closed
        /// </summary>
        private VideoResult result = new VideoResult(TaskResult.Cancel);

        #endregion

        /// <summary>
        /// Initializes components
        /// </summary>
        public VideoRecorder()
        {
            InitializeComponent();

            PhoneAppBar = (ApplicationBar)ApplicationBar;
            PhoneAppBar.IsVisible = true;
            btnStartRecording = ((ApplicationBarIconButton)ApplicationBar.Buttons[0]);
            btnTakeVideo = ((ApplicationBarIconButton)ApplicationBar.Buttons[1]);
        }

        /// <summary>
        /// Initializes the video recorder then page is loading
        /// </summary>
        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            this.InitializeVideoRecorder();
        }

        /// <summary>
        /// Disposes camera and media objects then leave the page
        /// </summary>
        protected override void OnNavigatedFrom(NavigationEventArgs e)
        {
            this.DisposeVideoRecorder();

            if (this.Completed != null)
            {
                this.Completed(this, result);
            }
            base.OnNavigatedFrom(e);
        }

        /// <summary>
        /// Handles TakeVideo button click
        /// </summary>
        private void TakeVideo_Click(object sender, EventArgs e)
        {
            this.result = this.SaveVideoClip();
            this.NavigateBack();
        }

        private void NavigateBack()
        {
            if (this.NavigationService.CanGoBack)
            {
                this.NavigationService.GoBack();
            }
        }

        /// <summary>
        /// Resaves video clip from temporary directory to persistent 
        /// </summary>
        private VideoResult SaveVideoClip()
        {
            try
            {
                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    if (string.IsNullOrEmpty(filePath) || (!isoFile.FileExists(filePath)))
                    {
                        return new VideoResult(TaskResult.Cancel);
                    }

                    string fileName = String.Format(FileNameFormat, Guid.NewGuid().ToString());
                    string newPath = Path.Combine("/" + LocalFolderName + "/", fileName);
                    isoFile.CopyFile(filePath, newPath);
                    isoFile.DeleteFile(filePath);

                    memoryStream = new MemoryStream();
                    using (IsolatedStorageFileStream fileStream = new IsolatedStorageFileStream(newPath, FileMode.Open, isoFile))
                    {
                        fileStream.CopyTo(memoryStream);
                    }

                    VideoResult result = new VideoResult(TaskResult.OK);
                    result.VideoFileName = newPath;
                    result.VideoFile = this.memoryStream;
                    result.VideoFile.Seek(0, SeekOrigin.Begin);
                    return result;
                }

            }
            catch (Exception)
            {
                return new VideoResult(TaskResult.None);
            }
        }

        /// <summary>
        /// Updates the buttons on the UI thread based on current state. 
        /// </summary>
        /// <param name="currentState">current UI state</param>
        private void UpdateUI(VideoState currentState)
        {
            Dispatcher.BeginInvoke(delegate
            {
                switch (currentState)
                {
                    case VideoState.CameraNotSupported:
                        btnStartRecording.IsEnabled = false;
                        btnTakeVideo.IsEnabled = false;
                        break;

                    case VideoState.Initialized:
                        btnStartRecording.Text = RecordingStartCaption;
                        btnStartRecording.IconUri = new Uri(StartIconUri, UriKind.Relative);
                        btnTakeVideo.IsEnabled = false;
                        break;

                    case VideoState.Ready:
                        btnStartRecording.Text = RecordingStartCaption;
                        btnStartRecording.IconUri = new Uri(StartIconUri, UriKind.Relative);
                        btnTakeVideo.IsEnabled = true;
                        break;

                    case VideoState.Recording:
                        btnStartRecording.Text = RecordingStopCaption;
                        btnStartRecording.IconUri = new Uri(StopIconUri, UriKind.Relative);
                        btnTakeVideo.IsEnabled = false;
                        break;

                    default:
                        break;
                }
                currentVideoState = currentState;
            });
        }

        /// <summary>
        /// Initializes VideoRecorder
        /// </summary>
        public void InitializeVideoRecorder()
        {
            if (captureSource == null)
            {
                captureSource = new CaptureSource();
                fileSink = new FileSink();
                videoCaptureDevice = CaptureDeviceConfiguration.GetDefaultVideoCaptureDevice();

                if (videoCaptureDevice != null)
                {
                    videoRecorderBrush = new VideoBrush();
                    videoRecorderBrush.SetSource(captureSource);
                    viewfinderRectangle.Fill = videoRecorderBrush;
                    captureSource.Start();
                    this.UpdateUI(VideoState.Initialized);
                }
                else
                {
                    this.UpdateUI(VideoState.CameraNotSupported);
                }
            }
        }

        /// <summary>
        /// Sets recording state: start recording 
        /// </summary>
        private void StartVideoRecording()
        {
            try
            {
                if ((captureSource.VideoCaptureDevice != null) && (captureSource.State == CaptureState.Started))
                {
                    captureSource.Stop();
                    fileSink.CaptureSource = captureSource;
                    filePath = System.IO.Path.Combine("/" + LocalFolderName + "/", defaultFileName);

                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        if (!isoFile.DirectoryExists(LocalFolderName))
                        {
                            isoFile.CreateDirectory(LocalFolderName);
                        }

                        if (isoFile.FileExists(filePath))
                        {
                            isoFile.DeleteFile(filePath);
                        }
                    }

                    fileSink.IsolatedStorageFileName = filePath;
                }

                if (captureSource.VideoCaptureDevice != null
                    && captureSource.State == CaptureState.Stopped)
                {
                    captureSource.Start();
                }
                this.UpdateUI(VideoState.Recording);
            }
            catch (Exception)
            {
                this.result = new VideoResult(TaskResult.None);
                this.NavigateBack();
            }
        }

        /// <summary>
        /// Sets the recording state: stop recording
        /// </summary>
        private void StopVideoRecording()
        {
            try
            {
                if ((captureSource.VideoCaptureDevice != null) && (captureSource.State == CaptureState.Started))
                {
                    captureSource.Stop();
                    fileSink.CaptureSource = null;
                    fileSink.IsolatedStorageFileName = null;
                    this.StartVideoPreview();
                }
            }
            catch (Exception)
            {
                this.result = new VideoResult(TaskResult.None);
                this.NavigateBack();
            }
        }

        /// <summary>
        /// Sets the recording state: display the video on the viewfinder. 
        /// </summary>
        private void StartVideoPreview()
        {
            try
            {
                if ((captureSource.VideoCaptureDevice != null) && (captureSource.State == CaptureState.Stopped))
                {
                    videoRecorderBrush.SetSource(captureSource);
                    viewfinderRectangle.Fill = videoRecorderBrush;
                    captureSource.Start();
                    this.UpdateUI(VideoState.Ready);
                }
            }
            catch (Exception)
            {
                this.result = new VideoResult(TaskResult.None);
                this.NavigateBack();
            }
        }

        /// <summary>
        /// Starts video recording 
        /// </summary>
        private void StartRecording_Click(object sender, EventArgs e)
        {
            if (currentVideoState == VideoState.Recording)
            {
                this.StopVideoRecording();
            }
            else
            {
                this.StartVideoRecording();
            }
        }

        /// <summary>
        /// Releases resources
        /// </summary>
        private void DisposeVideoRecorder()
        {
            if (captureSource != null)
            {
                if ((captureSource.VideoCaptureDevice != null) && (captureSource.State == CaptureState.Started))
                {
                    captureSource.Stop();
                }
                captureSource = null;
                videoCaptureDevice = null;
                fileSink = null;
                videoRecorderBrush = null;
            }
        }

    }
}