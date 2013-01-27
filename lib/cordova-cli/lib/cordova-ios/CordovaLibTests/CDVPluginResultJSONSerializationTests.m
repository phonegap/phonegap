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

#import <Foundation/Foundation.h>
#import <SenTestingKit/SenTestingKit.h>

#import "CDVPluginResult.h"
#import "CDVJSON.h"

@interface CDVPluginResultJSONSerializationTests : SenTestCase
@end

@implementation CDVPluginResultJSONSerializationTests

- (void)testSerializingMessageAsInt
{
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:5];
    NSDictionary* dic = [[result toJSONString] JSONObject];
    NSNumber* message = [dic objectForKey:@"message"];

    STAssertTrue([[NSNumber numberWithInt:5] isEqual:message], nil);
}

- (void)testSerializingMessageAsDouble
{
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDouble:5.5];
    NSDictionary* dic = [[result toJSONString] JSONObject];
    NSNumber* message = [dic objectForKey:@"message"];

    STAssertTrue([[NSNumber numberWithDouble:5.5] isEqual:message], nil);
}

- (void)testSerializingMessageAsBool
{
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:YES];
    NSDictionary* dic = [[result toJSONString] JSONObject];
    NSNumber* message = [dic objectForKey:@"message"];

    STAssertTrue([[NSNumber numberWithBool:YES] isEqual:message], nil);
}

- (void)testSerializingMessageAsArray
{
    NSArray* testValues = [NSArray arrayWithObjects:
        [NSNull null],
        @"string",
        [NSNumber numberWithInt:5],
        [NSNumber numberWithDouble:5.5],
        [NSNumber numberWithBool:true],
        nil];

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:testValues];
    NSDictionary* dic = [[result toJSONString] JSONObject];
    NSArray* message = [dic objectForKey:@"message"];

    STAssertTrue([message isKindOfClass:[NSArray class]], nil);
    STAssertTrue([testValues count] == [message count], nil);

    for (NSInteger i = 0; i < [testValues count]; i++) {
        STAssertTrue([[testValues objectAtIndex:i] isEqual:[message objectAtIndex:i]], nil);
    }
}

- (void)__testDictionary:(NSDictionary*)dictA withDictionary:(NSDictionary*)dictB
{
    STAssertTrue([dictA isKindOfClass:[NSDictionary class]], nil);
    STAssertTrue([dictB isKindOfClass:[NSDictionary class]], nil);

    STAssertTrue([[dictA allKeys] count] == [[dictB allKeys] count], nil);

    for (NSInteger i = 0; i < [dictA count]; i++) {
        id keyA = [[dictA allKeys] objectAtIndex:i];
        id objA = [dictA objectForKey:keyA];
        id objB = [dictB objectForKey:keyA];

        STAssertTrue([[dictB allKeys] containsObject:keyA], nil); // key exists
        if ([objA isKindOfClass:[NSDictionary class]]) {
            [self __testDictionary:objA withDictionary:objB];
        } else {
            STAssertTrue([objA isEqual:objB], nil); // key's value equality
        }
    }
}

- (void)testSerializingMessageAsDictionary
{
    NSMutableDictionary* testValues = [NSMutableDictionary dictionaryWithObjectsAndKeys:
        [NSNull null], @"nullItem",
        @"string", @"stringItem",
        [NSNumber numberWithInt:5], @"intItem",
        [NSNumber numberWithDouble:5.5], @"doubleItem",
        [NSNumber numberWithBool:true], @"boolItem",
        nil];

    NSDictionary* nestedDict = [testValues copy];

    [testValues setValue:nestedDict forKey:@"nestedDict"];

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:testValues];
    NSDictionary* dic = [[result toJSONString] JSONObject];
    NSDictionary* message = [dic objectForKey:@"message"];

    [self __testDictionary:testValues withDictionary:message];
}

- (void)testSerializingMessageAsErrorCode
{
    NSMutableDictionary* testValues = [NSMutableDictionary dictionaryWithObjectsAndKeys:
        [NSNumber numberWithInt:1], @"code",
        nil];

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageToErrorObject:1];
    NSDictionary* dic = [[result toJSONString] JSONObject];
    NSDictionary* message = [dic objectForKey:@"message"];

    [self __testDictionary:testValues withDictionary:message];
}

- (void)testSerializingMessageAsStringContainingQuotes
{
    NSString* quotedString = @"\"quoted\"";
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:quotedString];
    NSDictionary* dic = [[result toJSONString] JSONObject];
    NSString* message = [dic objectForKey:@"message"];

    STAssertTrue([quotedString isEqual:message], nil);
}

- (void)testSerializingMessageAsStringThatIsNil
{
    NSString* nilString = nil;
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:nilString];
    NSDictionary* dic = [[result toJSONString] JSONObject];
    NSString* message = [dic objectForKey:@"message"];

    STAssertTrue([[NSNull null] isEqual:message], nil);
}

@end
