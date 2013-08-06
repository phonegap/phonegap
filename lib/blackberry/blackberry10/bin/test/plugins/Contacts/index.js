/*
 * Copyright 2013 Research In Motion Limited.
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

describe("Contacts", function () {
    var _apiDir = __dirname + "/../../../../plugins/Contacts/src/blackberry10/",
        index,
        ContactError = require(_apiDir + "ContactError"),
        ContactFindOptions = require(_apiDir + "ContactFindOptions"),
        result = {
            noResult: jasmine.createSpy("PluginResult.noResult"),
            error: jasmine.createSpy("PluginResult.error"),
            ok: jasmine.createSpy("PluginResult.ok"),
            callbackError: jasmine.createSpy("PluginResult.callbackError"),
            callbackOk: jasmine.createSpy("PluginResult.callbackOk"),
            callbackId: "Contacts12345"
        };

    beforeEach(function () {
        GLOBAL.JNEXT = {
            require: jasmine.createSpy("JNEXT.require").andCallFake(function () {
                return true;
            }),
            createObject: jasmine.createSpy("JNEXT.createObject").andCallFake(function () {
                return 123;
            }),
            invoke: jasmine.createSpy("JNEXT.invoke").andCallFake(function () {
                return JSON.stringify({
                    _success: true,
                    contact: { id: "123" }
                });
            }),
            registerEvents: jasmine.createSpy("JNEXT.regsiterEvents")
        };
        GLOBAL.PluginResult = function () {
            return result;
        };
        index = require(_apiDir + "index");
        GLOBAL.window = {
            parseInt: jasmine.createSpy("window.parseInt"),
            isNaN: jasmine.createSpy("window.isNaN")
        };
    });

    afterEach(function () {
        index = null;
        delete GLOBAL.JNEXT;
        delete GLOBAL.window;
        delete GLOBAL.PluginResult;
    });

    describe("index.search", function () {
        it("correctly parses args to pass down to native (with filter)", function () {
            var findOptions = new ContactFindOptions("test"),
                args = {
                   "0": encodeURIComponent(JSON.stringify(["phoneNumbers", "emails"])),
                   "1": encodeURIComponent(JSON.stringify(findOptions)),
                   "callbackId": encodeURIComponent(JSON.stringify("Contacts12345"))
                },
                jnextArgs = {
                    "_eventId": "Contacts12345",
                    "fields": ["phoneNumbers", "emails"],
                    "options": {
                        "filter": [
                            { "fieldValue": "test" }
                        ]
                    }
            };
            index.search(function () {}, function () {}, args, {});
            expect(JNEXT.invoke).toHaveBeenCalledWith(123, 'find ' + JSON.stringify(jnextArgs));
            expect(result.noResult).toHaveBeenCalledWith(true);
        });

        it("correctly parses args to pass down to native (with no filter)", function () {
            var findOptions = new ContactFindOptions(),
                args = {
                   "0": encodeURIComponent(JSON.stringify(["phoneNumbers", "emails"])),
                   "1": encodeURIComponent(JSON.stringify(findOptions)),
                   "callbackId": encodeURIComponent(JSON.stringify("Contacts12345"))
                },
                jnextArgs = {
                    "_eventId": "Contacts12345",
                    "fields": ["phoneNumbers", "emails"],
                    "options": {
                        "filter": []
                    }
            };
            index.search(function () {}, function () {}, args, {});
            expect(JNEXT.invoke).toHaveBeenCalledWith(123, 'find ' + JSON.stringify(jnextArgs));
            expect(result.noResult).toHaveBeenCalledWith(true);
        });
    });

    describe("index.save", function () {
        it("calls JNEXT save with the correct param if contactId provided", function () {
            var contactProps = {
                    "id": "123"
                },
                args = {
                    "0": encodeURIComponent(JSON.stringify(contactProps)),
                    "callbackId": encodeURIComponent(JSON.stringify("Contacts12345"))
            };

            window.parseInt.andCallFake(function () {
                return 123;
            });
            index.save(function () {}, function () {}, args, {});
            expect(JNEXT.invoke).toHaveBeenCalledWith(123, 'save ' + JSON.stringify({"id": 123, "_eventId": "Contacts12345"}));
            expect(result.noResult).toHaveBeenCalledWith(true);
        });

        it("properly converts birthdays for native", function () {
            var contactProps = {
                    birthday: 1367259069028,
                },
                args = {
                    "0": encodeURIComponent(JSON.stringify(contactProps)),
                    "callbackId": encodeURIComponent(JSON.stringify("Contacts12345"))
                },
                processedArgs = {
                    "birthday": "Mon Apr 29 2013",
                    "_eventId": "Contacts12345"
            };

            index.save(function () {}, function () {}, args, {});
            expect(JNEXT.invoke).toHaveBeenCalledWith(123, 'save ' + JSON.stringify(processedArgs));
            expect(result.noResult).toHaveBeenCalledWith(true);
        });

        it("processes emails contactFeild array", function () {
            var contactProps = {
                    "emails": [
                        { "value": "a@c.com" },
                        { "type" : "home", "value": "a@b.com" }
                    ]
                },
                args = {
                    "0": encodeURIComponent(JSON.stringify(contactProps)),
                    "callbackId": encodeURIComponent(JSON.stringify("Contacts12345"))
                },
                processedArgs = {
                    "emails": [
                        { "type": "home", "value": "a@c.com" },
                        { "type": "home", "value": "a@b.com" },
                    ],
                    "_eventId": "Contacts12345"
            };
            index.save(function () {}, function () {}, args, {});
            expect(JNEXT.invoke).toHaveBeenCalledWith(123, 'save ' + JSON.stringify(processedArgs));
            expect(result.noResult).toHaveBeenCalledWith(true);

        });

    });

    describe("index.remove", function () {
        it("calls JNEXT remove with the correct params for valid contactId", function () {
            var args = {
                "0": encodeURIComponent(JSON.stringify(123)),
                "callbackId": encodeURIComponent(JSON.stringify("Contacts12345"))
            };

            window.parseInt.andCallFake(function () {
                return 123;
            });
            index.remove(function () {}, function () {}, args, {});
            expect(JNEXT.invoke).toHaveBeenCalledWith(123, 'remove ' + JSON.stringify({"contactId": 123, "_eventId": "Contacts12345"}));
            expect(result.noResult).toHaveBeenCalledWith(true);
        });

        it("calls callbackError if invalid ID", function () {
            var args = {
                "0": encodeURIComponent(JSON.stringify("asdfas")),
                "callbackId": encodeURIComponent(JSON.stringify("Contacts12345"))
            };

            window.isNaN.andCallFake(function() {
                return true;
            });
            index.remove(function () {}, function () {}, args, {});
            expect(result.error).toHaveBeenCalledWith(ContactError.UNKNOWN_ERROR);
            expect(result.noResult).toHaveBeenCalledWith(false);
        });
    });
});
