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

/**
 * Tokenizes a stream into JSON tokens.
 */
public class Tokenizer {

    /**
     * The reader from which the JSON string is being read.
     */
    private Reader reader;

    /**
     * The current line position in the JSON string.
     */
    private int     lineNo;

    /**
     * The current column position in the JSON string.
     */
    private int     colNo;

    /**
     * The last character read from the JSON string.
     */
    private int     lastChar;

    /**
     * Whether or not the parser should be spec strict, or allow unquoted strings and comments
     */
    private boolean strict = false;

    /**
     * Constructor.
     * @param reader The reader from which the JSON string is read.  Same as Tokenizer(reader, false);
     *
     * @throws IOException Thrown on IOErrors such as invalid JSON or sudden reader closures.
     */
    public Tokenizer(Reader reader) throws IOException {
        super();

//        Class readerClass= reader.getClass();
        //In-memory readers don't need to be buffered.  Also, skip PushbackReaders
        //because they probably already wrap a buffered stream.  And lastly, anything
        //that extends from a BufferedReader also doesn't need buffering!
//        if (!StringReader.class.isAssignableFrom(readerClass) &&
//            !CharArrayReader.class.isAssignableFrom(readerClass) &&
//            !PushbackReader.class.isAssignableFrom(readerClass) &&
//            !BufferedReader.class.isAssignableFrom(readerClass)) {
//            reader = new BufferedReader(reader);
//        }
        this.reader    = reader;
        this.lineNo    = 0;
        this.colNo     = 0;
        this.lastChar  = '\n';
        readChar();
    }

    /**
     * Constructor.
     * @param reader The reader from which the JSON string is read.
     * @param strict Whether or not the parser should be spec strict, or allow unquoted strings and comments.
     *
     * @throws IOException Thrown on IOErrors such as invalid JSON or sudden reader closures.
     */
    public Tokenizer(Reader reader, boolean strict) throws IOException {
        super();

//        Class readerClass= reader.getClass();
        //In-memory readers don't need to be buffered.  Also, skip PushbackReaders
        //because they probably already wrap a buffered stream.  And lastly, anything
        //that extends from a BufferedReader also doesn't need buffering!
//        if (!StringReader.class.isAssignableFrom(readerClass) &&
//            !CharArrayReader.class.isAssignableFrom(readerClass) &&
//            !PushbackReader.class.isAssignableFrom(readerClass) &&
//            !BufferedReader.class.isAssignableFrom(readerClass)) {
//            reader = new BufferedReader(reader);
//        }
        this.reader    = reader;
        this.lineNo    = 0;
        this.colNo     = 0;
        this.lastChar  = '\n';
        this.strict    = strict;

        readChar();
    }

