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
using System.Runtime.Serialization;
using System.Threading;
using Microsoft.Devices.Sensors;
using System.Globalization;
using System.Diagnostics;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Captures device motion in the x, y, and z direction.
    /// </summary>
    public class Accelerometer : BaseCommand
    {
        #region AccelerometerOptions class
        /// <summary>
        /// Represents Accelerometer options.
        /// </summary>
        [DataContract]
        public class AccelerometerOptions
        {
            /// <summary>
            /// How often to retrieve the Acceleration in milliseconds
            /// </summary>
            [DataMember(IsRequired = false, Name = "frequency")]
            public int Frequency { get; set; }

            /// <summary>
            /// Watcher id
            /// </summary>
            [DataMember(IsRequired = false, Name = "id")]
            public string Id { get; set; }

            /// <summary>
            /// Creates options object with default parameters
            /// </summary>
            public AccelerometerOptions()
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
                this.Frequency = 10000;
            }
        }

        #endregion

        #region Status codes and Constants

        public const int Stopped = 0;
        public const int Starting = 1;
        public const int Running = 2;
        public const int ErrorFailedToStart = 3;

        public const double gConstant = -9.81;

        #endregion

        #region Static members

        /// <summary>
        /// Status of listener
        /// </summary>
        private static int currentStatus;

        /// <summary>
        /// Accelerometer
        /// </summary>
        private static Microsoft.Devices.Sensors.Accelerometer accelerometer = new Microsoft.Devices.Sensors.Accelerometer();

        private static DateTime StartOfEpoch = new DateTime(1970, 1, 1, 0, 0, 0);

        #endregion

        /// <summary>
        /// Sensor listener event
        /// </summary>        
        private void accelerometer_CurrentValueChanged(object sender, SensorReadingEventArgs<AccelerometerReading> e)
        {
            this.SetStatus(Running);

            PluginResult result = new PluginResult(PluginResult.Status.OK, GetCurrentAccelerationFormatted());
            result.KeepCallback = true;
            DispatchCommandResult(result);
        }

        /// <summary>
        /// Starts listening for acceleration sensor
        /// </summary>
        /// <returns>status of listener</returns>
        public void start(string options)
        {
            if ((currentStatus == Running) || (currentStatus == Starting))
            {
                return;
            }
            try
            {
                lock (accelerometer)
                {
                    accelerometer.CurrentValueChanged += accelerometer_CurrentValueChanged;
                    accelerometer.Start();
                    this.SetStatus(Starting);
                }

                long timeout = 2000;
                while ((currentStatus == Starting) && (timeout > 0))
                {
                    timeout = timeout - 100;
                    Thread.Sleep(100);
                }

                if (currentStatus != Running)
                {
                    this.SetStatus(ErrorFailedToStart);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, ErrorFailedToStart));
                    return;
                }
            }
            catch (Exception)
            {
                this.SetStatus(ErrorFailedToStart);
                DispatchCommandResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, ErrorFailedToStart));
                return;
            }
            PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
            result.KeepCallback = true;
            DispatchCommandResult(result);
        }

        public void stop(string options)
        {
            if (currentStatus == Running)
            {
                lock (accelerometer)
                {
                    accelerometer.CurrentValueChanged -= accelerometer_CurrentValueChanged;
                    accelerometer.Stop();
                    this.SetStatus(Stopped);
                }
            }
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
        }

        /// <summary>
        /// Formats current coordinates into JSON format
        /// </summary>
        /// <returns>Coordinates in JSON format</returns>
        private string GetCurrentAccelerationFormatted()
        {
            // convert to unix timestamp
            // long timestamp = ((accelerometer.CurrentValue.Timestamp.DateTime - StartOfEpoch).Ticks) / 10000;
            // Note: Removed timestamp, to let the JS side create it using (new Date().getTime()) -jm
            // this resolves an issue with inconsistencies between JS dates and Native DateTime 
            string resultCoordinates = String.Format("\"x\":{0},\"y\":{1},\"z\":{2}",
                            (accelerometer.CurrentValue.Acceleration.X * gConstant).ToString("0.00000", CultureInfo.InvariantCulture),
                            (accelerometer.CurrentValue.Acceleration.Y * gConstant).ToString("0.00000", CultureInfo.InvariantCulture),
                            (accelerometer.CurrentValue.Acceleration.Z * gConstant).ToString("0.00000", CultureInfo.InvariantCulture));
            return  "{" + resultCoordinates + "}";
        }

        /// <summary>
        /// Sets current status
        /// </summary>
        /// <param name="status">current status</param>
        private void SetStatus(int status)
        {
            currentStatus = status;
        }
    }
}

