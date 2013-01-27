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

#import <objc/message.h>
#import "CDV.h"
#import "CDVCommandQueue.h"
#import "CDVCommandDelegateImpl.h"
#import "CDVConfigParser.h"
#import "CDVUserAgentUtil.h"

#define degreesToRadian(x) (M_PI * (x) / 180.0)

@interface CDVViewController ()

@property (nonatomic, readwrite, strong) NSXMLParser* configParser;
@property (nonatomic, readwrite, strong) NSDictionary* settings;
@property (nonatomic, readwrite, strong) CDVWhitelist* whitelist;
@property (nonatomic, readwrite, strong) NSMutableDictionary* pluginObjects;
@property (nonatomic, readwrite, strong) NSDictionary* pluginsMap;
@property (nonatomic, readwrite, strong) NSArray* supportedOrientations;
@property (nonatomic, readwrite, assign) BOOL loadFromString;

@property (nonatomic, readwrite, strong) IBOutlet UIActivityIndicatorView* activityView;
@property (nonatomic, readwrite, strong) UIImageView* imageView;
@property (readwrite, assign) BOOL initialized;

@property (atomic, strong) NSURL* openURL;

@end

@implementation CDVViewController

@synthesize webView, supportedOrientations;
@synthesize pluginObjects, pluginsMap, whitelist;
@synthesize configParser, settings, loadFromString;
@synthesize imageView, activityView, useSplashScreen;
@synthesize wwwFolderName, startPage, initialized, openURL;
@synthesize commandDelegate = _commandDelegate;
@synthesize commandQueue = _commandQueue;

- (void)__init
{
    if ((self != nil) && !self.initialized) {
        _commandQueue = [[CDVCommandQueue alloc] initWithViewController:self];
        _commandDelegate = [[CDVCommandDelegateImpl alloc] initWithViewController:self];
        [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(receivedOrientationChange)
                                                     name:UIDeviceOrientationDidChangeNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onAppWillTerminate:)
                                                     name:UIApplicationWillTerminateNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onAppWillResignActive:)
                                                     name:UIApplicationWillResignActiveNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onAppDidBecomeActive:)
                                                     name:UIApplicationDidBecomeActiveNotification object:nil];

        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onAppWillEnterForeground:)
                                                     name:UIApplicationWillEnterForegroundNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onAppDidEnterBackground:)
                                                     name:UIApplicationDidEnterBackgroundNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleOpenURL:) name:CDVPluginHandleOpenURLNotification object:nil];

        // read from UISupportedInterfaceOrientations (or UISupportedInterfaceOrientations~iPad, if its iPad) from -Info.plist
        self.supportedOrientations = [self parseInterfaceOrientations:
            [[[NSBundle mainBundle] infoDictionary] objectForKey:@"UISupportedInterfaceOrientations"]];

        [self printMultitaskingInfo];
        [self printDeprecationNotice];
        self.initialized = YES;

        // load config.xml settings
        [self loadSettings];
    }
}

- (id)initWithNibName:(NSString*)nibNameOrNil bundle:(NSBundle*)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    [self __init];
    return self;
}

- (id)init
{
    self = [super init];
    [self __init];
    return self;
}

- (void)printDeprecationNotice
{
    if (!IsAtLeastiOSVersion(@"5.0")) {
        NSLog(@"CRITICAL: For Cordova 2.0, you will need to upgrade to at least iOS 5.0 or greater. Your current version of iOS is %@.",
            [[UIDevice currentDevice] systemVersion]
            );
    }
}

- (void)printMultitaskingInfo
{
    UIDevice* device = [UIDevice currentDevice];
    BOOL backgroundSupported = NO;

    if ([device respondsToSelector:@selector(isMultitaskingSupported)]) {
        backgroundSupported = device.multitaskingSupported;
    }

    NSNumber* exitsOnSuspend = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIApplicationExitsOnSuspend"];
    if (exitsOnSuspend == nil) { // if it's missing, it should be NO (i.e. multi-tasking on by default)
        exitsOnSuspend = [NSNumber numberWithBool:NO];
    }

    NSLog(@"Multi-tasking -> Device: %@, App: %@", (backgroundSupported ? @"YES" : @"NO"), (![exitsOnSuspend intValue]) ? @"YES" : @"NO");
}

- (BOOL)URLisAllowed:(NSURL*)url
{
    if (self.whitelist == nil) {
        return YES;
    }

    return [self.whitelist URLIsAllowed:url];
}

