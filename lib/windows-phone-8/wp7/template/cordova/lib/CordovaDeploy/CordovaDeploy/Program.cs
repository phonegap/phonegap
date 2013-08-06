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
using Microsoft.SmartDevice.Connectivity;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Xml.XPath;
using System.Xml;
using System.Xml.Linq;


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
            //Console.WriteLine("\nPress ENTER to continue...");
            //Console.Read();
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
            // Get CoreCon WP7 SDK
            DatastoreManager dsmgrObj = new DatastoreManager(1033);
            Platform WP7SDK = dsmgrObj.GetPlatforms().Single(p => p.Name == "Windows Phone 7");
            Collection<Device> devices = WP7SDK.GetDevices();
            for (int index = 0; index < devices.Count; index++)
            {
                Device d = devices[index];
                string info = string.Format("{0} : {1} : {2}", index.ToString(), d.Id, d.Name);
                Log(info);
            }
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
                // Logging of errors is done in ReadAppId
                return;
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


            // Get CoreCon WP7 SDK
            DatastoreManager dsmgrObj = new DatastoreManager(1033);
            Collection<Platform> WP7SDKs = dsmgrObj.GetPlatforms();
            Platform WP7SDK = dsmgrObj.GetPlatforms().Single(p => p.Name == "Windows Phone 7");

            Collection<Device> devices = null;

            devices = WP7SDK.GetDevices();

            //// Get Emulator / Device
            Device WP7Device = devices[deviceIndex];

            if (WP7Device != null)
            {
                RemoteApplication app;
                bool isConnected = WP7Device.IsConnected();

                Debug.WriteLine(WP7Device.ToString());

                if (!isConnected)
                {
                    try
                    {
                        WP7Device.Connect();
                    }
                    catch (Exception ex)
                    {
                        Log("Error: " + ex.Message, true);
                        ReadWait();
                        return;
                    }
                }

                if (WP7Device.IsApplicationInstalled(appID))
                {
                    Log("Uninstalling XAP from " + WP7Device.Name);
                    app = WP7Device.GetApplication(appID);
                    app.Uninstall();
                }

                Log("Installing app on " + WP7Device.Name);
                app = WP7Device.InstallApplication(appID, appID, "NormalApp", iconFilePath, xapFilePath);

                Log("Launching app on " + WP7Device.Name);
                app.Launch();

                ReadWait();
            }
        }
    }
}
