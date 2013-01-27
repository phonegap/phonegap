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
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.util.Enumeration;
import java.util.Hashtable;

import org.apache.cordova.json4j.internal.JSON4JStringReader;
import org.apache.cordova.json4j.internal.JSON4JStringWriter;
import org.apache.cordova.json4j.internal.NumberUtil;
import org.apache.cordova.json4j.internal.Parser;
import org.apache.cordova.json4j.internal.Serializer;
import org.apache.cordova.json4j.internal.SerializerVerbose;

/**
 * Models a JSON Object.
 *
 * Extension of Hashtable that only allows String keys, and values which are JSON-able (such as a Java Bean).
 * <BR><BR>
 * JSON-able values are: null, and instances of String, Boolean, Number, JSONObject and JSONArray.
 * <BR><BR>
 * Instances of this class are not thread-safe.
 */
public class JSONObject extends Hashtable implements JSONArtifact {

    private static final long serialVersionUID = -3269263069889337298L;

    /**
     * A constant definition reference to Java null.
     * Provided for API compatibility with other JSON parsers.
     */
    public static final Object NULL = new Null();

    /**
     * Return whether the object is a valid value for a property.
     * @param object The object to check for validity as a JSON property value.
     * @return boolean indicating if the provided object is directly convertable to JSON.
     */
    public static boolean isValidObject(Object object) {
        if (null == object) return true;
        return isValidType(object.getClass());
    }

    /**
     * Return whether the class is a valid type of value for a property.
     * @param clazz The class type to check for validity as a JSON object type.
     * @return boolean indicating if the provided class is directly convertable to JSON.
     */
    public static boolean isValidType(Class clazz) {
        if (null == clazz) throw new IllegalArgumentException();

        if (String.class  == clazz) return true;
        if (Boolean.class == clazz) return true;
        if (JSONObject.class.isAssignableFrom(clazz)) return true;
        if (JSONArray.class == clazz) return true;
        if (NumberUtil.isNumber(clazz)) return true;
        if (JSONObject.NULL == clazz) return true;
        if (JSONString.class.isAssignableFrom(clazz)) return true;

        return false;
    }

    /**
     * Create a new instance of this class.
     */
    public JSONObject() {
        super();
    }

    /**
     * Create a new instance of this class taking selected values from the underlying one.
     * @param obj The JSONObject to extract values from.
     * @param keys The keys to take from the JSONObject and apply to this instance.
     * @throws JSONException Thrown if a key is duplicated in the string[] keys
     */
    public JSONObject(JSONObject obj, String[] keys) throws JSONException{
        super();
        if (keys != null && keys.length > 0) {
            for (int i = 0; i < keys.length; i++) {
                if (this.containsKey(keys[i])) {
                    throw new JSONException("Duplicate key: " + keys[i]);
                }
                try {
                    this.put(keys[i], obj.get(keys[i]));
                } catch (Exception ex) {
                    JSONException jex = new JSONException("Error occurred during JSONObject creation");
                    jex.setCause(ex);
                    throw jex;
                }
            }
        }
    }