- (void)loadSettings
{
    CDVConfigParser* delegate = [[CDVConfigParser alloc] init];

    // read from config.xml in the app bundle
    NSString* path = [[NSBundle mainBundle] pathForResource:@"config" ofType:@"xml"];

    if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSAssert(NO, @"ERROR: config.xml does not exist. Please run cordova-ios/bin/cordova_plist_to_config_xml path/to/project.");
        return;
    }

    NSURL* url = [NSURL fileURLWithPath:path];

    configParser = [[NSXMLParser alloc] initWithContentsOfURL:url];
    if (configParser == nil) {
        NSLog(@"Failed to initialize XML parser.");
        return;
    }
    [configParser setDelegate:((id < NSXMLParserDelegate >)delegate)];
    [configParser parse];

    // Get the plugin dictionary, whitelist and settings from the delegate.
    self.pluginsMap = [delegate.pluginsDict dictionaryWithLowercaseKeys];
    self.whitelist = [[CDVWhitelist alloc] initWithArray:delegate.whitelistHosts];
    self.settings = delegate.settings;

    // And the start folder/page.
    self.wwwFolderName = @"www";
    self.startPage = [delegate getStartPage];

    // Initialize the plugin objects dict.
    self.pluginObjects = [[NSMutableDictionary alloc] initWithCapacity:4];
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad
{
    [super viewDidLoad];

    NSURL* appURL = nil;
    NSString* loadErr = nil;

    if ([self.startPage rangeOfString:@"://"].location != NSNotFound) {
        appURL = [NSURL URLWithString:self.startPage];
    } else if ([self.wwwFolderName rangeOfString:@"://"].location != NSNotFound) {
        appURL = [NSURL URLWithString:[NSString stringWithFormat:@"%@/%@", self.wwwFolderName, self.startPage]];
    } else {
        NSString* startFilePath = [self.commandDelegate pathForResource:self.startPage];
        if (startFilePath == nil) {
            loadErr = [NSString stringWithFormat:@"ERROR: Start Page at '%@/%@' was not found.", self.wwwFolderName, self.startPage];
            NSLog(@"%@", loadErr);
            self.loadFromString = YES;
            appURL = nil;
        } else {
            appURL = [NSURL fileURLWithPath:startFilePath];
        }
    }

    // // Fix the iOS 5.1 SECURITY_ERR bug (CB-347), this must be before the webView is instantiated ////

    NSString* backupWebStorageType = @"cloud"; // default value

    id backupWebStorage = [self.settings objectForKey:@"BackupWebStorage"];
    if ([backupWebStorage isKindOfClass:[NSString class]]) {
        backupWebStorageType = backupWebStorage;
    } else if ([backupWebStorage isKindOfClass:[NSNumber class]]) {
        NSLog(@"Deprecated: BackupWebStorage boolean property is a string property now (none, local, cloud). A boolean value of 'true' will be mapped to 'cloud'. Consult the docs: http://docs.cordova.io/en/edge/guide_project-settings_ios_index.md.html#Project%%20Settings%%20for%%20iOS");
        backupWebStorageType = [(NSNumber*) backupWebStorage boolValue] ? @"cloud" : @"none";
    }

    if (IsAtLeastiOSVersion(@"5.1")) {
        [CDVLocalStorage __fixupDatabaseLocationsWithBackupType:backupWebStorageType];
    }

    // // Instantiate the WebView ///////////////

    [self createGapView];

    // /////////////////

    NSNumber* enableLocation = [self.settings objectForKey:@"EnableLocation"];
    NSString* enableViewportScale = [self.settings objectForKey:@"EnableViewportScale"];
    NSNumber* allowInlineMediaPlayback = [self.settings objectForKey:@"AllowInlineMediaPlayback"];
    BOOL mediaPlaybackRequiresUserAction = YES;  // default value
    if ([self.settings objectForKey:@"MediaPlaybackRequiresUserAction"]) {
        mediaPlaybackRequiresUserAction = [(NSNumber*)[settings objectForKey:@"MediaPlaybackRequiresUserAction"] boolValue];
    }

    self.webView.scalesPageToFit = [enableViewportScale boolValue];

    /*
     * Fire up the GPS Service right away as it takes a moment for data to come back.
     */

    if ([enableLocation boolValue]) {
        [[self.commandDelegate getCommandInstance:@"Geolocation"] getLocation:[CDVInvokedUrlCommand new]];
    }

    /*
     * Fire up CDVLocalStorage to work-around WebKit storage limitations: on all iOS 5.1+ versions for local-only backups, but only needed on iOS 5.1 for cloud backup.
     */
    if (IsAtLeastiOSVersion(@"5.1") && (([backupWebStorageType isEqualToString:@"local"]) ||
            ([backupWebStorageType isEqualToString:@"cloud"] && !IsAtLeastiOSVersion(@"6.0")))) {
        [self registerPlugin:[[CDVLocalStorage alloc] initWithWebView:self.webView settings:[NSDictionary dictionaryWithObjectsAndKeys:
                    @"backupType", backupWebStorageType, nil]] withClassName:NSStringFromClass([CDVLocalStorage class])];
    }

    /*
     * This is for iOS 4.x, where you can allow inline <video> and <audio>, and also autoplay them
     */
    if ([allowInlineMediaPlayback boolValue] && [self.webView respondsToSelector:@selector(allowsInlineMediaPlayback)]) {
        self.webView.allowsInlineMediaPlayback = YES;
    }
    if ((mediaPlaybackRequiresUserAction == NO) && [self.webView respondsToSelector:@selector(mediaPlaybackRequiresUserAction)]) {
        self.webView.mediaPlaybackRequiresUserAction = NO;
    }

    // UIWebViewBounce property - defaults to true
    NSNumber* bouncePreference = [self.settings objectForKey:@"UIWebViewBounce"];
    BOOL bounceAllowed = (bouncePreference == nil || [bouncePreference boolValue]);

    // prevent webView from bouncing
    // based on UIWebViewBounce key in config.xml
    if (!bounceAllowed) {
        if ([self.webView respondsToSelector:@selector(scrollView)]) {
            ((UIScrollView*)[self.webView scrollView]).bounces = NO;
        } else {
            for (id subview in self.webView.subviews) {
                if ([[subview class] isSubclassOfClass:[UIScrollView class]]) {
                    ((UIScrollView*)subview).bounces = NO;
                }
            }
        }
    }

    /*
     * iOS 6.0 UIWebView properties
     */
    if (IsAtLeastiOSVersion(@"6.0")) {
        BOOL keyboardDisplayRequiresUserAction = YES; // KeyboardDisplayRequiresUserAction - defaults to YES
        if ([self.settings objectForKey:@"KeyboardDisplayRequiresUserAction"] != nil) {
            if ([self.settings objectForKey:@"KeyboardDisplayRequiresUserAction"]) {
                keyboardDisplayRequiresUserAction = [(NSNumber*)[self.settings objectForKey:@"KeyboardDisplayRequiresUserAction"] boolValue];
            }
        }

        // property check for compiling under iOS < 6
        if ([self.webView respondsToSelector:@selector(setKeyboardDisplayRequiresUserAction:)]) {
            [self.webView setValue:[NSNumber numberWithBool:keyboardDisplayRequiresUserAction] forKey:@"keyboardDisplayRequiresUserAction"];
        }

        BOOL suppressesIncrementalRendering = NO; // SuppressesIncrementalRendering - defaults to NO
        if ([self.settings objectForKey:@"SuppressesIncrementalRendering"] != nil) {
            if ([self.settings objectForKey:@"SuppressesIncrementalRendering"]) {
                suppressesIncrementalRendering = [(NSNumber*)[self.settings objectForKey:@"SuppressesIncrementalRendering"] boolValue];
            }
        }

        // property check for compiling under iOS < 6
        if ([self.webView respondsToSelector:@selector(setSuppressesIncrementalRendering:)]) {
            [self.webView setValue:[NSNumber numberWithBool:suppressesIncrementalRendering] forKey:@"suppressesIncrementalRendering"];
        }
    }

    // /////////////////

    if (!loadErr) {
        NSURLRequest* appReq = [NSURLRequest requestWithURL:appURL cachePolicy:NSURLRequestUseProtocolCachePolicy timeoutInterval:20.0];
        [self.webView loadRequest:appReq];
    } else {
        NSString* html = [NSString stringWithFormat:@"<html><body> %@ </body></html>", loadErr];
        [self.webView loadHTMLString:html baseURL:nil];
    }
}

