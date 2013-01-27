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
package org.apache.cordova.notification;

import org.apache.cordova.ui.SpacerField;
import org.apache.cordova.util.StringUtils;

import net.rim.device.api.ui.Field;
import net.rim.device.api.ui.FieldChangeListener;
import net.rim.device.api.ui.component.ButtonField;
import net.rim.device.api.ui.component.LabelField;
import net.rim.device.api.ui.component.SeparatorField;
import net.rim.device.api.ui.container.PopupScreen;
import net.rim.device.api.ui.container.VerticalFieldManager;

/**
 * Creates a dialog box in which the title, message, and button labels are all
 * customizable.
 */
public final class ConfirmDialog extends PopupScreen implements FieldChangeListener {

    private ButtonField[] buttons;              // the button fields
    private int           selectedValue = -1;   // the selected button

    /**
     * Construct a confirmation dialog, with customizable title and button text.
     *
     * @param {String} message Message to print in the body of the alert
     * @param {String} title Title of the alert dialog (default: 'Confirm')
     * @param {String} buttonLabels Labels of the buttons (default: 'OK,Cancel')
     */
    public ConfirmDialog(String message, String title, String buttonLabels) {
        super(new VerticalFieldManager());

        // title
        add(new LabelField(title));

        // separator
        add(new SeparatorField(SeparatorField.LINE_HORIZONTAL));

        // message
        add(new SpacerField(0, 20));
        add(new LabelField(message, FIELD_HCENTER | FIELD_VCENTER));
        add(new SpacerField(0, 20));

        // parse the button labels
        String[] labels = StringUtils.split(buttonLabels, ",");
        buttons = new ButtonField[labels.length];

        // add buttons
        for (int i = 0; i < labels.length; i++) {
            buttons[i] = new ButtonField(labels[i], ButtonField.CONSUME_CLICK | FIELD_HCENTER);
            buttons[i].setChangeListener(this);
            add(new SpacerField(0, 5));
            add(buttons[i]);
        }
    }

    /**
     * Returns the index of the button pressed.
     *
     * @return The index of the button pressed (0,1,2...).
     */
    public int getSelectedValue() {
        return this.selectedValue;
    }

    /**
     * Invoked when a button is pressed.
     */
    public void fieldChanged(Field field, int context) {

        // figure out which button was pressed
        for (int i = 0; i < buttons.length; i++) {
            if (buttons[i] == field) {
                this.selectedValue = i;
                break;
            }
        }

        // close the dialog
        close();
    }
}