    /**
     * Method to get the next JSON token from the JSON String
     * @return The next token in the stream, returning Token.TokenEOF when finished.
     *
     * @throws IOException Thrown if unexpected read error occurs or invalid character encountered in JSON string.
     */
    public Token next() throws IOException {

        // skip whitespace, use our own checker, it seems
        // a bit faster than Java's default.
        //while (Character.isWhitespace((char)lastChar)) {
        while (isWhitespace((char)lastChar)) {
            readChar();
        }

        // handle punctuation
        switch (lastChar) {
            case -1:  readChar(); return Token.TokenEOF;
            case '{': readChar(); return Token.TokenBraceL;
            case '}': readChar(); return Token.TokenBraceR;
            case '[': readChar(); return Token.TokenBrackL;
            case ']': readChar(); return Token.TokenBrackR;
            case ':': readChar(); return Token.TokenColon;
            case ',': readChar(); return Token.TokenComma;

            case '"':
            case '\'':
                String stringValue = readString();
                return new Token(stringValue);

            case '-':
            case '.':
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                Object numberValue = readNumber();
                return new Token(numberValue);

            case 'n':
            case 't':
            case 'f':
                String ident = readIdentifier();

                if (ident.equals("null"))  return Token.TokenNull;
                if (ident.equals("true"))  return Token.TokenTrue;
                if (ident.equals("false")) return Token.TokenFalse;

                // Okay, this was some sort of unquoted string, may be okay
                if (!this.strict) {
                    //Unquoted string.  Non-strict mode allows this.  It's still bad input
                    //from a spec perspective, but allowable in non-strict mode.
                    return new Token(ident);
                } else {
                    throw new IOException("Unexpected unquoted string literal: [" + ident + "].  Unquoted strings are not allowed in strict mode");
                }
            case '/':
                if (!this.strict) {
                    // Comment mode and not strict.  Lets just devour the comment.
                    readComment();
                    return next();
                } else {
                    throw new IOException("Unexpected character / encountered " + onLineCol() + ".  Comments are not allowed in strict mode");
                }

            default:
                if (!this.strict && isValidUnquotedChar((char)lastChar)) {
                    // Unquoted string.  Bad form, but ... okay, lets accept it.
                    // some other parsers do.
                    String unquotedStr = readIdentifier();
                    return new Token(unquotedStr);
                } else {
                    if (this.strict) {
                        throw new IOException("Unexpected character '" + (char)lastChar + "' " + onLineCol() + ".  Unquoted strings are not allowed in strict mode.");
                    } else {
                        throw new IOException("Unexpected character '" + (char)lastChar + "' " + onLineCol());
                    }
                }
        }

    }

    /**
     * Method to read out comments in the 'JSON'.  JSON normally should not
     * have comments, but I guess we need to be more permissive to make some Crockford code
     * happy.
     */
    private void readComment() throws IOException {
        readChar();
        if ((char)lastChar == '/') {
            // Okay, // comment,so just read to \n or end of line
            while ((char)lastChar != '\n' && lastChar != -1) {
                readChar();
            }
        } else if ((char)lastChar == '*') {
            // /* comment, so read past it.
            char[] chars = new char[2];
            readChar();
            if (lastChar != -1) {
                chars[0] = (char)lastChar;
            } else {
                return;
            }
            readChar();
            if (lastChar != -1) {
                chars[1] = (char)lastChar;
            } else {
                return;
            }

            while (chars[0] != '*' || chars[1] != '/') {
                readChar();
                if (lastChar != -1) {
                    chars[0] = chars[1];
                    chars[1] = (char)lastChar;

                } else {
                    return;
                }
            }
        }
    }

    /**
     * Method to read a string from the JSON string, converting escapes accordingly.
     * @return The parsed JSON string with all escapes properly converyed.
     *
     * @throws IOException Thrown on unterminated strings, invalid characters, bad escapes, and so on.  Basically, invalid JSON.
     */
    private String readString() throws IOException {
        StringBuffer sb    = new StringBuffer();
        int          delim = lastChar;
        int          l = lineNo;
        int          c = colNo;

        readChar();
        while ((-1 != lastChar) && (delim != lastChar)) {
            StringBuffer digitBuffer;

            if (lastChar != '\\') {
                sb.append((char)lastChar);
                readChar();
                continue;
            }

            readChar();

            switch (lastChar) {
                case 'b':  readChar(); sb.append('\b'); continue;
                case 'f':  readChar(); sb.append('\f'); continue;
                case 'n':  readChar(); sb.append('\n'); continue;
                case 'r':  readChar(); sb.append('\r'); continue;
                case 't':  readChar(); sb.append('\t'); continue;
                case '\'': readChar(); sb.append('\''); continue;
                case '"':  readChar(); sb.append('"');  continue;
                case '\\': readChar(); sb.append('\\'); continue;
                case '/': readChar();  sb.append('/'); continue;

                    // hex constant
                    // unicode constant
                case 'x':
                case 'u':
                    digitBuffer = new StringBuffer();

                    int toRead = 2;
                    if (lastChar == 'u') toRead = 4;

                    for (int i=0; i<toRead; i++) {
                        readChar();
                        if (!isHexDigit(lastChar)) throw new IOException("non-hex digit " + onLineCol());
                        digitBuffer.append((char) lastChar);
                    }
                    readChar();

                    try {
                        int digitValue = Integer.parseInt(digitBuffer.toString(), 16);
                        sb.append((char) digitValue);
                    } catch (NumberFormatException e) {
                        throw new IOException("non-hex digit " + onLineCol());
                    }

                    break;

                    // octal constant
                default:
                    if (!isOctalDigit(lastChar)) throw new IOException("non-hex digit " + onLineCol());

                    digitBuffer = new StringBuffer();
                    digitBuffer.append((char) lastChar);

                    for (int i=0; i<2; i++) {
                        readChar();
                        if (!isOctalDigit(lastChar)) break;

                        digitBuffer.append((char) lastChar);
                    }

                    try {
                        int digitValue = Integer.parseInt(digitBuffer.toString(), 8);
                        sb.append((char) digitValue);
                    } catch (NumberFormatException e) {
                        throw new IOException("non-hex digit " + onLineCol());
                    }
            }
        }

        if (-1 == lastChar) {
            throw new IOException("String not terminated " + onLineCol(l,c));
        }

        readChar();

        return sb.toString();
    }

