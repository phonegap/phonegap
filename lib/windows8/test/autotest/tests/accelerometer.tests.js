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

describe('Accelerometer (navigator.accelerometer)', function () {
    it("accelerometer.spec.1 should exist", function () {
        expect(navigator.accelerometer).toBeDefined();
    });

    describe("getCurrentAcceleration", function() {
        it("accelerometer.spec.2 should exist", function() {
            expect(typeof navigator.accelerometer.getCurrentAcceleration).toBeDefined();
            expect(typeof navigator.accelerometer.getCurrentAcceleration == 'function').toBe(true);
        });

        it("accelerometer.spec.3 success callback should be called with an Acceleration object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(a.x).toBeDefined();
                    expect(typeof a.x == 'number').toBe(true);
                    expect(a.y).toBeDefined();
                    expect(typeof a.y == 'number').toBe(true);
                    expect(a.z).toBeDefined();
                    expect(typeof a.z == 'number').toBe(true);
                    expect(a.timestamp).toBeDefined();
                    expect(typeof a.timestamp).toBe('number');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.accelerometer.getCurrentAcceleration(win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });

        it("accelerometer.spec.4 success callback Acceleration object should have (reasonable) values for x, y and z expressed in m/s^2", function() {
            var reasonableThreshold = 15;
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a.x).toBeLessThan(reasonableThreshold);
                    expect(a.x).toBeGreaterThan(reasonableThreshold * -1);
                    expect(a.y).toBeLessThan(reasonableThreshold);
                    expect(a.y).toBeGreaterThan(reasonableThreshold * -1);
                    expect(a.z).toBeLessThan(reasonableThreshold);
                    expect(a.z).toBeGreaterThan(reasonableThreshold * -1);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.accelerometer.getCurrentAcceleration(win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });

        it("accelerometer.spec.5 success callback Acceleration object should return a recent timestamp", function() {
            var veryRecently = (new Date()).getTime();
            // Need to check that dates returned are not vastly greater than a recent time stamp.
            // In case the timestamps returned are ridiculously high
            var reasonableTimeLimit = veryRecently + 5000; // 5 seconds from now
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a.timestamp).toBeGreaterThan(veryRecently);
                    expect(a.timestamp).toBeLessThan(reasonableTimeLimit);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.accelerometer.getCurrentAcceleration(win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });

    describe("watchAcceleration", function() {
        var id;

        afterEach(function() {
            navigator.accelerometer.clearWatch(id);
        });

        it("accelerometer.spec.2 should exist", function() {
            expect(navigator.accelerometer.watchAcceleration).toBeDefined();
            expect(typeof navigator.accelerometer.watchAcceleration == 'function').toBe(true);
        });
        it("accelerometer.spec.3 success callback should be called with an Acceleration object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(a.x).toBeDefined();
                    expect(typeof a.x == 'number').toBe(true);
                    expect(a.y).toBeDefined();
                    expect(typeof a.y == 'number').toBe(true);
                    expect(a.z).toBeDefined();
                    expect(typeof a.z == 'number').toBe(true);
                    expect(a.timestamp).toBeDefined();
                    expect(typeof a.timestamp).toBe('number');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                id = navigator.accelerometer.watchAcceleration(win, fail, {frequency:500});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });

        it("accelerometer.spec.4 success callback Acceleration object should have (reasonable) values for x, y and z expressed in m/s^2", function() {
            var reasonableThreshold = 15;
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a.x).toBeLessThan(reasonableThreshold);
                    expect(a.x).toBeGreaterThan(reasonableThreshold * -1);
                    expect(a.y).toBeLessThan(reasonableThreshold);
                    expect(a.y).toBeGreaterThan(reasonableThreshold * -1);
                    expect(a.z).toBeLessThan(reasonableThreshold);
                    expect(a.z).toBeGreaterThan(reasonableThreshold * -1);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                id = navigator.accelerometer.watchAcceleration(win, fail, {frequency:500});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });

        it("accelerometer.spec.5 success callback Acceleration object should return a recent timestamp", function() {
            var veryRecently = (new Date()).getTime();
            // Need to check that dates returned are not vastly greater than a recent time stamp.
            // In case the timestamps returned are ridiculously high
            var reasonableTimeLimit = veryRecently + 5000; // 5 seconds from now
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a.timestamp).toBeGreaterThan(veryRecently);
                    expect(a.timestamp).toBeLessThan(reasonableTimeLimit);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                id = navigator.accelerometer.watchAcceleration(win, fail, {frequency:500});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });

    describe("clearWatch", function() {
        it("accelerometer.spec.2 should exist", function() {
            expect(navigator.accelerometer.clearWatch).toBeDefined();
            expect(typeof navigator.accelerometer.clearWatch == 'function').toBe(true);
        });

        it("accelerometer.spec.11 should clear an existing watch", function() {
            var id,
                win = jasmine.createSpy();

            runs(function() {
                id = navigator.accelerometer.watchAcceleration(win, function() {}, {frequency:100});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function() {
                win.reset();
                navigator.accelerometer.clearWatch(id);
            });

            waits(201);

            runs(function() {
                expect(win).not.toHaveBeenCalled();
            });
        });
    });
});