- (NSArray*)parseInterfaceOrientations:(NSArray*)orientations
{
    NSMutableArray* result = [[NSMutableArray alloc] init];

    if (orientations != nil) {
        NSEnumerator* enumerator = [orientations objectEnumerator];
        NSString* orientationString;

        while (orientationString = [enumerator nextObject]) {
            if ([orientationString isEqualToString:@"UIInterfaceOrientationPortrait"]) {
                [result addObject:[NSNumber numberWithInt:UIInterfaceOrientationPortrait]];
            } else if ([orientationString isEqualToString:@"UIInterfaceOrientationPortraitUpsideDown"]) {
                [result addObject:[NSNumber numberWithInt:UIInterfaceOrientationPortraitUpsideDown]];
            } else if ([orientationString isEqualToString:@"UIInterfaceOrientationLandscapeLeft"]) {
                [result addObject:[NSNumber numberWithInt:UIInterfaceOrientationLandscapeLeft]];
            } else if ([orientationString isEqualToString:@"UIInterfaceOrientationLandscapeRight"]) {
                [result addObject:[NSNumber numberWithInt:UIInterfaceOrientationLandscapeRight]];
            }
        }
    }

    // default
    if ([result count] == 0) {
        [result addObject:[NSNumber numberWithInt:UIInterfaceOrientationPortrait]];
    }

    return result;
}

