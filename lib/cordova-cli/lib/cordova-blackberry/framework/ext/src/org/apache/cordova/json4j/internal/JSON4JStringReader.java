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
import java.io.Reader;

public class JSON4JStringReader extends Reader {

    private char[] _buf = null;
    private int _mark = 0;
    private int maxLength = 0;

    public JSON4JStringReader(String str) {
        _buf = str.toCharArray();
        maxLength = str.length();
        _mark = 0;
    }

    public void close() throws IOException {
        return;
    }

    public int read(char[] cbuf, int off, int len) throws IOException {
        if (_mark == (maxLength))
            return -1;

        int read = 0;
        for (int x=0; x<len; x++) {
            cbuf[x+off] = _buf[_mark];
            read++;
            _mark++;
            if (_mark == (maxLength))
                return read;
        }
        return read;
    }
}
