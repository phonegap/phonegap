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
package org.apache.cordova;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

public class HttpHandler {

    protected Boolean get(String url, String file)
    {
        HttpEntity entity = getHttpEntity(url);
        try {
            writeToDisk(entity, file);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        try {
            entity.consumeContent();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

    private HttpEntity getHttpEntity(String url)
    /**
     * get the http entity at a given url
     */
    {
        HttpEntity entity = null;
        try {
            DefaultHttpClient httpclient = new DefaultHttpClient();
            HttpGet httpget = new HttpGet(url);
            HttpResponse response = httpclient.execute(httpget);
            entity = response.getEntity();
        } catch (Exception e) { e.printStackTrace(); return null; }
        return entity;
    }

    private void writeToDisk(HttpEntity entity, String file) throws IllegalStateException, IOException
    /**
     * writes a HTTP entity to the specified filename and location on disk
     */
    {
        //int i = 0;
        String FilePath = "/sdcard/" + file;
        InputStream in = entity.getContent();
        byte buff[] = new byte[1024];
        FileOutputStream out =
                new FileOutputStream(FilePath);
       do {
            int numread = in.read(buff);
            if (numread <= 0)
                break;
            out.write(buff, 0, numread);
            //i++;
        } while (true);
        out.flush();
        out.close();
    }
}
