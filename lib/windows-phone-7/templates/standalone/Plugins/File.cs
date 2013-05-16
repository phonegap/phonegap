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
using System.Security;
using System.Text;
using System.Diagnostics;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Provides access to isolated storage
    /// </summary>
    public class File : BaseCommand
    {
        // Error codes
        public const int NOT_FOUND_ERR = 1;
        public const int SECURITY_ERR = 2;
        public const int ABORT_ERR = 3;
        public const int NOT_READABLE_ERR = 4;
        public const int ENCODING_ERR = 5;
        public const int NO_MODIFICATION_ALLOWED_ERR = 6;
        public const int INVALID_STATE_ERR = 7;
        public const int SYNTAX_ERR = 8;
        public const int INVALID_MODIFICATION_ERR = 9;
        public const int QUOTA_EXCEEDED_ERR = 10;
        public const int TYPE_MISMATCH_ERR = 11;
        public const int PATH_EXISTS_ERR = 12;

        // File system options
        public const int TEMPORARY = 0;
        public const int PERSISTENT = 1;
        public const int RESOURCE = 2;
        public const int APPLICATION = 3;

        /// <summary>
        /// Temporary directory name
        /// </summary>
        private readonly string TMP_DIRECTORY_NAME = "tmp";

        /// <summary>
        /// Represents error code for callback
        /// </summary>
        [DataContract]
        public class ErrorCode
        {
            /// <summary>
            /// Error code
            /// </summary>
            [DataMember(IsRequired = true, Name = "code")]
            public int Code { get; set; }

            /// <summary>
            /// Creates ErrorCode object
            /// </summary>
            public ErrorCode(int code)
            {
                this.Code = code;
            }
        }

        /// <summary>
        /// Represents File action options.
        /// </summary>
        [DataContract]
        public class FileOptions
        {
            /// <summary>
            /// File path
            /// </summary>
            /// 
            private string _fileName;
            [DataMember(Name = "fileName")]
            public string FilePath
            {
                get
                {
                    return this._fileName;
                }

                set
                {
                    int index = value.IndexOfAny(new char[] { '#', '?' });
                    this._fileName = index > -1 ? value.Substring(0, index) : value;
                }
            }

            /// <summary>
            /// Full entryPath
            /// </summary>
            [DataMember(Name = "fullPath")]
            public string FullPath { get; set; }

            /// <summary>
            /// Directory name
            /// </summary>
            [DataMember(Name = "dirName")]
            public string DirectoryName { get; set; }

            /// <summary>
            /// Path to create file/directory
            /// </summary>
            [DataMember(Name = "path")]
            public string Path { get; set; }

            /// <summary>
            /// The encoding to use to encode the file's content. Default is UTF8.
            /// </summary>
            [DataMember(Name = "encoding")]
            public string Encoding { get; set; }

            /// <summary>
            /// Uri to get file
            /// </summary>
            /// 
            private string _uri;
            [DataMember(Name = "uri")]
            public string Uri
            {
                get
                {
                    return this._uri;
                }

                set
                {
                    int index = value.IndexOfAny(new char[] { '#', '?' });
                    this._uri = index > -1 ? value.Substring(0, index) : value;
                }
            }

            /// <summary>
            /// Size to truncate file
            /// </summary>
            [DataMember(Name = "size")]
            public long Size { get; set; }

            /// <summary>
            /// Data to write in file
            /// </summary>
            [DataMember(Name = "data")]
            public string Data { get; set; }

            /// <summary>
            /// Position the writing starts with
            /// </summary>
            [DataMember(Name = "position")]
            public int Position { get; set; }

            /// <summary>
            /// Type of file system requested
            /// </summary>
            [DataMember(Name = "type")]
            public int FileSystemType { get; set; }

            /// <summary>
            /// New file/directory name
            /// </summary>
            [DataMember(Name = "newName")]
            public string NewName { get; set; }

            /// <summary>
            /// Destination directory to copy/move file/directory
            /// </summary>
            [DataMember(Name = "parent")]
            public string Parent { get; set; }

            /// <summary>
            /// Options for getFile/getDirectory methods
            /// </summary>
            [DataMember(Name = "options")]
            public CreatingOptions CreatingOpt { get; set; }

            /// <summary>
            /// Creates options object with default parameters
            /// </summary>
            public FileOptions()
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
                this.Encoding = "UTF-8";
                this.FilePath = "";
                this.FileSystemType = -1; 
            }
        }

        /// <summary>
        /// Stores image info
        /// </summary>
        [DataContract]
        public class FileMetadata
        {
            [DataMember(Name = "fileName")]
            public string FileName { get; set; }

            [DataMember(Name = "fullPath")]
            public string FullPath { get; set; }

            [DataMember(Name = "type")]
            public string Type { get; set; }

            [DataMember(Name = "lastModifiedDate")]
            public string LastModifiedDate { get; set; }

            [DataMember(Name = "size")]
            public long Size { get; set; }

            public FileMetadata(string filePath)
            {
                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    if ((string.IsNullOrEmpty(filePath)) || (!isoFile.FileExists(filePath)))
                    {
                        throw new FileNotFoundException("File doesn't exist");
                    }
                    //TODO get file size the other way if possible                
                    using (IsolatedStorageFileStream stream = new IsolatedStorageFileStream(filePath, FileMode.Open, FileAccess.Read, isoFile))
                    {
                        this.Size = stream.Length;
                    }
                    this.FullPath = filePath;
                    this.FileName = System.IO.Path.GetFileName(filePath);
                    this.Type = MimeTypeMapper.GetMimeType(filePath);
                    this.LastModifiedDate = isoFile.GetLastWriteTime(filePath).DateTime.ToString();
                }
            }
        }

        /// <summary>
        /// Represents file or directory modification metadata
        /// </summary>
        [DataContract]
        public class ModificationMetadata
        {
            /// <summary>
            /// Modification time
            /// </summary>
            [DataMember]
            public string modificationTime { get; set; }
        }

        /// <summary>
        /// Represents file or directory entry
        /// </summary>
        [DataContract]
        public class FileEntry
        {

            /// <summary>
            /// File type
            /// </summary>
            [DataMember(Name = "isFile")]
            public bool IsFile { get; set; }

            /// <summary>
            /// Directory type
            /// </summary>
            [DataMember(Name = "isDirectory")]
            public bool IsDirectory { get; set; }

            /// <summary>
            /// File/directory name
            /// </summary>
            [DataMember(Name = "name")]
            public string Name { get; set; }

            /// <summary>
            /// Full path to file/directory
            /// </summary>
            [DataMember(Name = "fullPath")]
            public string FullPath { get; set; }

            public static FileEntry GetEntry(string filePath)
            {
                FileEntry entry = null;
                try
                {
                    entry = new FileEntry(filePath);

                }
                catch (Exception ex)
                {
                    Debug.WriteLine("Exception in GetEntry for filePath :: " + filePath + " " + ex.Message);
                }
                return entry;
            }

            /// <summary>
            /// Creates object and sets necessary properties
            /// </summary>
            /// <param name="filePath"></param>
            public FileEntry(string filePath)
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    throw new ArgumentException();
                }

                if(filePath.Contains(" ")) 
                {
                    Debug.WriteLine("FilePath with spaces :: " +  filePath);
                }

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    this.IsFile = isoFile.FileExists(filePath);
                    this.IsDirectory = isoFile.DirectoryExists(filePath);
                    if (IsFile)
                    {
                        this.Name = Path.GetFileName(filePath);
                    }
                    else if (IsDirectory)
                    {
                        this.Name = this.GetDirectoryName(filePath);
                        if (string.IsNullOrEmpty(Name))
                        {
                            this.Name = "/";
                        }
                    }
                    else
                    {
                        throw new FileNotFoundException();
                    }

                    try
                    {
                        this.FullPath = filePath.Replace('\\', '/'); // new Uri(filePath).LocalPath;
                    }
                    catch (Exception)
                    {
                        this.FullPath = filePath;
                    }
                }
            }

            /// <summary>
            /// Extracts directory name from path string
            /// Path should refer to a directory, for example \foo\ or /foo.
            /// </summary>
            /// <param name="path"></param>
            /// <returns></returns>
            private string GetDirectoryName(string path)
            {
                if (String.IsNullOrEmpty(path))
                {
                    return path;
                }

                string[] split = path.Split(new char[] { '/', '\\' }, StringSplitOptions.RemoveEmptyEntries);
                if (split.Length < 1)
                {
                    return null;
                }
                else
                {
                    return split[split.Length - 1];
                }
            }
        }


        /// <summary>
        /// Represents info about requested file system
        /// </summary>
        [DataContract]
        public class FileSystemInfo
        {
            /// <summary>
            /// file system type
            /// </summary>
            [DataMember(Name = "name", IsRequired = true)]
            public string Name { get; set; }

            /// <summary>
            /// Root directory entry
            /// </summary>
            [DataMember(Name = "root", EmitDefaultValue = false)]
            public FileEntry Root { get; set; }

            /// <summary>
            /// Creates class instance
            /// </summary>
            /// <param name="name"></param>
            /// <param name="rootEntry"> Root directory</param>
            public FileSystemInfo(string name, FileEntry rootEntry = null)
            {
                Name = name;
                Root = rootEntry;
            }
        }

        [DataContract]
        public class CreatingOptions
        {
            /// <summary>
            /// Create file/directory if is doesn't exist
            /// </summary>
            [DataMember(Name = "create")]
            public bool Create { get; set; }

            /// <summary>
            /// Generate an exception if create=true and file/directory already exists
            /// </summary>
            [DataMember(Name = "exclusive")]
            public bool Exclusive { get; set; }


        }

        /// <summary>
        /// File options
        /// </summary>
        private FileOptions fileOptions;

        private bool LoadFileOptions(string options)
        {
            try
            {
                fileOptions = JSON.JsonHelper.Deserialize<FileOptions>(options);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return false;
            }
            return true;
        }

        // returns null value if it fails.
        private string getSingleStringOption(string options)
        {
            string result = null;
            try
            {
                result = JSON.JsonHelper.Deserialize<string[]>(options)[0];
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
            }
            return result;
        }

        /// <summary>
        /// Gets amount of free space available for Isolated Storage
        /// </summary>
        /// <param name="options">No options is needed for this method</param>
        public void getFreeDiskSpace(string options)
        {
            try
            {
                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, isoFile.AvailableFreeSpace));
                }
            }
            catch (IsolatedStorageException)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                }
            }
        }

        /// <summary>
        /// Check if file exists
        /// </summary>
        /// <param name="options">File path</param>
        public void testFileExists(string options)
        {
            IsDirectoryOrFileExist(options, false);
        }

        /// <summary>
        /// Check if directory exists
        /// </summary>
        /// <param name="options">directory name</param>
        public void testDirectoryExists(string options)
        {
            IsDirectoryOrFileExist(options, true);
        }

        /// <summary>
        /// Check if file or directory exist
        /// </summary>
        /// <param name="options">File path/Directory name</param>
        /// <param name="isDirectory">Flag to recognize what we should check</param>
        public void IsDirectoryOrFileExist(string options, bool isDirectory)
        {
            if (!LoadFileOptions(options))
            {
                return;
            }

            try
            {
                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    bool isExist;
                    if (isDirectory)
                    {
                        isExist = isoFile.DirectoryExists(fileOptions.DirectoryName);
                    }
                    else
                    {
                        isExist = isoFile.FileExists(fileOptions.FilePath);
                    }
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, isExist));
                }
            }
            catch (IsolatedStorageException) // default handler throws INVALID_MODIFICATION_ERR
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                }
            }

        }

        public void readAsDataURL(string options)
        {
            // exception+PluginResult are handled by getSingleStringOptions 
            string filePath = getSingleStringOption(options);
            if (filePath != null)
            {
                try
                {
                    string base64URL = null;

                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        if (!isoFile.FileExists(filePath))
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                            return;
                        }
                        string mimeType = MimeTypeMapper.GetMimeType(filePath);

                        using (IsolatedStorageFileStream stream = isoFile.OpenFile(filePath, FileMode.Open, FileAccess.Read))
                        {
                            string base64String = GetFileContent(stream);
                            base64URL = "data:" + mimeType + ";base64," + base64String;
                        }
                    }

                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, base64URL));
                }
                catch (Exception ex)
                {
                    if (!this.HandleException(ex))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                    }
                }
            }
        }

        public void readAsText(string options)
        {
            // TODO: try/catch
            string[] optStrings = JSON.JsonHelper.Deserialize<string[]>(options);
            string filePath = optStrings[0];
            string encStr = optStrings[1];


            try
            {
                string text;

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    if (!isoFile.FileExists(filePath))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                        return;
                    }
                    Encoding encoding = Encoding.GetEncoding(encStr);

                    using (TextReader reader = new StreamReader(isoFile.OpenFile(filePath, FileMode.Open, FileAccess.Read), encoding))
                    {
                        text = reader.ReadToEnd();
                    }
                }

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, text));
            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                }
            }
        }

        /// <summary>
        /// Reads application resource as a text
        /// </summary>
        /// <param name="options">Path to a resource</param>
        public void readResourceAsText(string options)
        {
            string pathToResource;
            try 
            {
                string[] optStrings = JSON.JsonHelper.Deserialize<string[]>(options);
                pathToResource = optStrings[0];
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }
            
            try
            {
                if (pathToResource.StartsWith("/"))
                {
                    pathToResource = pathToResource.Remove(0, 1);
                }
                
                var resource = System.Windows.Application.GetResourceStream(new Uri(pathToResource, UriKind.Relative));
                
                if (resource == null)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                    return;
                }

                string text;
                StreamReader streamReader = new StreamReader(resource.Stream);
                text = streamReader.ReadToEnd();
                
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, text));
            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                }
            }
        }

        public void truncate(string options)
        {
            // TODO: try/catch
            string[] optStrings = JSON.JsonHelper.Deserialize<string[]>(options);

            string filePath = optStrings[0];
            int size = int.Parse(optStrings[1]);

            try
            {
                long streamLength = 0;

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    if (!isoFile.FileExists(filePath))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                        return;
                    }

                    using (FileStream stream = new IsolatedStorageFileStream(filePath, FileMode.Open, FileAccess.ReadWrite, isoFile))
                    {
                        if (0 <= size && size <= stream.Length)
                        {
                            stream.SetLength(size);
                        }

                        streamLength = stream.Length;
                    }
                }

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, streamLength));
            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                }
            }
        }

        //write:["filePath","data","position"],
        public void write(string options)
        {
            // TODO: try/catch
            string[] optStrings = JSON.JsonHelper.Deserialize<string[]>(options);

            string filePath = optStrings[0];
            string data = optStrings[1];
            int position = int.Parse(optStrings[2]);

            try
            {
                if (string.IsNullOrEmpty(data))
                {
                    Debug.WriteLine("Expected some data to be send in the write command to {0}", filePath);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                    return;
                }

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    // create the file if not exists
                    if (!isoFile.FileExists(filePath))
                    {
                        var file = isoFile.CreateFile(filePath);
                        file.Close();
                    }

                    using (FileStream stream = new IsolatedStorageFileStream(filePath, FileMode.Open, FileAccess.ReadWrite, isoFile))
                    {
                        if (0 <= position && position <= stream.Length)
                        {
                            stream.SetLength(position);
                        }
                        using (BinaryWriter writer = new BinaryWriter(stream))
                        {
                            writer.Seek(0, SeekOrigin.End);
                            writer.Write(data.ToCharArray());
                        }
                    }
                }

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, data.Length));
            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                }
            }
        }

        /// <summary>
        /// Look up metadata about this entry.
        /// </summary>
        /// <param name="options">filePath to entry</param>   
        public void getMetadata(string options)
        {
            string filePath = getSingleStringOption(options);

            if (filePath != null)
            {
                try
                {
                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        if (isoFile.FileExists(filePath))
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.OK,
                                new ModificationMetadata() { modificationTime = isoFile.GetLastWriteTime(filePath).DateTime.ToString() }));
                        }
                        else if (isoFile.DirectoryExists(filePath))
                        {
                            string modTime = isoFile.GetLastWriteTime(filePath).DateTime.ToString();
                            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, new ModificationMetadata() { modificationTime = modTime }));
                        }
                        else
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                        }

                    }
                }
                catch (IsolatedStorageException)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                }
                catch (Exception ex)
                {
                    if (!this.HandleException(ex))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                    }
                }
            }

        }


        /// <summary>
        /// Returns a File that represents the current state of the file that this FileEntry represents.
        /// </summary>
        /// <param name="filePath">filePath to entry</param>
        /// <returns></returns>
        public void getFileMetadata(string options)
        {
            string filePath = getSingleStringOption(options);
            if (filePath != null)
            {
                try
                {
                    FileMetadata metaData = new FileMetadata(filePath);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, metaData));
                }
                catch (IsolatedStorageException)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                }
                catch (Exception ex)
                {
                    if (!this.HandleException(ex))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_READABLE_ERR));
                    }
                }
            }
        }

        /// <summary>
        /// Look up the parent DirectoryEntry containing this Entry. 
        /// If this Entry is the root of IsolatedStorage, its parent is itself.
        /// </summary>
        /// <param name="options"></param>
        public void getParent(string options)
        {
            string filePath = getSingleStringOption(options);
            if (filePath != null)
            {
                try
                {
                    if (string.IsNullOrEmpty(filePath))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                        return;
                    }

                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        FileEntry entry;

                        if (isoFile.FileExists(filePath) || isoFile.DirectoryExists(filePath))
                        {
                           
                             
                            string path = this.GetParentDirectory(filePath);
                            entry = FileEntry.GetEntry(path);
                            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, entry));
                        }
                        else
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                        }

                    }
                }
                catch (Exception ex)
                {
                    if (!this.HandleException(ex))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                    }
                }
            }
        }

        public void remove(string options)
        {
            string filePath = getSingleStringOption(options);
            if (filePath != null)
            {
                try
                {
                    if (filePath == "/" || filePath == "" || filePath == @"\")
                    {
                        throw new Exception("Cannot delete root file system") ;
                    }
                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        if (isoFile.FileExists(filePath))
                        {
                            isoFile.DeleteFile(filePath);
                        }
                        else
                        {
                            if (isoFile.DirectoryExists(filePath))
                            {
                                isoFile.DeleteDirectory(filePath);
                            }
                            else
                            {
                                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                                return;
                            }
                        }
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                    }
                }
                catch (Exception ex)
                {
                    if (!this.HandleException(ex))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                    }
                }
            }
        }

        public void removeRecursively(string options)
        {
            string filePath = getSingleStringOption(options);
            if (filePath != null)
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                }
                else
                {
                    removeDirRecursively(filePath);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
                }
            }
        }

        public void readEntries(string options)
        {
            string filePath = getSingleStringOption(options);
            if (filePath != null)
            {
                try
                {
                    if (string.IsNullOrEmpty(filePath))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                        return;
                    }

                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        if (isoFile.DirectoryExists(filePath))
                        {
                            string path = File.AddSlashToDirectory(filePath);
                            List<FileEntry> entries = new List<FileEntry>();
                            string[] files = isoFile.GetFileNames(path + "*");
                            string[] dirs = isoFile.GetDirectoryNames(path + "*");
                            foreach (string file in files)
                            {
                                entries.Add(FileEntry.GetEntry(path + file));
                            }
                            foreach (string dir in dirs)
                            {
                                entries.Add(FileEntry.GetEntry(path + dir + "/"));
                            }
                            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, entries));
                        }
                        else
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                        }
                    }
                }
                catch (Exception ex)
                {
                    if (!this.HandleException(ex))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                    }
                }
            }
        }

        public void requestFileSystem(string options)
        {
            // TODO: try/catch
            double[] optVals = JSON.JsonHelper.Deserialize<double[]>(options);

            double fileSystemType = optVals[0];
            double size = optVals[1];

            IsolatedStorageFile.GetUserStoreForApplication();

            if (size > (10 * 1024 * 1024)) // 10 MB, compiler will clean this up!
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, QUOTA_EXCEEDED_ERR));
                return;
            }

            try
            {
                if (size != 0)
                {
                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        long availableSize = isoFile.AvailableFreeSpace;
                        if (size > availableSize)
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, QUOTA_EXCEEDED_ERR));
                            return;
                        }
                    }
                }

                if (fileSystemType == PERSISTENT)
                {
                    // TODO: this should be in it's own folder to prevent overwriting of the app assets, which are also in ISO
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, new FileSystemInfo("persistent", FileEntry.GetEntry("/"))));
                }
                else if (fileSystemType == TEMPORARY)
                {
                    using (IsolatedStorageFile isoStorage = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        if (!isoStorage.FileExists(TMP_DIRECTORY_NAME))
                        {
                            isoStorage.CreateDirectory(TMP_DIRECTORY_NAME);
                        }
                    }

                    string tmpFolder = "/" + TMP_DIRECTORY_NAME + "/";

                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, new FileSystemInfo("temporary", FileEntry.GetEntry(tmpFolder))));
                }
                else if (fileOptions.FileSystemType == RESOURCE)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, new FileSystemInfo("resource")));
                }
                else if (fileOptions.FileSystemType == APPLICATION)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, new FileSystemInfo("application")));
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                }

            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                }
            }
        }

        public void resolveLocalFileSystemURI(string options)
        {
            string uri = getSingleStringOption(options).Split('?')[0];

            if (uri != null)
            {
                // a single '/' is valid, however, '/someDir' is not, but '/tmp//somedir' and '///someDir' are valid
                if (uri.StartsWith("/") && uri.IndexOf("//") < 0 && uri != "/")
                {
                     Debug.WriteLine("Starts with / ::: " + uri);
                     DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ENCODING_ERR));
                     return;
                }
                try
                {
                    // fix encoded spaces
                    string path = Uri.UnescapeDataString(uri);

                    FileEntry uriEntry = FileEntry.GetEntry(path);
                    if (uriEntry != null)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, uriEntry));
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                    }
                }
                catch (Exception ex)
                {
                    if (!this.HandleException(ex))
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                    }
                }
            }
        }

        public void copyTo(string options)
        {
            TransferTo(options, false);
        }

        public void moveTo(string options)
        {
            TransferTo(options, true);
        }

        public void getFile(string options)
        {
            GetFileOrDirectory(options, false);
        }

        public void getDirectory(string options)
        {
            GetFileOrDirectory(options, true);
        }

        #region internal functionality

        /// <summary>
        /// Retrieves the parent directory name of the specified path,
        /// </summary>
        /// <param name="path">Path</param>
        /// <returns>Parent directory name</returns>
        private string GetParentDirectory(string path)
        {
            if (String.IsNullOrEmpty(path) || path == "/")
            {
                return "/";
            }

            if (path.EndsWith(@"/") || path.EndsWith(@"\"))
            {
                return this.GetParentDirectory(Path.GetDirectoryName(path));
            }

            string result = Path.GetDirectoryName(path);
            if (result == null)
            {
                result = "/";
            }

            return result;
        }

        private void removeDirRecursively(string fullPath)
        {
            try
            {
                if (fullPath == "/")
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                    return;
                }

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    if (isoFile.DirectoryExists(fullPath))
                    {
                        string tempPath = File.AddSlashToDirectory(fullPath);
                        string[] files = isoFile.GetFileNames(tempPath + "*");
                        if (files.Length > 0)
                        {
                            foreach (string file in files)
                            {
                                isoFile.DeleteFile(tempPath + file);
                            }
                        }
                        string[] dirs = isoFile.GetDirectoryNames(tempPath + "*");
                        if (dirs.Length > 0)
                        {
                            foreach (string dir in dirs)
                            {
                                removeDirRecursively(tempPath + dir);
                            }
                        }
                        isoFile.DeleteDirectory(fullPath);
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                    }
                }
            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                }
            }
        }

        private bool CanonicalCompare(string pathA, string pathB)
        {
            string a = pathA.Replace("//", "/");
            string b = pathB.Replace("//", "/");

            return a.Equals(b, StringComparison.OrdinalIgnoreCase);
        }

        /*
         *  copyTo:["fullPath","parent", "newName"],
         *  moveTo:["fullPath","parent", "newName"],
         */
        private void TransferTo(string options, bool move)
        {
            // TODO: try/catch
            string[] optStrings = JSON.JsonHelper.Deserialize<string[]>(options);
            string fullPath = optStrings[0];
            string parent = optStrings[1];
            string newFileName = optStrings[2];

            char[] invalids = Path.GetInvalidPathChars();
            
            if (newFileName.IndexOfAny(invalids) > -1 || newFileName.IndexOf(":") > -1 )
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ENCODING_ERR));
                return;
            }

            try
            {
                if ((parent == null) || (string.IsNullOrEmpty(parent)) || (string.IsNullOrEmpty(fullPath)))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                    return;
                }

                string parentPath = File.AddSlashToDirectory(parent);
                string currentPath = fullPath;

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    bool isFileExist = isoFile.FileExists(currentPath);
                    bool isDirectoryExist = isoFile.DirectoryExists(currentPath);
                    bool isParentExist = isoFile.DirectoryExists(parentPath);

                    if ( ( !isFileExist && !isDirectoryExist ) || !isParentExist )
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                        return;
                    }
                    string newName;
                    string newPath;
                    if (isFileExist)
                    {
                        newName = (string.IsNullOrEmpty(newFileName))
                                    ? Path.GetFileName(currentPath)
                                    : newFileName;

                        newPath = Path.Combine(parentPath, newName);
                        
                        // sanity check ..
                        // cannot copy file onto itself
                        if (CanonicalCompare(newPath,currentPath)) //(parent + newFileName))
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, INVALID_MODIFICATION_ERR));
                            return;
                        }
                        else if (isoFile.DirectoryExists(newPath)) 
                        {
                            // there is already a folder with the same name, operation is not allowed
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, INVALID_MODIFICATION_ERR));
                            return;
                        }
                        else if (isoFile.FileExists(newPath))
                        {   // remove destination file if exists, in other case there will be exception
                            isoFile.DeleteFile(newPath);
                        }

                        if (move)
                        {
                            isoFile.MoveFile(currentPath, newPath);
                        }
                        else
                        {
                            isoFile.CopyFile(currentPath, newPath, true);
                        }
                    }
                    else
                    {
                        newName = (string.IsNullOrEmpty(newFileName))
                                    ? currentPath
                                    : newFileName;

                        newPath = Path.Combine(parentPath, newName);

                        if (move)
                        {
                            // remove destination directory if exists, in other case there will be exception
                            // target directory should be empty
                            if (!newPath.Equals(currentPath) && isoFile.DirectoryExists(newPath))
                            {
                                isoFile.DeleteDirectory(newPath);
                            }

                            isoFile.MoveDirectory(currentPath, newPath);
                        }
                        else
                        {
                            CopyDirectory(currentPath, newPath, isoFile);
                        }
                    }
                    FileEntry entry = FileEntry.GetEntry(newPath);
                    if (entry != null)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, entry));
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                    }
                }

            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                }
            }
        }

        private bool HandleException(Exception ex)
        {
            bool handled = false;
            if (ex is SecurityException)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, SECURITY_ERR));
                handled = true;
            }
            else if (ex is FileNotFoundException)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                handled = true;
            }
            else if (ex is ArgumentException)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ENCODING_ERR));
                handled = true;
            }
            else if (ex is IsolatedStorageException)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, INVALID_MODIFICATION_ERR));
                handled = true;
            }
            else if (ex is DirectoryNotFoundException)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                handled = true;
            }
            return handled;
        }

        private void CopyDirectory(string sourceDir, string destDir, IsolatedStorageFile isoFile)
        {
            string path = File.AddSlashToDirectory(sourceDir);

            bool bExists = isoFile.DirectoryExists(destDir);

            if (!bExists)
            {
                isoFile.CreateDirectory(destDir);
            }

            destDir = File.AddSlashToDirectory(destDir);
               
            string[] files = isoFile.GetFileNames(path + "*");
                
            if (files.Length > 0)
            {
                foreach (string file in files)
                {
                    isoFile.CopyFile(path + file, destDir + file,true);
                }
            }
            string[] dirs = isoFile.GetDirectoryNames(path + "*");
            if (dirs.Length > 0)
            {
                foreach (string dir in dirs)
                {
                    CopyDirectory(path + dir, destDir + dir, isoFile);
                }
            }
        }

        private void GetFileOrDirectory(string options, bool getDirectory)
        {
            FileOptions fOptions = new FileOptions();
            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);

                fOptions.FullPath = args[0];
                fOptions.Path = args[1];
                fOptions.CreatingOpt = JSON.JsonHelper.Deserialize<CreatingOptions>(args[2]);
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                if ((string.IsNullOrEmpty(fOptions.Path)) || (string.IsNullOrEmpty(fOptions.FullPath)))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                    return;
                }

                string path;

                if (fOptions.Path.Split(':').Length > 2)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ENCODING_ERR));
                    return;
                }

                try
                {
                    path = Path.Combine(fOptions.FullPath + "/", fOptions.Path);
                }
                catch (Exception)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ENCODING_ERR));
                    return;
                }

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    bool isFile = isoFile.FileExists(path);
                    bool isDirectory = isoFile.DirectoryExists(path);
                    bool create = (fOptions.CreatingOpt == null) ? false : fOptions.CreatingOpt.Create;
                    bool exclusive = (fOptions.CreatingOpt == null) ? false : fOptions.CreatingOpt.Exclusive;
                    if (create)
                    {
                        if (exclusive && (isoFile.FileExists(path) || isoFile.DirectoryExists(path)))
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, PATH_EXISTS_ERR));
                            return;
                        }


                        // need to make sure the parent exists
                        // it is an error to create a directory whose immediate parent does not yet exist
			// see issue: https://issues.apache.org/jira/browse/CB-339
                        string[] pathParts = path.Split('/');
                        string builtPath = pathParts[0];
                        for (int n = 1; n < pathParts.Length - 1; n++)
                        {
                            builtPath += "/" + pathParts[n];
                            if (!isoFile.DirectoryExists(builtPath))
                            {
                                Debug.WriteLine(String.Format("Error :: Parent folder \"{0}\" does not exist, when attempting to create \"{1}\"",builtPath,path));
                                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                                return;
                            }
                        }

                        if ((getDirectory) && (!isDirectory))
                        {
                            isoFile.CreateDirectory(path);
                        }
                        else
                        {
                            if ((!getDirectory) && (!isFile))
                            {

                                IsolatedStorageFileStream fileStream = isoFile.CreateFile(path);
                                fileStream.Close();
                            }
                        }
                    }
                    else
                    {
                        if ((!isFile) && (!isDirectory))
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                            return;
                        }
                        if (((getDirectory) && (!isDirectory)) || ((!getDirectory) && (!isFile)))
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, TYPE_MISMATCH_ERR));
                            return;
                        }
                    }
                    FileEntry entry = FileEntry.GetEntry(path);
                    if (entry != null)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, entry));
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NOT_FOUND_ERR));
                    }
                }
            }
            catch (Exception ex)
            {
                if (!this.HandleException(ex))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, NO_MODIFICATION_ALLOWED_ERR));
                }
            }
        }

        private static string AddSlashToDirectory(string dirPath)
        {
            if (dirPath.EndsWith("/"))
            {
                return dirPath;
            }
            else
            {
                return dirPath + "/";
            }
        }

        /// <summary>
        /// Returns file content in a form of base64 string
        /// </summary>
        /// <param name="stream">File stream</param>
        /// <returns>Base64 representation of the file</returns>
        private string GetFileContent(Stream stream)
        {
            int streamLength = (int)stream.Length;
            byte[] fileData = new byte[streamLength + 1];
            stream.Read(fileData, 0, streamLength);
            stream.Close();
            return Convert.ToBase64String(fileData);
        }

        #endregion

    }
}
