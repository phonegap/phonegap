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

using Microsoft.Phone.Controls;
using Microsoft.Phone.Tasks;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using System;
using System.IO;
using System.IO.IsolatedStorage;
using System.Windows;
using System.Windows.Threading;
using WPCordovaClassLib.Cordova.Commands;
using AudioResult = WPCordovaClassLib.Cordova.UI.AudioCaptureTask.AudioResult;

namespace WPCordovaClassLib.Cordova.UI
{
    /// <summary>
    /// Implements Audio Recording application
    /// </summary>
    public partial class AudioRecorder : PhoneApplicationPage
    {

        #region Constants

        private const string RecordingStartCaption = "Start";
        private const string RecordingStopCaption = "Stop";

        private const string LocalFolderName = "AudioCache";
        private const string FileNameFormat = "Audio-{0}.wav";

        #endregion

        #region Callbacks

        /// <summary>
        /// Occurs when a audio recording task is completed.
        /// </summary>
        public event EventHandler<AudioResult> Completed;

        #endregion

        #region Fields

        /// <summary>
        /// Audio source
        /// </summary>
        private Microphone microphone;

        /// <summary>
        /// Temporary buffer to store audio chunk
        /// </summary>
        private byte[] buffer;

        /// <summary>
        /// Recording duration
        /// </summary>
        private TimeSpan duration;

        /// <summary>
        /// Output buffer
        /// </summary>
        private MemoryStream memoryStream;

        /// <summary>
        /// Xna game loop dispatcher
        /// </summary>
        DispatcherTimer dtXna;

        /// <summary>
        /// Recording result, dispatched back when recording page is closed
        /// </summary>
        private AudioResult result = new AudioResult(TaskResult.Cancel);

        /// <summary>
        /// Whether we are recording audio now
        /// </summary>
        private bool IsRecording
        {
            get
            {
                return (this.microphone != null && this.microphone.State == MicrophoneState.Started);
            }
        }

        #endregion

        /// <summary>
        /// Creates new instance of the AudioRecorder class.
        /// </summary>
        public AudioRecorder()
        {

            this.InitializeXnaGameLoop();

            // microphone requires special XNA initialization to work
            InitializeComponent();
        }

        /// <summary>
        /// Starts recording, data is stored in memory
        /// </summary>
        private void StartRecording()
        {
            this.microphone = Microphone.Default;
            this.microphone.BufferDuration = TimeSpan.FromMilliseconds(500);

            this.btnTake.IsEnabled = false;
            this.btnStartStop.Content = RecordingStopCaption;

            this.buffer = new byte[microphone.GetSampleSizeInBytes(this.microphone.BufferDuration)];
            this.microphone.BufferReady += new EventHandler<EventArgs>(MicrophoneBufferReady);

            this.memoryStream = new MemoryStream();
            this.memoryStream.InitializeWavStream(this.microphone.SampleRate);

            this.duration = new TimeSpan(0);

            this.microphone.Start();
        }

        /// <summary>
        /// Stops recording
        /// </summary>
        private void StopRecording()
        {
            this.microphone.Stop();

            this.microphone.BufferReady -= MicrophoneBufferReady;

            this.microphone = null;

            btnStartStop.Content = RecordingStartCaption;

            // check there is some data
            this.btnTake.IsEnabled = true;
        }

        /// <summary>
        /// Handles Start/Stop events
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void btnStartStop_Click(object sender, RoutedEventArgs e)
        {

            if (this.IsRecording)
            {
                this.StopRecording();
            }
            else
            {
                this.StartRecording();
            }
        }

        /// <summary>
        /// Handles Take button click
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void btnTake_Click(object sender, RoutedEventArgs e)
        {
            this.result = this.SaveAudioClipToLocalStorage();

            if (Completed != null)
            {
                Completed(this, result);
            }

            if (this.NavigationService.CanGoBack)
            {
                this.NavigationService.GoBack();
            }
        }

        /// <summary>
        /// Handles page closing event, stops recording if needed and dispatches results.
        /// </summary>
        /// <param name="e"></param>
        protected override void OnNavigatedFrom(System.Windows.Navigation.NavigationEventArgs e)
        {
            if (IsRecording)
            {
                StopRecording();
            }

            this.FinalizeXnaGameLoop();

            base.OnNavigatedFrom(e);
        }

        /// <summary>
        /// Copies data from microphone to memory storages and updates recording state
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void MicrophoneBufferReady(object sender, EventArgs e)
        {
            this.microphone.GetData(this.buffer);
            this.memoryStream.Write(this.buffer, 0, this.buffer.Length);
            TimeSpan bufferDuration = this.microphone.BufferDuration;

            this.Dispatcher.BeginInvoke(() =>
            {
                this.duration += bufferDuration;

                this.txtDuration.Text = "Duration: " +
                    this.duration.Minutes.ToString().PadLeft(2, '0') + ":" +
                    this.duration.Seconds.ToString().PadLeft(2, '0');
            });

        }

        /// <summary>
        /// Writes audio data from memory to isolated storage
        /// </summary>
        /// <returns></returns>
        private AudioResult SaveAudioClipToLocalStorage()
        {
            if (this.memoryStream == null || this.memoryStream.Length <= 0)
            {
                return new AudioResult(TaskResult.Cancel);
            }

            this.memoryStream.UpdateWavStream();

            // save audio data to local isolated storage

            string filename = String.Format(FileNameFormat, Guid.NewGuid().ToString());

            try
            {
                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {

                    if (!isoFile.DirectoryExists(LocalFolderName))
                    {
                        isoFile.CreateDirectory(LocalFolderName);
                    }

                    string filePath = System.IO.Path.Combine("/" + LocalFolderName + "/", filename);

                    this.memoryStream.Seek(0, SeekOrigin.Begin);

                    using (IsolatedStorageFileStream fileStream = isoFile.CreateFile(filePath))
                    {

                        this.memoryStream.CopyTo(fileStream);
                    }

                    AudioResult result = new AudioResult(TaskResult.OK);
                    result.AudioFileName = filePath;

                    result.AudioFile = this.memoryStream;
                    result.AudioFile.Seek(0, SeekOrigin.Begin);

                    return result;
                }



            }
            catch (Exception)
            {
                //TODO: log or do something else
                throw;
            }
        }

        /// <summary>
        /// Special initialization required for the microphone: XNA game loop
        /// </summary>
        private void InitializeXnaGameLoop()
        {
            // Timer to simulate the XNA game loop (Microphone is from XNA)
            this.dtXna = new DispatcherTimer();
            this.dtXna.Interval = TimeSpan.FromMilliseconds(33);
            this.dtXna.Tick += delegate { try { FrameworkDispatcher.Update(); } catch { } };
            this.dtXna.Start();
        }
        /// <summary>
        /// Finalizes XNA game loop for microphone
        /// </summary>
        private void FinalizeXnaGameLoop()
        {
            // Timer to simulate the XNA game loop (Microphone is from XNA)
            if (dtXna != null)
            {
                dtXna.Stop();
                dtXna = null;
            }
        }
    }
}