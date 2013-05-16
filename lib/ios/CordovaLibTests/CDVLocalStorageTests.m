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

#import "CDVLocalStorage.h"
#import "CDVWebViewTest.h"
#import "CDVFakeFileManager.h"
#import "ViewController.h"

@interface CDVLocalStorageTests : CDVWebViewTest
                                  // Deletes LocalStorage files from disk.
- (void)deleteOriginals:(BOOL)originals backups:(BOOL)backups;
// Returns the CDVLocalStorage instance from the plugins dict.
- (CDVLocalStorage*)localStorage;
@end

@implementation CDVLocalStorageTests

- (void)setUp
{
    [super setUp];
    // Clear these on setUp as well in case they were left around.
    [self deleteOriginals:YES backups:YES];
}

- (void)tearDown
{
    // Don't leave any localStorage files around.
    [self deleteOriginals:YES backups:YES];
    [super tearDown];
}

- (CDVLocalStorage*)localStorage
{
    return [self pluginInstance:@"LocalStorage"];
}

- (void)deleteOriginals:(BOOL)originals backups:(BOOL)backups
{
    NSFileManager* fileManager = [NSFileManager defaultManager];

    for (CDVBackupInfo* info in [self localStorage].backupInfo) {
        if (originals) {
            [fileManager removeItemAtPath:info.original error:nil];
        }
        if (backups) {
            [fileManager removeItemAtPath:info.backup error:nil];
        }
    }
}

- (void)disabled_testBackupAndRestore
{
    CDVLocalStorage* localStorage = [self localStorage];

    [self waitForConditionName:@"shouldBackup" block:^{
        [self evalJs:@"localStorage.setItem('foo', 'bar')"];
        return [localStorage shouldBackup];
    }];
    [localStorage backup:[CDVInvokedUrlCommand new]];
    STAssertFalse([localStorage shouldBackup], @"Should have backed up.");

    // It would be nice to be able to test that the restore functionality
    // alters what localStorage.getItem('foo') returns, but it seems as though
    // the WebView maintains an in-memory cache of what's in LocalStorage even
    // after we delete the underlying files and recreate the view.

    // Instead, we just test the file copying logic.
    [self deleteOriginals:YES backups:NO];
    STAssertTrue([localStorage shouldRestore], @"Should restore after deleting originals");
    [localStorage restore:[CDVInvokedUrlCommand new]];
    STAssertFalse([localStorage shouldRestore], @"Restore did not complete successfully");
}

- (void)testVerifyAndFixDatabaseLocations_noChangeRequired
{
    NSString* const kBundlePath = @"/bpath";
    id fakeFileManager = [CDVFakeFileManager managerWithFileExistsBlock:^(NSString* path) {
            STFail(@"fileExists called.");
            return NO;
        }];
    NSMutableDictionary* appPlistDict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
        @"/bpath/foo", @"WebKitLocalStorageDatabasePathPreferenceKey",
        @"/bpath/foo", @"WebDatabaseDirectory",
        nil];
    BOOL modified = [CDVLocalStorage __verifyAndFixDatabaseLocationsWithAppPlistDict:appPlistDict
                                                                          bundlePath:kBundlePath
                                                                         fileManager:fakeFileManager];

    STAssertFalse(modified, @"Should not have applied fix.");
}

- (void)testVerifyAndFixDatabaseLocations_changeRequired1
{
    NSString* const kBundlePath = @"/bpath";
    id fakeFileManager = [CDVFakeFileManager managerWithFileExistsBlock:^(NSString* path) {
            return YES;
        }];
    NSMutableDictionary* appPlistDict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
        @"/foo", @"WebKitLocalStorageDatabasePathPreferenceKey",
        nil];
    BOOL modified = [CDVLocalStorage __verifyAndFixDatabaseLocationsWithAppPlistDict:appPlistDict
                                                                          bundlePath:kBundlePath
                                                                         fileManager:fakeFileManager];

    STAssertTrue(modified, @"Should have applied fix.");
    NSString* newPath = [appPlistDict objectForKey:@"WebKitLocalStorageDatabasePathPreferenceKey"];
    STAssertTrue([@"/bpath/Library/Caches" isEqualToString: newPath], nil);
}

- (void)testVerifyAndFixDatabaseLocations_changeRequired2
{
    NSString* const kBundlePath = @"/bpath";
    id fakeFileManager = [CDVFakeFileManager managerWithFileExistsBlock:^(NSString* path) {
            return NO;
        }];
    NSMutableDictionary* appPlistDict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
        @"/foo", @"WebDatabaseDirectory",
        nil];
    BOOL modified = [CDVLocalStorage __verifyAndFixDatabaseLocationsWithAppPlistDict:appPlistDict
                                                                          bundlePath:kBundlePath
                                                                         fileManager:fakeFileManager];

    STAssertTrue(modified, @"Should have applied fix.");
    NSString* newPath = [appPlistDict objectForKey:@"WebDatabaseDirectory"];
    STAssertTrue([@"/bpath/Library/WebKit" isEqualToString: newPath], nil);
}

@end
