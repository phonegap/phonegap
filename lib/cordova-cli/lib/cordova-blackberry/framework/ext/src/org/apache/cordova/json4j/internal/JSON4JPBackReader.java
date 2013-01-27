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

public class JSON4JPBackReader extends Reader {

    private Reader _reader = null;

    private int _lastChar = 0;

    public JSON4JPBackReader(Reader reader) {
        _reader = reader;
    }

    public void close() throws IOException {
        _reader.close();
    }

    public void unread(int c) {
    }

    public int read(char[] cbuf, int off, int len) throws IOException {
        cbuf[off] = (char)_lastChar;
        _reader.read(cbuf, off + 1, len -1);
        _lastChar = cbuf[off + len];
        return 0;
    }
}
