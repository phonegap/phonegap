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

/**
 * Class representing a JSON token.
 */
public class Token {

    static final public Token TokenEOF    = new Token();
    static final public Token TokenBraceL = new Token();
    static final public Token TokenBraceR = new Token();
    static final public Token TokenBrackL = new Token();
    static final public Token TokenBrackR = new Token();
    static final public Token TokenColon  = new Token();
    static final public Token TokenComma  = new Token();
    static final public Token TokenTrue   = new Token();
    static final public Token TokenFalse  = new Token();
    static final public Token TokenNull   = new Token();

    private String  valueString;
    private Object  valueNumber;
    private boolean  isConstant;

    /**
     * Constructor
     */
    public Token() {
        super();
    }

    /**
     * Constructor
     * @param value The value of the token as a string
     */
    public Token(String value) {
        super();
        valueString = value;
    }

    /**
     * Constructor
     * @param value The value of the token as a number
     */
    public Token(Object value) {
        super();

        valueNumber = value;
    }

    /**
     * Method to obtain the string value of this token
     */
    public String getString() {
        return valueString;
    }

    /**
     * Method to obtain the number value of this token
     */
    public Object getNumber() {
        return valueNumber;
    }

    /**
     * Method to indicate if this token is string based or not.
     */
    public boolean isString() {
        return (null != valueString) && !isConstant;
    }

    /**
     * Method to indicate if this token is number based or not.
     */
    public boolean isNumber() {
        return null != valueNumber;
    }

    /**
     * Method to convert the token to a string representation.
     */
    public String toString() {
        if (this == TokenEOF)    return "Token: EOF";
        if (this == TokenBraceL) return "Token: {";
        if (this == TokenBraceR) return "Token: }";
        if (this == TokenBrackL) return "Token: [";
        if (this == TokenBrackR) return "Token: ]";
        if (this == TokenColon)  return "Token: :";
        if (this == TokenComma)  return "Token: ,";
        if (this == TokenTrue)   return "Token: true";
        if (this == TokenFalse)  return "Token: false";
        if (this == TokenNull)   return "Token: null";

        if (this.isNumber()) return "Token: Number - " + getNumber();
        if (this.isString()) return "Token: String - '" + getString() + "'";

        return "Token: unknown.";
    }
}