- (NSInteger)mapIosOrientationToJsOrientation:(UIInterfaceOrientation)orientation
{
    switch (orientation) {
        case UIInterfaceOrientationPortraitUpsideDown:
            return 180;

        case UIInterfaceOrientationLandscapeLeft:
            return -90;

        case UIInterfaceOrientationLandscapeRight:
            return 90;

        case UIInterfaceOrientationPortrait:
            return 0;

        default:
            return 0;
    }
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // First, ask the webview via JS if it supports the new orientation
    NSString* jsCall = [NSString stringWithFormat:
        @"window.shouldRotateToOrientation && window.shouldRotateToOrientation(%d);"
        , [self mapIosOrientationToJsOrientation:interfaceOrientation]];
    NSString* res = [webView stringByEvaluatingJavaScriptFromString:jsCall];

    if ([res length] > 0) {
        return [res boolValue];
    }

    // if js did not handle the new orientation (no return value), use values from the plist (via supportedOrientations)
    return [self supportsOrientation:interfaceOrientation];
}

- (BOOL)shouldAutorotate
{
    return YES;
}

- (NSUInteger)supportedInterfaceOrientations
{
    NSUInteger ret = 0;

    if ([self shouldAutorotateToInterfaceOrientation:UIInterfaceOrientationPortrait]) {
        ret = ret | (1 << UIInterfaceOrientationPortrait);
    }
    if ([self shouldAutorotateToInterfaceOrientation:UIInterfaceOrientationPortraitUpsideDown]) {
        ret = ret | (1 << UIInterfaceOrientationPortraitUpsideDown);
    }
    if ([self shouldAutorotateToInterfaceOrientation:UIInterfaceOrientationLandscapeRight]) {
        ret = ret | (1 << UIInterfaceOrientationLandscapeRight);
    }
    if ([self shouldAutorotateToInterfaceOrientation:UIInterfaceOrientationLandscapeLeft]) {
        ret = ret | (1 << UIInterfaceOrientationLandscapeLeft);
    }

    return ret;
}

- (BOOL)supportsOrientation:(UIInterfaceOrientation)orientation
{
    return [self.supportedOrientations containsObject:[NSNumber numberWithInt:orientation]];
}

- (UIWebView*)newCordovaViewWithFrame:(CGRect)bounds
{
    return [[UIWebView alloc] initWithFrame:bounds];
}

- (NSString*)userAgent
{
    if (_userAgent == nil) {
        NSString* originalUserAgent = [CDVUserAgentUtil originalUserAgent];
        // Use our address as a unique number to append to the User-Agent.
        _userAgent = [NSString stringWithFormat:@"%@ (%lld)", originalUserAgent, (long long)self];
    }
    return _userAgent;
}

- (void)createGapView
{
    CGRect webViewBounds = self.view.bounds;

    webViewBounds.origin = self.view.bounds.origin;

    if (!self.webView) {
        [CDVUserAgentUtil setUserAgent:self.userAgent];

        self.webView = [self newCordovaViewWithFrame:webViewBounds];
        self.webView.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);

        [self.view addSubview:self.webView];
        [self.view sendSubviewToBack:self.webView];

        self.webView.delegate = self;

        // register this viewcontroller with the NSURLProtocol, only after the User-Agent is set
        [CDVURLProtocol registerViewController:self];
    }
}

