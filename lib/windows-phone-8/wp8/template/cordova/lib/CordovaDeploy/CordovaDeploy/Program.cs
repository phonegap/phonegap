/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License. 
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Xml.XPath;
using System.Xml;
using System.Xml.Linq;
using System.Globalization;
// Windows Phone Emulator Libraries
using Microsoft.SmartDevice.Connectivity;
using Microsoft.SmartDevice.Connectivity.Interface;
using Microsoft.SmartDevice.MultiTargeting.Connectivity;


namespace CordovaDeploy
{

    class DeployTool
    {

        static void Usage()
        {
            Log("Usage: CordovaDeploy [ -devices  BuildOutputPath -d:DeviceIndex ]");
            Log("    -devices : lists the devices and exits");
            Log("    BuildOutputPath : path to the built application, typically Bin/Debug/ or Bin/Release/");
            Log("    -d : index of the device to deploy, default is 0 ");
            Log("examples:");
            Log("  CordovaDeploy -devices");
            Log("  CordovaDeploy Bin/Debug");
            Log("  CordovaDeploy Bin/Release -d:1");
        }

        static void ReadWait()
        {
            // This is used when running in Visual Studio, the Command Window is created at launch, and disappears at the 
            // end of the program run, this let's us see the output before the window is closed.

            /*
            Console.WriteLine("\nPress ENTER to continue...");
            Console.Read();
            */
        }

        static void Log(string msg, bool error = false)
        {
            Debug.WriteLine(msg);
            if (error)
            {
                Console.Error.WriteLine(msg);
            }
            else
            {
                Console.Out.WriteLine(msg);
            }
        }

        static Guid ReadAppId(string root)
        {
            Guid appID = Guid.Empty;
            string manifestFilePath = root + @"\Properties\WMAppManifest.xml";

            if (File.Exists(manifestFilePath))
            {
                XDocument xdoc = XDocument.Load(manifestFilePath);
                var appNode = xdoc.Root.Descendants("App").FirstOrDefault();
                if (appNode != null)
                {
                    string guidStr = appNode.Attribute("ProductID").Value;
                    appID = new Guid(guidStr);
                }
                else
                {
                    Log(string.Format("Unable to find appID, expected to find an App.ProductID property defined in the file {0}", manifestFilePath), true);
                }
            }
            else
            {
                Log(string.Format("Error: the file {0} does not exist", manifestFilePath), true);
            }
            return appID;
        }

        static void ListDevices()
        {
            MultiTargetingConnectivity mtConn = new MultiTargetingConnectivity(CultureInfo.CurrentUICulture.LCID);
            Collection<ConnectableDevice> deviceList = mtConn.GetConnectableDevices();

            for (int index = 0; index < deviceList.Count; index++)
            {
                ConnectableDevice d = deviceList[index];
                string info = string.Format("{0} : {1} : {2}", index.ToString(), d.Id, d.Name);
                Log(info);
            }
        }

        static ConnectableDevice GetDeviceAtIndex(int index)
        {
            MultiTargetingConnectivity mtConn = new MultiTargetingConnectivity(CultureInfo.CurrentUICulture.LCID);
            Collection<ConnectableDevice> deviceList = mtConn.GetConnectableDevices();
            return deviceList[index];
        }