    /**
     * Create a new instance of this class from the provided JSON object string.
     * Note:  This is the same as new JSONObject(str, false);  Parsing in non-strict mode.
     * @param str The JSON string to parse.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONObject(String str) throws JSONException {
        super();
        JSON4JStringReader reader = new JSON4JStringReader(str);
        (new Parser(reader)).parse(this);
    }

    /**
     * Create a new instance of this class from the provided JSON object string.
     * @param str The JSON string to parse.
     * @param strict Whether or not to parse in 'strict' mode, meaning all strings must be quoted (including identifiers), and comments are not allowed.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONObject(String str, boolean strict) throws JSONException {
        super();
        JSON4JStringReader reader = new JSON4JStringReader(str);
        (new Parser(reader, strict)).parse(this);
    }

    /**
     * Create a new instance of this class from the data provided from the reader.  The reader content must be a JSON object string.
     * Note:  The reader will not be closed, that is left to the caller.
     * Note:  This is the same as new JSONObject(rdr, false);  Parsing in non-strict mode.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONObject(Reader rdr) throws JSONException {
        (new Parser(rdr)).parse(this);
    }

    /**
     * Create a new instance of this class from the data provided from the reader.  The reader content must be a JSON object string.
     * Note:  The reader will not be closed, that is left to the caller.
     * @param rdr The reader from which to read the JSON.
     * @param strict Whether or not to parse in 'strict' mode, meaning all strings must be quoted (including identifiers), and comments are not allowed.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONObject(Reader rdr, boolean strict) throws JSONException {
        (new Parser(rdr, strict)).parse(this);
    }

    /**
     * Create a new instance of this class from the data provided from the input stream.  The stream content must be a JSON object string.
     * Note:  The input stream content is assumed to be UTF-8 encoded.
     * Note:  The InputStream will not be closed, that is left to the caller.
     * Note:  This is the same as new JSONObject(is, false);  Parsing in non-strict mode.
     * @param is The InputStream from which to read the JSON.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONObject (InputStream is) throws JSONException {
        InputStreamReader isr = null;
        if (is != null) {
            try {
                isr = new InputStreamReader(is, "UTF-8");
            } catch (Exception ex) {
                isr = new InputStreamReader(is);
            }
        } else {
            throw new JSONException("InputStream cannot be null");
        }
        (new Parser(isr)).parse(true, this);
    }

    /**
     * Create a new instance of this class from the data provided from the input stream.  The stream content must be a JSON object string.
     * Note:  The input stream content is assumed to be UTF-8 encoded.
     * Note:  The InputStream will not be closed, that is left to the caller.
     * @param is The InputStream from which to read the JSON.
     * @param strict Whether or not to parse in 'strict' mode, meaning all strings must be quoted (including identifiers), and comments are not allowed.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONObject (InputStream is, boolean strict) throws JSONException {
        InputStreamReader isr = null;
        if (is != null) {
            try {
                isr = new InputStreamReader(is, "UTF-8");
            } catch (Exception ex) {
                isr = new InputStreamReader(is);
            }
        } else {
            throw new JSONException("InputStream cannot be null");
        }
        (new Parser(isr, strict)).parse(true, this);
    }

    /**
     * Write this object to the stream as JSON text in UTF-8 encoding.  Same as calling write(os,false);
     * Note that encoding is always written as UTF-8, as per JSON spec.
     * @param os The output stream to write data to.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public OutputStream write(OutputStream os) throws JSONException {
        write(os,false);
        return os;
    }

    /**
     * Convert this object into a stream of JSON text.  Same as calling write(writer,false);
     * Note that encoding is always written as UTF-8, as per JSON spec.
     * @param os The output stream to write data to.
     * @param verbose Whether or not to write the JSON text in a verbose format.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public OutputStream write(OutputStream os, boolean verbose) throws JSONException {
        Writer writer = null;
        try {
            //MSN BUFFERED
            writer = new OutputStreamWriter(os, "UTF-8");
        } catch (UnsupportedEncodingException uex) {
            JSONException jex = new JSONException(uex.toString());
            jex.setCause(uex);
            throw jex;
        }
        write(writer, verbose);
        try {
            writer.flush();
        } catch (Exception ex) {
            JSONException jex = new JSONException("Error during buffer flush");
            jex.setCause(ex);
            throw jex;
        }
        return os;
    }

    /**
     * Write this object to the stream as JSON text in UTF-8 encoding, specifying how many spaces should be used for each indent.
     * @param indentDepth How many spaces to use for each indent level.  Should be one to eight.
     * Less than one means no intending, greater than 8 and it will just use tab.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public OutputStream write(OutputStream os, int indentDepth) throws JSONException {
        Writer writer = null;
        try {
            //MSN BUFFERED
            writer = new OutputStreamWriter(os, "UTF-8");
        } catch (UnsupportedEncodingException uex) {
            JSONException jex = new JSONException(uex.toString());
            jex.setCause(uex);
            throw jex;
        }
        write(writer, indentDepth);
        try {
            writer.flush();
        } catch (Exception ex) {
            JSONException jex = new JSONException("Error during buffer flush");
            jex.setCause(ex);
            throw jex;
        }
        return os;
    }

    /**
     * Write this object to the writer as JSON text. Same as calling write(writer,false);
     * @param writer The writer which to write the JSON text to.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public Writer write(Writer writer) throws JSONException {
        write(writer, false);
        return writer;
    }

    /**
     * Write this object to the writer as JSON text in UTF-8 encoding, specifying whether to use verbose (tab-indented) output or not.
     * @param writer The writer which to write the JSON text to.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public Writer write(Writer writer, boolean verbose) throws JSONException {
        Serializer serializer;

        //Try to avoid double-buffering or buffering in-memory
        //writers.
//        Class writerClass = writer.getClass();
        boolean flushIt = false;
//        if (!StringWriter.class.isAssignableFrom(writerClass) &&
//            !CharArrayWriter.class.isAssignableFrom(writerClass) &&
//            !BufferedWriter.class.isAssignableFrom(writerClass)) {
//            writer = new BufferedWriter(writer);
//            flushIt = true;
//        }

        if (verbose) {
            serializer = new SerializerVerbose(writer);
        } else {
            serializer = new Serializer(writer);
        }

        try {
            serializer.writeObject(this);
        } catch (IOException iox) {
            JSONException jex = new JSONException("Error occurred during input read.");
            jex.setCause(iox);
            throw jex;
        }
        if (flushIt) {
            try {
                writer.flush();
            } catch (Exception ex) {
                JSONException jex = new JSONException("Error during buffer flush");
                jex.setCause(ex);
                throw jex;
            }
        }
        return writer;
    }

    /**
     * Write this object to the writer as JSON text, specifying how many spaces should be used for each indent.
     * This is an alternate indent style to using tabs.
     * @param writer The writer which to write the JSON text to.
     * @param indentDepth How many spaces to use for each indent.  The value should be between one to eight.
     */
    public Writer write(Writer writer, int indentDepth) throws JSONException {
        Serializer serializer;

        if (indentDepth < 1) {
            indentDepth = 0;
        } else if (indentDepth > 8) {
            indentDepth = 9;
        }

        //Try to avoid double-buffering or buffering in-memory
        //writers.
//        Class writerClass = writer.getClass();
        boolean flushIt = false;
//        if (!StringWriter.class.isAssignableFrom(writerClass) &&
//            !CharArrayWriter.class.isAssignableFrom(writerClass) &&
//            !BufferedWriter.class.isAssignableFrom(writerClass)) {
//            writer = new BufferedWriter(writer);
//            flushIt = true;
//        }

        if (indentDepth > 0) {
            serializer = new SerializerVerbose(writer, indentDepth);
        } else {
            serializer = new Serializer(writer);
        }
        try {
            serializer.writeObject(this);
        } catch (IOException iox) {
            JSONException jex = new JSONException("Error occurred during input read.");
            jex.setCause(iox);
            throw jex;
        }
        if (flushIt) {
            try {
                writer.flush();
            } catch (Exception ex) {
                JSONException jex = new JSONException("Error during buffer flush");
                jex.setCause(ex);
                throw jex;
            }
        }
        return writer;
    }