- (void)didReceiveMemoryWarning
{
    // iterate through all the plugin objects, and call hasPendingOperation
    // if at least one has a pending operation, we don't call [super didReceiveMemoryWarning]

    NSEnumerator* enumerator = [self.pluginObjects objectEnumerator];
    CDVPlugin* plugin;

    BOOL doPurge = YES;

    while ((plugin = [enumerator nextObject])) {
        if (plugin.hasPendingOperation) {
            NSLog(@"Plugin '%@' has a pending operation, memory purge is delayed for didReceiveMemoryWarning.", NSStringFromClass([plugin class]));
            doPurge = NO;
        }
    }

    if (doPurge) {
        // Releases the view if it doesn't have a superview.
        [super didReceiveMemoryWarning];
    }

    // Release any cached data, images, etc. that aren't in use.
}

- (void)viewDidUnload
{
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;

    self.webView.delegate = nil;
    self.webView = nil;
}

#pragma mark UIWebViewDelegate

/**
 When web application loads Add stuff to the DOM, mainly the user-defined settings from the Settings.plist file, and
 the device's data such as device ID, platform version, etc.
 */
- (void)webViewDidStartLoad:(UIWebView*)theWebView
{
    [_commandQueue resetRequestId];
    [[NSNotificationCenter defaultCenter] postNotification:[NSNotification notificationWithName:CDVPluginResetNotification object:nil]];
}

/**
 Called when the webview finishes loading.  This stops the activity view and closes the imageview
 */
- (void)webViewDidFinishLoad:(UIWebView*)theWebView
{
    /*
     * Hide the Top Activity THROBBER in the Battery Bar
     */
    [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];

    id autoHideSplashScreenValue = [self.settings objectForKey:@"AutoHideSplashScreen"];
    // if value is missing, default to yes
    if ((autoHideSplashScreenValue == nil) || [autoHideSplashScreenValue boolValue]) {
        self.imageView.hidden = YES;
        self.activityView.hidden = YES;
        [self.view.superview bringSubviewToFront:self.webView];
    }
    [self didRotateFromInterfaceOrientation:(UIInterfaceOrientation)[[UIDevice currentDevice] orientation]];

    // The .onNativeReady().fire() will work when cordova.js is already loaded.
    // The _nativeReady = true; is used when this is run before cordova.js is loaded.
    NSString* nativeReady = @"try{cordova.require('cordova/channel').onNativeReady.fire();}catch(e){window._nativeReady = true;}";
    // Don't use [commandDelegate evalJs] here since it relies on cordova.js being loaded already.
    [self.webView stringByEvaluatingJavaScriptFromString:nativeReady];

    [self processOpenUrl];
}

- (void)webView:(UIWebView*)webView didFailLoadWithError:(NSError*)error
{
    NSLog(@"Failed to load webpage with error: %@", [error localizedDescription]);

    /*
     if ([error code] != NSURLErrorCancelled)
     alert([error localizedDescription]);
     */
}

- (BOOL)webView:(UIWebView*)theWebView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType
{
    NSURL* url = [request URL];

    /*
     * Execute any commands queued with cordova.exec() on the JS side.
     * The part of the URL after gap:// is irrelevant.
     */
    if ([[url scheme] isEqualToString:@"gap"]) {
        [_commandQueue fetchCommandsFromJs];
        return NO;
    }

    /*
     * If a URL is being loaded that's a file/http/https URL, just load it internally
     */
    else if ([url isFileURL]) {
        return YES;
    }

    /*
     *    If we loaded the HTML from a string, we let the app handle it
     */
    else if (self.loadFromString == YES) {
        self.loadFromString = NO;
        return YES;
    }

    /*
     * all tel: scheme urls we let the UIWebview handle it using the default behavior
     */
    else if ([[url scheme] isEqualToString:@"tel"]) {
        return YES;
    }

    /*
     * all about: scheme urls are not handled
     */
    else if ([[url scheme] isEqualToString:@"about"]) {
        return NO;
    }

    /*
     * all data: scheme urls are handled
     */
    else if ([[url scheme] isEqualToString:@"data"]) {
        return YES;
    }

    /*
     * Handle all other types of urls (tel:, sms:), and requests to load a url in the main webview.
     */
    else {
        // BOOL isIFrame = ([theWebView.request.mainDocumentURL absoluteString] == nil);

        if ([self.whitelist schemeIsAllowed:[url scheme]]) {
            return [self.whitelist URLIsAllowed:url];
        } else {
            if ([[UIApplication sharedApplication] canOpenURL:url]) {
                [[UIApplication sharedApplication] openURL:url];
            } else { // handle any custom schemes to plugins
                [[NSNotificationCenter defaultCenter] postNotification:[NSNotification notificationWithName:CDVPluginHandleOpenURLNotification object:url]];
            }
        }

        return NO;
    }

    return YES;
}

