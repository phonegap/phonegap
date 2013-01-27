/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <SenTestingKit/SenTestingKit.h>

#import "NSData+Base64.h"

@interface CDVBase64Tests : SenTestCase
@end

@implementation CDVBase64Tests

- (void)setUp
{
    [super setUp];

    // setup code here
}

- (void)tearDown
{
    // Tear-down code here.

    [super tearDown];
}

- (void)testBase64Encode
{
    NSString* decodedString = @"abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&";
    NSData* decodedData = [decodedString dataUsingEncoding:NSUTF8StringEncoding];

    NSString* expectedEncodedString = @"YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwIUAjJCVeJg==";
    NSString* actualEncodedString = [decodedData base64EncodedString];

    STAssertTrue([expectedEncodedString isEqualToString:actualEncodedString], nil);
}

- (void)testBase64Decode
{
    NSString* encodedString = @"YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkwIUAjJCVeJg==";
    NSString* decodedString = @"abcdefghijklmnopqrstuvwxyz1234567890!@#$%^&";
    NSData* encodedData = [decodedString dataUsingEncoding:NSUTF8StringEncoding];
    NSData* decodedData = [NSData dataFromBase64String:encodedString];

    STAssertTrue([encodedData isEqualToData:decodedData], nil);
}

@end
