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

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Provides extra functionality to support different audio formats.
    /// </summary>
    public static class AudioFormatsHelper
    {
        #region Wav
        /// <summary>
        /// Adds wav file format header to the stream
        /// https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
        /// </summary>
        /// <param name="stream">The stream</param>
        /// <param name="sampleRate">Sample Rate</param>
        public static void InitializeWavStream(this Stream stream, int sampleRate)
        {
            #region args checking

            if (stream == null) 
            {
                throw new ArgumentNullException("stream can't be null or empty");
            }

            #endregion

            int numBits = 16;
            int numBytes = numBits / 8;

            stream.Write(System.Text.Encoding.UTF8.GetBytes("RIFF"), 0, 4);
            stream.Write(BitConverter.GetBytes(0), 0, 4);
            stream.Write(System.Text.Encoding.UTF8.GetBytes("WAVE"), 0, 4);
            stream.Write(System.Text.Encoding.UTF8.GetBytes("fmt "), 0, 4);
            stream.Write(BitConverter.GetBytes(16), 0, 4);
            stream.Write(BitConverter.GetBytes((short)1), 0, 2);
            stream.Write(BitConverter.GetBytes((short)1), 0, 2);
            stream.Write(BitConverter.GetBytes(sampleRate), 0, 4);
            stream.Write(BitConverter.GetBytes(sampleRate * numBytes), 0, 4);
            stream.Write(BitConverter.GetBytes((short)(numBytes)), 0, 2);
            stream.Write(BitConverter.GetBytes((short)(numBits)), 0, 2);
            stream.Write(System.Text.Encoding.UTF8.GetBytes("data"), 0, 4);
            stream.Write(BitConverter.GetBytes(0), 0, 4);
        }

        /// <summary>
        /// Updates wav file format header
        /// https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
        /// </summary>
        /// <param name="stream">Wav stream</param>
        public static void UpdateWavStream(this Stream stream)
        {
            #region args checking

            if (stream == null)
            {
                throw new ArgumentNullException("stream can't be null or empty");
            }

            #endregion

            var position = stream.Position;

            stream.Seek(4, SeekOrigin.Begin);
            stream.Write(BitConverter.GetBytes((int)stream.Length - 8), 0, 4);
            stream.Seek(40, SeekOrigin.Begin);
            stream.Write(BitConverter.GetBytes((int)stream.Length - 44), 0, 4);
            stream.Seek(position, SeekOrigin.Begin);
        }

        #endregion
    }
}
