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

using System.Collections.Generic;
using System.IO;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Represents file extension to mime type mapper.
    /// </summary>
    public static class MimeTypeMapper
    {
        /// <summary>
        /// For unknown type it is recommended to use 'application/octet-stream'
        /// http://stackoverflow.com/questions/1176022/unknown-file-type-mime
        /// </summary>
        private static string DefaultMimeType = "application/octet-stream";

        /// <summary>
        /// Stores mime type for all necessary extension
        /// </summary>
        private static readonly Dictionary<string, string> MIMETypesDictionary = new Dictionary<string, string>
                                                                             {                                                                                
                                                                                 {"avi", "video/x-msvideo"},
                                                                                 {"bmp", "image/bmp"},                                                                                                                                                                
                                                                                 {"gif", "image/gif"},                                                                                                                                                               
                                                                                 {"jpe", "image/jpeg"},
                                                                                 {"jpeg", "image/jpeg"},
                                                                                 {"jpg", "image/jpeg"},                                                                                                                                                             
                                                                                 {"mov", "video/quicktime"},
                                                                                 {"mp2", "audio/mpeg"},
                                                                                 {"mp3", "audio/mpeg"},
                                                                                 {"mp4", "video/mp4"},
                                                                                 {"mpe", "video/mpeg"},
                                                                                 {"mpeg", "video/mpeg"},
                                                                                 {"mpg", "video/mpeg"},
                                                                                 {"mpga", "audio/mpeg"},                                                                                
                                                                                 {"pbm", "image/x-portable-bitmap"},
                                                                                 {"pcm", "audio/x-pcm"},
                                                                                 {"pct", "image/pict"},
                                                                                 {"pgm", "image/x-portable-graymap"},
                                                                                 {"pic", "image/pict"},
                                                                                 {"pict", "image/pict"},
                                                                                 {"png", "image/png"},
                                                                                 {"pnm", "image/x-portable-anymap"},
                                                                                 {"pnt", "image/x-macpaint"},
                                                                                 {"pntg", "image/x-macpaint"},
                                                                                 {"ppm", "image/x-portable-pixmap"},
                                                                                 {"qt", "video/quicktime"},
                                                                                 {"ra", "audio/x-pn-realaudio"},
                                                                                 {"ram", "audio/x-pn-realaudio"},
                                                                                 {"ras", "image/x-cmu-raster"},
                                                                                 {"rgb", "image/x-rgb"},
                                                                                 {"snd", "audio/basic"},
                                                                                 {"txt", "text/plain"},
                                                                                 {"tif", "image/tiff"},
                                                                                 {"tiff", "image/tiff"},
                                                                                 {"wav", "audio/x-wav"},
                                                                                 {"wbmp", "image/vnd.wap.wbmp"},

                                                                             };
        /// <summary>
        /// Gets mime type by file extension
        /// </summary>
        /// <param name="fileName">file name to extract extension</param>
        /// <returns>mime type</returns>
        public static string GetMimeType(string fileName)
        {
            string ext = Path.GetExtension(fileName);

            // invalid extension
            if (string.IsNullOrEmpty(ext) || !ext.StartsWith("."))
            {
                return DefaultMimeType;
            }

            ext = ext.Remove(0, 1);

            if (MIMETypesDictionary.ContainsKey(ext))
            {
                return MIMETypesDictionary[ext];
            }

            return DefaultMimeType;
        }
    }
}
