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

#import "CDVWhitelist.h"

NSString* const kCDVDefaultWhitelistRejectionString = @"ERROR whitelist rejection: url='%@'";

@interface CDVWhitelist ()

@property (nonatomic, readwrite, strong) NSArray* whitelist;
@property (nonatomic, readwrite, strong) NSArray* expandedWhitelist;
@property (nonatomic, readwrite, assign) BOOL allowAll;

- (void)processWhitelist;

@end

@implementation CDVWhitelist

@synthesize whitelist, expandedWhitelist, allowAll, whitelistRejectionFormatString;

- (id)initWithArray:(NSArray*)array
{
    self = [super init];
    if (self) {
        self.whitelist = array;
        self.expandedWhitelist = nil;
        self.allowAll = NO;
        self.whitelistRejectionFormatString = kCDVDefaultWhitelistRejectionString;
        [self processWhitelist];
    }

    return self;
}

- (BOOL)isIPv4Address:(NSString*)externalHost
{
    // an IPv4 address has 4 octets b.b.b.b where b is a number between 0 and 255.
    // for our purposes, b can also be the wildcard character '*'

    // we could use a regex to solve this problem but then I would have two problems
    // anyways, this is much clearer and maintainable
    NSArray* octets = [externalHost componentsSeparatedByString:@"."];
    NSUInteger num_octets = [octets count];

    // quick check
    if (num_octets != 4) {
        return NO;
    }

    // restrict number parsing to 0-255
    NSNumberFormatter* numberFormatter = [[NSNumberFormatter alloc] init];
    [numberFormatter setMinimum:[NSNumber numberWithUnsignedInteger:0]];
    [numberFormatter setMaximum:[NSNumber numberWithUnsignedInteger:255]];

    // iterate through each octet, and test for a number between 0-255 or if it equals '*'
    for (NSUInteger i = 0; i < num_octets; ++i) {
        NSString* octet = [octets objectAtIndex:i];

        if ([octet isEqualToString:@"*"]) { // passes - check next octet
            continue;
        } else if ([numberFormatter numberFromString:octet] == nil) { // fails - not a number and not within our range, return
            return NO;
        }
    }

    return YES;
}

- (NSString*)extractHostFromUrlString:(NSString*)url
{
    NSURL* aUrl = [NSURL URLWithString:url];

    if ((aUrl != nil) && ([aUrl scheme] != nil)) { // found scheme
        return [aUrl host];
    } else {
        return url;
    }
}

- (void)processWhitelist
{
    if (self.whitelist == nil) {
        NSLog(@"ERROR: CDVWhitelist was not initialized properly, all urls will be disallowed.");
        return;
    }

    NSMutableArray* expanded = [NSMutableArray arrayWithCapacity:[self.whitelist count]];

    // iterate through settings ExternalHosts, check for equality
    NSEnumerator* enumerator = [self.whitelist objectEnumerator];
    id externalHost = nil;

    // only allow known TLDs (since Aug 23rd 2011), and two character country codes
    // does not match internationalized domain names with non-ASCII characters
    NSString* tld_match = @"(aero|asia|arpa|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|xxx|[a-z][a-z])";

    while (externalHost = [enumerator nextObject]) {
        NSString* regex = [self extractHostFromUrlString:externalHost];
        BOOL is_ip = [self isIPv4Address:regex];

        // check for single wildcard '*', if found set allowAll to YES
        if ([regex isEqualToString:@"*"]) {
            self.allowAll = YES;
            self.expandedWhitelist = [NSArray arrayWithObject:regex];
            break;
        }

        // starts with wildcard match - we make the first '.' optional (so '*.org.apache.cordova' will match 'org.apache.cordova')
        NSString* prefix = @"*.";
        if ([regex hasPrefix:prefix]) {
            // replace the first two characters '*.' with our regex
            regex = [regex stringByReplacingCharactersInRange:NSMakeRange(0, [prefix length]) withString:@"(\\s{0}|*.)"]; // the '*' and '.' will be substituted later
        }

        // ends with wildcard match for TLD
        if (!is_ip && [regex hasSuffix:@".*"]) {
            // replace * with tld_match
            regex = [regex stringByReplacingCharactersInRange:NSMakeRange([regex length] - 1, 1) withString:tld_match];
        }
        // escape periods - since '.' means any character in regex
        regex = [regex stringByReplacingOccurrencesOfString:@"." withString:@"\\."];
        // wildcard is match 1 or more characters (to make it simple, since we are not doing verification whether the hostname is valid)
        regex = [regex stringByReplacingOccurrencesOfString:@"*" withString:@".*"];

        [expanded addObject:regex];
    }

    self.expandedWhitelist = expanded;
}

- (BOOL)schemeIsAllowed:(NSString*)scheme
{
    return [scheme isEqualToString:@"http"] ||
           [scheme isEqualToString:@"https"] ||
           [scheme isEqualToString:@"ftp"] ||
           [scheme isEqualToString:@"ftps"];
}

- (BOOL)URLIsAllowed:(NSURL*)url
{
    if (self.expandedWhitelist == nil) {
        return NO;
    }

    if (self.allowAll) {
        return YES;
    }

    // iterate through settings ExternalHosts, check for equality
    NSEnumerator* enumerator = [self.expandedWhitelist objectEnumerator];
    id regex = nil;
    NSString* urlHost = [url host];

    // if the url host IS found in the whitelist, load it in the app (however UIWebViewNavigationTypeOther kicks it out to Safari)
    // if the url host IS NOT found in the whitelist, we do nothing
    while (regex = [enumerator nextObject]) {
        NSPredicate* regex_test = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", regex];

        if ([regex_test evaluateWithObject:urlHost] == YES) {
            // if it matches at least one rule, return
            return YES;
        }
    }

    NSLog(@"%@", [self errorStringForURL:url]);
    // if we got here, the url host is not in the white-list, do nothing
    return NO;
}

- (NSString*)errorStringForURL:(NSURL*)url
{
    return [NSString stringWithFormat:self.whitelistRejectionFormatString, [url absoluteString]];
}

@end
