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

#import "CDVInvokedUrlCommand.h"

@interface CDVInvokedUrlCommandTests : SenTestCase
@end

@implementation CDVInvokedUrlCommandTests

- (void)testInitWithNoArgs
{
    NSArray* jsonArr = [NSArray arrayWithObjects:@"callbackId", @"className", @"methodName", [NSArray array], nil];
    CDVInvokedUrlCommand* command = [CDVInvokedUrlCommand commandFromJson:jsonArr];

    STAssertEquals(@"callbackId", command.callbackId, nil);
    STAssertEquals(@"className", command.className, nil);
    STAssertEquals(@"methodName", command.methodName, nil);
    STAssertEquals([NSArray array], command.arguments, nil);
}

- (void)testLegacyArgsNoDict
{
    NSArray* args = [NSArray arrayWithObjects:@"a", @"b", nil];
    NSArray* jsonArr = [NSArray arrayWithObjects:@"callbackId", @"className", @"methodName", args, nil];
    CDVInvokedUrlCommand* command = [CDVInvokedUrlCommand commandFromJson:jsonArr];
    NSMutableArray* legacyArgs = nil;
    NSMutableDictionary* dict = nil;

    [command legacyArguments:&legacyArgs andDict:&dict];
    // Ensure properties don't change.
    STAssertEquals(@"callbackId", command.callbackId, nil);
    STAssertEquals(@"className", command.className, nil);
    STAssertEquals(@"methodName", command.methodName, nil);
    STAssertEquals(args, command.arguments, nil);

    NSArray* expected = [NSArray arrayWithObjects:@"callbackId", @"a", @"b", nil];
    STAssertEqualObjects(expected, legacyArgs, nil);
    STAssertNil(dict, nil);
}

- (void)testLegacyArgsWithDicts
{
    NSDictionary* dummyDict1 = [NSDictionary dictionaryWithObjectsAndKeys:@"val", @"key", nil];
    NSDictionary* dummyDict2 = [NSDictionary dictionaryWithObjectsAndKeys:@"val", @"key", nil];
    NSArray* args = [NSArray arrayWithObjects:@"a", dummyDict1, dummyDict2, @"b", nil];
    NSArray* jsonArr = [NSArray arrayWithObjects:@"callbackId", @"className", @"methodName", args, nil];
    CDVInvokedUrlCommand* command = [CDVInvokedUrlCommand commandFromJson:jsonArr];
    NSMutableArray* legacyArgs = nil;
    NSMutableDictionary* dict = nil;

    [command legacyArguments:&legacyArgs andDict:&dict];
    // Ensure properties don't change.
    STAssertEquals(@"callbackId", command.callbackId, nil);
    STAssertEquals(@"className", command.className, nil);
    STAssertEquals(@"methodName", command.methodName, nil);
    STAssertEquals(args, command.arguments, nil);

    NSArray* expected = [NSArray arrayWithObjects:@"callbackId", @"a", dummyDict2, @"b", nil];
    STAssertEqualObjects(expected, legacyArgs, nil);
    STAssertEqualObjects(dict, dummyDict1, nil);
}

- (void)testLegacyArgsNoCallbackId
{
    NSArray* args = [NSArray arrayWithObjects:@"a", @"b", nil];
    NSArray* jsonArr = [NSArray arrayWithObjects:[NSNull null], @"className", @"methodName", args, nil];
    CDVInvokedUrlCommand* command = [CDVInvokedUrlCommand commandFromJson:jsonArr];
    NSMutableArray* legacyArgs = nil;
    NSMutableDictionary* dict = nil;

    [command legacyArguments:&legacyArgs andDict:&dict];

    NSArray* expected = [NSArray arrayWithObjects:@"a", @"b", nil];
    STAssertEqualObjects(expected, legacyArgs, nil);
}

- (void)testArgumentAtIndex
{
    NSArray* jsonArr = [NSArray arrayWithObjects:[NSNull null], @"className", @"methodName", [NSArray array], nil];
    CDVInvokedUrlCommand* command = [CDVInvokedUrlCommand commandFromJson:jsonArr];

    STAssertNil([command argumentAtIndex:0], @"NSNull to nil");
    STAssertNil([command argumentAtIndex:100], @"Invalid index to nil");
    STAssertEquals(@"default", [command argumentAtIndex:0 withDefault:@"default"], @"NSNull to default");
    STAssertEquals(@"default", [command argumentAtIndex:100 withDefault:@"default"], @"Invalid index to default");
}

@end
