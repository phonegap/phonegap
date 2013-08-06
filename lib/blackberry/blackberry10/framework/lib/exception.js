/*
 *  Copyright 2012 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {

    types: {
        Application: "Application",
        ArgumentLength: "ArgumentLength",
        ArgumentType: "ArgumentType",
        Argument: "Argument",
        NotificationType: "NotificationType",
        NotificationStateType: "NotificationStateType",
        DomObjectNotFound: "DomObjectNotFound",
        MethodNotImplemented: "MethodNotImplemented",
        InvalidState: "InvalidState",
        ApplicationState: "ApplicationState"
    },

    handle: function handle(exception, reThrow) {
        reThrow = reThrow || false;

        var eMsg = exception.message || "exception caught!",
        msg = eMsg + "\n\n" + (exception.stack || "*no stack provided*") + "\n\n";

        console.error(msg);

        if (reThrow) {
            throw exception;
        }
    },

    raise: function raise(exceptionType, message, customExceptionObject) {
        var obj = customExceptionObject || {
                type: "",
                message: "",

                toString: function () {
                    var result = this.name + ': "' + this.message + '"';

                    if (this.stack) {
                        result += "\n" + this.stack;
                    }
                    return result;
                }
            };

        message = message || "";

        obj.name = exceptionType;
        obj.type = exceptionType;
        // TODO: include the exception objects original message if exists
        obj.message = message;

        throw obj;
    }
};
