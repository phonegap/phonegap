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
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Collections.Generic;
using Microsoft.Phone.Tasks;
using System.Runtime.Serialization;
using System.IO;
using System.IO.IsolatedStorage;
using System.Windows.Media.Imaging;
using Microsoft.Phone;
using Microsoft.Xna.Framework.Media;
using System.Diagnostics;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class Camera : BaseCommand
    {

        /// <summary>
        /// Return base64 encoded string
        /// </summary>
        private const int DATA_URL = 0;

        /// <summary>
        /// Return file uri
        /// </summary>
        private const int FILE_URI = 1;

        /// <summary>
        /// Choose image from picture library
        /// </summary>
        private const int PHOTOLIBRARY = 0;

        /// <summary>
        /// Take picture from camera
        /// </summary>

        private const int CAMERA = 1;

        /// <summary>
        /// Choose image from picture library
        /// </summary>
        private const int SAVEDPHOTOALBUM = 2;

        /// <summary>
        /// Take a picture of type JPEG
        /// </summary>
        private const int JPEG = 0;

        /// <summary>
        /// Take a picture of type PNG
        /// </summary>
        private const int PNG = 1;

        /// <summary>
        /// Folder to store captured images
        /// </summary>
        private const string isoFolder = "CapturedImagesCache";

        /// <summary>
        /// Represents captureImage action options.
        /// </summary>
        [DataContract]
        public class CameraOptions
        {
            /// <summary>
            /// Source to getPicture from.
            /// </summary>
            [DataMember(IsRequired = false, Name = "sourceType")]
            public int PictureSourceType { get; set; }

            /// <summary>
            /// Format of image that returned from getPicture.
            /// </summary>
            [DataMember(IsRequired = false, Name = "destinationType")]
            public int DestinationType { get; set; }

            /// <summary>
            /// Quality of saved image
            /// </summary>
            [DataMember(IsRequired = false, Name = "quality")]
            public int Quality { get; set; }

            /// <summary>
            /// Controls whether or not the image is also added to the device photo album.
            /// </summary>
            [DataMember(IsRequired = false, Name = "saveToPhotoAlbum")]
            public bool SaveToPhotoAlbum { get; set; }

            /// <summary>
            /// Ignored
            /// </summary>
            [DataMember(IsRequired = false, Name = "correctOrientation")]
            public bool CorrectOrientation { get; set; }

            

            /// <summary>
            /// Ignored
            /// </summary>
            [DataMember(IsRequired = false, Name = "allowEdit")]
            public bool AllowEdit { get; set; }

                        /// <summary>
            /// Height in pixels to scale image
            /// </summary>
            [DataMember(IsRequired = false, Name = "encodingType")]
            public int EncodingType { get; set; }

                        /// <summary>
            /// Height in pixels to scale image
            /// </summary>
            [DataMember(IsRequired = false, Name = "mediaType")]
            public int MediaType { get; set; }


            /// <summary>
            /// Height in pixels to scale image
            /// </summary>
            [DataMember(IsRequired = false, Name = "targetHeight")]
            public int TargetHeight { get; set; }


            /// <summary>
            /// Width in pixels to scale image
            /// </summary>
            [DataMember(IsRequired = false, Name = "targetWidth")]
            public int TargetWidth { get; set; }

            /// <summary>
            /// Creates options object with default parameters
            /// </summary>
            public CameraOptions()
            {
                this.SetDefaultValues(new StreamingContext());
            }

            /// <summary>
            /// Initializes default values for class fields.
            /// Implemented in separate method because default constructor is not invoked during deserialization.
            /// </summary>
            /// <param name="context"></param>
            [OnDeserializing()]
            public void SetDefaultValues(StreamingContext context)
            {
                PictureSourceType = CAMERA;
                DestinationType = FILE_URI;
                Quality = 80;
                TargetHeight = -1;
                TargetWidth = -1;
                SaveToPhotoAlbum = false;
                CorrectOrientation = true;
                AllowEdit = false;
                MediaType = -1;
                EncodingType = -1;
            }
        }

        /// <summary>
        /// Used to open photo library
        /// </summary>
        PhotoChooserTask photoChooserTask;

        /// <summary>
        /// Used to open camera application
        /// </summary>
        CameraCaptureTask cameraTask;

        /// <summary>
        /// Camera options
        /// </summary>
        CameraOptions cameraOptions;

        public void takePicture(string options)
        {
            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                // ["quality", "destinationType", "sourceType", "targetWidth", "targetHeight", "encodingType",
                //     "mediaType", "allowEdit", "correctOrientation", "saveToPhotoAlbum" ]
                this.cameraOptions = new CameraOptions();
                this.cameraOptions.Quality = int.Parse(args[0]);
                this.cameraOptions.DestinationType = int.Parse(args[1]);
                this.cameraOptions.PictureSourceType = int.Parse(args[2]);
                this.cameraOptions.TargetWidth = int.Parse(args[3]);
                this.cameraOptions.TargetHeight = int.Parse(args[4]);
                this.cameraOptions.EncodingType = int.Parse(args[5]);
                this.cameraOptions.MediaType = int.Parse(args[6]);
                this.cameraOptions.AllowEdit = bool.Parse(args[7]);
                this.cameraOptions.CorrectOrientation = bool.Parse(args[8]);
                this.cameraOptions.SaveToPhotoAlbum = bool.Parse(args[9]);
                
                //this.cameraOptions = String.IsNullOrEmpty(options) ?
                //        new CameraOptions() : JSON.JsonHelper.Deserialize<CameraOptions>(options);
            }
            catch (Exception ex)
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION, ex.Message));
                return;
            }

            //TODO Check if all the options are acceptable


            if (cameraOptions.PictureSourceType == CAMERA)
            {
                cameraTask = new CameraCaptureTask();
                cameraTask.Completed += onCameraTaskCompleted;
                cameraTask.Show();
            }
            else
            {
                if ((cameraOptions.PictureSourceType == PHOTOLIBRARY) || (cameraOptions.PictureSourceType == SAVEDPHOTOALBUM))
                {
                    photoChooserTask = new PhotoChooserTask();
                    photoChooserTask.Completed += onPickerTaskCompleted;
                    photoChooserTask.Show();
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.NO_RESULT));
                }
            }

        }

        public void onCameraTaskCompleted(object sender, PhotoResult e)
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
                        string imagePathOrContent = string.Empty;

                        if (cameraOptions.DestinationType == FILE_URI)
                        {
                            // Save image in media library
                            if (cameraOptions.SaveToPhotoAlbum)
                            {
                                MediaLibrary library = new MediaLibrary();
                                Picture pict = library.SavePicture(e.OriginalFileName, e.ChosenPhoto); // to save to photo-roll ...
                            }

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

                            // we should return stream position back after saving stream to media library
                            rotImageStream.Seek(0, SeekOrigin.Begin);

                            WriteableBitmap image = PictureDecoder.DecodeJpeg(rotImageStream);

                            imagePathOrContent = this.SaveImageToLocalStorage(image, Path.GetFileName(e.OriginalFileName));


                        }
                        else if (cameraOptions.DestinationType == DATA_URL)
                        {
                            imagePathOrContent = this.GetImageContent(e.ChosenPhoto);
                        }
                        else
                        {
                            // TODO: shouldn't this happen before we launch the camera-picker?
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Incorrect option: destinationType"));
                            return;
                        }

                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, imagePathOrContent));

                    }
                    catch (Exception)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Error retrieving image."));
                    }
                    break;

                case TaskResult.Cancel:
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Selection cancelled."));
                    break;

                default:
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Selection did not complete!"));
                    break;
            }

        }

        public void onPickerTaskCompleted(object sender, PhotoResult e)
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
                        string imagePathOrContent = string.Empty;

                        if (cameraOptions.DestinationType == FILE_URI)
                        {
                            WriteableBitmap image = PictureDecoder.DecodeJpeg(e.ChosenPhoto);
                            imagePathOrContent = this.SaveImageToLocalStorage(image, Path.GetFileName(e.OriginalFileName));
                        }
                        else if (cameraOptions.DestinationType == DATA_URL)
                        {
                            imagePathOrContent = this.GetImageContent(e.ChosenPhoto);

                        }
                        else
                        {
                            // TODO: shouldn't this happen before we launch the camera-picker?
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Incorrect option: destinationType"));
                            return;
                        }

                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, imagePathOrContent));

                    }
                    catch (Exception)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Error retrieving image."));
                    }
                    break;

                case TaskResult.Cancel:
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Selection cancelled."));
                    break;

                default:
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "Selection did not complete!"));
                    break;
            }
        }

        /// <summary>
        /// Returns image content in a form of base64 string
        /// </summary>
        /// <param name="stream">Image stream</param>
        /// <returns>Base64 representation of the image</returns>
        private string GetImageContent(Stream stream)
        {
            int streamLength = (int)stream.Length;
            byte[] fileData = new byte[streamLength + 1];
            stream.Read(fileData, 0, streamLength);

            //use photo's actual width & height if user doesn't provide width & height
            if (cameraOptions.TargetWidth < 0 && cameraOptions.TargetHeight < 0)
            {
                stream.Close();
                return Convert.ToBase64String(fileData);
            }
            else
            {
                // resize photo
                byte[] resizedFile = ResizePhoto(stream, fileData);
                stream.Close();
                return Convert.ToBase64String(resizedFile);
            }
        }

        /// <summary>
        /// Resize image
        /// </summary>
        /// <param name="stream">Image stream</param>
        /// <param name="fileData">File data</param>
        /// <returns>resized image</returns>
        private byte[] ResizePhoto(Stream stream, byte[] fileData)
        {
            int streamLength = (int)stream.Length;
            int intResult = 0;

            byte[] resizedFile;

            stream.Read(fileData, 0, streamLength);

            BitmapImage objBitmap = new BitmapImage();
            MemoryStream objBitmapStream = new MemoryStream(fileData);
            MemoryStream objBitmapStreamResized = new MemoryStream();
            WriteableBitmap objWB;
            objBitmap.SetSource(stream);
            objWB = new WriteableBitmap(objBitmap);

            // resize the photo with user defined TargetWidth & TargetHeight
            Extensions.SaveJpeg(objWB, objBitmapStreamResized, cameraOptions.TargetWidth, cameraOptions.TargetHeight, 0, cameraOptions.Quality);

            //Convert the resized stream to a byte array. 
            streamLength = (int)objBitmapStreamResized.Length;
            resizedFile = new Byte[streamLength]; //-1 
            objBitmapStreamResized.Position = 0;
            //for some reason we have to set Position to zero, but we don't have to earlier when we get the bytes from the chosen photo... 
            intResult = objBitmapStreamResized.Read(resizedFile, 0, streamLength);

            return resizedFile;
        }

        /// <summary>
        /// Saves captured image in isolated storage
        /// </summary>
        /// <param name="imageFileName">image file name</param>
        /// <returns>Image path</returns>
        private string SaveImageToLocalStorage(WriteableBitmap image, string imageFileName)
        {

            if (image == null)
            {
                throw new ArgumentNullException("imageBytes");
            }
            try
            {


                var isoFile = IsolatedStorageFile.GetUserStoreForApplication();

                if (!isoFile.DirectoryExists(isoFolder))
                {
                    isoFile.CreateDirectory(isoFolder);
                }

                string filePath = System.IO.Path.Combine("///" + isoFolder + "/", imageFileName);

                using (var stream = isoFile.CreateFile(filePath))
                {
                    // resize image if Height and Width defined via options 
                    if (cameraOptions.TargetHeight > 0 && cameraOptions.TargetWidth > 0)
                    {
                        image.SaveJpeg(stream, cameraOptions.TargetWidth, cameraOptions.TargetHeight, 0, cameraOptions.Quality);
                    }
                    else
                    {
                        image.SaveJpeg(stream, image.PixelWidth, image.PixelHeight, 0, cameraOptions.Quality);
                    }
                }

                return new Uri(filePath, UriKind.Relative).ToString();
            }
            catch (Exception)
            {
                //TODO: log or do something else
                throw;
            }
        }

    }
}
