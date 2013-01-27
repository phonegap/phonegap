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

#import "CDVUserAgentUtil.h"

#import <UIKit/UIKit.h>

static NSString* gOriginalUserAgent = nil;
static NSString* kCdvUserAgentKey = @"Cordova-User-Agent";
static NSString* kCdvUserAgentVersionKey = @"Cordova-User-Agent-Version";

@implementation CDVUserAgentUtil

+ (NSString*)originalUserAgent
{
    if (gOriginalUserAgent == nil) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onAppLocaleDidChange:)
                                                     name:NSCurrentLocaleDidChangeNotification object:nil];

        NSUserDefaults* userDefaults = [NSUserDefaults standardUserDefaults];
        NSString* systemVersion = [[UIDevice currentDevice] systemVersion];
        NSString* localeStr = [[NSLocale currentLocale] localeIdentifier];
        NSString* systemAndLocale = [NSString stringWithFormat:@"%@ %@", systemVersion, localeStr];

        NSString* cordovaUserAgentVersion = [userDefaults stringForKey:kCdvUserAgentVersionKey];
        gOriginalUserAgent = [userDefaults stringForKey:kCdvUserAgentKey];
        BOOL cachedValueIsOld = ![systemAndLocale isEqualToString:cordovaUserAgentVersion];

        if ((gOriginalUserAgent == nil) || cachedValueIsOld) {
            UIWebView* sampleWebView = [[UIWebView alloc] initWithFrame:CGRectZero];
            gOriginalUserAgent = [sampleWebView stringByEvaluatingJavaScriptFromString:@"navigator.userAgent"];

            [userDefaults setObject:gOriginalUserAgent forKey:kCdvUserAgentKey];
            [userDefaults setObject:systemAndLocale forKey:kCdvUserAgentVersionKey];

            [userDefaults synchronize];
        }
    }
    return gOriginalUserAgent;
}

+ (void)setUserAgent:(NSString*)newValue
{
    // Setting the UserAgent must occur before a UIWebView is instantiated.
    // It is read per instantiation, so it does not affect previously created views.
    // Except! When a PDF is loaded, all currently active UIWebViews reload their
    // User-Agent from the NSUserDefaults some time after the DidFinishLoad of the PDF bah!
    NSDictionary* dict = [[NSDictionary alloc] initWithObjectsAndKeys:newValue, @"UserAgent", nil];

    [[NSUserDefaults standardUserDefaults] registerDefaults:dict];
}

+ (void)onAppLocaleDidChange:(NSNotification*)notification
{
    // TODO: We should figure out how to update the user-agent of existing UIWebViews when this happens.
    // Maybe use the PDF bug (noted in setUserAgent:).
    gOriginalUserAgent = nil;
}

@end