        static void Main(string[] args)
        {
            int deviceIndex = 0;

            string iconFilePath = "";
            string xapFilePath = "";
            Guid appID = Guid.Empty;

            string root = Directory.GetCurrentDirectory();

            if (args.Length < 1)
            {
                Usage();
                ReadWait();
                return;
            }
            else if (args[0] == "-devices")
            {
                ListDevices();
                ReadWait();
                return;
            }
            else if (args.Length > 1 && args[1].StartsWith("-d:"))
            {
                deviceIndex = int.Parse(args[1].Substring(3));
            }


            if (Directory.Exists(args[0]))
            {
                DirectoryInfo info = new DirectoryInfo(args[0]);
                root = info.FullName;
            }

            appID = ReadAppId(root);
            if (appID == Guid.Empty)
            {
                return;    // Logging of errors is done in ReadAppId
            }

            if (File.Exists(root + @"\ApplicationIcon.png"))
            {
                iconFilePath = root + @"\ApplicationIcon.png";
            }
            else
            {
                Log(string.Format("Error: could not find application icon at {0}", root + @"\ApplicationIcon.png"), true);
                ReadWait();
                return;
            }

            try {
                xapFilePath = Directory.GetFiles(root + @"\Bin\Debug", "*.xap").FirstOrDefault();
            } catch (DirectoryNotFoundException e) {
                try {
                    xapFilePath = Directory.GetFiles(root + @"\Bin\Release", "*.xap").FirstOrDefault();
                } catch (DirectoryNotFoundException ex) {
                    Log(string.Format("Error: could not find project build directoy in {0}", root), true);
                    Log("make sure your app has been successfully built before deploying.", true);
                }
            }

            if (string.IsNullOrEmpty(xapFilePath))
            {
                Log(string.Format("Error: could not find application .xap in folder {0}", root), true);
                ReadWait();
                return;
            }

            ConnectableDevice deviceConn = GetDeviceAtIndex(deviceIndex);
            Log("Connecting to device :: " + deviceConn.Id + " : " + deviceConn.Name);
            try
            {
                IDevice device = deviceConn.Connect();
                IRemoteApplication app = null;
                if (device.IsApplicationInstalled(appID))
                {
                    Log("Uninstalling XAP from " + deviceConn.Name);
                    app = device.GetApplication(appID);
                    app.Uninstall();
                }

                Log("Installing app on " + deviceConn.Name);
                app = device.InstallApplication(appID, appID, "NormalApp", iconFilePath, xapFilePath);

                Log("Launching app on " + deviceConn.Name);
                app.Launch();

                // To Stop :
                //app.TerminateRunningInstances();

                device.Disconnect();

                ReadWait();

            }
            catch (Exception ex)
            {
                Log("Error :: " + ex.Message, true);
            }
        }

        // To read and write ISO storage files!! :
        /*
        try
        {
            IRemoteIsolatedStorageFile isoStore = app.GetIsolatedStore();
            remoteIsolatedStorageFile.ReceiveFile("sourcePath", "destPath", true);
        }
        catch (Exception ex) { }
        */

    }
    class Program
    {
        static void Usage()
        {
            Log("Usage: CordovaDeploy [ -devices  BuildOutputPath -d:DeviceIndex ]");
            Log("    -devices : lists the devices and exits");
            Log("    BuildOutputPath : path to the built application, typically Bin/Debug/ or Bin/Release/");
            Log("    -d : index of the device to deploy, default is 0 ");
            Log("examples:");
            Log("  CordovaDeploy -devices");
            Log("  CordovaDeploy Bin/Debug");
            Log("  CordovaDeploy Bin/Release -d:1");
        }

        static void ReadWait()
        {
            // This is used when running in Visual Studio, the Command Window is created at launch, and disappears at the 
            // end of the program run, this let's us see the output before the window is closed.

            /*
            Console.WriteLine("\nPress ENTER to continue...");
            Console.Read();
            */
        }

        static void Log(string msg, bool error = false)
        {
            Debug.WriteLine(msg);
            if (error)
            {
                Console.Error.WriteLine(msg);
            }
            else
            {
                Console.Out.WriteLine(msg);
            }
        }

        static Guid ReadAppId(string root)
        {
            Guid appID = Guid.Empty;
            string manifestFilePath = root + @"\Properties\WMAppManifest.xml";

            if (File.Exists(manifestFilePath))
            {
                XDocument xdoc = XDocument.Load(manifestFilePath);
                var appNode = xdoc.Root.Descendants("App").FirstOrDefault();
                if (appNode != null)
                {
                    string guidStr = appNode.Attribute("ProductID").Value;
                    appID = new Guid(guidStr);
                }
                else
                {
                    Log(string.Format("Unable to find appID, expected to find an App.ProductID property defined in the file {0}", manifestFilePath), true);
                }
            }
            else
            {
                Log(string.Format("Error: the file {0} does not exist", manifestFilePath), true);
            }
            return appID;
        }

