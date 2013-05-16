/*
 *
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
 *
*/

describe("Session Storage", function () {
    it("storage.spec.1 should exist", function () {
        expect(window.sessionStorage).toBeDefined();
        expect(typeof window.sessionStorage.length).not.toBe('undefined');
        expect(typeof(window.sessionStorage.key)).toBe('function');
        expect(typeof(window.sessionStorage.getItem)).toBe('function');
        expect(typeof(window.sessionStorage.setItem)).toBe('function');
        expect(typeof(window.sessionStorage.removeItem)).toBe('function');
        expect(typeof(window.sessionStorage.clear)).toBe('function');
    });

    it("storage.spec.2 check length", function () {
        expect(window.sessionStorage.length).toBe(0);
        window.sessionStorage.setItem("key","value");
        expect(window.sessionStorage.length).toBe(1);
        window.sessionStorage.removeItem("key");   
        expect(window.sessionStorage.length).toBe(0);
    });

    it("storage.spec.3 check key", function () {
        expect(window.sessionStorage.key(0)).toBe(null);
        window.sessionStorage.setItem("test","value");
        expect(window.sessionStorage.key(0)).toBe("test");
        window.sessionStorage.removeItem("test");   
        expect(window.sessionStorage.key(0)).toBe(null);
    });

    it("storage.spec.4 check getItem", function() {
        expect(window.sessionStorage.getItem("item")).toBe(null);
        window.sessionStorage.setItem("item","value");
        expect(window.sessionStorage.getItem("item")).toBe("value");
        window.sessionStorage.removeItem("item");   
        expect(window.sessionStorage.getItem("item")).toBe(null);
    });

    it("storage.spec.5 check setItem", function() {
        expect(window.sessionStorage.getItem("item")).toBe(null);
        window.sessionStorage.setItem("item","value");
        expect(window.sessionStorage.getItem("item")).toBe("value");
        window.sessionStorage.setItem("item","newval");
        expect(window.sessionStorage.getItem("item")).toBe("newval");
        window.sessionStorage.removeItem("item");   
        expect(window.sessionStorage.getItem("item")).toBe(null);
    });

    it("storage.spec.6 can remove an item", function () {
        expect(window.sessionStorage.getItem("item")).toBe(null);
        window.sessionStorage.setItem("item","value");
        expect(window.sessionStorage.getItem("item")).toBe("value");
        window.sessionStorage.removeItem("item");   
        expect(window.sessionStorage.getItem("item")).toBe(null);
    });

    it("storage.spec.7 check clear", function() {
        window.sessionStorage.setItem("item1","value");
        window.sessionStorage.setItem("item2","value");
        window.sessionStorage.setItem("item3","value");
        expect(window.sessionStorage.length).toBe(3);
        window.sessionStorage.clear();
        expect(window.sessionStorage.length).toBe(0);
    });

    it("storage.spec.8 check dot notation", function() {
        expect(window.sessionStorage.item).not.toBeDefined();
        window.sessionStorage.item = "value";
        expect(window.sessionStorage.item).toBe("value");
        window.sessionStorage.removeItem("item");   
        expect(window.sessionStorage.item).not.toBeDefined();
    });

    describe("Local Storage", function () {
        it("storage.spec.9 should exist", function() {
            expect(window.localStorage).toBeDefined();
            expect(window.localStorage.length).toBeDefined();
            expect(typeof window.localStorage.key).toBe("function");
            expect(typeof window.localStorage.getItem).toBe("function");
            expect(typeof window.localStorage.setItem).toBe("function");
            expect(typeof window.localStorage.removeItem).toBe("function");
            expect(typeof window.localStorage.clear).toBe("function");
        });  

        it("storage.spec.10 check length", function() {
            expect(window.localStorage.length).toBe(0);
            window.localStorage.setItem("key","value");
            expect(window.localStorage.length).toBe(1);
            window.localStorage.removeItem("key");   
            expect(window.localStorage.length).toBe(0);
        });

        it("storage.spec.11 check key", function() {
            expect(window.localStorage.key(0)).toBe(null);
            window.localStorage.setItem("test","value");
            expect(window.localStorage.key(0)).toBe("test");
            window.localStorage.removeItem("test");   
            expect(window.localStorage.key(0)).toBe(null);
        });

        it("storage.spec.4 check getItem", function() {
            expect(window.localStorage.getItem("item")).toBe(null);
            window.localStorage.setItem("item","value");
            expect(window.localStorage.getItem("item")).toBe("value");
            window.localStorage.removeItem("item");   
            expect(window.localStorage.getItem("item")).toBe(null);
        });

        it("storage.spec.5 check setItem", function() {
            expect(window.localStorage.getItem("item")).toBe(null);
            window.localStorage.setItem("item","value");
            expect(window.localStorage.getItem("item")).toBe("value");
            window.localStorage.setItem("item","newval");
            expect(window.localStorage.getItem("item")).toBe("newval");
            window.localStorage.removeItem("item");   
            expect(window.localStorage.getItem("item")).toBe(null);
        });

        it("storage.spec.14 check removeItem", function() {
            expect(window.localStorage.getItem("item")).toBe(null);
            window.localStorage.setItem("item","value");
            expect(window.localStorage.getItem("item")).toBe("value");
            window.localStorage.removeItem("item");   
            expect(window.localStorage.getItem("item")).toBe(null);
        });

        it("storage.spec.7 check clear", function() {
            expect(window.localStorage.getItem("item1")).toBe(null);
            expect(window.localStorage.getItem("item2")).toBe(null);
            expect(window.localStorage.getItem("item3")).toBe(null);
            window.localStorage.setItem("item1","value");
            window.localStorage.setItem("item2","value");
            window.localStorage.setItem("item3","value");
            expect(window.localStorage.getItem("item1")).toBe("value");
            expect(window.localStorage.getItem("item2")).toBe("value");
            expect(window.localStorage.getItem("item3")).toBe("value");
            expect(window.localStorage.length).toBe(3);
            window.localStorage.clear();
            expect(window.localStorage.length).toBe(0);
            expect(window.localStorage.getItem("item1")).toBe(null);
            expect(window.localStorage.getItem("item2")).toBe(null);
            expect(window.localStorage.getItem("item3")).toBe(null);
        });

        it("storage.spec.8 check dot notation", function() {
            expect(window.localStorage.item).not.toBeDefined();
            window.localStorage.item = "value";
            expect(window.localStorage.item).toBe("value");
            window.localStorage.removeItem("item");   
            expect(window.localStorage.item).not.toBeDefined();
        });
    });

    describe("HTML 5 Storage", function () {
        it("storage.spec.9 should exist", function() {
            expect(window.openDatabase);
        });

        it("storage.spec.18 Should be able to create and drop tables", function() {
            var win = jasmine.createSpy('win');
            var fail1 = createDoNotCallSpy('fail1');
            var fail2 = createDoNotCallSpy('fail2');
            var db = openDatabase("Database", "1.0", "HTML5 Database API example", 5*1024*1024);
            db.transaction(function(t) {
                t.executeSql('CREATE TABLE IF NOT EXISTS foo(id int, name varchar(255));');
                t.executeSql('CREATE TABLE IF NOT EXISTS foo2(id int, name varchar(255));');
            }, fail1, step2);
            function step2() {
              db.transaction(function(t) {
                  t.executeSql('DROP TABLE foo;');
                  t.executeSql('DROP TABLE foo2');
              }, fail2, win);
            }
            waitsForAny(win, fail1, fail2);
        });
    });
});
