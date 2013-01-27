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
import java.util.Vector;

import org.apache.cordova.json4j.internal.JSON4JStringReader;
import org.apache.cordova.json4j.internal.JSON4JStringWriter;
import org.apache.cordova.json4j.internal.NumberUtil;
import org.apache.cordova.json4j.internal.Parser;
import org.apache.cordova.json4j.internal.Serializer;
import org.apache.cordova.json4j.internal.SerializerVerbose;

/**
 * Extension of ArrayList that only allows values which are JSON-able.
 * See JSONObject for a list of valid values.
 *
 * Instances of this class are not thread-safe.
 */
public class JSONArray extends Vector implements JSONArtifact {

    /**
     * Serial UID for serialization checking.
     */
    private static final long serialVersionUID = 9076798781015779954L;

    /**
     * Create a new instance of this class.
     */
    public JSONArray() {
        super();
    }

    /**
     * Create a new instance of this class with the specified initial capacity.
     * @param initialCapacity The initial size to define the array as.
     */
    public JSONArray(int initialCapacity) {
        super(initialCapacity);
    }

    /**
     * Create a new instance of this class based off the contents of the passed object array.
     * @param elems The strings to add to a new JSONArray
     * @throws JSONException Thrown when objects in the array are not JSONable.
     */
    public JSONArray(Object[] elems) throws JSONException {
        if(elems != null){
            for(int i = 0; i < elems.length; i++){
                this.add(elems[i]);
            }
        }
    }

    /**
     * Create a new instance of this class based off the contents of the passed object array.
     * @param elems The strings to add to a new JSONArray
     * @param includeSuperclass For JavaBeans, include all superclass info.
     * @throws JSONException Thrown when objects in the array are not JSONable.
     */
    public JSONArray(Object[] elems, boolean includeSuperclass) throws JSONException {
        if(elems != null){
            for(int i = 0; i < elems.length; i++){
                this.add(elems[i]);
            }
        }
    }