#pragma mark GapHelpers

- (void)javascriptAlert:(NSString*)text
{
    NSString* jsString = [NSString stringWithFormat:@"alert('%@');", text];

    [self.commandDelegate evalJs:jsString];
}

+ (NSString*)resolveImageResource:(NSString*)resource
{
    NSString* systemVersion = [[UIDevice currentDevice] systemVersion];
    BOOL isLessThaniOS4 = ([systemVersion compare:@"4.0" options:NSNumericSearch] == NSOrderedAscending);

    // the iPad image (nor retina) differentiation code was not in 3.x, and we have to explicitly set the path
    if (isLessThaniOS4) {
        if (CDV_IsIPad()) {
            return [NSString stringWithFormat:@"%@~ipad.png", resource];
        } else {
            return [NSString stringWithFormat:@"%@.png", resource];
        }
    }

    return resource;
}

+ (NSString*)applicationDocumentsDirectory
{
    NSArray* paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString* basePath = ([paths count] > 0) ? [paths objectAtIndex:0] : nil;

    return basePath;
}

- (void)showSplashScreen
{
    CGRect screenBounds = [[UIScreen mainScreen] bounds];
    NSString* launchImageFile = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UILaunchImageFile"];

    if (launchImageFile == nil) { // fallback if no launch image was specified
        if (CDV_IsIPhone5()) {
            // iPhone 5 or iPod Touch 6th-gen
            launchImageFile = @"Default-568h";
        } else {
            launchImageFile = @"Default";
        }
    }

    NSString* orientedLaunchImageFile = nil;
    CGAffineTransform startupImageTransform = CGAffineTransformIdentity;
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
    CGRect statusBarFrame = [UIApplication sharedApplication].statusBarFrame;
    UIInterfaceOrientation statusBarOrientation = [UIApplication sharedApplication].statusBarOrientation;
    UIImage* launchImage = nil;

    // default to center of screen as in the original implementation. This will produce the 20px jump
    CGPoint center = CGPointMake((screenBounds.size.width / 2), (screenBounds.size.height / 2));

    if (CDV_IsIPad()) {
        if (!UIDeviceOrientationIsValidInterfaceOrientation(deviceOrientation)) {
            deviceOrientation = (UIDeviceOrientation)statusBarOrientation;
        }

        switch (deviceOrientation) {
            case UIDeviceOrientationLandscapeLeft: // this is where the home button is on the right (yeah, I know, confusing)
                {
                    orientedLaunchImageFile = [NSString stringWithFormat:@"%@-Landscape", launchImageFile];
                    startupImageTransform = CGAffineTransformMakeRotation(degreesToRadian(90));
                    center.x -= MIN(statusBarFrame.size.width, statusBarFrame.size.height) / 2;
                }
                break;

            case UIDeviceOrientationLandscapeRight: // this is where the home button is on the left (yeah, I know, confusing)
                {
                    orientedLaunchImageFile = [NSString stringWithFormat:@"%@-Landscape", launchImageFile];
                    startupImageTransform = CGAffineTransformMakeRotation(degreesToRadian(-90));
                    center.x += MIN(statusBarFrame.size.width, statusBarFrame.size.height) / 2;
                }
                break;

            case UIDeviceOrientationPortraitUpsideDown:
                {
                    orientedLaunchImageFile = [NSString stringWithFormat:@"%@-Portrait", launchImageFile];
                    startupImageTransform = CGAffineTransformMakeRotation(degreesToRadian(180));
                    center.y -= MIN(statusBarFrame.size.width, statusBarFrame.size.height) / 2;
                }
                break;

            case UIDeviceOrientationPortrait:
            default:
                {
                    orientedLaunchImageFile = [NSString stringWithFormat:@"%@-Portrait", launchImageFile];
                    startupImageTransform = CGAffineTransformIdentity;
                    center.y += MIN(statusBarFrame.size.width, statusBarFrame.size.height) / 2;
                }
                break;
        }
    } else { // not iPad
        orientedLaunchImageFile = launchImageFile;
    }

    launchImage = [UIImage imageNamed:[[self class] resolveImageResource:orientedLaunchImageFile]];
    if (launchImage == nil) {
        NSLog(@"WARNING: Splash-screen image '%@' was not found. Orientation: %d, iPad: %d", orientedLaunchImageFile, deviceOrientation, CDV_IsIPad());
    }

    self.imageView = [[UIImageView alloc] initWithImage:launchImage];
    self.imageView.tag = 1;
    self.imageView.center = center;

    self.imageView.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin);
    [self.imageView setTransform:startupImageTransform];
    [self.view.superview addSubview:self.imageView];

    /*
     * The Activity View is the top spinning throbber in the status/battery bar. We init it with the default Grey Style.
     *
     *     whiteLarge = UIActivityIndicatorViewStyleWhiteLarge
     *     white      = UIActivityIndicatorViewStyleWhite
     *     gray       = UIActivityIndicatorViewStyleGray
     *
     */
    NSString* topActivityIndicator = [self.settings objectForKey:@"TopActivityIndicator"];
    UIActivityIndicatorViewStyle topActivityIndicatorStyle = UIActivityIndicatorViewStyleGray;

    if ([topActivityIndicator isEqualToString:@"whiteLarge"]) {
        topActivityIndicatorStyle = UIActivityIndicatorViewStyleWhiteLarge;
    } else if ([topActivityIndicator isEqualToString:@"white"]) {
        topActivityIndicatorStyle = UIActivityIndicatorViewStyleWhite;
    } else if ([topActivityIndicator isEqualToString:@"gray"]) {
        topActivityIndicatorStyle = UIActivityIndicatorViewStyleGray;
    }

    self.activityView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:topActivityIndicatorStyle];
    self.activityView.tag = 2;

    id showSplashScreenSpinnerValue = [self.settings objectForKey:@"ShowSplashScreenSpinner"];
    // backwards compatibility - if key is missing, default to true
    if ((showSplashScreenSpinnerValue == nil) || [showSplashScreenSpinnerValue boolValue]) {
        [self.view.superview addSubview:self.activityView];
    }

    self.activityView.center = self.view.center;
    [self.activityView startAnimating];

    [self.view.superview layoutSubviews];
}