    /**
     * Method to read a number from the JSON string.
     *
     * (-)(1-9)(0-9)*            : decimal
     * (-)0(0-7)*               : octal
     * (-)0(x|X)(0-9|a-f|A-F)*  : hex
     * [digits][.digits][(E|e)[(+|-)]digits]
     *
     * @returns The number as the wrapper Java Number type.
     *
     * @throws IOException Thrown in invalid numbers or unexpected end of JSON string
     * */
    private Object readNumber() throws IOException {
        StringBuffer sb = new StringBuffer();
        int          l    = lineNo;
        int          c    = colNo;

        boolean isHex = false;

        if (lastChar == '-') {
            sb.append((char)lastChar);
            readChar();
        }
        if (lastChar == '0') {
            sb.append((char)lastChar);
            readChar();
            if (lastChar == 'x' || lastChar == 'X') {
                sb.append((char)lastChar);
                readChar();
                isHex = true;
            }
        }

        if (isHex) {
            while (isDigitChar(lastChar) || isHexDigit(lastChar)) {
                sb.append((char)lastChar);
                readChar();
            }
        }
        else {
            while (isDigitChar(lastChar)) {
                sb.append((char)lastChar);
                readChar();
            }
        }

        // convert it!
        String string = sb.toString();

        try {
            if (-1 != string.indexOf('.')) {
                return Double.valueOf(string);
            }

            String sign = "";
            if (string.startsWith("-")) {
                sign = "-";
                string = string.substring(1);
            }

//            if (isHex) {
//            	Long value = Long.valueOf(sign + string.substring(2),16);
//                if (value.longValue() <= Integer.MAX_VALUE  && (value.longValue() >= Integer.MIN_VALUE)) {
//                	return new Integer(value.intValue());
//                }
//                else {
//                	return value;
//                }
//            }

            if (string.equals("0")) {
                return new Integer(0);
//            } else if (string.startsWith("0") && string.length() > 1) {
//            	Long value = Long.valueOf(sign + string.substring(1),8);
//                if (value.longValue() <= Integer.MAX_VALUE  && (value.longValue() >= Integer.MIN_VALUE)) {
//                	return new Integer(value.intValue());
//                }
//                else {
//                	return value;
//                }
            }

            /**
             * We have to check for the exponential and treat appropriately
             * Exponentials should be treated as Doubles.
             */
            if (string.indexOf("e") != -1 || string.indexOf("E") != -1) {
                return Double.valueOf(sign + string);
            } else {
                Long value = new Long(Long.parseLong(sign+ string, 10));
                //Long value = Long.valueOf(sign + string);
                if (value.longValue() <= Integer.MAX_VALUE  && (value.longValue() >= Integer.MIN_VALUE)) {
                    return new Integer(Integer.parseInt(sign + string, 10));
                }
                else {
                    return value;
                }
            }
           // else return new Integer(0);  //MSN
        } catch (NumberFormatException e) {
            IOException iox = new IOException("Invalid number literal " + onLineCol(l,c));
            //MSNiox.setCause(e);
            throw iox;
        }
    }

