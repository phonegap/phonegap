// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import org.xml.sax.SAXException;
import java.io.IOException;

public class ApplicationInfo {
    private static void parseAndroidManifest(String path) {
        // System.out.println(path);
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        Document dom;
        try {
            DocumentBuilder db = dbf.newDocumentBuilder();
            dom = db.parse(path);

            // getting package information
            Element manifest = dom.getDocumentElement();
            String pakkage = manifest.getAttribute("package");

            // getting activity name
            String activity = ((Element)dom.getElementsByTagName("activity").item(0)).getAttribute("android:name");
            System.out.println(String.format("%s/.%s", pakkage, activity.replace(".", "")));
        } catch(ParserConfigurationException pce) {
			pce.printStackTrace();
		} catch(SAXException se) {
			se.printStackTrace();
		} catch(IOException ioe) {
			ioe.printStackTrace();
		}
        
    }

    public static void main(String[] args) {
        String path;
        if(args.length > 0) {
            path = args[0];
        } else {
            path = System.getProperty("user.dir") + "/../AndroidManifest.xml";
        }
        parseAndroidManifest(path);
    }
}