    /**
     * Convert this object into a String of JSON text, specifying how many spaces should be used for each indent.
     * This is an alternate indent style to using tabs.
     * @param indentDepth How many spaces to use for each indent.  The value should be between one to eight.
     * Less than one means no indenting, greater than 8 and it will just use tab.
     *
     * @throws JSONException Thrown on errors during serialization.
     */
    public String write(int indentDepth) throws JSONException {
        Serializer serializer;
        JSON4JStringWriter writer = new JSON4JStringWriter();

        if (indentDepth < 1) {
            indentDepth = 0;
        } else if (indentDepth > 8) {
            indentDepth = 9;
        }

        if (indentDepth > 0) {
            serializer = new SerializerVerbose(writer, indentDepth);
        } else {
            serializer = new Serializer(writer);
        }
        try {
            serializer.writeObject(this).flush();
        } catch (IOException iox) {
            JSONException jex = new JSONException("Error occurred during write.");
            jex.setCause(iox);
            throw jex;
        }
        return writer.toString();
    }

    /**
     * Convert this object into a String of JSON text, specifying whether to use verbose (tab-indented) output or not.
     * @param verbose Whether or not to write in compressed format.
     *
     * @throws JSONException Thrown on errors during serialization.
     */
    public String write(boolean verbose) throws JSONException {
        Serializer serializer;
        JSON4JStringWriter writer = new JSON4JStringWriter();

        if (verbose) {
            serializer = new SerializerVerbose(writer);
        } else {
            serializer = new Serializer(writer);
        }
        try {
            serializer.writeObject(this).flush();
        } catch (IOException iox) {
            JSONException jex = new JSONException("Error occurred during write.");
            jex.setCause(iox);
            throw jex;
        }
        return writer.toString();
    }

    /**
     * Convert this object into a String of JSON text.  Same as write(false);
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public String write() throws JSONException {
        return write(false);
    }

    /**
     * Method to obtain the object value for a key.
     * This string-based method is provided for API compatibility to other JSON models.
     * @param key The key  (attribute) name to obtain the value for.
     * @throws JSONException Thrown if the noted key is not in the map of key/value pairs.
     */
    public Object get(String key) throws JSONException {
        Object val = this.get((Object)key);
        if (val == null) {
            if (!this.containsKey(key)) {
                throw new JSONException("The key [" + key + "] was not in the map");
            }
        }
        return val;
    }

    /**
     * Method to obtain the object value for a key.  If the key is not in the map, null is returned.
     * This string-based method is provided for API compatibility to other JSON models.
     * @param key The key  (attribute) name to obtain the value for.
     */
    public Object opt(String key) {
        return this.get((Object)key);
    }

