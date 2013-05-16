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


#import "CDVWebViewDelegate.h"
#import "CDVConsole.h"
#import "CDVBridge.h"

@implementation CDVWebViewDelegate

@synthesize console;

- (void)webView:(WebView*)webView didClearWindowObject:(WebScriptObject*)windowScriptObject forFrame:(WebFrame*)frame
{
	if (self.console == nil) {
        self.console = [CDVConsole new];
    }
	[windowScriptObject setValue:self.console forKey:@"console"];
	
	if (self.bridge == nil) {
        self.bridge = [[CDVBridge alloc] initWithWebView:webView andViewController:self.viewController];
    }
    [windowScriptObject setValue:self.bridge forKey:@"cordovabridge"];
}

- (void)webView:(WebView*)sender didFinishLoadForFrame:(WebFrame*)frame
{
    id win = [sender windowScriptObject];
    NSString* nativeReady = @"try{cordova.require('cordova/channel').onNativeReady.fire();}catch(e){window._nativeReady = true;}";
    [win evaluateWebScript:nativeReady];
}

- (void) webView:(WebView*)webView addMessageToConsole:(NSDictionary*)message
{
	if (![message isKindOfClass:[NSDictionary class]]) { 
		return;
	}
	
	NSLog(@"JavaScript error: %@:%@: %@", 
		  [[message objectForKey:@"sourceURL"] lastPathComponent],	// could be nil
		  [message objectForKey:@"lineNumber"],
		  [message objectForKey:@"message"]);
}

#pragma mark WebScripting protocol

/* checks whether a selector is acceptable to be called from JavaScript */
+ (BOOL) isSelectorExcludedFromWebScript:(SEL)selector
{
	return YES;
}

// right now exclude all properties (eg keys)
+ (BOOL) isKeyExcludedFromWebScript:(const char*)name
{
	return YES;
}

#pragma mark WebPolicyDelegate

- (void)webView:(WebView *)sender decidePolicyForNavigationAction:(NSDictionary *)actionInformation request:(NSURLRequest *)request frame:(WebFrame *)frame decisionListener:(id<WebPolicyDecisionListener>)listener
{	
    NSString* url = [[request URL] description];
    NSLog(@"navigating to %@", url);

    [listener use];
}


#pragma mark WebUIDelegate

- (BOOL)webView:(WebView*)sender runBeforeUnloadConfirmPanelWithMessage:(NSString*)message initiatedByFrame:(WebFrame*)frame
{
    return [self webView:sender runJavaScriptConfirmPanelWithMessage:message initiatedByFrame:frame];
}

- (void)webView:(WebView *)sender runOpenPanelForFileButtonWithResultListener:(id < WebOpenPanelResultListener >)resultListener allowMultipleFiles:(BOOL)allowMultipleFiles
{
    NSOpenPanel* dialog = [NSOpenPanel openPanel];
    
    [dialog setCanChooseFiles:YES];
    [dialog setAllowsMultipleSelection:allowMultipleFiles];
    [dialog setCanChooseDirectories:YES];
    
    if ([dialog runModal] == NSOKButton) {
        [resultListener chooseFilenames:[[dialog URLs] valueForKey:@"relativePath"]];
    }
}

- (void)webView:(WebView*)sender runOpenPanelForFileButtonWithResultListener:(id<WebOpenPanelResultListener>)resultListener
{
    [self webView:sender runOpenPanelForFileButtonWithResultListener:resultListener allowMultipleFiles:NO];
}

- (void)webView:(WebView*)sender runJavaScriptAlertPanelWithMessage:(NSString*)message initiatedByFrame:(WebFrame*)frame
{
    NSAlert* alert = [[NSAlert alloc] init];
    [alert addButtonWithTitle:NSLocalizedString(@"OK", @"")];
    [alert setMessageText:message];
    
    [alert runModal];
}

- (BOOL)webView:(WebView*)sender runJavaScriptConfirmPanelWithMessage:(NSString*)message initiatedByFrame:(WebFrame*)frame
{
    NSAlert* alert = [[NSAlert alloc] init];
    [alert addButtonWithTitle:NSLocalizedString(@"OK", @"")];
    [alert addButtonWithTitle:NSLocalizedString(@"Cancel", @"")];
    [alert setMessageText:message];
    
    return ([alert runModal] == NSAlertFirstButtonReturn);
}

- (NSString*)webView:(WebView*)sender runJavaScriptTextInputPanelWithPrompt:(NSString*)prompt defaultText:(NSString*)defaultText initiatedByFrame:(WebFrame*)frame
{
    NSAlert* alert = [NSAlert alertWithMessageText:prompt
                                     defaultButton:NSLocalizedString(@"OK", @"")
                                   alternateButton:NSLocalizedString(@"Cancel", @"")
                                       otherButton:nil
                         informativeTextWithFormat:@""];
    
    NSTextField* input = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 0, 300, 24)];
    [input setStringValue:defaultText];
    [alert setAccessoryView:input];
    
    NSInteger button = [alert runModal];
    if (button == NSAlertDefaultReturn) {
        [input validateEditing];
        return [input stringValue];
    }
    
    return nil;
}

@end
