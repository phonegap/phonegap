/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.cordova.json4j.internal;

import java.io.IOException;
import java.io.Writer;

public class JSON4JStringWriter extends Writer {

    public static int BUF_SIZE = 10000;

    private char[] _buffer = null;

    private int _mark = 0;

    public JSON4JStringWriter() {
        _buffer = new char[BUF_SIZE];
        _mark = 0;
    }

    // Resizes an array; doubles up every time.
    public static char[] resizeArray(char[] expandMe) {
        int newSize = expandMe.length * 2;
        char[] newArray = new char[newSize];
        System.arraycopy(expandMe, 0, newArray, 0, expandMe.length);
        return newArray;
    }


    public void close() throws IOException {
        return;
    }

    public void flush() throws IOException {
        return;
    }

    public void write(char[] cbuf, int off, int len) throws IOException {
        if (((len - off) + _mark) >= _buffer.length) {
            // Resize the array first.
            _buffer = JSON4JStringWriter.resizeArray(_buffer);
        }
        for (int x=0; x < len; x++) {
            _buffer[_mark] = cbuf[off+x];
            _mark++;
        }
    }

    public String toString() {
        return new String(_buffer, 0, _mark);
    }
}