    /**
     * (non-Javadoc)
     * @see java.util.HashMap#put(java.lang.Object, java.lang.Object)
     * @param key The key to put in the JSONObject
     * @param value The value to put in the JSONObject
     * @param includeSuperclass Boolean indicating that if the object is a JavaBean, include superclass getter properties.
     * @throws JSONException.  Thrown if key is null, not a string, or the value could not be converted.
     */
    public Object put(Object key, Object value, boolean includeSuperclass) throws JSONException{
        if (null == key) throw new JSONException("key must not be null");
        if (!(key instanceof String)) throw new JSONException("key must be a String");
        if (!isValidObject(value)) {
            throw new JSONException("Invalid type of value.  Could not convert type: [" + value.getClass().getName() + "]");
        }
        if (null == value) {
            value = NULL;
        }
        return super.put(key, value);
    }

    /**
     * (non-Javadoc)
     * @see java.util.HashMap#put(java.lang.Object, java.lang.Object)
     * This is the same as calling put(key, value, true);
     */
    public Object put(Object key, Object value) {
        try {
            return put(key, value, true);
        } catch (Exception e) {
            IllegalArgumentException iae = new IllegalArgumentException("Error occurred during JSON conversion");
           //MSN iae.setCause(e);
            throw iae;
        }
    }

    /**
     * Convenience functions, to help map from other JSON parsers.
     */

    /**
     * Similar to default HashMap put, except it returns JSONObject instead of Object.
     * @see java.util.HashMap#put(java.lang.Object, java.lang.Object)
     * @return A reference to this object instance.
     * @throws JSONException.  Thrown if key is null, not a string, or the value could not be converted to JSON.
     */
    public JSONObject put(String key, Object value) throws JSONException{
        this.put((Object)key, value);
        return this;
    }

    /**
     * Method to add an atomic boolean to the JSONObject.
     * param key The key/attribute name to set the boolean at.
     * @param value The boolean value.
     * @throws JSONException.  Thrown if key is null or not a string.
     * @return A reference to this object instance.
     */
    public JSONObject put(String key, boolean value) throws JSONException{
        this.put(key,new Boolean(value));
        return this;
    }

    /**
     * Method to add an atomic double to the JSONObject.
     * param key The key/attribute name to set the double at.
     * @param value The double value.
     * @throws JSONException.  Thrown if key is null or not a string.
     * @return A reference to this object instance.
     */
    public JSONObject put(String key, double value) throws JSONException{
        this.put(key, new Double(value));
        return this;
    }

    /**
     * Method to add an atomic integer to the JSONObject.
     * param key The key/attribute name to set the integer at.
     * @param value The integer value.
     * @throws JSONException.  Thrown if key is null or not a string.
     * @return A reference to this object instance.
     */
    public JSONObject put(String key, int value) throws JSONException{
        this.put(key, new Integer(value));
        return this;
    }

    /**
     * Method to add an atomic short to the JSONObject.
     * param key The key/attribute name to set the integer at.
     * @param value The integer value.
     * @throws JSONException.  Thrown if key is null or not a string.
     * @return A reference to this object instance.
     */
    public JSONObject put(String key, short value) throws JSONException{
        this.put(key, new Short(value));
        return this;
    }

    /**
     * Method to add an atomic long to the JSONObject.
     * @param key The key/attribute name to set the long to.
     * @param value The long value.
     * @throws JSONException.  Thrown if key is null or not a string.
     * @return A reference to this object instance.
     */
    public JSONObject put(String key, long value) throws JSONException{
        this.put(key, new Long(value));
        return this;
    }

    /**
     * Method to add an Object array as a new JSONArray contained in this JSONObject
     * @param key The key/attribute name to set the collection to.
     * @param value The Object array to convert to a JSONArray and store.
     * @throws JSONException Thrown when contents in the Collection cannot be converted to something JSONable.
     * @return A reference to this object instance.
     */
     public JSONObject put(String key, Object[] value) throws JSONException {
         return put (key, new JSONArray(value));
     }

     /**
      * Method to add an Object array as a new JSONArray contained in this JSONObject
      * @param key The key/attribute name to set the collection to.
      * @param value The Object array to convert to a JSONArray and store.
      * @param includeSuperclass For values of the Object array which are JavaBeans and are converted, include superclass getter properties.
      * @throws JSONException Thrown when contents in the Collection cannot be converted to something JSONable.
      * @return A reference to this object instance.
      *
      public JSONObject put(String key, Object[] value, boolean includeSuperclass) throws JSONException {
          return put (key, new JSONArray(value), includeSuperclass);
      } */

