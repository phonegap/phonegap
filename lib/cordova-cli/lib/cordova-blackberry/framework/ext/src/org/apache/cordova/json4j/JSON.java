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
package org.apache.cordova.json4j;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import org.apache.cordova.json4j.internal.JSON4JPBackReader;

/**
 * Helper class that does generic parsing of a JSON stream and returns the appropriate
 * JSON structure (JSONArray or JSONObject).  Note that it is slightly more efficient to directly
 * parse with the appropriate object than to use this class to do a generalized parse.
 */
public class JSON {

    /**
     * A constant for representing null.
     * In this case, it is just null.
     */
    public static final Object NULL = null;

    /**
     * Parse a Reader of JSON text into a JSONArtifact.
     * @param reader The character reader to read the JSON data from.
     * @param order Boolean flag indicating if the order of the JSON data should be preserved.  This parameter only has an effect if the stream is JSON Object { ... } formatted data.
     * Note:  The provided reader is not closed on completion of read; that is left to the caller.
     * Note:  This is the same as calling parse(reader, order, false);
     *
     * @return Returns an instance of JSONArtifact (JSONObject, OrderedJSONObject, or JSONArray), corrisponding to if the input stream was Object or Array notation.
     *
     * @throws JSONException Thrown on errors during parse.
     * @throws NullPointerException Thrown if reader is null
     */
    public static JSONArtifact parse(Reader reader, boolean order) throws JSONException, NullPointerException {
        return parse(reader,order,false);
    }

    /**
     * Parse a Reader of JSON text into a JSONArtifact.
     * @param reader The character reader to read the JSON data from.
     * @param order Boolean flag indicating if the order of the JSON data should be preserved.  This parameter only has an effect if the stream is JSON Object { ... } formatted data.
     * @param strict Boolean flag to indicate if the content should be parsed in strict mode or not, meaning comments and unquoted strings are not allowed.
     * Note:  The provided reader is not closed on completion of read; that is left to the caller.
     *
     * @return Returns an instance of JSONArtifact (JSONObject, OrderedJSONObject, or JSONArray), corrisponding to if the input stream was Object or Array notation.
     *
     * @throws JSONException Thrown on errors during parse.
     * @throws NullPointerException Thrown if reader is null
     */
    public static JSONArtifact parse(Reader reader, boolean order, boolean strict) throws JSONException, NullPointerException {

        try {
            if (reader != null) {

                JSON4JPBackReader pReader = null;

                //Determine if we should buffer-wrap the reader before passing it on
                //to the appropriate parser.
                //boolean bufferIt = false;

                Class readerClass = reader.getClass();

               /* if (!StringReader.class.isAssignableFrom(readerClass) &&
                    !CharArrayReader.class.isAssignableFrom(readerClass) &&
                    !PushbackReader.class.isAssignableFrom(readerClass) &&
                    !BufferedReader.class.isAssignableFrom(readerClass)) {
                    bufferIt = true;
                } */

                //MSN IMPLEMENT PUSHBACKREADER!!
                if (JSON4JPBackReader.class.isAssignableFrom(readerClass)) {
                    pReader = (JSON4JPBackReader) reader;
                } else {
                    pReader = new JSON4JPBackReader(reader);
                }

                Reader rdr = pReader;
                int ch = pReader.read();
                while (ch != -1) {
                    switch (ch) {
                        case '{':
                            pReader.unread(ch);
                           /* if (bufferIt) {
                                rdr = new BufferedReader(pReader);
                            } */
                            return new JSONObject(rdr,strict);
                        case '[':
                            pReader.unread(ch);
                            /*if (bufferIt) {
                                rdr = new BufferedReader(pReader);
                            } */
                            return new JSONArray(rdr, strict);
                        case ' ':
                        case '\t':
                        case '\f':
                        case '\r':
                        case '\n':
                        case '\b':
                            ch = pReader.read();
                            break;
                        default:
                            throw new JSONException("Unexpected character: [" + (char)ch + "] while scanning JSON String for JSON type.  Invalid JSON.");
                    }
                }
                throw new JSONException("Encountered end of stream before JSON data was read.  Invalid JSON");
            } else {
                throw new NullPointerException("reader cannot be null.");
            }
        } catch (IOException iox) {
            JSONException jex = new JSONException("Error occurred during input read.");
            jex.setCause(iox);
            throw jex;
        }
    }

