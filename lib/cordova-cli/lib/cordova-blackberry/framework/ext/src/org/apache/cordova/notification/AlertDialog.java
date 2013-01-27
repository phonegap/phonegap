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

import net.rim.device.api.ui.Field;
import net.rim.device.api.ui.FieldChangeListener;
import net.rim.device.api.ui.component.ButtonField;
import net.rim.device.api.ui.component.LabelField;
import net.rim.device.api.ui.component.SeparatorField;
import net.rim.device.api.ui.container.PopupScreen;
import net.rim.device.api.ui.container.VerticalFieldManager;

public final class AlertDialog extends PopupScreen implements FieldChangeListener {

    private ButtonField button;

    /**
     * Open a custom alert dialog, with a customizable title and button text.
     *
     * @param {String} message Message to print in the body of the alert
     * @param {String} title Title of the alert dialog (default: 'Alert')
     * @param {String} buttonLabel Label of the close button (default: 'OK')
     */
    public AlertDialog(String message, String title, String buttonLabel) {

        super(new VerticalFieldManager());

        // title
        add(new LabelField(title));

        // separator
        add(new SeparatorField(SeparatorField.LINE_HORIZONTAL));

        // message
        add(new SpacerField(0, 20));
        add(new LabelField(message, FIELD_HCENTER | FIELD_VCENTER));
        add(new SpacerField(0, 20));

        // button
        button = new ButtonField(buttonLabel, ButtonField.CONSUME_CLICK | FIELD_HCENTER);
        button.setChangeListener(this);
        add(button);
    }

    public void fieldChanged(Field field, int context) {
        if (button == field) {
            close();
        }
    }
}
