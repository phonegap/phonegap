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

describe('Notification (navigator.notification)', function () {
	it("should exist", function() {
                expect(navigator.notification).toBeDefined();
	});

	it("should contain a vibrate function", function() {
		expect(typeof navigator.notification.vibrate).toBeDefined();
		expect(typeof navigator.notification.vibrate).toBe("function");
	});

	it("should contain a beep function", function() {
		expect(typeof navigator.notification.beep).toBeDefined();
		expect(typeof navigator.notification.beep).toBe("function");
	});

	it("should contain an alert function", function() {
		expect(typeof navigator.notification.alert).toBeDefined();
		expect(typeof navigator.notification.alert).toBe("function");
	});

	it("should contain a confirm function", function() {
		expect(typeof navigator.notification.confirm).toBeDefined();
		expect(typeof navigator.notification.confirm).toBe("function");
	});
	
	it("should contain a prompt function", function() {
		expect(typeof navigator.notification.prompt).toBeDefined();
		expect(typeof navigator.notification.prompt).toBe("function");
	});
});