    /**
     * Parse a Reader of JSON text into a JSONArtifact.
     * This call is the same as JSON.parse(reader, false, false).
     * Note that the provided reader is not closed on completion of read; that is left to the caller.
     * @param reader The character reader to read the JSON data from.
     *
     * @return Returns an instance of JSONArtifact (JSONObject, OrderedJSONObject, or JSONArray), corrisponding to if the input stream was Object or Array notation.
     *
     * @throws JSONException Thrown on errors during parse.
     * @throws NullPointerException Thrown if reader is null
     */
    public static JSONArtifact parse(Reader reader) throws JSONException, NullPointerException {
        return parse(reader,false, false);
    }

    /**
     * Parse a InputStream of JSON text into a JSONArtifact.
     * Note:  The provided InputStream is not closed on completion of read; that is left to the caller.
     * @param is The input stream to read from.  The content is assumed to be UTF-8 encoded and handled as such.
     * @param order Boolean flag indicating if the order of the JSON data should be preserved.  This parameter only has an effect if the stream is JSON Object { ... } formatted data.
     *
     * @return Returns an instance of JSONArtifact (JSONObject or JSONArray), corrisponding to if the input stream was Object or Array notation.
     *
     * @throws JSONException Thrown on errors during parse.
     * @throws NullPointerException Thrown if reader is null
     */
    public static JSONArtifact parse(InputStream is, boolean order) throws JSONException, NullPointerException {
        return parse(is,order, false);
    }

    /**
     * Parse a InputStream of JSON text into a JSONArtifact.
     * Note that the provided InputStream is not closed on completion of read; that is left to the caller.
     * @param is The input stream to read from.  The content is assumed to be UTF-8 encoded and handled as such.
     * @param order Boolean flag indicating if the order of the JSON data should be preserved.  This parameter only has an effect if the stream is JSON Object { ... } formatted data.
     * @param strict Boolean flag to indicate if the content should be parsed in strict mode or not, meaning comments and unquoted strings are not allowed.
     *
     * @return Returns an instance of JSONArtifact (JSONObject or JSONArray), corrisponding to if the input stream was Object or Array notation.
     *
     * @throws JSONException Thrown on errors during parse.
     * @throws NullPointerException Thrown if reader is null
     */
    public static JSONArtifact parse(InputStream is, boolean order, boolean strict) throws JSONException, NullPointerException {
        if (is != null) {
            //BufferedReader reader = null;
            InputStreamReader reader = null;
            try {
                reader = new InputStreamReader(is, "UTF-8");
            } catch (Exception ex) {
                JSONException iox = new JSONException("Could not construct UTF-8 character reader for the InputStream");
                iox.setCause(ex);
                throw iox;
            }
            return parse(reader,order);
        } else {
            throw new NullPointerException("is cannot be null");
        }
    }

    /**
     * Parse an InputStream of JSON text into a JSONArtifact.
     * This call is the same as JSON.parse(is, false, false).
     * Note that the provided InputStream is not closed on completion of read; that is left to the caller.
     * @param is The input stream to read from.  The content is assumed to be UTF-8 encoded and handled as such.
     *
     * @return Returns an instance of JSONArtifact (JSONObject, OrderedJSONObject, or JSONArray), corrisponding to if the input stream was Object or Array notation.
     *
     * @throws JSONException Thrown on errors during parse.
     * @throws NullPointerException Thrown if reader is null
     */
    public static JSONArtifact parse(InputStream is) throws JSONException, NullPointerException {
        return parse(is,false, false);
    }
}