BOOL gSplashScreenShown = NO;
- (void)receivedOrientationChange
{
    if (self.imageView == nil) {
        gSplashScreenShown = YES;
        if (self.useSplashScreen) {
            [self showSplashScreen];
        }
    }
}

#pragma mark CordovaCommands

- (void)registerPlugin:(CDVPlugin*)plugin withClassName:(NSString*)className
{
    if ([plugin respondsToSelector:@selector(setViewController:)]) {
        [plugin setViewController:self];
    }

    if ([plugin respondsToSelector:@selector(setCommandDelegate:)]) {
        [plugin setCommandDelegate:_commandDelegate];
    }

    [self.pluginObjects setObject:plugin forKey:className];
}

/**
 Returns an instance of a CordovaCommand object, based on its name.  If one exists already, it is returned.
 */
- (id)getCommandInstance:(NSString*)pluginName
{
    // first, we try to find the pluginName in the pluginsMap
    // (acts as a whitelist as well) if it does not exist, we return nil
    // NOTE: plugin names are matched as lowercase to avoid problems - however, a
    // possible issue is there can be duplicates possible if you had:
    // "org.apache.cordova.Foo" and "org.apache.cordova.foo" - only the lower-cased entry will match
    NSString* className = [self.pluginsMap objectForKey:[pluginName lowercaseString]];

    if (className == nil) {
        return nil;
    }

    id obj = [self.pluginObjects objectForKey:className];
    if (!obj) {
        // attempt to load the settings for this command class
        NSDictionary* classSettings = [self.settings objectForKey:className];

        if (classSettings) {
            obj = [[NSClassFromString (className)alloc] initWithWebView:webView settings:classSettings];
        } else {
            obj = [[NSClassFromString (className)alloc] initWithWebView:webView];
        }

        if ((obj != nil) && [obj isKindOfClass:[CDVPlugin class]]) {
            [self registerPlugin:obj withClassName:className];
        } else {
            NSLog(@"CDVPlugin class %@ (pluginName: %@) does not exist.", className, pluginName);
        }
    }
    return obj;
}

#pragma mark -

- (NSString*)appURLScheme
{
    NSString* URLScheme = nil;

    NSArray* URLTypes = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleURLTypes"];

    if (URLTypes != nil) {
        NSDictionary* dict = [URLTypes objectAtIndex:0];
        if (dict != nil) {
            NSArray* URLSchemes = [dict objectForKey:@"CFBundleURLSchemes"];
            if (URLSchemes != nil) {
                URLScheme = [URLSchemes objectAtIndex:0];
            }
        }
    }

    return URLScheme;
}

