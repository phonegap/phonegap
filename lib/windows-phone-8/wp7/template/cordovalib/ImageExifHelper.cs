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
using System.Diagnostics;
using System.IO;
using System.Windows.Media.Imaging;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class ImageExifOrientation
    {
        public const int Portrait = 1;
        public const int PortraitUpsideDown = 3;
        public const int LandscapeLeft = 6;
        public const int LandscapeRight = 8;
    }

    public class ImageExifHelper
    {

        public static Stream RotateStream(Stream stream, int angle)
        {
            stream.Position = 0;
            if (angle % 90 != 0 || angle < 0)
            {
                throw new ArgumentException();
            }
            if (angle % 360 == 0)
            {
                return stream;
            }

            angle = angle % 360;

            BitmapImage bitmap = new BitmapImage();
            bitmap.SetSource(stream);
            WriteableBitmap wbSource = new WriteableBitmap(bitmap);

            WriteableBitmap wbTarget = null;

            int srcPixelWidth = wbSource.PixelWidth;
            int srcPixelHeight = wbSource.PixelHeight;

            if (angle % 180 == 0)
            {
                wbTarget = new WriteableBitmap(srcPixelWidth, srcPixelHeight);
            }
            else
            {
                wbTarget = new WriteableBitmap(srcPixelHeight, srcPixelWidth);
            }

            int destPixelWidth = wbTarget.PixelWidth;
            int[] srcPxls = wbSource.Pixels;
            int[] destPxls = wbTarget.Pixels;

            // this ugly if/else is to avoid a conditional check for every pixel
            if (angle == 90)
            {
                for (int x = 0; x < srcPixelWidth; x++)
                {
                    for (int y = 0; y < srcPixelHeight; y++)
                    {
                        destPxls[(srcPixelHeight - y - 1) + (x * destPixelWidth)] = srcPxls[x + y * srcPixelWidth];
                    }
                }
            }
            else if (angle == 180)
            {
                for (int x = 0; x < srcPixelWidth; x++)
                {
                    for (int y = 0; y < srcPixelHeight; y++)
                    {
                        destPxls[(srcPixelWidth - x - 1) + (srcPixelHeight - y - 1) * srcPixelWidth] = srcPxls[x + y * srcPixelWidth];
                    }
                }
            }
            else if (angle == 270)
            {
                for (int x = 0; x < srcPixelWidth; x++)
                {
                    for (int y = 0; y < srcPixelHeight; y++)
                    {
                        destPxls[y + (srcPixelWidth - x - 1) * destPixelWidth] = srcPxls[x + y * srcPixelWidth];
                    }
                }
            }

            MemoryStream targetStream = new MemoryStream();
            wbTarget.SaveJpeg(targetStream, destPixelWidth, wbTarget.PixelHeight, 0, 100);
            return targetStream;
        }

        public static int getImageOrientationFromStream(Stream imgStream)
        {

            // 0xFFD8 : jpgHeader
            // 0xFFE1 :
            // 0x???? : length of exif data
            // 0x????, 0x???? : Chars 'E','x','i','f'
            // 0x0000 : 2 empty bytes
            // <== mark beginning of tags SIZE:ID:VALUE
            // 0x???? : 'II' or 'MM' for Intel or Motorola ( always getting II on my WP7 devices ), determines littleEndian-ness
            // 0x002A : marker value
            // 0x???? : offset to the Image File Data

            // XXXX possible space before actual tag data ... we skip to mark + offset

            // 0x???? number of exif tags present

            // make sure we are at the beginning
            imgStream.Seek(0, SeekOrigin.Begin);
            BinaryReader reader = new BinaryReader(imgStream);

            byte[] jpgHdr = reader.ReadBytes(2); // always (0xFFD8)

            byte start = reader.ReadByte(); // 0xFF
            byte index = reader.ReadByte(); // 0xE1

            while (start == 0xFF && index != 0xE1) // This never seems to happen, todo: optimize
            {
                // Get the data length
                ushort dLen = BitConverter.ToUInt16(reader.ReadBytes(2), 0);
                // skip along
                reader.ReadBytes(dLen - 2);
                start = reader.ReadByte();
                index = reader.ReadByte();
            }

            // It's only success if we found the 0xFFE1 marker
            if (start != 0xFF || index != 0xE1)
            {
                //   throw new Exception("Could not find Exif data block");
                Debug.WriteLine("Did not find EXIF data");
                return 0;
            }

            // read 2 byte length of EXIF data
            ushort exifLen = BitConverter.ToUInt16(reader.ReadBytes(2), 0);
            String exif = ""; // build the string
            for (var n = 0; n < 4; n++)
            {
                exif += reader.ReadChar();
            }
            if (exif != "Exif")
            {
                // did not find exif data ...
                Debug.WriteLine("Did not find EXIF data");
                return 0;
            }

            // read 2 empty bytes
            //ushort emptyBytes = BitConverter.ToUInt16(reader.ReadBytes(2), 0);
            reader.ReadBytes(2);

            long headerMark = reader.BaseStream.Position; // where are we now <==

            //bool isLEndian = (reader.ReadChar() + "" + reader.ReadChar()) == "II";
            reader.ReadBytes(2); // 'II' or 'MM', but we don't care

            if (0x002A != BitConverter.ToUInt16(reader.ReadBytes(2), 0))
            {
                Debug.WriteLine("Error in data != 0x002A");
                return 0;
            }

            // Get the offset to the IFD (image file directory)
            ushort imgOffset = BitConverter.ToUInt16(reader.ReadBytes(2), 0);

            imgStream.Position = headerMark + imgOffset;
            ushort tagCount = BitConverter.ToUInt16(reader.ReadBytes(2), 0);
            for (ushort x = 0; x < tagCount; x++)
            {
                // Orientation = 0x112, aka 274
                if (0x112 == BitConverter.ToUInt16(reader.ReadBytes(2), 0))
                {
                    ushort dType = BitConverter.ToUInt16(reader.ReadBytes(2), 0);
                    // don't care ..
                    uint comps = reader.ReadUInt32();
                    byte[] tagData = reader.ReadBytes(4);
                    int orientation = (int)tagData[0];
                    Debug.WriteLine("orientation = " + orientation.ToString());
                    return orientation;
                    // 6 means rotate clockwise 90 deg
                    // 8 means rotate counter-clockwise 90 deg
                    // 1 means all is good
                    // 3 means flip vertical
                }
                // skip to the next item, 12 bytes each
                reader.BaseStream.Seek(10, SeekOrigin.Current);
            }
            return 0;
        }

    }
}