    /**
     * Utility method to obtain the specified key as a 'boolean' value
     * Only boolean true, false, and the String true and false will return.  In this case null, the number 0, and empty string should be treated as false.
     * everything else is true.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a boolean instance, or the strings 'true' or 'false'.
     * @return A boolean value (true or false), if the value stored for key is a Boolean, or the strings 'true' or 'false'.
     */
    public boolean getBoolean(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (val instanceof Boolean) {
                return((Boolean)val).booleanValue();
            } else if (NumberUtil.isNumber(val.getClass())) {
                throw new JSONException("Value at key: [" + key + "] was not a boolean or string value of 'true' or 'false'.");
            } else if (String.class.isAssignableFrom(val.getClass())) {
                String str = (String)val;
                if (str.equals("true")) {
                    return true;
                } else if (str.equals("false")) {
                    return false;
                } else {
                    throw new JSONException("The value for key: [" + key + "]: [" + str + "] was not 'true' or 'false'");
                }
            } else {
                throw new JSONException("The value for key: [" + key + "] was not a type that can be converted to boolean");
            }
        } else {
            throw new JSONException("The value for key: [" + key + "] was null");
        }
    }

    /**
     * Utility method to obtain the specified key as a 'boolean' value
     * Only returns true if the value is boolean true or the string 'true'.  All other values return false.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @return A boolean value (true or false), if the value stored for key is a Boolean, or the strings 'true' or 'false'.
     */
    public boolean optBoolean(String key) {
        Object val = this.opt(key);
        if (val != null) {
            if (val instanceof Boolean) {
                return((Boolean)val).booleanValue();
            } else if (NumberUtil.isNumber(val.getClass())) {
                return false;
            } else if (String.class.isAssignableFrom(val.getClass())) {
                String str = (String)val;
                if (str.equals("true")) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Utility method to obtain the specified key as a 'boolean' value
     * Only returns true if the value is boolean true or the string 'true'.  All other values return false.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @param defaultValue The default value to return.
     * @return A boolean value (true or false), if the value stored for key is a Boolean, or the strings 'true' or 'false'.
     */
    public boolean optBoolean(String key, boolean defaultValue) {
        Object val = this.opt(key);
        if (val != null) {
            if (val instanceof Boolean) {
                return((Boolean)val).booleanValue();
            } else if (NumberUtil.isNumber(val.getClass())) {
                return false;
            } else if (String.class.isAssignableFrom(val.getClass())) {
                String str = (String)val;
                if (str.equals("true")) {
                    return true;
                } else if (str.equals("false")) {
                    return false;
                } else {
                    return defaultValue;
                }
            } else {
                return defaultValue;
            }
        } else {
            return defaultValue;
        }
    }

    /**
     * Utility method to obtain the specified key as a 'double' value
     * Only values of Number will be converted to double, all other types will generate an exception
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a Double instance, or cannot be converted to a double.
     * @return A double value if the value stored for key is an instance of Number.
     */
    public double getDouble(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getDouble(val);
            }
            else {
                throw new JSONException("The value for key: [" + key + "] was not a type that can be converted to double");
            }
        } else {
            throw new JSONException("The value for key: [" + key + "] was null.  Number required.");
        }
    }

    /**
     * Utility method to obtain the specified key as a 'double' value
     * Only values of Number will be converted to double.  all other values will return Double.NaN.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @return A double value if the value stored for key is an instance of Number.
     */
    public double optDouble(String key) {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getDouble(val);
            }
        }
        return Double.NaN;
    }

    /**
     * Utility method to obtain the specified key as a 'double' value
     * Only values of Number will be converted to double.  all other values will return Double.NaN.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @param defaultValue The default double value to return in case of NaN/null values in map.
     * @return A double value if the value stored for key is an instance of Number.
     */
    public double optDouble(String key, double defaultValue) {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getDouble(val);
            }
        }
        return defaultValue;
    }

    /**
     * Utility method to obtain the specified key as a 'short' value
     * Only values of Number will be converted to short, all other types will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a Short instance, or cannot be converted to a short.
     * @return A short value if the value stored for key is an instance of Number.
     */
    public short getShort(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getShort(val);
            } else {
                throw new JSONException("The value for key: [" + key + "] was not a type that can be converted to short");
            }
        } else {
            throw new JSONException("The value for key: [" + key + "] was null.  Number required.");
        }
    }

    /**
     * Utility method to obtain the specified key as a 'short' value
     * Only values of Number will be converted to short.  All other types return 0.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @return A short value if the value stored for key is an instance of Number.  0 otherwise.
     */
    public short optShort(String key) {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getShort(val);
            }
        }
        return(short)0;
    }

    /**
     * Utility method to obtain the specified key as a 'short' value
     * Only values of Number will be converted to short.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @param defaultValue The default value to return in the case of null/nonNumber values in the map.
     * @return A short value if the value stored for key is an instance of Number.  0 otherwise.
     */
    public short optShort(String key, short defaultValue) {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getShort(val);
            }
        }
        return defaultValue;
    }

    /**
     * Utility method to obtain the specified key as a 'int' value
     * Only values of Number will be converted to integer, all other types will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a Double instance, or cannot be converted to a double.
     * @return A int value if the value stored for key is an instance of Number.
     */
    public int getInt(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getInt(val);
            } else {
                throw new JSONException("The value for key: [" + key + "] was not a type that can be converted to integer");
            }
        } else {
            throw new JSONException("The value for key: [" + key + "] was null.  Number required.");
        }
    }

    /**
     * Utility method to obtain the specified key as a 'int' value
     * Provided for compatibility to other JSON models.
     * Only values of Number will be converted to integer, all other types will return 0.
     * @param key The key to look up.
     * @return A int value if the value stored for key is an instance of Number.  0 otherwise.
     */
    public int optInt(String key) {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getInt(val);
            }
        }
        return 0;
    }

    /**
     * Utility method to obtain the specified key as a 'int' value
     * Provided for compatibility to other JSON models.
     * Only values of Number will be converted to integer
     * @param key The key to look up.
     * @param defaultValue The default int value to return in case of null/non-number values in the map.
     * @return A int value if the value stored for key is an instance of Number.
     */
    public int optInt(String key, int defaultValue) {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getInt(val);
            }
        }
        return defaultValue;
    }

    /**
     * Utility method to obtain the specified key as a 'long' value
     * Only values of Number will be converted to long, all other types will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a Long instance, or cannot be converted to a long..
     * @return A long value if the value stored for key is an instance of Number.
     */
    public long getLong(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getLong(val);
            } else {
                throw new JSONException("The value for key: [" + key + "] was not a type that can be converted to long");
            }
        } else {
            throw new JSONException("The value for key: [" + key + "] was null.  Number required.");
        }
    }

    /**
     * Utility method to obtain the specified key as a 'long' value
     * Only values of Number will be converted to long.  all other types return 0.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @return A long value if the value stored for key is an instance of Number, 0 otherwise.
     */
    public long optLong(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getLong(val);
            }
        }
        return(long)0;
    }

    /**
     * Utility method to obtain the specified key as a 'long' value
     * Only values of Number will be converted to long.  all other types return 0.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @param defaultValue The default long value to return in case of null/non Number values in the map.
     * @return A long value if the value stored for key is an instance of Number, defaultValue otherwise.
     */
    public long optLong(String key, long defaultValue) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (NumberUtil.isNumber(val.getClass())) {
                return NumberUtil.getLong(val);
            }
        }
        return defaultValue;
    }

    /**
     * Utility method to obtain the specified key as a 'string' value
     * Only values that can be easily converted to string will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is null.
     * @return A string value if the value if the value stored for key is not null.
     */
    public String getString(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            return val.toString();
        } else {
            throw new JSONException("The value for key: [" + key + "] was null.  Object required.");
        }
    }

    /**
     * Utility method to obtain the specified key as a 'string' value
     * Only values that can be easily converted to string will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is null.
     * @return A string value if the value if the value stored for key is not null.
     */
    public String optString(String key) {
        Object val = this.opt(key);
        if (val != null) {
            return val.toString();
        }
        return null;
    }

    /**
     * Utility method to obtain the specified key as a 'string' value
     * Only values that can be easily converted to string will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @param defaultValue The default String value to return in the case of null values in the map.
     * @return A string value if the value if the value stored for key is not null, defaultValue otherwise.
     */
    public String optString(String key, String defaultValue) {
        Object val = this.opt(key);
        if (val != null) {
            return val.toString();
        }
        return defaultValue;
    }

    /**
     * Utility method to obtain the specified key as a JSONObject
     * Only values that are instances of JSONObject will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a JSONObject instance.
     * @return A JSONObject value if the value stored for key is an instance or subclass of JSONObject.
     */
    public JSONObject getJSONObject(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (JSONObject.class.isAssignableFrom(val.getClass())) {
                return(JSONObject)val;
            } else {
                throw new JSONException("The value for key: [" + key + "] was not a JSONObject");
            }
        } else {
            throw new JSONException("The value for key: [" + key + "] was null.  Object required.");
        }
    }

    /**
     * Utility method to obtain the specified key as a JSONObject
     * Only values that are instances of JSONObject will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @return A JSONObject value if the value stored for key is an instance or subclass of JSONObject, null otherwise.
     */
    public JSONObject optJSONObject(String key) {
        Object val = this.opt(key);
        if (val != null) {
            if (JSONObject.class.isAssignableFrom(val.getClass())) {
                return(JSONObject)val;
            }
        }
        return null;
    }

    /**
     * Utility method to obtain the specified key as a JSONObject
     * Only values that are instances of JSONObject will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @param defaultValue The default JSONObject to return in the case of null/non JSONObject values in the map.
     * @return A JSONObject value if the value stored for key is an instance or subclass of JSONObject, defaultValue otherwise.
     */
    public JSONObject optJSONObject(String key, JSONObject defaultValue) {
        Object val = this.opt(key);
        if (val != null) {
            if (JSONObject.class.isAssignableFrom(val.getClass())) {
                return(JSONObject)val;
            }
        }
        return defaultValue;
    }

    /**
     * Utility method to obtain the specified key as a JSONArray
     * Only values that are instances of JSONArray will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a Long instance, or cannot be converted to a long..
     * @return A JSONArray value if the value stored for key is an instance or subclass of JSONArray.
     */
    public JSONArray getJSONArray(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (JSONArray.class.isAssignableFrom(val.getClass())) {
                return(JSONArray)val;
            } else {
                throw new JSONException("The value for key: [" + key + "] was not a JSONObject");
            }
        } else {
            throw new JSONException("The value for key: [" + key + "] was null.  Object required.");
        }
    }

    /**
     * Utility method to obtain the specified key as a JSONArray
     * Only values that are instances of JSONArray will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @return A JSONArray value if the value stored for key is an instance or subclass of JSONArray, null otherwise.
     */
    public JSONArray optJSONArray(String key) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (JSONArray.class.isAssignableFrom(val.getClass())) {
                return(JSONArray)val;
            }
        }
        return null;
    }

    /**
     * Utility method to obtain the specified key as a JSONArray
     * Only values that are instances of JSONArray will be returned.  A null will generate an exception.
     * Provided for compatibility to other JSON models.
     * @param key The key to look up.
     * @param defaultValue The default value to return if the value in the map is null/not a JSONArray.
     * @return A JSONArray value if the value stored for key is an instance or subclass of JSONArray, defaultValue otherwise.
     */
    public JSONArray optJSONArray(String key, JSONArray defaultValue) throws JSONException {
        Object val = this.opt(key);
        if (val != null) {
            if (JSONArray.class.isAssignableFrom(val.getClass())) {
                return(JSONArray)val;
            }
        }
        return defaultValue;
    }

    /**
     * Put a key/value pair into the JSONObject, but only if key/value are both not null, and only if the key is not present already.
     * Provided for compatibility to existing models.
     * @param key The ket to place in the array
     * @param value The value to place in the array
     * @return Reference to the current JSONObject.
     * @throws JSONException - Thrown if the key already exists or if key or value is null
     */
    public JSONObject putOnce(String key, Object value) throws JSONException {
        if (key == null) {
            throw new JSONException("Key cannot be null");
        }
        if (value == null) {
            throw new JSONException("Value cannot be null");
        }
        if (this.containsKey(key)) {
            throw new JSONException("Key [" + key + "] already exists in the map");
        }
        this.put(key,value);
        return this;
    }

    /**
     * Put a key/value pair into the JSONObject, but only if the key and value are non-null.
     * @param key The keey (attribute) name to assign to the value.
     * @param value The value to put into the JSONObject.
     * @return Reference to the current JSONObject.
     * @throws JSONException - if the value is a non-finite number
     */
    public JSONObject putOpt(String key, Object value) throws JSONException {
        if (key == null) {
            throw new JSONException("Key cannot be null");
        }
        if (value == null) {
            throw new JSONException("Value cannot be null");
        }
        this.put(key,value);
        return this;
    }

    /**
     * Method to return the number of keys in this JSONObject.
     * This function merely maps to HashMap.size().  Provided for API compatibility.
     * @return returns the number of keys in the JSONObject.
     */
    public int length() {
        return this.size();
    }

    /**
     * Method to append the 'value' object to the element at entry 'key'.
     * If JSONObject.has(key) returns false, a new array is created and the value is appended to it.
     * If the object as position key is not an array, then a new JSONArray is created
     * and both current and new values are appended to it, then the value of the attribute is set to the new
     * array.  If the current value is already an array, then 'value' is added to it.
     *
     * @param key The key/attribute name to append to.
     * @param value The value to append to it.
     *
     * @throws JSONException Thrown if the value to append is not JSONAble.
     * @return A reference to this object instance.
     */
    public JSONObject append(String key, Object value) throws JSONException {
        JSONArray array = null;
        if (!this.has(key)) {
            array = new JSONArray();
        }
        else {
            Object oldVal = this.get(key);
            array = new JSONArray();
            if (oldVal == null) {
                // Add a null if the key was actually there, but just
                // had value of null.
                array.add(null);
            }
            else  if (JSONArray.class.isAssignableFrom(oldVal.getClass())) {
                array = (JSONArray)oldVal;
            } else {
                array = new JSONArray();
                array.add(oldVal);
            }
        }
        array.add(value);
        return put(key,array);
    }

    /**
     * Produce a JSONArray containing the values of the members of this JSONObject
     * @param names - A JSONArray containing the a list of key strings.  This determines the sequence of values in the result.
     * @return A JSONArray of the values found for the names provided.
     * @throws JSONException - if errors occur during storing the values in a JSONArray
     */
    public JSONArray toJSONArray(JSONArray names) throws JSONException {
        Enumeration itr = names.elements();
        JSONArray array = new JSONArray();
        //MSN WAS IF, SHOULD BE WHILE?
        while (itr != null && itr.hasMoreElements()) {
            array.put(this.get(itr.nextElement()));
        }
        return array;
    }


    /**
     * Method to test if a key exists in the JSONObject.
     * @param key The key to test.
     * @return true if the key is defined in the JSONObject (regardless of value), or false if the key is not in the JSONObject
     */
    public boolean has(String key) {
        if (key != null) {
            return this.containsKey(key);
        }
        return false;
    }

  /**
   * Method to test if a key is mapped to null. This method will also return
   * true if the key has not been put in the JSONObject yet,
   *
   * @param key   The key to test for null.
   * @return true if the key is not in the map or if the value referenced by the
   *         key is null, or if the value is the JSONObject.NULL object.
   */
    public boolean isNull(String key) {
        Object obj = this.opt(key);
        return JSONObject.NULL.equals(obj);
    }

    /**
     * Utility function that returns an iterator of all the keys (attributes) of this JSONObject
     * @return An iterator of all keys in the object.
     *
    public Enumeration keys() {
        return this.keys();

    } */

    /**
     * Utility function that returns a JSONArray of all the names of the keys (attributes) of this JSONObject
     * @return All the keys in the JSONObject as a JSONArray.
     */
    public JSONArray names() {
        Enumeration itr = this.keys();
        if (itr != null) {
            JSONArray array = new JSONArray();
            while (itr.hasMoreElements()) {
                array.add(itr.nextElement());
            }
            return array;
        }
        return null;
    }

    /**
     * Utility function that returns a String[] of all the names of the keys (attributes) of this JSONObject
     * @return All the keys in the JSONObject as a String[].
     */
    public static String[] getNames(JSONObject obj) {
        String[] array = null;
        if (obj != null) {
            if (obj.size() > 0) {
                array = new String[obj.size()];
                int pos = 0;
                Enumeration itr = obj.keys();
                if (itr != null) {
                    while (itr.hasMoreElements()) {
                        array[pos] = (String)itr.nextElement();
                        pos++;
                    }
                }
            }
        }
        return array;
    }

