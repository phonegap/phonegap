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

describe('Camera (navigator.camera)', function () {
	it("should exist", function() {
        expect(navigator.camera).toBeDefined();
	});

	it("should contain a getPicture function", function() {
        expect(navigator.camera.getPicture).toBeDefined();
		expect(typeof navigator.camera.getPicture == 'function').toBe(true);
	});
});

describe('Camera Constants (window.Camera + navigator.camera)', function () {
    it("camera.spec.1 window.Camera should exist", function() {
        expect(window.Camera).toBeDefined();
    });

    it("camera.spec.2 should contain three DestinationType constants", function() {
        expect(Camera.DestinationType.DATA_URL).toBe(0);
        expect(Camera.DestinationType.FILE_URI).toBe(1);
        expect(Camera.DestinationType.NATIVE_URI).toBe(2);
        expect(navigator.camera.DestinationType.DATA_URL).toBe(0);
        expect(navigator.camera.DestinationType.FILE_URI).toBe(1);
        expect(navigator.camera.DestinationType.NATIVE_URI).toBe(2);
    });

    it("camera.spec.3 should contain two EncodingType constants", function() {
        expect(Camera.EncodingType.JPEG).toBe(0);
        expect(Camera.EncodingType.PNG).toBe(1);
        expect(navigator.camera.EncodingType.JPEG).toBe(0);
        expect(navigator.camera.EncodingType.PNG).toBe(1);
    });

    it("camera.spec.4 should contain three MediaType constants", function() {
        expect(Camera.MediaType.PICTURE).toBe(0);
        expect(Camera.MediaType.VIDEO).toBe(1);
        expect(Camera.MediaType.ALLMEDIA).toBe(2);
        expect(navigator.camera.MediaType.PICTURE).toBe(0);
        expect(navigator.camera.MediaType.VIDEO).toBe(1);
        expect(navigator.camera.MediaType.ALLMEDIA).toBe(2);
    });
    it("camera.spec.5 should contain three PictureSourceType constants", function() {
        expect(Camera.PictureSourceType.PHOTOLIBRARY).toBe(0);
        expect(Camera.PictureSourceType.CAMERA).toBe(1);
        expect(Camera.PictureSourceType.SAVEDPHOTOALBUM).toBe(2);
        expect(navigator.camera.PictureSourceType.PHOTOLIBRARY).toBe(0);
        expect(navigator.camera.PictureSourceType.CAMERA).toBe(1);
        expect(navigator.camera.PictureSourceType.SAVEDPHOTOALBUM).toBe(2);
    });
});
