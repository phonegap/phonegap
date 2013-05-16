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

#import "MainViewController.h"

@interface MainViewController ()

@end

@implementation MainViewController

- (id)initWithWindow:(NSWindow *)window
{
    self = [super initWithWindow:window];
    if (self) {
        // Initialization code here.
    }
    
    return self;
}

- (id)initWithWindowNibName:(NSString*)nibNameOrNil
{
    self = [super initWithWindowNibName:nibNameOrNil];
    if (self) {
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[MainCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[MainCommandQueue alloc] initWithViewController:self];
    }
    return self;
}


- (id)init
{
    self = [super init];
    if (self) {
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[MainCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[MainCommandQueue alloc] initWithViewController:self];
    }
    return self;
}


- (void)awakeFromNib
{
    [super awakeFromNib];
    
    // Implement this method to handle any initialization after your window controller's window has been loaded from its nib file.

    // enable HTML5 webStorage
    WebPreferences* prefs = [self.webView preferences];
    if ([prefs respondsToSelector:@selector(_setLocalStorageDatabasePath:)]) {
        NSString* webStoragePath = @"~/Library/Application Support/__TESTING__";
        [prefs performSelector:@selector(_setLocalStorageDatabasePath:) withObject:webStoragePath];
        NSLog(@"WebStoragePath is '%@', modify in MainViewController.m.", webStoragePath);
    }
    if ([prefs respondsToSelector:@selector(setLocalStorageEnabled:)]) {
        [prefs performSelector:@selector(setLocalStorageEnabled:) withObject:[NSNumber numberWithBool:YES]];
    }
}

@end

@implementation MainCommandDelegate

/* To override the methods, uncomment the line in the init function(s)
 in MainViewController.m
 */

#pragma mark CDVCommandDelegate implementation

- (id)getCommandInstance:(NSString*)className
{
    return [super getCommandInstance:className];
}

/*
 NOTE: this will only inspect execute calls coming explicitly from native plugins,
 not the commandQueue (from JavaScript). To see execute calls from JavaScript, see
 MainCommandQueue below
 */
- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}

- (NSString*)pathForResource:(NSString*)resourcepath;
{
    return [super pathForResource:resourcepath];
}

@end

@implementation MainCommandQueue

/* To override, uncomment the line in the init function(s)
 in MainViewController.m
 */
- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}

@end

