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

#import "CDVWebViewTest.h"
#import "CDVViewController.h"
#import "AppDelegate.h"

@interface CDVUserAgentTestViewController : UIViewController
@property (nonatomic) CDVViewController* vc1;
@property (nonatomic) CDVViewController* vc2;
@end

@implementation CDVUserAgentTestViewController
@synthesize vc1 = _vc1, vc2 = _vc2;

- (void)loadView
{
    _vc1 = [[CDVViewController alloc] init];
    _vc1.wwwFolderName = @"www";
    _vc1.startPage = @"index.html";
    [self addChildViewController:_vc1];

    _vc2 = [[CDVViewController alloc] init];
    _vc2.wwwFolderName = @"www";
    _vc2.startPage = @"index.html";
    [self addChildViewController:_vc2];

    CGRect applicationFrame = [[UIScreen mainScreen] applicationFrame];
    UIView* contentView = [[UIView alloc] initWithFrame:applicationFrame];

    CGRect sub1, sub2;
    CGRectDivide(applicationFrame, &sub1, &sub2, applicationFrame.size.height / 2, CGRectMinYEdge);
    [_vc1.view setBounds:sub1];
    [_vc2.view setBounds:sub2];

    [contentView addSubview:_vc1.view];
    [contentView addSubview:_vc2.view];

    self.view = contentView;
}

@end

@interface CDVUserAgentTest : CDVWebViewTest
@end

@implementation CDVUserAgentTest

- (void)setUp
{
    [super setUp];
}

- (void)tearDown
{
    [super tearDown];
}

- (void)testMultipleViews
{
    CDVUserAgentTestViewController* rootVc = [[CDVUserAgentTestViewController alloc] init];

    self.appDelegate.window.rootViewController = rootVc;

    NSString* getUserAgentCode = @"navigator.userAgent";
    [self waitForConditionName:@"getting user-agents" block:^{
        return (BOOL)(rootVc.vc1.webView.request != nil && rootVc.vc2.webView.request != nil);
    }];
    NSString* ua1 = [rootVc.vc1.webView stringByEvaluatingJavaScriptFromString:getUserAgentCode];
    NSString* ua2 = [rootVc.vc2.webView stringByEvaluatingJavaScriptFromString:getUserAgentCode];

    STAssertFalse([ua1 isEqual:ua2], @"User-Agents should be different.");
}

@end
