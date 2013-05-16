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

describe('Compass (navigator.compass)', function () {
    it("compass.spec.1 should exist", function() {
        expect(navigator.compass).toBeDefined();
    });

    it("compass.spec.2 should contain a getCurrentHeading function", function() {
        expect(navigator.compass.getCurrentHeading).toBeDefined();
		expect(typeof navigator.compass.getCurrentHeading == 'function').toBe(true);
	});

    it("compass.spec.3 getCurrentHeading success callback should be called with a Heading object", function() {
        var win = jasmine.createSpy().andCallFake(function(a) {
                expect(a instanceof CompassHeading).toBe(true);
                expect(a.magneticHeading).toBeDefined();
                expect(typeof a.magneticHeading == 'number').toBe(true);
                expect(a.trueHeading).not.toBe(undefined);
                expect(typeof a.trueHeading == 'number' || a.trueHeading === null).toBe(true);
                expect(a.headingAccuracy).not.toBe(undefined);
                expect(typeof a.headingAccuracy == 'number' || a.headingAccuracy === null).toBe(true);
                expect(typeof a.timestamp == 'number').toBe(true);
            }),
            fail = jasmine.createSpy();

        runs(function () {
            navigator.compass.getCurrentHeading(win, fail);
        });

        waitsFor(function () { return win.wasCalled; }, "success callback never called", Tests.TEST_TIMEOUT);

        runs(function () {
            expect(fail).not.toHaveBeenCalled();
            expect(win).toHaveBeenCalled();
        });
	});

    it("compass.spec.4 should contain a watchHeading function", function() {
        expect(navigator.compass.watchHeading).toBeDefined();
        expect(typeof navigator.compass.watchHeading == 'function').toBe(true);
    });

    it("compass.spec.5 should contain a clearWatch function", function() {
        expect(navigator.compass.clearWatch).toBeDefined();
        expect(typeof navigator.compass.clearWatch == 'function').toBe(true);
    });

    describe('Compass Constants (window.CompassError)', function () {
        it("compass.spec.1 should exist", function() {
            expect(window.CompassError).toBeDefined();
            expect(window.CompassError.COMPASS_INTERNAL_ERR).toBe(0);
            expect(window.CompassError.COMPASS_NOT_SUPPORTED).toBe(20);
        });
    });

    describe('Compass Heading model (CompassHeading)', function () {
        it("compass.spec.1 should exist", function() {
            expect(CompassHeading).toBeDefined();
        });

        it("compass.spec.8 should be able to create a new CompassHeading instance with no parameters", function() {
            var h = new CompassHeading();
            expect(h.magneticHeading).toBeDefined();
            expect(h.trueHeading).toBeDefined();
            expect(h.headingAccuracy).toBeDefined();
            expect(typeof h.timestamp == 'number').toBe(true);
        });

        it("compass.spec.9 should be able to create a new CompassHeading instance with parameters", function() {
            var h = new CompassHeading(1,2,3,4);
            expect(h.magneticHeading).toBe(1);
            expect(h.trueHeading).toBe(2);
            expect(h.headingAccuracy).toBe(3);
            expect(h.timestamp.valueOf()).toBe(4);
            expect(typeof h.timestamp == 'number').toBe(true);
        });
    });
});
