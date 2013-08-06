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

#import <Cordova/CDVWebViewDelegate.h>

@interface CDVWebViewDelegateTests : SenTestCase
@end

@implementation CDVWebViewDelegateTests

- (void)setUp
{
    [super setUp];
}

- (void)tearDown
{
    [super tearDown];
}

- (void)testFragmentIdentifiersWithHttpUrl
{
    [self doTestFragmentIdentifiersWithBaseUrl:@"http://cordova.apache.org" fragment:@"myfragment"];
}

- (void)testFragmentIdentifiersWithFileUrl
{
    [self doTestFragmentIdentifiersWithBaseUrl:@"file:///var/mobile/GASGEQGQsdga3313/www/index.html" fragment:@"myfragment"];
}

- (void)testFragmentIdentifiersWithFileUrlAndMalformedFragment
{
    [self doTestFragmentIdentifiersWithBaseUrl:@"file:///var/mobile/GASGEQGQsdga3313/www/index.html" fragment:@"/var/mobile/GASGEQGQsdga3313/www/index.html"];
}

- (void)doTestFragmentIdentifiersWithBaseUrl:(NSString*)baseUrl fragment:(NSString*)fragment
{
    CDVWebViewDelegate* wvd = [[CDVWebViewDelegate alloc] initWithDelegate:nil]; // not really testing delegate handling

    NSString* originalUrlString = baseUrl;
    NSURL* originalUrl = [NSURL URLWithString:originalUrlString];
    NSURL* originalUrlWithFragmentOnly = [NSURL URLWithString:[NSString stringWithFormat:@"%@#%@", originalUrlString, fragment]];
    NSURL* originalUrlWithFragmentOnlyNoIdentifier = [NSURL URLWithString:[NSString stringWithFormat:@"%@#", originalUrlString]];
    NSURL* originalUrlWithQueryParamsAndFragment = [NSURL URLWithString:[NSString stringWithFormat:@"%@?foo=bar#%@", originalUrlString, fragment]];

    NSURLRequest* originalRequest = [NSURLRequest requestWithURL:originalUrl];
    NSURLRequest* originalRequestWithFragmentOnly = [NSURLRequest requestWithURL:originalUrlWithFragmentOnly];
    NSURLRequest* originalRequestWithFragmentOnlyNoIdentifier = [NSURLRequest requestWithURL:originalUrlWithFragmentOnlyNoIdentifier];
    NSURLRequest* originalRequestWithQueryParamsAndFragment = [NSURLRequest requestWithURL:originalUrlWithQueryParamsAndFragment];
    NSURLRequest* notOriginalRequest = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://httpd.apache.org"]];

    STAssertFalse([wvd request:originalRequest isFragmentIdentifierToRequest:originalRequest], @"originalRequest should not be a fragment of originalRequest");
    STAssertTrue([wvd request:originalRequestWithFragmentOnly isFragmentIdentifierToRequest:originalRequest], @"originalRequestWithFragment should be a fragment of originalRequest");
    STAssertTrue([wvd request:originalRequestWithFragmentOnlyNoIdentifier isFragmentIdentifierToRequest:originalRequest], @"originalRequestWithFragmentNoIdentifier should be a fragment of originalRequest");
    STAssertTrue([wvd request:originalRequestWithQueryParamsAndFragment isFragmentIdentifierToRequest:originalRequest], @"originalRequestWithQueryParamsAndFragment should be a fragment of originalRequest");
    STAssertFalse([wvd request:notOriginalRequest isFragmentIdentifierToRequest:originalRequest], @"notOriginalRequest should not be a fragment of originalRequest");

    // equality tests
    STAssertTrue([wvd request:originalRequestWithFragmentOnly isFragmentIdentifierToRequest:originalRequestWithFragmentOnly], @"originalRequestWithFragment should be a fragment of itself");
    STAssertTrue([wvd request:originalRequestWithFragmentOnlyNoIdentifier isFragmentIdentifierToRequest:originalRequestWithFragmentOnlyNoIdentifier], @"originalRequestWithFragmentNoIdentifier should be a fragment of itself");
    STAssertTrue([wvd request:originalRequestWithQueryParamsAndFragment isFragmentIdentifierToRequest:originalRequestWithQueryParamsAndFragment], @"originalRequestWithQueryParamsAndFragment should be a fragment of itself");
}

@end
