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

describe('Network (navigator.connection)', function () {
    it("network.spec.1 should exist", function() {
        expect(navigator.network && navigator.network.connection).toBeDefined();
        expect(navigator.connection).toBeDefined();
    });

    it("network.spec.2 should be set to a valid value", function() {
        var validValues = {
            'unknown': 1,
            'ethernet': 1,
            'wifi': 1,
            '2g': 1,
            '3g': 1,
            '4g': 1,
            'none': 1
        };
        expect(validValues[navigator.connection.type]).toBe(1);
    });

    it("network.spec.3 should have the same value in deprecated and non-deprecated apis", function() {
        expect(navigator.network.connection.type).toBe(navigator.connection.type);
    });

    it("network.spec.4 should define constants for connection status", function() {
        expect(Connection.UNKNOWN).toBe("unknown");
        expect(Connection.ETHERNET).toBe("ethernet");
        expect(Connection.WIFI).toBe("wifi");
        expect(Connection.CELL_2G).toBe("2g");
        expect(Connection.CELL_3G).toBe("3g");
        expect(Connection.CELL_4G).toBe("4g");
        expect(Connection.NONE).toBe("none");
        expect(Connection.CELL).toBe("cellular");
    });
});
