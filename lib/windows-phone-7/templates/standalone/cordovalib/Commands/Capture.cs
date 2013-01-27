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
using System.IO;
using System.IO.IsolatedStorage;
using System.Runtime.Serialization;
using System.Windows.Media.Imaging;
using Microsoft.Phone;
using Microsoft.Phone.Tasks;
using Microsoft.Xna.Framework.Media;
using WPCordovaClassLib.Cordova.UI;
using AudioResult = WPCordovaClassLib.Cordova.UI.AudioCaptureTask.AudioResult;
using VideoResult = WPCordovaClassLib.Cordova.UI.VideoCaptureTask.VideoResult;
using System.Windows;
using System.Diagnostics;
using Microsoft.Phone.Controls;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Provides access to the audio, image, and video capture capabilities of the device
    /// </summary>
    public class Capture : BaseCommand
    {
        #region Internal classes (options and resultant objects)

        /// <summary>
        /// Represents captureImage action options.
        /// </summary>
        [DataContract]
        public class CaptureImageOptions
        {
            /// <summary>
            /// The maximum number of images the device user can capture in a single capture operation. The value must be greater than or equal to 1 (defaults to 1).
            /// </summary>
            [DataMember(IsRequired = false, Name = "limit")]
            public int Limit { get; set; }

            public static CaptureImageOptions Default
            {
                get { return new CaptureImageOptions() { Limit = 1 }; }
            }
        }

        /// <summary>
        /// Represents captureAudio action options.
        /// </summary>
        [DataContract]
        public class CaptureAudioOptions
        {
            /// <summary>
            /// The maximum number of audio files the device user can capture in a single capture operation. The value must be greater than or equal to 1 (defaults to 1).
            /// </summary>
            [DataMember(IsRequired = false, Name = "limit")]
            public int Limit { get; set; }

            public static CaptureAudioOptions Default
            {
                get { return new CaptureAudioOptions() { Limit = 1 }; }
            }
        }

        /// <summary>
        /// Represents captureVideo action options.
        /// </summary>
        [DataContract]
        public class CaptureVideoOptions
        {
            /// <summary>
            /// The maximum number of video files the device user can capture in a single capture operation. The value must be greater than or equal to 1 (defaults to 1).
            /// </summary>
            [DataMember(IsRequired = false, Name = "limit")]
            public int Limit { get; set; }

            public static CaptureVideoOptions Default
            {
                get { return new CaptureVideoOptions() { Limit = 1 }; }
            }
        }

        /// <summary>
        /// Represents getFormatData action options.
        /// </summary>
        [DataContract]
        public class MediaFormatOptions
        {
            /// <summary>
            /// File path
            /// </summary>
            [DataMember(IsRequired = true, Name = "fullPath")]
            public string FullPath { get; set; }

            /// <summary>
            /// File mime type
            /// </summary>
            [DataMember(Name = "type")]
            public string Type { get; set; }

        }

        /// <summary>
        /// Stores image info
        /// </summary>
        [DataContract]
        public class MediaFile
        {

            [DataMember(Name = "name")]
            public string FileName { get; set; }

            [DataMember(Name = "fullPath")]
            public string FilePath { get; set; }

            [DataMember(Name = "type")]
            public string Type { get; set; }

            [DataMember(Name = "lastModifiedDate")]
            public string LastModifiedDate { get; set; }

            [DataMember(Name = "size")]
            public long Size { get; set; }

            public MediaFile(string filePath, Picture image)
            {
                this.FilePath = filePath;
                this.FileName = System.IO.Path.GetFileName(this.FilePath);
                this.Type = MimeTypeMapper.GetMimeType(FileName);
                this.Size = image.GetImage().Length;

                using (IsolatedStorageFile storage = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    this.LastModifiedDate = storage.GetLastWriteTime(filePath).DateTime.ToString();
                }

            }

            public MediaFile(string filePath, Stream stream)
            {
                this.FilePath = filePath;
                this.FileName = System.IO.Path.GetFileName(this.FilePath);
                this.Type = MimeTypeMapper.GetMimeType(FileName);
                this.Size = stream.Length;

                using (IsolatedStorageFile storage = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    this.LastModifiedDate = storage.GetLastWriteTime(filePath).DateTime.ToString();
                }
            }
        }

        /// <summary>
        /// Stores additional media file data
        /// </summary>
        [DataContract]
        public class MediaFileData
        {
            [DataMember(Name = "height")]
            public int Height { get; set; }

            [DataMember(Name = "width")]
            public int Width { get; set; }

            [DataMember(Name = "bitrate")]
            public int Bitrate { get; set; }

            [DataMember(Name = "duration")]
            public int Duration { get; set; }

            [DataMember(Name = "codecs")]
            public string Codecs { get; set; }

            public MediaFileData(WriteableBitmap image)
            {
                this.Height = image.PixelHeight;
                this.Width = image.PixelWidth;
                this.Bitrate = 0;
                this.Duration = 0;
                this.Codecs = "";
            }
        }

        #endregion

        /// <summary>
        /// Folder to store captured images
        /// </summary>
        private string isoFolder = "CapturedImagesCache";

        /// <summary>
        /// Capture Image options
        /// </summary>
        protected CaptureImageOptions captureImageOptions;

        /// <summary>
        /// Capture Audio options
        /// </summary>
        protected CaptureAudioOptions captureAudioOptions;

        /// <summary>
        /// Capture Video options
        /// </summary>
        protected CaptureVideoOptions captureVideoOptions;

        /// <summary>
        /// Used to open camera application
        /// </summary>
        private CameraCaptureTask cameraTask;

        /// <summary>
        /// Used for audio recording
        /// </summary>
        private AudioCaptureTask audioCaptureTask;

        /// <summary>
        /// Used for video recording
        /// </summary>
        private VideoCaptureTask videoCaptureTask;

        /// <summary>
        /// Stores information about captured files
        /// </summary>
        List<MediaFile> files = new List<MediaFile>();

        /// <summary>
        /// Launches default camera application to capture image
        /// </summary>
        /// <param name="options">may contains limit or mode parameters</param>
        public void captureImage(string options)
        {
            try
            {
                try
                {

                    string args = JSON.JsonHelper.Deserialize<string[]>(options)[0];
                    this.captureImageOptions = String.IsNullOrEmpty(args) ? CaptureImageOptions.Default : JSON.JsonHelper.Deserialize<CaptureImageOptions>(args);

                }
                catch (Exception ex)
                {
                    this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION, ex.Message));
                    return;
                }


                cameraTask = new CameraCaptureTask();
                cameraTask.Completed += this.cameraTask_Completed;
                cameraTask.Show();
            }
            catch (Exception e)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, e.Message));
            }
        }

        /// <summary>
        /// Launches our own audio recording control to capture audio
        /// </summary>
        /// <param name="options">may contains additional parameters</param>
        public void captureAudio(string options)
        {
            try
            {
                try
                {
                    string args = JSON.JsonHelper.Deserialize<string[]>(options)[0];
                    this.captureAudioOptions = String.IsNullOrEmpty(args) ? CaptureAudioOptions.Default : JSON.JsonHelper.Deserialize<CaptureAudioOptions>(args);

                }
                catch (Exception ex)
                {
                    this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION, ex.Message));
                    return;
                }

                audioCaptureTask = new AudioCaptureTask();
                audioCaptureTask.Completed += audioRecordingTask_Completed;
                audioCaptureTask.Show();

            }
            catch (Exception e)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, e.Message));
            }
        }

        /// <summary>
        /// Launches our own video recording control to capture video
        /// </summary>
        /// <param name="options">may contains additional parameters</param>
        public void captureVideo(string options)
        {
            try
            {
                try
                {
                    string args = JSON.JsonHelper.Deserialize<string[]>(options)[0];
                    this.captureVideoOptions = String.IsNullOrEmpty(args) ? CaptureVideoOptions.Default : JSON.JsonHelper.Deserialize<CaptureVideoOptions>(args);

                }
                catch (Exception ex)
                {
                    this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION, ex.Message));
                    return;
                }

                videoCaptureTask = new VideoCaptureTask();
                videoCaptureTask.Completed += videoRecordingTask_Completed;
                videoCaptureTask.Show();

            }
            catch (Exception e)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, e.Message));
            }
        }

        /// <summary>
        /// Retrieves the format information of the media file.
        /// </summary>
        /// <param name="options"></param>
        public void getFormatData(string options)
        {
            try
            {
                MediaFormatOptions mediaFormatOptions;
                try
                {
                    mediaFormatOptions = new MediaFormatOptions();
                    string[] optionStrings = JSON.JsonHelper.Deserialize<string[]>(options);
                    mediaFormatOptions.FullPath = optionStrings[0];
                    mediaFormatOptions.Type = optionStrings[1];
                }
                catch (Exception ex)
                {
                    this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION, ex.Message));
                    return;
                }

                if (string.IsNullOrEmpty(mediaFormatOptions.FullPath))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                }

                string mimeType = mediaFormatOptions.Type;

                if (string.IsNullOrEmpty(mimeType))
                {
                    mimeType = MimeTypeMapper.GetMimeType(mediaFormatOptions.FullPath);
                }

                if (mimeType.Equals("image/jpeg"))
                {
                    Deployment.Current.Dispatcher.BeginInvoke(() =>
                    {
                        WriteableBitmap image = ExtractImageFromLocalStorage(mediaFormatOptions.FullPath);

                        if (image == null)
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "File not found"));
                            return;
                        }

                        MediaFileData mediaData = new MediaFileData(image);
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, mediaData));
                    });
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR));
                }
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR));
            }
        }

        /// <summary>
        /// Opens specified file in media player
        /// </summary>
        /// <param name="options">MediaFile to play</param>
        public void play(string options)
        {
            try
            {
                MediaFile file;

                try
                {
                    file = String.IsNullOrEmpty(options) ? null : JSON.JsonHelper.Deserialize<MediaFile[]>(options)[0];

                }
                catch (Exception ex)
                {
                    this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION, ex.Message));
                    return;
                }

                if (file == null || String.IsNullOrEmpty(file.FilePath))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "File path is missing"));
                    return;
                }

                // if url starts with '/' media player throws FileNotFound exception
                Uri fileUri = new Uri(file.FilePath.TrimStart(new char[] { '/', '\\' }), UriKind.Relative);

                MediaPlayerLauncher player = new MediaPlayerLauncher();
                player.Media = fileUri;
                player.Location = MediaLocationType.Data;
                player.Show();

                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK));

            }
            catch (Exception e)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, e.Message));
            }
        }


        /// <summary>
        /// Handles result of capture to save image information 
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e">stores information about current captured image</param>
        private void cameraTask_Completed(object sender, PhotoResult e)
        {

            if (e.Error != null)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR));
                return;
            }

            switch (e.TaskResult)
            {
                case TaskResult.OK:
                    try
                    {
                        string fileName = System.IO.Path.GetFileName(e.OriginalFileName);

                        // Save image in media library
                        MediaLibrary library = new MediaLibrary();
                        Picture image = library.SavePicture(fileName, e.ChosenPhoto);

                        int orient = ImageExifHelper.getImageOrientationFromStream(e.ChosenPhoto);
                        int newAngle = 0;
                        switch (orient)
                        {
                            case ImageExifOrientation.LandscapeLeft:
                                newAngle = 90;
                                break;
                            case ImageExifOrientation.PortraitUpsideDown:
                                newAngle = 180;
                                break;
                            case ImageExifOrientation.LandscapeRight:
                                newAngle = 270;
                                break;
                            case ImageExifOrientation.Portrait:
                            default: break; // 0 default already set
                        }

                        Stream rotImageStream = ImageExifHelper.RotateStream(e.ChosenPhoto, newAngle);

                        // Save image in isolated storage    

                        // we should return stream position back after saving stream to media library
                        rotImageStream.Seek(0, SeekOrigin.Begin);

                        byte[] imageBytes = new byte[rotImageStream.Length];
                        rotImageStream.Read(imageBytes, 0, imageBytes.Length);
                        rotImageStream.Dispose();
                        string pathLocalStorage = this.SaveImageToLocalStorage(fileName, isoFolder, imageBytes);
                        imageBytes = null;
                        // Get image data
                        MediaFile data = new MediaFile(pathLocalStorage, image);

                        this.files.Add(data);

                        if (files.Count < this.captureImageOptions.Limit)
                        {
                            cameraTask.Show();
                        }
                        else
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                            files.Clear();
                        }
                    }
                    catch (Exception)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Error capturing image."));
                    }
                    break;

                case TaskResult.Cancel:
                    if (files.Count > 0)
                    {
                        // User canceled operation, but some images were made
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                        files.Clear();
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Canceled."));
                    }
                    break;

                default:
                    if (files.Count > 0)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                        files.Clear();
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Did not complete!"));
                    }
                    break;
            }
        }

        /// <summary>
        /// Handles result of audio recording tasks 
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e">stores information about current captured audio</param>
        private void audioRecordingTask_Completed(object sender, AudioResult e)
        {

            if (e.Error != null)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR));
                return;
            }

            switch (e.TaskResult)
            {
                case TaskResult.OK:
                    try
                    {
                        // Get image data
                        MediaFile data = new MediaFile(e.AudioFileName, e.AudioFile);

                        this.files.Add(data);

                        if (files.Count < this.captureAudioOptions.Limit)
                        {
                            audioCaptureTask.Show();
                        }
                        else
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                            files.Clear();
                        }
                    }
                    catch (Exception)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Error capturing audio."));
                    }
                    break;

                case TaskResult.Cancel:
                    if (files.Count > 0)
                    {
                        // User canceled operation, but some audio clips were made
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                        files.Clear();
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Canceled."));
                    }
                    break;

                default:
                    if (files.Count > 0)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                        files.Clear();
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Did not complete!"));
                    }
                    break;
            }
        }

        /// <summary>
        /// Handles result of video recording tasks 
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e">stores information about current captured video</param>
        private void videoRecordingTask_Completed(object sender, VideoResult e)
        {

            if (e.Error != null)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR));
                return;
            }

            switch (e.TaskResult)
            {
                case TaskResult.OK:
                    try
                    {
                        // Get image data
                        MediaFile data = new MediaFile(e.VideoFileName, e.VideoFile);

                        this.files.Add(data);

                        if (files.Count < this.captureVideoOptions.Limit)
                        {
                            videoCaptureTask.Show();
                        }
                        else
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                            files.Clear();
                        }
                    }
                    catch (Exception)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Error capturing video."));
                    }
                    break;

                case TaskResult.Cancel:
                    if (files.Count > 0)
                    {
                        // User canceled operation, but some video clips were made
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                        files.Clear();
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Canceled."));
                    }
                    break;

                default:
                    if (files.Count > 0)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, files));
                        files.Clear();
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Did not complete!"));
                    }
                    break;
            }
        }

        /// <summary>
        /// Extract file from Isolated Storage as WriteableBitmap object
        /// </summary>
        /// <param name="filePath"></param>
        /// <returns></returns>
        private WriteableBitmap ExtractImageFromLocalStorage(string filePath)
        {
            try
            {

                var isoFile = IsolatedStorageFile.GetUserStoreForApplication();

                using (var imageStream = isoFile.OpenFile(filePath, FileMode.Open, FileAccess.Read))
                {
                    var imageSource = PictureDecoder.DecodeJpeg(imageStream);
                    return imageSource;
                }
            }
            catch (Exception)
            {
                return null;
            }
        }


        /// <summary>
        /// Saves captured image in isolated storage
        /// </summary>
        /// <param name="imageFileName">image file name</param>
        /// <param name="imageFolder">folder to store images</param>
        /// <returns>Image path</returns>
        private string SaveImageToLocalStorage(string imageFileName, string imageFolder, byte[] imageBytes)
        {
            if (imageBytes == null)
            {
                throw new ArgumentNullException("imageBytes");
            }
            try
            {
                var isoFile = IsolatedStorageFile.GetUserStoreForApplication();

                if (!isoFile.DirectoryExists(imageFolder))
                {
                    isoFile.CreateDirectory(imageFolder);
                }
                string filePath = System.IO.Path.Combine("/" + imageFolder + "/", imageFileName);

                using (IsolatedStorageFileStream stream = isoFile.CreateFile(filePath))
                {
                    stream.Write(imageBytes, 0, imageBytes.Length);
                }

                return filePath;
            }
            catch (Exception)
            {
                //TODO: log or do something else
                throw;
            }
        }


    }
}