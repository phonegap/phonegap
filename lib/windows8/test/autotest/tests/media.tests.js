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

describe('Media', function () {
	it("should exist", function() {
        expect(Media).toBeDefined();
		expect(typeof Media).toBe("function");
	});

    it("media.spec.1 should have the following properties", function() {
        var media1 = new Media("dummy");
        expect(media1.id).toBeDefined();
        expect(media1.src).toBeDefined();
        expect(media1._duration).toBeDefined();
        expect(media1._position).toBeDefined();
        media1.release();
    });

	it("should define constants for Media errors", function() {
        expect(MediaError).toBeDefined();
        expect(MediaError.MEDIA_ERR_NONE_ACTIVE).toBe(0);
        expect(MediaError.MEDIA_ERR_ABORTED).toBe(1);
		expect(MediaError.MEDIA_ERR_NETWORK).toBe(2);
		expect(MediaError.MEDIA_ERR_DECODE).toBe(3);
		expect(MediaError.MEDIA_ERR_NONE_SUPPORTED).toBe(4);
	});

    it("media.spec.2 should contain a play function", function() {
        var media1 = new Media();
        expect(media1.play).toBeDefined();
        expect(typeof media1.play).toBe('function');
        media1.release();
    });

    it("media.spec.3 should contain a stop function", function() {
        var media1 = new Media();
        expect(media1.stop).toBeDefined();
        expect(typeof media1.stop).toBe('function');
        media1.release();
    });

    it("media.spec.4 should contain a seekTo function", function() {
        var media1 = new Media();
        expect(media1.seekTo).toBeDefined();
        expect(typeof media1.seekTo).toBe('function');
        media1.release();
    });

    it("media.spec.5 should contain a pause function", function() {
        var media1 = new Media();
        expect(media1.pause).toBeDefined();
        expect(typeof media1.pause).toBe('function');
        media1.release();
    });

    it("media.spec.6 should contain a getDuration function", function() {
        var media1 = new Media();
        expect(media1.getDuration).toBeDefined();
        expect(typeof media1.getDuration).toBe('function');
        media1.release();
    });

    it("media.spec.7 should contain a getCurrentPosition function", function() {
        var media1 = new Media();
        expect(media1.getCurrentPosition).toBeDefined();
        expect(typeof media1.getCurrentPosition).toBe('function');
        media1.release();
    });

    it("media.spec.8 should contain a startRecord function", function() {
        var media1 = new Media();
        expect(media1.startRecord).toBeDefined();
        expect(typeof media1.startRecord).toBe('function');
        media1.release();
    });

    it("media.spec.9 should contain a stopRecord function", function() {
        var media1 = new Media();
        expect(media1.stopRecord).toBeDefined();
        expect(typeof media1.stopRecord).toBe('function');
        media1.release();
    });

    it("media.spec.10 should contain a release function", function() {
        var media1 = new Media();
        expect(media1.release).toBeDefined();
        expect(typeof media1.release).toBe('function');
        media1.release();
    });

    it("media.spec.11 should contain a setVolume function", function() {
        var media1 = new Media();
        expect(media1.setVolume).toBeDefined();
        expect(typeof media1.setVolume).toBe('function');
        media1.release();
    });

	it("should return MediaError for bad filename", function() {
		var badMedia = null,
            win = jasmine.createSpy(),
            fail = jasmine.createSpy().andCallFake(function (result) {
                expect(result).toBeDefined();
                expect(result.code).toBe(MediaError.MEDIA_ERR_ABORTED);
            });
            
        runs(function () {
            badMedia = new Media("invalid.file.name", win,fail);
            badMedia.play();
        });

        waitsFor(function () { return fail.wasCalled; }, Tests.TEST_TIMEOUT);

        runs(function () {
            expect(win).not.toHaveBeenCalled();
            badMedia.release();
        });
	});

    it("media.spec.12 position should be set properly", function() {
        var media1 = new Media("http://cordova.apache.org/downloads/BlueZedEx.mp3"),
            test = jasmine.createSpy().andCallFake(function(position) {
                    console.log("position = " + position);
                    expect(position).toBeGreaterThan(0.0);
                    media1.stop()
                    media1.release();
                });

        media1.play();

        waits(5000);

        runs(function () {
            media1.getCurrentPosition(test, function () {});
        });

        waitsFor(function () { return test.wasCalled; }, Tests.TEST_TIMEOUT);
    });

    it("media.spec.13 duration should be set properly", function() {
        var media1 = new Media("http://cordova.apache.org/downloads/BlueZedEx.mp3");
        media1.play();
        waits(5000);
        runs(function () {
            expect(media1.getDuration()).toBeGreaterThan(0.0);
        });
    });
});