/**
 Returns the contents of the named plist bundle, loaded as a dictionary object
 */
+ (NSDictionary*)getBundlePlist:(NSString*)plistName
{
    NSString* errorDesc = nil;
    NSPropertyListFormat format;
    NSString* plistPath = [[NSBundle mainBundle] pathForResource:plistName ofType:@"plist"];
    NSData* plistXML = [[NSFileManager defaultManager] contentsAtPath:plistPath];
    NSDictionary* temp = (NSDictionary*)[NSPropertyListSerialization
        propertyListFromData:plistXML
            mutabilityOption:NSPropertyListMutableContainersAndLeaves
                      format:&format errorDescription:&errorDesc];

    return temp;
}

#pragma mark -
#pragma mark UIApplicationDelegate impl

/*
 This method lets your application know that it is about to be terminated and purged from memory entirely
 */
- (void)onAppWillTerminate:(NSNotification*)notification
{
    // empty the tmp directory
    NSFileManager* fileMgr = [[NSFileManager alloc] init];
    NSError* __autoreleasing err = nil;

    // clear contents of NSTemporaryDirectory
    NSString* tempDirectoryPath = NSTemporaryDirectory();
    NSDirectoryEnumerator* directoryEnumerator = [fileMgr enumeratorAtPath:tempDirectoryPath];
    NSString* fileName = nil;
    BOOL result;

    while ((fileName = [directoryEnumerator nextObject])) {
        NSString* filePath = [tempDirectoryPath stringByAppendingPathComponent:fileName];
        result = [fileMgr removeItemAtPath:filePath error:&err];
        if (!result && err) {
            NSLog(@"Failed to delete: %@ (error: %@)", filePath, err);
        }
    }
}

/*
 This method is called to let your application know that it is about to move from the active to inactive state.
 You should use this method to pause ongoing tasks, disable timer, ...
 */
- (void)onAppWillResignActive:(NSNotification*)notification
{
    // NSLog(@"%@",@"applicationWillResignActive");
    [self.commandDelegate evalJs:@"cordova.fireDocumentEvent('resign');" scheduledOnRunLoop:NO];
}

/*
 In iOS 4.0 and later, this method is called as part of the transition from the background to the inactive state.
 You can use this method to undo many of the changes you made to your application upon entering the background.
 invariably followed by applicationDidBecomeActive
 */
- (void)onAppWillEnterForeground:(NSNotification*)notification
{
    // NSLog(@"%@",@"applicationWillEnterForeground");
    [self.commandDelegate evalJs:@"cordova.fireDocumentEvent('resume');"];
}

// This method is called to let your application know that it moved from the inactive to active state.
- (void)onAppDidBecomeActive:(NSNotification*)notification
{
    // NSLog(@"%@",@"applicationDidBecomeActive");
    [self.commandDelegate evalJs:@"cordova.fireDocumentEvent('active');"];
}

/*
 In iOS 4.0 and later, this method is called instead of the applicationWillTerminate: method
 when the user quits an application that supports background execution.
 */
- (void)onAppDidEnterBackground:(NSNotification*)notification
{
    // NSLog(@"%@",@"applicationDidEnterBackground");
    [self.commandDelegate evalJs:@"cordova.fireDocumentEvent('pause', null, true);" scheduledOnRunLoop:NO];
}

// ///////////////////////

- (void)handleOpenURL:(NSNotification*)notification
{
    self.openURL = notification.object;
}

- (void)processOpenUrl
{
    if (self.openURL) {
        // calls into javascript global function 'handleOpenURL'
        NSString* jsString = [NSString stringWithFormat:@"handleOpenURL(\"%@\");", [self.openURL description]];
        [self.webView stringByEvaluatingJavaScriptFromString:jsString];
        self.openURL = nil;
    }
}

// ///////////////////////

- (void)dealloc
{
    [CDVURLProtocol unregisterViewController:self];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillTerminateNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillResignActiveNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillEnterForegroundNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidBecomeActiveNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidEnterBackgroundNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:NSCurrentLocaleDidChangeNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:CDVPluginHandleOpenURLNotification object:nil];

    self.webView.delegate = nil;
    self.webView = nil;
    [_commandQueue dispose];
    [[self.pluginObjects allValues] makeObjectsPerformSelector:@selector(dispose)];
}

@end