        static void ListDevices()
        {
            MultiTargetingConnectivity mtConn = new MultiTargetingConnectivity(CultureInfo.CurrentUICulture.LCID);
            Collection<ConnectableDevice> deviceList = mtConn.GetConnectableDevices();

            for (int index = 0; index < deviceList.Count; index++)
            {
                ConnectableDevice d = deviceList[index];
                string info = string.Format("{0} : {1} : {2}", index.ToString(), d.Id, d.Name);
                Log(info);
            }
        }

        static ConnectableDevice GetDeviceAtIndex(int index)
        {
            MultiTargetingConnectivity mtConn = new MultiTargetingConnectivity(CultureInfo.CurrentUICulture.LCID);
            Collection<ConnectableDevice> deviceList = mtConn.GetConnectableDevices();
            return deviceList[index];
        }

        static void Main(string[] args)
        {
            int deviceIndex = 0;

            string iconFilePath = "";
            string xapFilePath = "";
            Guid appID = Guid.Empty;

            string root = Directory.GetCurrentDirectory();

            if (args.Length < 1)
            {
                Usage();
                ReadWait();
                return;
            }
            else if (args[0] == "-devices")
            {
                ListDevices();
                ReadWait();
                return;
            }
            else if (args.Length > 1 && args[1].StartsWith("-d:"))
            {
                deviceIndex = int.Parse(args[1].Substring(3));
            }


            if (Directory.Exists(args[0]))
            {
                DirectoryInfo info = new DirectoryInfo(args[0]);
                root = info.FullName;
            }

            appID = ReadAppId(root);
            if (appID == Guid.Empty)
            {
                return;    // Logging of errors is done in ReadAppId
            }

            if (File.Exists(root + @"\ApplicationIcon.png"))
            {
                iconFilePath = root + @"\ApplicationIcon.png";
            }
            else
            {
                Log(string.Format("Error: could not find application icon at {0}", root + @"\ApplicationIcon.png"), true);
                ReadWait();
                return;
            }

            xapFilePath = Directory.GetFiles(root + @"\Bin\Debug", "*.xap").FirstOrDefault();
            if (string.IsNullOrEmpty(xapFilePath))
            {
                Log(string.Format("Error: could not find application .xap in folder {0}", root), true);
                ReadWait();
                return;
            }

            ConnectableDevice deviceConn = GetDeviceAtIndex(deviceIndex);
            Log("Connecting to device :: " + deviceConn.Id + " : " + deviceConn.Name);
            try
            {
                IDevice device = deviceConn.Connect();
                IRemoteApplication app = null;
                if (device.IsApplicationInstalled(appID))
                {
                    Log("Uninstalling XAP from " + deviceConn.Name);
                    app = device.GetApplication(appID);
                    app.Uninstall();
                }

                Log("Installing app on " + deviceConn.Name);
                app = device.InstallApplication(appID, appID, "NormalApp", iconFilePath, xapFilePath);

                Log("Launching app on " + deviceConn.Name);
                app.Launch();

                // To Stop :
                //app.TerminateRunningInstances();

                device.Disconnect();

                ReadWait();

            }
            catch (Exception ex)
            {
                Log("Error :: " + ex.Message, true);
            }
        }

        // To read and write ISO storage files!! :
        /*
        try
        {
            IRemoteIsolatedStorageFile isoStore = app.GetIsolatedStore();
            remoteIsolatedStorageFile.ReceiveFile("sourcePath", "destPath", true);
        }
        catch (Exception ex) { }
        */ 
    }
}
