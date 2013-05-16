describe('Globalization (navigator.globalization)', function () {
    it("globalization.spec.1 should exist", function() {
        expect(navigator.globalization).toBeDefined();
    });
    
    describe("getLocaleName", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.getLocaleName).toBeDefined();
            expect(typeof navigator.globalization.getLocaleName == 'function').toBe(true);
        });
        it("globalization.spec.3 getLocaleName success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getLocaleName(win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
    
    describe("dateToString", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.dateToString).toBeDefined();
            expect(typeof navigator.globalization.dateToString == 'function').toBe(true);
        });
        it("globalization.spec.5 dateToString using default options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.dateToString(new Date(), win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.6 dateToString using formatLength=short and selector=date options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.dateToString(new Date(), win, fail, {formatLength: 'short', selector: 'date'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.7 dateToString using formatLength=full and selector=date options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.dateToString(new Date(), win, fail, {formatLength: 'full', selector: 'date'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.8 dateToString using formatLength=medium and selector=date and time(default) options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.dateToString(new Date(), win, fail, {formatLength: 'medium'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.9 dateToString using formatLength=long and selector=date and time(default) options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.dateToString(new Date(), win, fail, {formatLength: 'long'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.10 dateToString using formatLength=full and selector=date and time(default) options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.dateToString(new Date(), win, fail, {formatLength: 'full'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
    
    describe("stringToDate", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.stringToDate).toBeDefined();
            expect(typeof navigator.globalization.stringToDate == 'function').toBe(true);
        });
        it("globalization.spec.12 stringToDate using default options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.year).toBeDefined();
                    expect(typeof a.year).toBe('number');
                    expect(a.year >= 0 && a.year <=9999).toBe(true);
                    expect(a.month).toBeDefined();
                    expect(typeof a.month).toBe('number');
                    expect(a.month >= 0 && a.month <=11).toBe(true);
                    expect(a.day).toBeDefined();
                    expect(typeof a.day).toBe('number');
                    expect(a.day >= 1 && a.day <=31).toBe(true);
                    expect(a.hour).toBeDefined();
                    expect(typeof a.hour).toBe('number');
                    expect(a.hour >= 0 && a.hour <=23).toBe(true);
                    expect(a.minute).toBeDefined();
                    expect(typeof a.minute).toBe('number');
                    expect(a.minute >= 0 && a.minute <=59).toBe(true);
                    expect(a.second).toBeDefined();
                    expect(typeof a.second).toBe('number');
                    expect(a.second >= 0 && a.second <=59).toBe(true);
                    expect(a.millisecond).toBeDefined();
                    expect(typeof a.millisecond).toBe('number');
                }),
                fail = jasmine.createSpy();
                
            var win2 = function(a) {
                navigator.globalization.stringToDate(a.value, win, fail);                
            };

            runs(function () {
                navigator.globalization.dateToString(new Date(), win2, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.13 stringToDate using formatLength=short and selector=date options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.year).toBeDefined();
                    expect(typeof a.year).toBe('number');
                    expect(a.year >= 0 && a.year <=9999).toBe(true);
                    expect(a.month).toBeDefined();
                    expect(typeof a.month).toBe('number');
                    expect(a.month >= 0 && a.month <=11).toBe(true);
                    expect(a.day).toBeDefined();
                    expect(typeof a.day).toBe('number');
                    expect(a.day >= 1 && a.day <=31).toBe(true);
                    expect(a.hour).toBeDefined();
                    expect(typeof a.hour).toBe('number');
                    expect(a.hour >= 0 && a.hour <=23).toBe(true);
                    expect(a.minute).toBeDefined();
                    expect(typeof a.minute).toBe('number');
                    expect(a.minute >= 0 && a.minute <=59).toBe(true);
                    expect(a.second).toBeDefined();
                    expect(typeof a.second).toBe('number');
                    expect(a.second >= 0 && a.second <=59).toBe(true);
                    expect(a.millisecond).toBeDefined();
                    expect(typeof a.millisecond).toBe('number');
                }),
                fail = jasmine.createSpy();
                
            var win2 = function(a) {
                navigator.globalization.stringToDate(a.value, win, fail, {formatLength: 'short', selector: 'date'});
            };

            runs(function () {
                navigator.globalization.dateToString(new Date(), win2, fail, {formatLength: 'short', selector: 'date'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.14 stringToDate using formatLength=full and selector=date options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.year).toBeDefined();
                    expect(typeof a.year).toBe('number');
                    expect(a.year >= 0 && a.year <=9999).toBe(true);
                    expect(a.month).toBeDefined();
                    expect(typeof a.month).toBe('number');
                    expect(a.month >= 0 && a.month <=11).toBe(true);
                    expect(a.day).toBeDefined();
                    expect(typeof a.day).toBe('number');
                    expect(a.day >= 1 && a.day <=31).toBe(true);
                    expect(a.hour).toBeDefined();
                    expect(typeof a.hour).toBe('number');
                    expect(a.hour >= 0 && a.hour <=23).toBe(true);
                    expect(a.minute).toBeDefined();
                    expect(typeof a.minute).toBe('number');
                    expect(a.minute >= 0 && a.minute <=59).toBe(true);
                    expect(a.second).toBeDefined();
                    expect(typeof a.second).toBe('number');
                    expect(a.second >= 0 && a.second <=59).toBe(true);
                    expect(a.millisecond).toBeDefined();
                    expect(typeof a.millisecond).toBe('number');
                }),
                fail = jasmine.createSpy();

            var win2 = function(a) {
                navigator.globalization.stringToDate(a.value, win, fail, {formatLength: 'full', selector: 'date'});
            };
            runs(function () {
                navigator.globalization.dateToString(new Date(), win2, fail, {formatLength: 'full', selector: 'date'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.15 stringToDate using invalid date, error callback should be called with a GlobalizationError object", function() {
            var win = jasmine.createSpy(),
                fail = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.code).toBeDefined();
                    expect(typeof a.code).toBe('number');
                    expect(a.code === GlobalizationError.PARSING_ERROR).toBe(true);
                    expect(a.message).toBeDefined();
                    expect(typeof a.message).toBe('string');
                    expect(a.message !== "").toBe(true);
                });

            runs(function () {
                navigator.globalization.stringToDate('notADate', win, fail, {selector:'foobar'});
            });

            waitsFor(function () { return fail.wasCalled; }, "fail never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(win).not.toHaveBeenCalled();
            });
        });
    });

    describe("getDatePattern", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.getDatePattern).toBeDefined();
            expect(typeof navigator.globalization.getDatePattern == 'function').toBe(true);
        });
        it("globalization.spec.17 getDatePattern using default options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.pattern).toBeDefined();
                    expect(typeof a.pattern).toBe('string');
                    expect(a.pattern.length > 0).toBe(true);
                    expect(a.timezone).toBeDefined();
                    expect(typeof a.timezone).toBe('string');
                    expect(a.timezone.length > 0).toBe(true);
                    expect(a.utc_offset).toBeDefined();
                    expect(typeof a.utc_offset).toBe('number');
                    expect(a.dst_offset).toBeDefined();
                    expect(typeof a.dst_offset).toBe('number');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getDatePattern(win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.18 getDatePattern using formatLength=medium and selector=date options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.pattern).toBeDefined();
                    expect(typeof a.pattern).toBe('string');
                    expect(a.pattern.length > 0).toBe(true);
                    expect(a.timezone).toBeDefined();
                    expect(typeof a.timezone).toBe('string');
                    expect(a.timezone.length > 0).toBe(true);
                    expect(a.utc_offset).toBeDefined();
                    expect(typeof a.utc_offset).toBe('number');
                    expect(a.dst_offset).toBeDefined();
                    expect(typeof a.dst_offset).toBe('number');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getDatePattern(win, fail, {formatLength: 'medium', selector: 'date'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });    

    describe("getDateNames", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.getDateNames).toBeDefined();
            expect(typeof navigator.globalization.getDateNames == 'function').toBe(true);
        });
        it("globalization.spec.20 getDateNames using default options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(a.value instanceof Array).toBe(true);
                    expect(a.value.length > 0).toBe(true);
                    expect(typeof a.value[0]).toBe('string');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getDateNames(win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.21 getDateNames using type=narrow and item=days options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(a.value instanceof Array).toBe(true);
                    expect(a.value.length > 0).toBe(true);
                    expect(typeof a.value[0]).toBe('string');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getDateNames(win, fail, {type: 'narrow', item: 'days'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.22 getDateNames using type=narrow and item=months options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(a.value instanceof Array).toBe(true);
                    expect(a.value.length > 0).toBe(true);
                    expect(typeof a.value[0]).toBe('string');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getDateNames(win, fail, {type: 'narrow', item: 'months'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.23 getDateNames using type=wide and item=days options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(a.value instanceof Array).toBe(true);
                    expect(a.value.length > 0).toBe(true);
                    expect(typeof a.value[0]).toBe('string');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getDateNames(win, fail, {item: 'days'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.24 getDateNames using type=wide and item=months options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(a.value instanceof Array).toBe(true);
                    expect(a.value.length > 0).toBe(true);
                    expect(typeof a.value[0]).toBe('string');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getDateNames(win, fail, {item: 'months'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
    
    describe("isDayLightSavingsTime", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.isDayLightSavingsTime).toBeDefined();
            expect(typeof navigator.globalization.isDayLightSavingsTime == 'function').toBe(true);
        });
        it("globalization.spec.26 isDayLightSavingsTime using default options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.dst).toBeDefined();
                    expect(typeof a.dst).toBe('boolean');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.isDayLightSavingsTime(new Date(), win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
    
    describe("getFirstDayOfWeek", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.getFirstDayOfWeek).toBeDefined();
            expect(typeof navigator.globalization.getFirstDayOfWeek == 'function').toBe(true);
        });
        it("globalization.spec.28 getFirstDayOfWeek success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('number');
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getFirstDayOfWeek(win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
    
    describe("numberToString", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.numberToString).toBeDefined();
            expect(typeof navigator.globalization.numberToString == 'function').toBe(true);
        });
        it("globalization.spec.30 numberToString using default options, should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.numberToString(3.25, win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.31 numberToString using type=percent options, should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.numberToString(.25, win, fail, {type: 'percent'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.32 numberToString using type=currency options, should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('string');
                    expect(a.value.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.numberToString(5.20, win, fail, {type: 'currency'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
    
    describe("stringToNumber", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.stringToNumber).toBeDefined();
            expect(typeof navigator.globalization.stringToNumber == 'function').toBe(true);
        });
        it("globalization.spec.34 stringToNumber using default options, should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('number');
                    expect(a.value > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            var win2 = function(a) {
                navigator.globalization.stringToNumber(a.value, win, fail);
            };
            
            runs(function () {
                navigator.globalization.numberToString(3.25, win2, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.35 stringToNumber using type=percent options, should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.value).toBeDefined();
                    expect(typeof a.value).toBe('number');
                    expect(a.value > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            var win2 = function(a) {
                navigator.globalization.stringToNumber(a.value, win, fail, {type: 'percent'});
            };
            
            runs(function () {
                navigator.globalization.numberToString(.25, win2, fail, {type: 'percent'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
    
    describe("getNumberPattern", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.getNumberPattern).toBeDefined();
            expect(typeof navigator.globalization.getNumberPattern == 'function').toBe(true);
        });
        it("globalization.spec.37 getNumberPattern using default options, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.pattern).toBeDefined();
                    expect(typeof a.pattern).toBe('string');
                    expect(a.pattern.length > 0).toBe(true);
                    expect(typeof a.symbol).toBe('string');
                    expect(typeof a.fraction).toBe('number');
                    expect(typeof a.rounding).toBe('number');
                    expect(a.positive).toBeDefined();
                    expect(typeof a.positive).toBe('string');
                    expect(a.positive.length >= 0).toBe(true);
                    expect(a.negative).toBeDefined();
                    expect(typeof a.negative).toBe('string');
                    expect(a.negative.length >= 0).toBe(true);
                    expect(a.decimal).toBeDefined();
                    expect(typeof a.decimal).toBe('string');
                    expect(a.decimal.length > 0).toBe(true);
                    expect(a.grouping).toBeDefined();
                    expect(typeof a.grouping).toBe('string');
                    expect(a.grouping.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getNumberPattern(win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.38 getNumberPattern using type=percent, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.pattern).toBeDefined();
                    expect(typeof a.pattern).toBe('string');
                    expect(a.pattern.length > 0).toBe(true);
                    expect(typeof a.symbol).toBe('string');
                    expect(typeof a.fraction).toBe('number');
                    expect(typeof a.rounding).toBe('number');
                    expect(a.positive).toBeDefined();
                    expect(typeof a.positive).toBe('string');
                    expect(a.positive.length >= 0).toBe(true);
                    expect(a.negative).toBeDefined();
                    expect(typeof a.negative).toBe('string');
                    expect(a.negative.length >= 0).toBe(true);
                    expect(a.decimal).toBeDefined();
                    expect(typeof a.decimal).toBe('string');
                    expect(a.decimal.length > 0).toBe(true);
                    expect(a.grouping).toBeDefined();
                    expect(typeof a.grouping).toBe('string');
                    expect(a.grouping.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getNumberPattern(win, fail, {type: 'percent'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("globalization.spec.39 getNumberPattern using type=currency, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.pattern).toBeDefined();
                    expect(typeof a.pattern).toBe('string');
                    expect(a.pattern.length > 0).toBe(true);
                    expect(typeof a.symbol).toBe('string');
                    expect(typeof a.fraction).toBe('number');
                    expect(typeof a.rounding).toBe('number');
                    expect(a.positive).toBeDefined();
                    expect(typeof a.positive).toBe('string');
                    expect(a.positive.length >= 0).toBe(true);
                    expect(a.negative).toBeDefined();
                    expect(typeof a.negative).toBe('string');
                    expect(a.negative.length >= 0).toBe(true);
                    expect(a.decimal).toBeDefined();
                    expect(typeof a.decimal).toBe('string');
                    expect(a.decimal.length > 0).toBe(true);
                    expect(a.grouping).toBeDefined();
                    expect(typeof a.grouping).toBe('string');
                    expect(a.grouping.length > 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getNumberPattern(win, fail, {type: 'currency'});
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
    
    describe("getCurrencyPattern", function() {
        it("globalization.spec.1 should exist", function() {
            expect(typeof navigator.globalization.getCurrencyPattern).toBeDefined();
            expect(typeof navigator.globalization.getCurrencyPattern == 'function').toBe(true);
        });
        it("globalization.spec.41 getCurrencyPattern using EUR for currency, success callback should be called with a Properties object", function() {
            var win = jasmine.createSpy().andCallFake(function(a) {
                    expect(a).toBeDefined();
                    expect(typeof a).toBe('object');
                    expect(a.pattern).toBeDefined();
                    expect(typeof a.pattern).toBe('string');
                    expect(a.pattern.length > 0).toBe(true);
                    expect(a.code).toBeDefined();
                    expect(typeof a.code).toBe('string');
                    expect(a.code.length > 0).toBe(true);
                    expect(typeof a.fraction).toBe('number');
                    expect(typeof a.rounding).toBe('number');                   
                    expect(a.decimal).toBeDefined();
                    expect(typeof a.decimal).toBe('string');
                    expect(a.decimal.length >= 0).toBe(true);                    
                    expect(a.grouping).toBeDefined();
                    expect(typeof a.grouping).toBe('string');
                    expect(a.grouping.length >= 0).toBe(true);
                }),
                fail = jasmine.createSpy();

            runs(function () {
                navigator.globalization.getCurrencyPattern("EUR", win, fail);
            });

            waitsFor(function () { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function () {
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
});
