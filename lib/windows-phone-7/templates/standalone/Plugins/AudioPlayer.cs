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
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using Microsoft.Xna.Framework.Media;
using Microsoft.Phone.Controls;
using System.Diagnostics;
using System.Windows.Resources;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Implements audio record and play back functionality.
    /// </summary>
    internal class AudioPlayer : IDisposable
    {
        #region Constants

        // AudioPlayer states
        private const int PlayerState_None = 0;
        private const int PlayerState_Starting = 1;
        private const int PlayerState_Running = 2;
        private const int PlayerState_Paused = 3;
        private const int PlayerState_Stopped = 4;

        // AudioPlayer messages
        private const int MediaState = 1;
        private const int MediaDuration = 2;
        private const int MediaPosition = 3;
        private const int MediaError = 9;

        // AudioPlayer errors
        private const int MediaErrorPlayModeSet = 1;
        private const int MediaErrorAlreadyRecording = 2;
        private const int MediaErrorStartingRecording = 3;
        private const int MediaErrorRecordModeSet = 4;
        private const int MediaErrorStartingPlayback = 5;
        private const int MediaErrorResumeState = 6;
        private const int MediaErrorPauseState = 7;
        private const int MediaErrorStopState = 8;

        //TODO: get rid of this callback, it should be universal
        //private const string CallbackFunction = "CordovaMediaonStatus";

        #endregion

        /// <summary>
        /// The AudioHandler object
        /// </summary>
        private Media handler;

        /// <summary>
        /// Temporary buffer to store audio chunk
        /// </summary>
        private byte[] buffer;

        /// <summary>
        /// Xna game loop dispatcher
        /// </summary>
        DispatcherTimer dtXna;

        /// <summary>
        /// Output buffer
        /// </summary>
        private MemoryStream memoryStream;

        /// <summary>
        /// The id of this player (used to identify Media object in JavaScript)
        /// </summary>
        private String id;

        /// <summary>
        /// State of recording or playback
        /// </summary>
        private int state = PlayerState_None;

        /// <summary>
        /// File name to play or record to
        /// </summary>
        private String audioFile = null;

        /// <summary>
        /// Duration of audio
        /// </summary>
        private double duration = -1;

        /// <summary>
        /// Audio player object
        /// </summary>
        private MediaElement player = null;

        /// <summary>
        /// Audio source
        /// </summary>
        private Microphone recorder;

        /// <summary>
        /// Internal flag specified that we should only open audio w/o playing it
        /// </summary>
        private bool prepareOnly = false;

        /// <summary>
        /// Creates AudioPlayer instance
        /// </summary>
        /// <param name="handler">Media object</param>
        /// <param name="id">player id</param>
        public AudioPlayer(Media handler, String id)
        {
            this.handler = handler;
            this.id = id;
        }

        /// <summary>
        /// Destroys player and stop audio playing or recording
        /// </summary>
        public void Dispose()
        {
            if (this.player != null)
            {
                this.stopPlaying();
                this.player = null;
            }
            if (this.recorder != null)
            {
                this.stopRecording();
                this.recorder = null;
            }

            this.FinalizeXnaGameLoop();
        }

        private void InvokeCallback(int message, string value, bool removeHandler)
        {
            string args = string.Format("('{0}',{1},{2});", this.id, message, value);
            string callback = @"(function(id,msg,value){
                try {
                    if (msg == Media.MEDIA_ERROR) {
                        value = {'code':value};
                    }
                    Media.onStatus(id,msg,value);
                }
                catch(e) {
                    console.log('Error calling Media.onStatus :: ' + e);
                }
            })" + args;
            this.handler.InvokeCustomScript(new ScriptCallback("eval", new string[] { callback }), false);
        }

        private void InvokeCallback(int message, int value, bool removeHandler)
        {
            InvokeCallback(message, value.ToString(), removeHandler);
        }

        private void InvokeCallback(int message, double value, bool removeHandler)
        {
            InvokeCallback(message, value.ToString(), removeHandler);
        }

        /// <summary>
        /// Starts recording, data is stored in memory
        /// </summary>
        /// <param name="filePath"></param>
        public void startRecording(string filePath)
        {
            if (this.player != null)
            {
                InvokeCallback(MediaError, MediaErrorPlayModeSet, false);
            }
            else if (this.recorder == null)
            {
                try
                {
                    this.audioFile = filePath;
                    this.InitializeXnaGameLoop();
                    this.recorder = Microphone.Default;
                    this.recorder.BufferDuration = TimeSpan.FromMilliseconds(500);
                    this.buffer = new byte[recorder.GetSampleSizeInBytes(this.recorder.BufferDuration)];
                    this.recorder.BufferReady += new EventHandler<EventArgs>(recorderBufferReady);
                    this.memoryStream = new MemoryStream();
                    this.memoryStream.InitializeWavStream(this.recorder.SampleRate);
                    this.recorder.Start();
                    FrameworkDispatcher.Update();
                    this.SetState(PlayerState_Running);
                }
                catch (Exception)
                {
                    InvokeCallback(MediaError, MediaErrorStartingRecording, false);
                    //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError, MediaErrorStartingRecording),false);
                }
            }
            else
            {
                InvokeCallback(MediaError, MediaErrorAlreadyRecording, false);
                //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError, MediaErrorAlreadyRecording),false);
            }
        }

        /// <summary>
        /// Stops recording
        /// </summary>
        public void stopRecording()
        {
            if (this.recorder != null)
            {
                if (this.state == PlayerState_Running)
                {
                    try
                    {
                        this.recorder.Stop();
                        this.recorder.BufferReady -= recorderBufferReady;
                        this.recorder = null;
                        SaveAudioClipToLocalStorage();
                        this.FinalizeXnaGameLoop();
                        this.SetState(PlayerState_Stopped);
                    }
                    catch (Exception)
                    {
                        //TODO 
                    }
                }
            }
        }

        /// <summary>
        /// Starts or resume playing audio file
        /// </summary>
        /// <param name="filePath">The name of the audio file</param>
        /// <summary>
        /// Starts or resume playing audio file
        /// </summary>
        /// <param name="filePath">The name of the audio file</param>
        public void startPlaying(string filePath)
        {
            if (this.recorder != null)
            {
                InvokeCallback(MediaError, MediaErrorRecordModeSet, false);
                //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError, MediaErrorRecordModeSet),false);
                return;
            }


            if (this.player == null || this.player.Source.AbsolutePath.LastIndexOf(filePath) < 0)
            {
                try
                {
                    // this.player is a MediaElement, it must be added to the visual tree in order to play
                    PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                    if (frame != null)
                    {
                        PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                        if (page != null)
                        {
                            Grid grid = page.FindName("LayoutRoot") as Grid;
                            if (grid != null)
                            {

                                this.player = grid.FindName("playerMediaElement") as MediaElement;
                                if (this.player == null) // still null ?
                                {
                                    this.player = new MediaElement();
                                    this.player.Name = "playerMediaElement";
                                    grid.Children.Add(this.player);
                                    this.player.Visibility = Visibility.Visible;
                                }
                                if (this.player.CurrentState == System.Windows.Media.MediaElementState.Playing)
                                {
                                    this.player.Stop(); // stop it!
                                }
                                
                                this.player.Source = null; // Garbage collect it.
                                this.player.MediaOpened += MediaOpened;
                                this.player.MediaEnded += MediaEnded;
                                this.player.MediaFailed += MediaFailed;
                            }
                        }
                    }

                    this.audioFile = filePath;

                    Uri uri = new Uri(filePath, UriKind.RelativeOrAbsolute);
                    if (uri.IsAbsoluteUri)
                    {
                        this.player.Source = uri;
                    }
                    else
                    {
                        using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                        {
                            if (!isoFile.FileExists(filePath))
                            {
                                // try to unpack it from the dll into isolated storage
                                StreamResourceInfo fileResourceStreamInfo = Application.GetResourceStream(new Uri(filePath, UriKind.Relative));
                                if (fileResourceStreamInfo != null)
                                {
                                    using (BinaryReader br = new BinaryReader(fileResourceStreamInfo.Stream))
                                    {
                                        byte[] data = br.ReadBytes((int)fileResourceStreamInfo.Stream.Length);          

                                        string[] dirParts = filePath.Split('/');
                                        string dirName = "";
                                        for (int n = 0; n < dirParts.Length - 1; n++)
                                        {
                                            dirName += dirParts[n] + "/";
                                        }
                                        if (!isoFile.DirectoryExists(dirName))
                                        {
                                            isoFile.CreateDirectory(dirName);
                                        }

                                        using (IsolatedStorageFileStream outFile = isoFile.OpenFile(filePath, FileMode.Create))
                                        {
                                            using (BinaryWriter writer = new BinaryWriter(outFile))
                                            {
                                                writer.Write(data);
                                            }
                                        }
                                    }
                                }
                            }
                            if (isoFile.FileExists(filePath))
                            {
                                using (IsolatedStorageFileStream stream = new IsolatedStorageFileStream(filePath, FileMode.Open, isoFile))
                                {
                                    this.player.SetSource(stream);
                                }
                            }
                            else
                            {
                                InvokeCallback(MediaError, MediaErrorPlayModeSet, false);
                                //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError, 1), false);
                                return;
                            }
                        }
                    }
                    this.SetState(PlayerState_Starting);
                }
                catch (Exception e)
                {
                    Debug.WriteLine("Error in AudioPlayer::startPlaying : " + e.Message);
                    InvokeCallback(MediaError, MediaErrorStartingPlayback, false);
                    //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError, MediaErrorStartingPlayback),false);
                }
            }
            else
            {
                if (this.state != PlayerState_Running)
                {
                    this.player.Play();
                    this.SetState(PlayerState_Running);
                }
                else
                {
                    InvokeCallback(MediaError, MediaErrorResumeState, false);
                    //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError, MediaErrorResumeState),false);
                }
            }
        }

        /// <summary>
        /// Callback to be invoked when the media source is ready for playback
        /// </summary>
        private void MediaOpened(object sender, RoutedEventArgs arg)
        {
            if (this.player != null)
            {
                this.duration = this.player.NaturalDuration.TimeSpan.TotalSeconds;
                InvokeCallback(MediaDuration, this.duration, false);
                //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaDuration, this.duration),false);
                if (!this.prepareOnly)
                {
                    this.player.Play();
                    this.SetState(PlayerState_Running);
                }
                this.prepareOnly = false;
            }
            else
            {
                // TODO: occasionally MediaOpened is signalled, but player is null
            }
        }

        /// <summary>
        /// Callback to be invoked when playback of a media source has completed
        /// </summary>
        private void MediaEnded(object sender, RoutedEventArgs arg)
        {
            this.SetState(PlayerState_Stopped);
        }

        /// <summary>
        /// Callback to be invoked when playback of a media source has failed
        /// </summary>
        private void MediaFailed(object sender, RoutedEventArgs arg)
        {
            player.Stop();
            InvokeCallback(MediaError, MediaErrorStartingPlayback, false);
            //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError.ToString(), "Media failed"),false);
        }

        /// <summary>
        /// Seek or jump to a new time in the track
        /// </summary>
        /// <param name="milliseconds">The new track position</param>
        public void seekToPlaying(int milliseconds)
        {
            if (this.player != null)
            {
                TimeSpan tsPos = new TimeSpan(0, 0, 0, 0, milliseconds);
                this.player.Position = tsPos;
                InvokeCallback(MediaPosition, milliseconds / 1000.0f, false);
                //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaPosition, milliseconds / 1000.0f),false);
            }
        }

        /// <summary>
        /// Set the volume of the player
        /// </summary>
        /// <param name="vol">volume 0.0-1.0, default value is 0.5</param>
        public void setVolume(double vol)
        {
            if (this.player != null)
            {
                this.player.Volume = vol;
            }
        }

        /// <summary>
        /// Pauses playing
        /// </summary>
        public void pausePlaying()
        {
            if (this.state == PlayerState_Running)
            {
                this.player.Pause();
                this.SetState(PlayerState_Paused);
            }
            else
            {
                InvokeCallback(MediaError, MediaErrorPauseState, false);
                //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError, MediaErrorPauseState),false);
            }
        }


        /// <summary>
        /// Stops playing the audio file
        /// </summary>
        public void stopPlaying()
        {
            if ((this.state == PlayerState_Running) || (this.state == PlayerState_Paused))
            {
                this.player.Stop();

                this.player.Position = new TimeSpan(0L);
                this.SetState(PlayerState_Stopped);
            }
            //else // Why is it an error to call stop on a stopped media?
            //{
            //    this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaError, MediaErrorStopState), false);
            //}
        }

        /// <summary>
        /// Gets current position of playback
        /// </summary>
        /// <returns>current position</returns>
        public double getCurrentPosition()
        {
            if ((this.state == PlayerState_Running) || (this.state == PlayerState_Paused))
            {
                double currentPosition = this.player.Position.TotalSeconds;
                //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaPosition, currentPosition),false);
                return currentPosition;
            }
            else
            {
                return 0;
            }
        }

        /// <summary>
        /// Gets the duration of the audio file
        /// </summary>
        /// <param name="filePath">The name of the audio file</param>
        /// <returns>track duration</returns>
        public double getDuration(string filePath)
        {
            if (this.recorder != null)
            {
                return (-2);
            }

            if (this.player != null)
            {
                return this.duration;

            }
            else
            {
                this.prepareOnly = true;
                this.startPlaying(filePath);
                return this.duration;
            }
        }

        /// <summary>
        /// Sets the state and send it to JavaScript
        /// </summary>
        /// <param name="state">state</param>
        private void SetState(int state)
        {
            if (this.state != state)
            {
                InvokeCallback(MediaState, state, false);
                //this.handler.InvokeCustomScript(new ScriptCallback(CallbackFunction, this.id, MediaState, state),false);
            }

            this.state = state;
        }

        #region record methods

        /// <summary>
        /// Copies data from recorder to memory storages and updates recording state
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void recorderBufferReady(object sender, EventArgs e)
        {
            this.recorder.GetData(this.buffer);
            this.memoryStream.Write(this.buffer, 0, this.buffer.Length);
        }

        /// <summary>
        /// Writes audio data from memory to isolated storage
        /// </summary>
        /// <returns></returns>
        private void SaveAudioClipToLocalStorage()
        {
            if (this.memoryStream == null || this.memoryStream.Length <= 0)
            {
                return;
            }

            this.memoryStream.UpdateWavStream();

            try
            {
                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    string directory = Path.GetDirectoryName(audioFile);

                    if (!isoFile.DirectoryExists(directory))
                    {
                        isoFile.CreateDirectory(directory);
                    }

                    this.memoryStream.Seek(0, SeekOrigin.Begin);

                    using (IsolatedStorageFileStream fileStream = isoFile.CreateFile(audioFile))
                    {
                        this.memoryStream.CopyTo(fileStream);
                    }
                }
            }
            catch (Exception)
            {
                //TODO: log or do something else
                throw;
            }
        }    

        #region Xna loop
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
            if (this.dtXna != null)
            {
                this.dtXna.Stop();
                this.dtXna = null;
            }
        }

        #endregion

        #endregion
    }
}
