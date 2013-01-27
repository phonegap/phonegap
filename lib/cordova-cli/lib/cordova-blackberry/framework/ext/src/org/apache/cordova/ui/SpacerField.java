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
package org.apache.cordova.ui;

import net.rim.device.api.ui.Field;
import net.rim.device.api.ui.Graphics;

/**
 * Provides an empty spacer field that can be used to provide custom spacing
 * between UI fields within a UI screen.
 */
public class SpacerField extends Field {

    int width;      // spacer width in pixels
    int height;     // space height in pixels

    /**
     * Constructor.
     * @param width Width of the spacer in pixels.
     * @param height Height of the spacer in pixels.
     */
    public SpacerField(int width, int height) {
        super(NON_FOCUSABLE);
        this.width = width;
        this.height = height;
    }

    /**
     * Sets the extent to the custom width and height of this spacer.
     */
    protected void layout(int width, int height) {
        this.setExtent(this.width, this.height);
    }

    /**
     * Paints the field.
     */
    protected void paint(Graphics graphics) {
        // supposed to be empty. don't paint anything.
    }

    /**
     * Returns the custom width of this spacer as the preferred field width.
     */
    public int getPreferredWidth() {
        return this.width;
    }

    /**
     * Returns the custom height of this spacer as the preferred field height.
     */
    public int getPreferredHeight() {
        return this.height;
    }
}
