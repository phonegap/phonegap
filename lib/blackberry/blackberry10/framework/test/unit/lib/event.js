/*
 * Copyright 2010-2011 Research In Motion Limited.
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
var libRoot = __dirname + "/../../../lib/";

describe("lib/event", function () {
    var event = require(libRoot + "event"),
        webview = require(libRoot + "webview"),
        mockedWebview;

    beforeEach(function () {
        spyOn(webview, "executeJavascript");
        mockedWebview = {
            executeJavaScript: jasmine.createSpy(),
            id: (new Date()).getTime()
        };
    });

    describe("trigger", function () {


        it("will trigger on the content webview when no webview is registered (for backwards compatability)", function () {
            event.trigger("foo", {"id": 123});
            expect(mockedWebview.executeJavaScript).not.toHaveBeenCalled();
            expect(webview.executeJavascript).toHaveBeenCalled();
        });

        it("can invoke the webview execute javascript", function () {
            var data = {"id": 123};
            event.add({event: "foo", context: {addEventListener: jasmine.createSpy()}}, mockedWebview);
            event.trigger("foo", data);
            expect(mockedWebview.executeJavaScript).toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([data]))) + "')");
            expect(webview.executeJavascript).not.toHaveBeenCalled();
            this.after(function () {
                event.remove({event: "foo", context: {removeEventListener: jasmine.createSpy()}}, mockedWebview);
            });
        });

        it("sends multiple arguments passed in across as a JSONified array", function () {
            var args = [{"id": 123, "foo": "hello world", list: [1, 2, 3]}, "Grrrrrrr", "Arrrrg"];
            event.add({event: "foo", context: {addEventListener: jasmine.createSpy()}}, mockedWebview);
            event.trigger.apply(null, ["foo"].concat(args));
            expect(mockedWebview.executeJavaScript).toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify(args))) + "')");
            expect(webview.executeJavascript).not.toHaveBeenCalled();
            this.after(function () {
                event.remove({event: "foo", context: {removeEventListener: jasmine.createSpy()}}, mockedWebview);
            });
        });

        it("invokes on all webviews that have registered, but not those removed", function () {
            var mockedWebview2 = {
                    executeJavaScript: jasmine.createSpy(),
                    id: mockedWebview.id - 42
                },
                mockedWebview3 = {
                    executeJavaScript: jasmine.createSpy(),
                    id: mockedWebview.id + 42
                },
                mockedWebview4 = {
                    executeJavaScript: jasmine.createSpy(),
                    id: mockedWebview.id * 42
                };
            event.add({event: "foo", context: {addEventListener: jasmine.createSpy()}}, mockedWebview);
            event.add({event: "foo", context: {addEventListener: jasmine.createSpy()}}, mockedWebview2);
            event.add({event: "foo", context: {addEventListener: jasmine.createSpy()}}, mockedWebview3);
            event.trigger("foo", {"id": 123});
            expect(mockedWebview.executeJavaScript).toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([{"id": 123}]))) + "')");
            expect(mockedWebview2.executeJavaScript).toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([{"id": 123}]))) + "')");
            expect(mockedWebview3.executeJavaScript).toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([{"id": 123}]))) + "')");
            expect(mockedWebview4.executeJavaScript).not.toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([{"id": 123}]))) + "')");
            expect(webview.executeJavascript).not.toHaveBeenCalled();


            event.remove({event: "foo", context: {removeEventListener: jasmine.createSpy()}}, mockedWebview3);
            mockedWebview.executeJavaScript.reset();
            mockedWebview2.executeJavaScript.reset();
            mockedWebview3.executeJavaScript.reset();
            mockedWebview4.executeJavaScript.reset();
            event.trigger("foo", {"id": 123});
            expect(mockedWebview.executeJavaScript).toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([{"id": 123}]))) + "')");
            expect(mockedWebview2.executeJavaScript).toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([{"id": 123}]))) + "')");
            expect(mockedWebview3.executeJavaScript).not.toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([{"id": 123}]))) + "')");
            expect(mockedWebview4.executeJavaScript).not.toHaveBeenCalledWith("webworks.event.trigger('foo', '" + escape(encodeURIComponent(JSON.stringify([{"id": 123}]))) + "')");
            expect(webview.executeJavascript).not.toHaveBeenCalled();
            this.after(function () {
                event.remove({event: "foo", context: {removeEventListener: jasmine.createSpy()}}, mockedWebview);
                event.remove({event: "foo", context: {removeEventListener: jasmine.createSpy()}}, mockedWebview2);
            });
        });

    });

    describe("add/remove would invoke action context", function () {
        var action = {
                context: {
                    addEventListener: jasmine.createSpy(),
                    removeEventListener: jasmine.createSpy()
                },
                event: "HELLO",
                trigger: function () {}
            };

        beforeEach(function () {
            action.context.addEventListener.reset();
            action.context.removeEventListener.reset();
        });

        it("can invoke action context add listener", function () {
            event.add(action, mockedWebview);
            expect(action.context.addEventListener).toHaveBeenCalledWith(action.event, action.trigger);
        });

        it("will not invoke action context add listener when the action has a once field", function () {
            action.once = true;
            event.add(action, mockedWebview);
            expect(action.context.addEventListener).not.toHaveBeenCalledWith(action.event, action.trigger);
            this.after(function () {
                delete action.once;
            });
        });

        it("can invoke action context remove listener", function () {
            event.remove(action, mockedWebview);
            expect(action.context.removeEventListener).toHaveBeenCalledWith(action.event, action.trigger);
        });
    });
});
