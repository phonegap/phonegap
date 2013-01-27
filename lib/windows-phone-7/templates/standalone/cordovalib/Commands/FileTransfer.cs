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
using System.Net;
using System.Runtime.Serialization;
using System.Windows;
using System.Security;
using System.Diagnostics;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class FileTransfer : BaseCommand
    {
        public class DownloadRequestState
        {
            // This class stores the State of the request.
            public HttpWebRequest request;
            public DownloadOptions options;

            public DownloadRequestState()
            {
                request = null;
                options = null;
            }
        }

        /// <summary>
        /// Boundary symbol
        /// </summary>       
        private string Boundary = "----------------------------" + DateTime.Now.Ticks.ToString("x");

        // Error codes
        public const int FileNotFoundError = 1;
        public const int InvalidUrlError = 2;
        public const int ConnectionError = 3;

        /// <summary>
        /// Options for downloading file
        /// </summary>
        [DataContract]
        public class DownloadOptions
        {
            /// <summary>
            /// File path to download to
            /// </summary>
            [DataMember(Name = "filePath", IsRequired = true)]
            public string FilePath { get; set; }

            /// <summary>
            /// Server address to the file to download
            /// </summary>
            [DataMember(Name = "url", IsRequired = true)]
            public string Url { get; set; }
        }

        /// <summary>
        /// Options for uploading file
        /// </summary>
        [DataContract]
        public class UploadOptions
        {
            /// <summary>
            /// File path to upload
            /// </summary>
            [DataMember(Name = "filePath", IsRequired = true)]
            public string FilePath { get; set; }

            /// <summary>
            /// Server address
            /// </summary>
            [DataMember(Name = "server", IsRequired = true)]
            public string Server { get; set; }

            /// <summary>
            /// File key
            /// </summary>
            [DataMember(Name = "fileKey")]
            public string FileKey { get; set; }

            /// <summary>
            /// File name on the server
            /// </summary>
            [DataMember(Name = "fileName")]
            public string FileName { get; set; }

            /// <summary>
            /// File Mime type
            /// </summary>
            [DataMember(Name = "mimeType")]
            public string MimeType { get; set; }


            /// <summary>
            /// Additional options
            /// </summary>
            [DataMember(Name = "params")]
            public string Params { get; set; }

            /// <summary>
            /// Flag to recognize if we should trust every host (only in debug environments)
            /// </summary>
            [DataMember(Name = "debug")]
            public bool Debug { get; set; }

            /// <summary>
            /// Creates options object with default parameters
            /// </summary>
            public UploadOptions()
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
                this.FileKey = "file";
                this.FileName = "image.jpg";
                this.MimeType = "image/jpeg";
            }

        }

        /// <summary>
        /// Uploading response info
        /// </summary>
        [DataContract]
        public class FileUploadResult
        {
            /// <summary>
            /// Amount of sent bytes
            /// </summary>
            [DataMember(Name = "bytesSent")]
            public long BytesSent { get; set; }

            /// <summary>
            /// Server response code
            /// </summary>
            [DataMember(Name = "responseCode")]
            public long ResponseCode { get; set; }

            /// <summary>
            /// Server response
            /// </summary>
            [DataMember(Name = "response", EmitDefaultValue = false)]
            public string Response { get; set; }

            /// <summary>
            /// Creates FileUploadResult object with response values
            /// </summary>
            /// <param name="bytesSent">Amount of sent bytes</param>
            /// <param name="responseCode">Server response code</param>
            /// <param name="response">Server response</param>
            public FileUploadResult(long bytesSent, long responseCode, string response)
            {
                this.BytesSent = bytesSent;
                this.ResponseCode = responseCode;
                this.Response = response;
            }
        }

        /// <summary>
        /// Represents transfer error codes for callback
        /// </summary>
        [DataContract]
        public class FileTransferError
        {
            /// <summary>
            /// Error code
            /// </summary>
            [DataMember(Name = "code", IsRequired = true)]
            public int Code { get; set; }

            /// <summary>
            /// The source URI
            /// </summary>
            [DataMember(Name = "source", IsRequired = true)]
            public string Source { get; set; }

            /// <summary>
            /// The target URI
            /// </summary>
            [DataMember(Name = "target", IsRequired = true)]
            public string Target { get; set; }

            /// <summary>
            /// The http status code response from the remote URI
            /// </summary>
            [DataMember(Name = "http_status", IsRequired = true)]
            public int HttpStatus { get; set; }

            /// <summary>
            /// Creates FileTransferError object
            /// </summary>
            /// <param name="errorCode">Error code</param>
            public FileTransferError(int errorCode)
            {
                this.Code = errorCode;
                this.Source = null;
                this.Target = null;
                this.HttpStatus = 0;
            }
            public FileTransferError(int errorCode, string source, string target, int status)
            {
                this.Code = errorCode;
                this.Source = source;
                this.Target = target;
                this.HttpStatus = status;
            }
        }

        /// <summary>
        /// Upload options
        /// </summary>
        private UploadOptions uploadOptions;

        /// <summary>
        /// Bytes sent
        /// </summary>
        private long bytesSent;

        /// <summary>
        /// sends a file to a server
        /// </summary>
        /// <param name="options">Upload options</param>
        public void upload(string options)
        {
            Debug.WriteLine("options = " + options);
            options = options.Replace("{}", "null");

            try 
            {
                try 
                {
                    string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                    uploadOptions = JSON.JsonHelper.Deserialize<UploadOptions>(args[0]);
                }
                catch (Exception)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                    return;
                }

                Uri serverUri;
                try
                {
                    serverUri = new Uri(uploadOptions.Server);
                }
                catch (Exception)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(InvalidUrlError, uploadOptions.Server, null, 0)));
                    return;
                }
                HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(serverUri);
                webRequest.ContentType = "multipart/form-data;boundary=" + Boundary;
                webRequest.Method = "POST";
                webRequest.BeginGetRequestStream(WriteCallback, webRequest);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(ConnectionError)));
            }
        }

        public void download(string options)
        {
            DownloadOptions downloadOptions = null;
            HttpWebRequest webRequest = null;

            try
            {
                string[] optionStrings = JSON.JsonHelper.Deserialize<string[]>(options);

                downloadOptions = new DownloadOptions();// JSON.JsonHelper.Deserialize<DownloadOptions>(options);
                downloadOptions.Url = optionStrings[0];
                downloadOptions.FilePath = optionStrings[1];
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                webRequest = (HttpWebRequest)WebRequest.Create(downloadOptions.Url);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(InvalidUrlError, downloadOptions.Url, null, 0)));
                return;
            }

            if (downloadOptions != null && webRequest != null)
            {
                DownloadRequestState state = new DownloadRequestState();
                state.options = downloadOptions;
                state.request = webRequest;
                webRequest.BeginGetResponse(new AsyncCallback(downloadCallback), state);
            }



        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="asynchronousResult"></param>
        private void downloadCallback(IAsyncResult asynchronousResult)
        {
            DownloadRequestState reqState = (DownloadRequestState)asynchronousResult.AsyncState;
            HttpWebRequest request = reqState.request;

            try
            {
                HttpWebResponse response = (HttpWebResponse)request.EndGetResponse(asynchronousResult);

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    // create the file if not exists
                    if (!isoFile.FileExists(reqState.options.FilePath))
                    {
                        var file = isoFile.CreateFile(reqState.options.FilePath);
                        file.Close();
                    }

                    using (FileStream fileStream = new IsolatedStorageFileStream(reqState.options.FilePath, FileMode.Open, FileAccess.Write, isoFile))
                    {
                        long totalBytes = response.ContentLength;
                        int bytesRead = 0;
                        using (BinaryReader reader = new BinaryReader(response.GetResponseStream()))
                        {

                            using (BinaryWriter writer = new BinaryWriter(fileStream))
                            {
                                int BUFFER_SIZE = 1024;
                                byte[] buffer;

                                while (true)
                                {
                                    buffer = reader.ReadBytes(BUFFER_SIZE);
                                    // fire a progress event ?
                                    bytesRead += buffer.Length;
                                    if (buffer.Length > 0)
                                    {
                                        writer.Write(buffer);
                                    }
                                    else
                                    {
                                        writer.Close();
                                        reader.Close();
                                        fileStream.Close();
                                        break;
                                    }
                                }
                            }

                        }


                    }
                }
                WPCordovaClassLib.Cordova.Commands.File.FileEntry entry = new WPCordovaClassLib.Cordova.Commands.File.FileEntry(reqState.options.FilePath);
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, entry));
            }
            catch (IsolatedStorageException)
            {
                // Trying to write the file somewhere within the IsoStorage.
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(FileNotFoundError)));
            }
            catch (SecurityException)
            {
                // Trying to write the file somewhere not allowed.
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(FileNotFoundError)));
            }
            catch (WebException webex)
            {
                // TODO: probably need better work here to properly respond with all http status codes back to JS
                // Right now am jumping through hoops just to detect 404.
                if ((webex.Status == WebExceptionStatus.ProtocolError && ((HttpWebResponse)webex.Response).StatusCode == HttpStatusCode.NotFound) || webex.Status == WebExceptionStatus.UnknownError)
                {
                    // Weird MSFT detection of 404... seriously... just give us the f(*&#$@ status code as a number ffs!!!
                    // "Numbers for HTTP status codes? Nah.... let's create our own set of enums/structs to abstract that stuff away."
                    // FACEPALM
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(ConnectionError, null, null, 404)));
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(ConnectionError)));
                }
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(FileNotFoundError)));
            }
        }



        /// <summary>
        /// Read file from Isolated Storage and sends it to server
        /// </summary>
        /// <param name="asynchronousResult"></param>
        private void WriteCallback(IAsyncResult asynchronousResult)
        {
            try
            {
                HttpWebRequest webRequest = (HttpWebRequest)asynchronousResult.AsyncState;
                using (Stream requestStream = (webRequest.EndGetRequestStream(asynchronousResult)))
                {
                    string lineStart = "--";
                    string lineEnd = Environment.NewLine;
                    byte[] boundaryBytes = System.Text.Encoding.UTF8.GetBytes(lineStart + Boundary + lineEnd);
                    string formdataTemplate = "Content-Disposition: form-data; name=\"{0}\"" + lineEnd + lineEnd + "{1}" + lineEnd;

                    if (uploadOptions.Params != null)
                    {

                        string[] arrParams = uploadOptions.Params.Split(new[] { '&' }, StringSplitOptions.RemoveEmptyEntries);

                        foreach (string param in arrParams)
                        {
                            string[] split = param.Split('=');
                            string key = split[0];
                            string val = split[1];
                            requestStream.Write(boundaryBytes, 0, boundaryBytes.Length);
                            string formItem = string.Format(formdataTemplate, key, val);
                            byte[] formItemBytes = System.Text.Encoding.UTF8.GetBytes(formItem);
                            requestStream.Write(formItemBytes, 0, formItemBytes.Length);
                        }
                        requestStream.Write(boundaryBytes, 0, boundaryBytes.Length);
                    }
                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        if (!isoFile.FileExists(uploadOptions.FilePath))
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(FileNotFoundError, uploadOptions.Server, uploadOptions.FilePath, 0)));
                            return;
                        }

                        using (FileStream fileStream = new IsolatedStorageFileStream(uploadOptions.FilePath, FileMode.Open, isoFile))
                        {
                            string headerTemplate = "Content-Disposition: form-data; name=\"{0}\"; filename=\"{1}\"" + lineEnd + "Content-Type: {2}" + lineEnd + lineEnd;
                            string header = string.Format(headerTemplate, uploadOptions.FileKey, uploadOptions.FileName, uploadOptions.MimeType);
                            byte[] headerBytes = System.Text.Encoding.UTF8.GetBytes(header);
                            requestStream.Write(boundaryBytes, 0, boundaryBytes.Length);
                            requestStream.Write(headerBytes, 0, headerBytes.Length);
                            byte[] buffer = new byte[4096];
                            int bytesRead = 0;

                            while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) != 0)
                            {
                                requestStream.Write(buffer, 0, bytesRead);
                                bytesSent += bytesRead;
                            }
                        }
                        byte[] endRequest = System.Text.Encoding.UTF8.GetBytes(lineEnd + lineStart + Boundary + lineStart + lineEnd);
                        requestStream.Write(endRequest, 0, endRequest.Length);
                    }
                }
                webRequest.BeginGetResponse(ReadCallback, webRequest);
            }
            catch (Exception)
            {
                Deployment.Current.Dispatcher.BeginInvoke(() =>
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(ConnectionError)));
                });
            }
        }

        /// <summary>
        /// Reads response into FileUploadResult
        /// </summary>
        /// <param name="asynchronousResult"></param>
        private void ReadCallback(IAsyncResult asynchronousResult)
        {
            try
            {
                HttpWebRequest webRequest = (HttpWebRequest)asynchronousResult.AsyncState;
                using (HttpWebResponse response = (HttpWebResponse)webRequest.EndGetResponse(asynchronousResult))
                {
                    using (Stream streamResponse = response.GetResponseStream())
                    {
                        using (StreamReader streamReader = new StreamReader(streamResponse))
                        {
                            string responseString = streamReader.ReadToEnd();
                            Deployment.Current.Dispatcher.BeginInvoke(() =>
                            {
                                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, new FileUploadResult(bytesSent, (long)response.StatusCode, responseString)));
                            });
                        }
                    }
                }
            }
            catch (Exception)
            {
                Deployment.Current.Dispatcher.BeginInvoke(() =>
                {
                    FileTransferError transferError = new FileTransferError(ConnectionError, uploadOptions.Server, uploadOptions.FilePath, 403);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, transferError));
                });
            }
        }
    }
}
