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

#import "CDVWebViewTest.h"

#import "AppDelegate.h"
#import "ViewController.h"

@interface CDVWebViewTest ()
// Runs the run loop until the webview has finished loading.
- (void)waitForPageLoad;
@end

@implementation CDVWebViewTest

@synthesize webView;

- (void)setUp
{
    [super setUp];
    // Stop tests on the first failed assertion. Having the test stop on the
    // first exception makes it much easier to identify the source of the error.
    // On iOS < 5 there is a bug in SenTestingKit where the exception is
    // uncaught and the app crashes upon a failed STAssert (oh well).
    [self raiseAfterFailure];
}

- (void)tearDown
{
    // Enforce that the view controller is released between tests to ensure
    // tests don't affect each other.
    [self.appDelegate destroyViewController];
    [super tearDown];
}

- (AppDelegate*)appDelegate
{
    return [[UIApplication sharedApplication] delegate];
}

- (CDVViewController*)viewController
{
    // Lazily create the view controller so that tests that do not require it
    // are not slowed down by it.
    if (self.appDelegate.viewController == nil) {
        [self.appDelegate createViewController];
        // Things break if tearDown is called before the page has finished
        // loading (a JS error happens and an alert pops up), so enforce a wait
        // here.
        [self waitForPageLoad];
    }
    STAssertNotNil(self.appDelegate.viewController, @"createViewController failed");
    return self.appDelegate.viewController;
}

- (UIWebView*)webView
{
    return self.viewController.webView;
}

- (id)pluginInstance:(NSString*)pluginName
{
    id ret = [self.viewController getCommandInstance:pluginName];

    STAssertNotNil(ret, @"Missing plugin %@", pluginName);
    return ret;
}

- (void)reloadWebView
{
    [self.appDelegate destroyViewController];
    [self.appDelegate createViewController];
}

- (void)waitForConditionName:(NSString*)conditionName block:(BOOL (^)())block
{
    // Number of seconds to wait for a condition to become true before giving up.
    const NSTimeInterval kConditionTimeout = 5.0;
    // Useful when debugging so that it does not timeout after one loop.
    const int kMinIterations = 4;

    NSDate* startTime = [NSDate date];
    int i = 0;

    while (!block()) {
        [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        NSTimeInterval elapsed = -[startTime timeIntervalSinceNow];
        STAssertTrue(i < kMinIterations || elapsed < kConditionTimeout,
            @"Timed out waiting for condition %@", conditionName);
        ++i;
    }
}

- (void)waitForPageLoad
{
    [self waitForConditionName:@"PageLoad" block:^{
        return [@"true" isEqualToString :[self evalJs:@"window.pageIsLoaded"]];
    }];
}

- (NSString*)evalJs:(NSString*)code
{
    return [self.webView stringByEvaluatingJavaScriptFromString:code];
}

@end