    /**
     * Method to indicate if the character read is a HEX digit or not.
     * @param c The character to check for being a HEX digit.
     */
    private boolean isHexDigit(int c) {
        switch (c) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case 'A':
            case 'B':
            case 'C':
            case 'D':
            case 'E':
            case 'F':
            case 'a':
            case 'b':
            case 'c':
            case 'd':
            case 'e':
            case 'f':
                return true;
        }

        return false;
    }

    /**
     * Method to indicate if the character read is an OCTAL digit or not.
     * @param c The character to check for being a OCTAL digit.
     */
    private boolean isOctalDigit(int c) {
        switch (c) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
                return true;
        }

        return false;
    }

    /**
     * Method to indicate if the character read is a digit or not.
     * @param c The character to check for being a digit.
     */
    private boolean isDigitChar(int c) {
        switch (c) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '.':
            case 'e':
            case 'E':
            case 'x':
            case 'X':
            case '+':
            case '-':
                return true;
        }

        return false;
    }

    /**
     * Method to read a partular character string.
     * only really need to handle 'null', 'true', and 'false'
     */
    private String readIdentifier() throws IOException {
        StringBuffer sb = new StringBuffer();

        if (this.strict) {
            while ((-1 != lastChar) && ( (Character.isUpperCase((char)lastChar)) || (Character.isLowerCase((char)lastChar)) ) ){
                sb.append((char)lastChar);
                readChar();
            }
        }
        else {
            while ((-1 != lastChar) && isValidUnquotedChar((char)lastChar)) {
               sb.append((char)lastChar);
               readChar();
           }
        }

        return sb.toString();
    }

    /**
     * Method to read the next character from the string, keeping track of line/column position.
     *
     * @throws IOEXception Thrown when underlying reader throws an error.
     */
    private void readChar() throws IOException {
        if ('\n' == lastChar) {
            this.colNo = 0;
            this.lineNo++;
        }
        lastChar = reader.read();
        if (-1 == lastChar) return ;
        colNo++;
    }

    /**
     * Method to generate a String indicationg the current line and column position in the JSON string.
     */
    private String onLineCol(int line, int col) {
        return "on line " + line + ", column " + col;
    }

    /**
     * Method to generate a String indicationg the current line and column position in the JSON string.
     */
    public String onLineCol() {
        return onLineCol(lineNo,colNo);
    }

    /**
     * High speed test for whitespace!  Faster than the java one (from some testing).
     * @return if the indicated character is whitespace.
     */
    public boolean isWhitespace(char c) {
        switch (c) {
            case 9:  //'unicode: 0009
            case 10: //'unicode: 000A'
            case 11: //'unicode: 000B'
            case 12: //'unicode: 000C'
            case 13: //'unicode: 000D'
            case 28: //'unicode: 001C'
            case 29: //'unicode: 001D'
            case 30: //'unicode: 001E'
            case 31: //'unicode: 001F'
            case ' ': // Space
                //case Character.SPACE_SEPARATOR:
                //case Character.LINE_SEPARATOR:
           //MSN  case Character.PARAGRAPH_SEPARATOR:
                return true;
        }
        return false;
    }

    /**
     * For non strict mode, check if char is valid when not quoted.
     * @param c
     * @return if character is valid unquoted character.
     */
    public boolean isValidUnquotedChar(char c) {

        if ( (Character.isDigit(c)) || (Character.isLowerCase(c)) || (Character.isUpperCase(c)) ) {
            return true;
        }

        switch (c) {
        case '@':
        case '-':
        case '.':
        case '$':
        case '+':
        case '!':
        case '_':
            return true;
        }
        return false;
    }

}