    /**
     * Create a new instance of this class from the provided JSON object string.
     * Note:  This is the same as calling new JSONArray(str, false);  Parsing in non-strict mode.
     * @param str The JSON array string to parse.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONArray(String str) throws JSONException {
        super();
        JSON4JStringReader reader = new JSON4JStringReader(str);
        (new Parser(reader)).parse(this);
    }

    /**
     * Create a new instance of this class from the provided JSON object string.
     * @param str The JSON array string to parse.
     * @param strict Boolean denoting if the JSON should be parsed n strict mode, meaning unquoted strings and comments are not allowed.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONArray(String str, boolean strict) throws JSONException {
        super();
        JSON4JStringReader reader = new JSON4JStringReader(str);
        (new Parser(reader, strict)).parse(this);
    }

    /**
     * Create a new instance of this class from the data provided from the reader.  The reader content must be a JSON array string.
     * Note:  The reader will not be closed, that is left to the caller.
     * Note:  This is the same as calling new JSONArray(rdr, false);  Parsing in non-strict mode.
     * @param rdr The Reader from which to read the JSON array string to parse.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONArray(Reader rdr) throws JSONException {
        (new Parser(rdr)).parse(this);
    }

    /**
     * Create a new instance of this class from the data provided from the reader.  The reader content must be a JSON array string.
     * Note:  The reader will not be closed, that is left to the caller.
     * @param rdr The Reader from which to read the JSON array string to parse.
     * @param strict Boolean denoting if the JSON should be parsed n strict mode, meaning unquoted strings and comments are not allowed.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONArray(Reader rdr, boolean strict) throws JSONException {
        (new Parser(rdr, strict)).parse(this);
    }

    /**
     * Create a new instance of this class from the data provided from the input stream.  The stream content must be a JSON array string.
     * Note:  The input stream content is assumed to be UTF-8 encoded.
     * Note:  The InputStream will not be closed, that is left to the caller.
     * @param is The InputStream from which to read the JSON array string to parse.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONArray(InputStream is) throws JSONException {
        InputStreamReader isr = null;
        if (is != null) {
            try {
                isr = new InputStreamReader(is, "UTF-8");
            } catch (Exception ex) {
                isr = new InputStreamReader(is);
            }
        } else {
            throw new JSONException("Inputstream cannot be null");
        }
        (new Parser(isr)).parse(true, this);
    }

    /**
     * Create a new instance of this class from the data provided from the input stream.  The stream content must be a JSON array string.
     * Note:  The input stream content is assumed to be UTF-8 encoded.
     * Note:  The InputStream will not be closed, that is left to the caller.
     * @param is The InputStream from which to read the JSON array string to parse.
     * @param strict Boolean denoting if the JSON should be parsed n strict mode, meaning unquoted strings and comments are not allowed.
     * @throws JSONException Thrown when the string passed is null, or malformed JSON..
     */
    public JSONArray(InputStream is, boolean strict) throws JSONException {
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
     * Function to get a JSONArray entry at a specified index.
     * @param index The position in the rray to fetch the object from
     * @throws JSONException Thrown if the index is outside the array bounds.
     */
    public Object getIndex(int index) throws JSONException {
        try{
            return super.elementAt(index);
        }catch (Exception ex) {
            JSONException jex = new JSONException("Error occurred trying to access element at: " + index);
            jex.setCause(ex);
            throw jex;
        }
    }

    /*
     * (non-Javadoc)
     * @see java.util.ArrayList#add(int, java.lang.Object)
     */
    public void add(int index, Object element) {
        if(index > this.size() - 1){
            expandArray(index);
        }
        if (!JSONObject.isValidObject(element)) {
            throw new IllegalArgumentException("Object of type: [" + element.getClass().getName() + "] could not be converted to a JSON representation.");
        }
        super.insertElementAt(element, index);
    }

    /*
     * (non-Javadoc)
     * @see java.util.ArrayList#add(java.lang.Object)
     */
    public boolean add(Object element, boolean includeSuperclass) {
        if (!JSONObject.isValidObject(element)) {
            throw new IllegalArgumentException("Object of type: [" + element.getClass().getName() + "] could not be converted to a JSON representation.");
        }
        super.addElement(element);
        return true;
    }

    /*
     * (non-Javadoc)
     * @see java.util.ArrayList#add(java.lang.Object)
     */
    public boolean add(Object element) {
        return this.add(element, true);
    }

    /*
     * (non-Javadoc)
     * @see java.util.ArrayList#set(int, java.lang.Object)
     */
    public Object set(int index, Object element) {
        if(index > this.size() - 1){
            expandArray(index);
        }
        if (!JSONObject.isValidObject(element)) {
            throw new IllegalArgumentException("Object of type: [" + element.getClass().getName() + "] could not be converted to a JSON representation.");
        }
        Object obj = super.elementAt(index);
        super.setElementAt(element, index);
        return obj;
    }

    /**
     * Internal function to pad-out the array list
     * Added to mimic expansion behavior of other JSON models.
     * @param toIndex Increase the array so that it has up to 'toIndex' as indexable slots.
     */
    private void expandArray(int toIndex){
        int maxIndex = this.size();
        toIndex = toIndex - maxIndex;
        if(toIndex > 0){
            for(int i = 0; i < toIndex; i++){
                super.addElement(null);
            }
        }
    }

    /**************************************************************/
    /* Maps of add to put, for API compatibility to other parsers.*/
    /**************************************************************/

    /**
     * Map of java.util.ArrayList.add(int, java.lang.Object), for compatibility to other JSON parsers.
     * @see java.util.ArrayList#add(int, java.lang.Object)
     * @throws JSONException in the case of index out of bounds, etc.
     * @return A reference to this array instance.
     */
    public JSONArray put(int index, Object element) throws JSONException {
        if (!JSONObject.isValidObject(element)) {
            throw new IllegalArgumentException("Object of type: [" + element.getClass().getName() + "] could not be converted to a JSON representation.");
        }
        try {
            super.insertElementAt(element, index);
        } catch (Exception ex) {
            JSONException jex = new JSONException("Exception occurred while placing element.");
            jex.setCause(ex);
            throw jex;
        }
        return this;
    }

    /**
     * Map of java.util.ArrayList.add(java.lang.Object), for compatibility to other JSON parsers.
     * @see java.util.ArrayList#add(java.lang.Object)
     * @return A reference to this array instance.
     */
    public JSONArray put(Object element) throws JSONException {
        return put(element, true);
    }

    /**
     * Map of java.util.ArrayList.add(java.lang.Object), for compatibility to other JSON parsers.
     * @see java.util.ArrayList#add(java.lang.Object)
     * @return A reference to this array instance.
     */
    public JSONArray put(Object element, boolean includeSuperclass)  throws JSONException {
        if (!JSONObject.isValidObject(element)) {
            throw new IllegalArgumentException("Object of type: [" + element.getClass().getName() + "] could not be converted to a JSON representation.");

        }
        try {
            super.addElement(element);
        } catch (Exception ex) {
            JSONException jex = new JSONException("Exception occurred while placing element.");
            jex.setCause(ex);
            throw jex;
        }
        return this;
    }

    /**
     * Method to place a long into the array.
     * @param value A long
     * @return A reference to this array instance.
     */
    public JSONArray put(long value) {
        this.add(new Long(value));
        return this;
    }

    /**
     * Method to place a long into the array.
     * @param index The position in the array to place the long.
     * @param value A long
     * @return A reference to this array instance.
     */
    public JSONArray put(int index, long value) {
        this.add(index, new Long(value));
        return this;
    }

    /**
     * Method to place a int into the array.
     * @param value An int
     * @return A reference to this array instance.
     */
    public JSONArray put(int value) {
        this.add(new Integer(value));
        return this;
    }

    /**
     * Method to place an int into the array.
     * @param index The position in the array to place the int.
     * @param value An int
     * @return A reference to this array instance.
     */
    public JSONArray put(int index, int value) {
        this.add(index, new Integer(value));
        return this;
    }

    /**
     * Method to place a short into the array.
     * @param value A short
     * @return A reference to this array instance.
     */
    public JSONArray put(short value) {
        this.add(new Short(value));
        return this;
    }

    /**
     * Method to place a short into the array.
     * @param index The position in the array to place the short.
     * @param value A short
     * @return A reference to this array instance.
     */
    public JSONArray put(int index, short value) {
        this.add(index, new Short(value));
        return this;
    }

    /**
     * Method to place a double into the array.
     * @param value A double
     * @return A reference to this array instance.
     */
    public JSONArray put(double value) {
        this.add(new Double(value));
        return this;
    }

    /**
     * Method to place a double into the array.
     * @param index The position in the array to place the double.
     * @param value A double
     * @return A reference to this array instance.
     */
    public JSONArray put(int index, double value) {
        this.add(index, new Double(value));
        return this;
    }

    /**
     * Method to place a int into the array.
     * @param value A boolean
     * @return A reference to this array instance.
     */
    public JSONArray put(boolean value) {
        this.add(new Boolean(value));
        return this;
    }

    /**
     * Method to place a boolean into the array.
     * @param index The position in the array to place the int.
     * @param value A boolean
     * @return A reference to this array instance.
     */
    public JSONArray put(int index, boolean value) {
        this.add(index, new Boolean(value));
        return this;
    }

    /*****************/
    /* End of mapping*/
    /*****************/

    /********************/
    /* Utility functions*/
    /********************/

    /**
     * Function to obtain a value at the specified index as a boolean.
     * @param index The index of the item to retrieve.
     * @return boolean value.
     * @throws JSONException if the index is outside the range or if the type at the position was not Boolean or a string of 'true' or 'false'
     */
    public boolean getBoolean(int index) throws JSONException {
        try {
            Object val = this.elementAt(index);
            if (val != null) {
                if (Boolean.class.isAssignableFrom(val.getClass())) {
                    return((Boolean)val).booleanValue();
                } else if (NumberUtil.isNumber(val.getClass())) {
                    throw new JSONException("Value at index: [" + index + "] was not a boolean or string value of 'true' or 'false'.");
                } else if (String.class.isAssignableFrom(val.getClass())) {
                    String str = (String)val;
                    if (str.equals("true")) {
                        return true;
                    } else if (str.equals("false")) {
                        return false;
                    } else {
                        throw new JSONException("Value at index: [" + index + "] was not a boolean or string value of 'true' or 'false'.");
                    }
                }
            } else {
                throw new JSONException("Value at index: [" + index + "] was null");
            }
        } catch (java.lang.IndexOutOfBoundsException iobe) {
            JSONException jex = new JSONException("The specified index was outside of the array boundries");
            jex.setCause(iobe);
            throw jex;
        }
        return false;
    }

    /**
     * Function to obtain a value at the specified index as a double.
     * @param index The index of the item to retrieve.
     * @return double value.
     * @throws JSONException if the index is outside the range or if the type at the position was not Number.
     */
    public double getDouble(int index) throws JSONException {
        try {
            Object val = this.elementAt(index);
            if (val != null) {
                if (NumberUtil.isNumber(val.getClass())) {
                    return NumberUtil.getDouble(val);
                }
                else {
                    throw new JSONException("Value at index: [" + index + "] was not a number.");
                }
            } else {
                throw new JSONException("Value at index: [" + index + "] was null");
            }

        } catch (java.lang.IndexOutOfBoundsException iobe) {
            JSONException jex = new JSONException("The specified index was outside of the array boundries");
            jex.setCause(iobe);
            throw jex;
        }
    }

    /**
     * Function to obtain a value at the specified index as a long.
     * @param index The index of the item to retrieve.
     * @return long value.
     * @throws JSONException if the index is outside the range or if the type at the position was not Number.
     */
    public long getLong(int index) throws JSONException {
        try {
            Object val = this.elementAt(index);
            if (val != null) {
                if (NumberUtil.isNumber(val.getClass())) {
                    return NumberUtil.getLong(val);
                } else {
                    throw new JSONException("Value at index: [" + index + "] was not a number.");
                }
            } else {
                throw new JSONException("Value at index: [" + index + "] was null");
            }

        } catch (java.lang.IndexOutOfBoundsException iobe) {
            JSONException jex = new JSONException("The specified index was outside of the array boundries");
            jex.setCause(iobe);
            throw jex;
        }
    }

    /**
     * Function to obtain a value at the specified index as an int.
     * @param index The index of the item to retrieve.
     * @return int value.
     * @throws JSONException if the index is outside the range or if the type at the position was not Number.
     */
    public int getInt(int index) throws JSONException {
        try {
            Object val = this.elementAt(index);
            if (val != null) {
                if (NumberUtil.isNumber(val.getClass())) {
                    return NumberUtil.getInt(val);
                }else {
                    throw new JSONException("Value at index: [" + index + "] was not a number.");
                }
            } else {
                throw new JSONException("Value at index: [" + index + "] was null");
            }

        } catch (java.lang.IndexOutOfBoundsException iobe) {
            JSONException jex = new JSONException("The specified index was outside of the array boundries");
            jex.setCause(iobe);
            throw jex;
        }
    }

    /**
     * Function to obtain a value at the specified index as a short.
     * @param index The index of the item to retrieve.
     * @return short value.
     * @throws JSONException if the index is outside the range or if the type at the position was not Number.
     */
    public short getShort(int index) throws JSONException {
        try {
            Object val = this.elementAt(index);
            if (val != null) {
                if (NumberUtil.isNumber(val.getClass())) {
                    return NumberUtil.getShort(val);
                }
                else {
                    throw new JSONException("Value at index: [" + index + "] was not a number.");
                }
            } else {
                throw new JSONException("Value at index: [" + index + "] was null");
            }
        } catch (java.lang.IndexOutOfBoundsException iobe) {
            JSONException jex = new JSONException("The specified index was outside of the array boundries");
            jex.setCause(iobe);
            throw jex;
        }
    }

    /**
     * Function to obtain a value at the specified index as a string.
     * @param index The index of the item to retrieve.
     * @return string value.
     * @throws JSONException if the index is outside the range or if the type at the position was not an object with a toString() function..
     */
    public String getString(int index) throws JSONException {
        try {
            Object val = this.elementAt(index);
            if (val != null) {
                return val.toString();
            } else {
                throw new JSONException("The value at index: [" + index + "] was null.");
            }
        } catch (java.lang.IndexOutOfBoundsException iobe) {
            JSONException jex = new JSONException("The specified index was outside of the array boundries");
            jex.setCause(iobe);
            throw jex;
        }
    }

    /**
     * Utility method to obtain the specified key as a JSONObject
     * Only values that are instances of JSONObject will be returned.  A null will generate an exception.
     * @param index The index to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a JSONObject instance.
     * @return A JSONObject value if the value stored for key is an instance or subclass of JSONObject.
     */
    public JSONObject getJSONObject(int index) throws JSONException {
        try {
            Object val = this.elementAt(index);
            if (val != null) {
                if (JSONObject.class.isAssignableFrom(val.getClass())) {
                    return(JSONObject)val;
                } else {
                    throw new JSONException("The value for index: [" + index + "] was not a JSONObject");
                }
            } else {
                throw new JSONException("The value for index: [" + index + "] was null.  Object required.");
            }
        } catch (java.lang.IndexOutOfBoundsException iobe) {
            JSONException jex = new JSONException("The specified index was outside of the array boundries");
            jex.setCause(iobe);
            throw jex;
        }
    }

    /**
     * Utility method to obtain the specified index as a JSONArray
     * Only values that are instances of JSONArray will be returned.  A null will generate an exception.
     * @param index The index to look up.
     * throws JSONException Thrown when the type returned by get(key) is not a Long instance, or cannot be converted to a long..
     * @return A JSONArray value if the value stored for key is an instance or subclass of JSONArray.
     */
    public JSONArray getJSONArray(int index) throws JSONException {
        try {
            Object val = this.elementAt(index);
            if (val != null) {
                if (JSONArray.class.isAssignableFrom(val.getClass())) {
                    return(JSONArray)val;
                } else {
                    throw new JSONException("The value index key: [" + index + "] was not a JSONObject");
                }
            } else {
                throw new JSONException("The value for index: [" + index + "] was null.  Object required.");
            }
        } catch (java.lang.IndexOutOfBoundsException iobe) {
            JSONException jex = new JSONException("The specified index was outside of the array boundries");
            jex.setCause(iobe);
            throw jex;
        }
    }

    /**
     * Utility function for testing if an element at index 'idx' is null or not.
     * @return boolean indicating if an index is null or not.  Will also return true for indexes outside the size of the array.
     */
    public boolean isNull(int index) {
        try {
            Object obj = this.elementAt(index);
            return JSONObject.NULL.equals(obj);
        } catch (java.lang.IndexOutOfBoundsException iobe) {
            return true;
        }
    }

    /**
     * Utility function that maps ArrayList.size() to length, for compatibility to other JSON parsers.
     * @return The number of elements in this JSONArray.
     */
    public int length() {
        return this.size();
    }

    /***************************/
    /* End of Utility functions*/
    /***************************/

    /**
     * Convert this object into a stream of JSON text.  Same as calling write(os,false);
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
     * @param os The output stream to write data to.  Output stream characters will be serialized as UTF-8.
     * @param verbose Whether or not to write the JSON text in a verbose format.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public OutputStream write(OutputStream os, boolean verbose) throws JSONException {
        Writer writer = null;
        try {
            //MSN reimplement BUFFERED
            writer = new OutputStreamWriter(os, "UTF-8");
        } catch (UnsupportedEncodingException uex) {
            JSONException jex = new JSONException(uex.toString());
            jex.setCause(uex);
            throw jex;
        }
        write(writer, verbose);
        return os;
    }

    /**
     * Convert this object into a String of JSON text, specifying how many spaces should
     * be used for each indent level.  Output stream characters will be serialized as UTF-8.
     * @param indentDepth How many spaces to use for each indent level.  Should be one to eight.
     * Less than one means no intending, greater than 8 and it will just use tab.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public OutputStream write(OutputStream os, int indentDepth) throws JSONException {
        Writer writer = null;
        try {
            //MSN reimplement BUFFERED
            writer = new OutputStreamWriter(os, "UTF-8");
        } catch (UnsupportedEncodingException uex) {
            JSONException jex = new JSONException(uex.toString());
            jex.setCause(uex);
            throw jex;
        }
        write(writer, indentDepth);
        return os;
    }

    /**
     * Convert this object into a stream of JSON text.  Same as calling write(writer,false);
     * @param writer The writer which to write the JSON text to.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public Writer write(Writer writer) throws JSONException {
        write(writer, false);
        return writer;
    }

    /**
     * Convert this object into a stream of JSON text, specifying verbosity.
     * @param writer The writer which to write the JSON text to.
     *
     * @throws JSONException Thrown on IO errors during serialization.
     */
    public Writer write(Writer writer, boolean verbose) throws JSONException {
        Serializer serializer;

        //Try to avoid double-buffering or buffering in-memory
        //writers.
        //Class writerClass = writer.getClass();
        boolean flushIt = false;

       //MSN reimplement BUFFERED
        /*if (!StringWriter.class.isAssignableFrom(writerClass) &&
            !CharArrayWriter.class.isAssignableFrom(writerClass) &&
            !BufferedWriter.class.isAssignableFrom(writerClass)) {
            writer = new BufferedWriter(writer);
            flushIt = true;
        } */

        if (verbose) {
            serializer = new SerializerVerbose(writer);
        } else {
            serializer = new Serializer(writer);
        }

        try {
            serializer.writeArray(this);
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
     * Convert this array into a stream of JSON text, specifying verbosity.
     * @param writer The writer which to write the JSON text to.
     * @param indentDepth How many spaces to use for each indent level.  Should be one to eight.
     *
     * @throws JSONException Thrown on IO errors during serialization.
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
       //MSN reimplement BUFFERED
//        Class writerClass = writer.getClass();
//        if (!StringWriter.class.isAssignableFrom(writerClass) &&
//            !CharArrayWriter.class.isAssignableFrom(writerClass) &&
//            !BufferedWriter.class.isAssignableFrom(writerClass)) {
//            writer = new BufferedWriter(writer);
//        }

        if (indentDepth > 0) {
            serializer = new SerializerVerbose(writer, indentDepth);
        } else {
            serializer = new Serializer(writer);
        }
        try {
            serializer.writeArray(this);
        } catch (IOException iox) {
            JSONException jex = new JSONException("Error occurred during input read.");
            jex.setCause(iox);
            throw jex;
        }
        return writer;
    }

    /**
     * Convert this object into a String of JSON text, specifying verbosity.
     * @param verbose Whether or not to write in compressed for formatted Strings.
     *
     * @throws JSONException Thrown on IO errors during serialization.
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
            serializer.writeArray(this).flush();
        } catch (IOException iox) {
            JSONException jex = new JSONException("Error occurred during input read.");
            jex.setCause(iox);
            throw jex;
        }
        return writer.toString();
    }

    /**
     * Convert this array into a String of JSON text, specifying verbosity.
     * @param indentDepth How many spaces to use for each indent level.  Should be one to eight.
     *
     * @throws JSONException Thrown on IO errors during serialization.
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
            serializer.writeArray(this).flush();
        } catch (IOException iox) {
            JSONException jex = new JSONException("Error occurred during input read.");
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
     * Over-ridden toString() method.  Returns the same value as write(), which is a compact JSON String.
     * If an error occurs in the serialization, the return will be of format: JSON Generation Error: [<some error>]
     */
    public String toString() {
        String str = null;
        try {
            str = write(false);
        } catch (JSONException jex) {
            str = "JSON Generation Error: [" + jex.toString() + "]";
        }
        return str;
    }

    /**
     * Function to return a string of JSON text with specified indention.  Returns the same value as write(indentDepth).
     * If an error occurs in the serialization, the return will be of format: JSON Generation Error: [<some error>]
     * @throws JSONException Thrown if an error occurs during JSON generation.
     */
    public String toString(int indentDepth) throws JSONException {
        return write(indentDepth);
    }

    /**
     * Method to mimic the behavior of the JavaScript array join function
     * @param str The string delimiter to place between joined array elements in the output string.
     * @return A string of all the elements joined together.
     */
    public String join(String str) {
        if (str == null) {
            str = "";
        }
        StringBuffer buf = new StringBuffer();
        for (int i = 0; i < this.size(); i++) {
            if (i > 0) {
                buf.append(str);
            }
            Object obj = this.elementAt(i);
            if (obj == null) {
                buf.append("null");
            } else {
                buf.append(obj.toString());
            }
        }
        return buf.toString();
    }

    /**
     * Methods added for compatibility to other models.
     */

    /**
     * Method to get the object at that position, or null if outside the array range.
     * @param index the array index to get
     * @return - value or null
     */
    public Object opt(int index) {
        try{
            return elementAt(index);
        } catch (Throwable th){
            return null;
        }
    }

    /**
     * Method to get the object at that position, or null if outside the array range.
     * @param index the array index to get
     * @param defaultValue the value to return if index is outside the array.
     * @return - value or defaultValue
     */
    public Object opt(int index, Object defaultValue) {
        try{
            return elementAt(index);
        } catch (Throwable th){
            return defaultValue;
        }
    }

    /**
     * Method to obtain the value at index as an boolean, or 'false' if outside the array.
     * @param index the array index to get
     * @return - value or false
     */
    public boolean optBoolean(int index) {
        try{
            return getBoolean(index);
        } catch (Throwable th){
            return false;
        }
    }

    /**
     * Method to obtain the value at index as an boolean, or 'defaultValue' if outside the array.
     * @param index The array index to get.
     * @param defaultValue the value to return if index is outside the array.
     * @return - value or false
     */
    public boolean optBoolean(int index, boolean defaultValue) {
        try{
            return getBoolean(index);
        } catch (Throwable th){
            return defaultValue;
        }
    }

    /**
     * Method to obtain the value at index as an int, or '0' if outside the array.
     * @param index the array index to get
     * @return - value or 0
     */
    public int optInt(int index) {
        try{
            return getInt(index);
        } catch (Throwable th){
            return 0;
        }
    }

    /**
     * Method to obtain the value at index as an int, or defaultValue if outside the array.
     * @param index the array index to get
     * @param defaultValue the value to return if index is outside the array.
     * @return - value or 0
     */
    public int optInt(int index, int defaultValue) {
        try{
            return getInt(index);
        } catch (Throwable th){
            return defaultValue;
        }
    }

    /**
     * Method to obtain the value at index as a long, or '0' if outside the array.
     * @param index the array index to get
     * @return - value or 0
     */
    public long optLong(int index) {
        try{
            return getLong(index);
        } catch (Throwable th){
            return (long)0;
        }
    }

    /**
     * Method to obtain the value at index as a long, or defaultValue if outside the array.
     * @param index the array index to get
     * @param defaultValue the value to return if index is outside the array.
     v* @return - value or defaultValue
     */
    public long optLong(int index, long defaultValue) {
        try{
            return getLong(index);
        } catch (Throwable th){
            return defaultValue;
        }
    }

    /**
     * Method to obtain the value at index as a short, or '0' if outside the array.
     * @param index the array index to get
     * @return - value or 0
     */
    public short optShort(int index) {
        try{
            return getShort(index);
        } catch (Throwable th){
            return (short)0;
        }
    }

    /**
     * Method to obtain the value at index as a short, or '0' if outside the array.
     * @param index the array index to get
     * @param defaultValue the value to return if index is outside the array.
     * @return - value or defaultValue
     */
    public short optShort(int index, short defaultValue) {
        try{
            return getShort(index);
        } catch (Throwable th){
            return defaultValue;
        }
    }

    /**
     * Method to obtain the value at index as a double, or Double.NaN if outside the array.
     * @param index the array index to get
     * @return - value or Double.NaN
     */
    public double optDouble(int index) {
        try{
            return getDouble(index);
        } catch (Throwable th){
            return Double.NaN;
        }
    }

    /**
     * Method to obtain the value at index as a double, or Double.NaN if outside the array.
     * @param index the array index to get
     * @param defaultValue the value to return if index is outside the array.
     * @return - value or defaultValue
     */
    public double optDouble(int index, double defaultValue) {
        try{
            return getDouble(index);
        } catch (Throwable th){
            return Double.NaN;
        }
    }

    /**
     * Method to obtain the value at index as a String, or null if outside the array.
     * @param index the array index to get
     * @return - value or null
     */
    public String optString(int index) {
        try{
            return getString(index);
        } catch (Exception th){
            return null;
        }
    }

    /**
     * Method to obtain the value at index as a String, or defaultValue if outside the array.
     * @param index the array index to get
     * @param defaultValue the value to return if index is outside the array.
     * @return - value or defaultValue
     */
    public String optString(int index, String defaultValue) {
        try{
            return getString(index);
        } catch (Throwable th){
            return defaultValue;
        }
    }
}