//    /**
//     * Utility function that returns an iterator of all the keys (attributes) of this JSONObject sorted in lexicographic manner (String.compareTo).
//     * @return An iterator of all keys in the object in lexicographic (character code) sorted order.
//     */
//    public Enumeration sortedKeys() {
//        Enumeration itr = this.keys();
//        if (itr != null && itr.hasMoreElements()) {
//            Vector vect = new Vector();
//            while (itr.hasMoreElements()) {
//                vect.addElement(itr.nextElement());
//            }
//            String[] strs = new String[vect.size()];
//            vect.copyInto(strs);
//           // java.util.Arrays.sort(strs);
//            vect.clear();
//            for (int i = 0; i < strs.length; i++) {
//                vect.add(strs[i]);
//            }
//            return vect.iterator();
//        }
//        return null;
//    }

    /**
     * End of convenience methods.
     */

    /**
     * Over-ridden toString() method.  Returns the same value as write(), which is a compact JSON String.
     * If an error occurs in the serialization, the return will be of format: JSON Generation Error: [<some error>]
     * @return A string of JSON text, if possible.
     */
    public String toString() {
        return toString(false);
    }

    /**
     * Verbose capable toString method.
     * If an error occurs in the serialization, the return will be of format: JSON Generation Error: [<some error>]
     * @param verbose Whether or not to tab-indent the output.
     * @return A string of JSON text, if possible.
     */
    public String toString(boolean verbose) {
        String str = null;
        try {
            str = write(verbose);
        } catch (JSONException jex) {
            str = "JSON Generation Error: [" + jex.toString() + "]";
        }
        return str;
    }

    /**
     * Function to return a string of JSON text with specified indention.  Returns the same value as write(indentDepth).
     * If an error occurs in the serialization, a JSONException is thrown.
     * @return A string of JSON text, if possible.
     */
    public String toString(int indentDepth) throws JSONException {
        return write(indentDepth);
    }

    public static String quote(String string) {
        return Serializer.quote(string);
    }

    /**
     * An simple class provided for API compatibility to other JSON models that 'represents'
     * 'null' in an actual object.
     */
    private static class Null implements JSONString {

        /**
         * Equals function that returns true for comparisons to null.
         */
        public boolean equals(Object obj) {
            if (obj == null || obj == this) {
                return true;
            }
            else {
                return false;
            }
        }

        /**
         * Ensure only one Null object.
         */
        protected Object clone() {
            return this;
        }

        /**
         * toString method that just returns 'null' as the string.
         */
        public String toString() {
            return "null";
        }

        /**
         * Method to return a JSON compliant representation of this object.
         * @return a JSON formatted string.
         */
        public String toJSONString() {
            return this.toString();
        }
    }
}
