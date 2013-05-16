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

#import "CDV.h"
#import "CDVCommandDelegateImpl.h"

static NSString* const kDummyArgCallbackId = @"cid0";
static NSString* const kDummyArgFileKey = @"image.jpg";
static NSString* const kDummyArgTarget = @"/path/to/image.jpg";
static NSString* const kDummyArgServer = @"http://apache.org";
static NSString* const kDummyFileContents = @"0123456789";

// Reads the given stream and returns the contents as an NSData.
static NSData *readStream(NSInputStream* stream)
{
    static const NSUInteger kBufferSize = 1024;

    UInt8* buffer = malloc(kBufferSize);
    NSMutableData* streamData = [NSMutableData data];

    [stream open];

    for (;; ) {
        NSInteger read = [stream read:buffer maxLength:kBufferSize];
        if (read > 0) {
            [streamData appendBytes:buffer length:read];
        } else {
            break;
        }
    }

    free(buffer);
    [stream close];
    return streamData;
}

@interface CDVFileTransferTests : SenTestCase {
    NSMutableArray* _arguments;
    CDVFileTransfer* _fileTransfer;
    NSData* _dummyFileData;
    CDVCommandDelegateImpl* _commandDelegate;
}
@end

@implementation CDVFileTransferTests

- (void)setUp
{
    [super setUp];

    _arguments = [[NSMutableArray alloc] initWithObjects:
        kDummyArgTarget, kDummyArgServer, kDummyArgFileKey, [NSNull null],
        [NSNull null], [NSNull null], [NSNull null], [NSNull null], [NSNull null], nil];
    _dummyFileData = [kDummyFileContents dataUsingEncoding:NSUTF8StringEncoding];
    _commandDelegate = [[CDVCommandDelegateImpl alloc] initWithViewController:nil];
    _fileTransfer = [[CDVFileTransfer alloc] init];
    _fileTransfer.commandDelegate = _commandDelegate;
}

- (void)tearDown
{
    _arguments = nil;
    _dummyFileData = nil;
    _fileTransfer = nil;
    _commandDelegate = nil;
    [super tearDown];
}

- (void)setFilePathArg:(NSString*)filePath
{
    [_arguments replaceObjectAtIndex:0 withObject:filePath];
}

- (void)setServerUrlArg:(NSString*)serverUrl
{
    [_arguments replaceObjectAtIndex:1 withObject:serverUrl];
}

- (void)setChunkedModeArg:(BOOL)chunk
{
    [_arguments replaceObjectAtIndex:7 withObject:[NSNumber numberWithBool:chunk]];
}

- (void)setParams:(NSDictionary*)params
{
    [_arguments replaceObjectAtIndex:5 withObject:params];
}

- (void)setHeaders:(NSDictionary*)headers
{
    [_arguments replaceObjectAtIndex:8 withObject:headers];
}

- (NSURLRequest*)requestForUpload
{
    CDVInvokedUrlCommand* command = [[CDVInvokedUrlCommand alloc] initWithArguments:_arguments
                                                                         callbackId:kDummyArgCallbackId
                                                                          className:@"FileTransfer"
                                                                         methodName:@"upload"];

    return [_fileTransfer requestForUploadCommand:command fileData:_dummyFileData];
}

- (void)checkUploadRequest:(NSURLRequest*)request chunked:(BOOL)chunked
{
    STAssertTrue([@"POST" isEqualToString:[request HTTPMethod]], nil);
    NSData* payloadData = nil;
    if (chunked) {
        STAssertNil([request HTTPBody], nil);
        STAssertNotNil([request HTTPBodyStream], nil);
        payloadData = readStream([request HTTPBodyStream]);
    } else {
        STAssertNotNil([request HTTPBody], nil);
        STAssertNil([request HTTPBodyStream], nil);
        payloadData = [request HTTPBody];
    }
    STAssertNotNil([request valueForHTTPHeaderField:@"X-Requested-With"], nil);
    NSUInteger contentLength = [[request valueForHTTPHeaderField:@"Content-Length"] intValue];
    STAssertEquals([payloadData length], contentLength, nil);
}

- (void)testEscapePathComponentForUrlString
{
    STAssertTrue([@"" isEqualToString:
        [_fileTransfer escapePathComponentForUrlString:@""]], nil);
    STAssertTrue([@"foo" isEqualToString:
        [_fileTransfer escapePathComponentForUrlString:@"foo"]], nil);
    STAssertTrue([@"http://a.org/spa%20ce%25" isEqualToString:
        [_fileTransfer escapePathComponentForUrlString:@"http://a.org/spa ce%"]], nil);
    STAssertTrue([@"http://a.org/spa%20ce%25/" isEqualToString:
        [_fileTransfer escapePathComponentForUrlString:@"http://a.org/spa ce%/"]], nil);
    STAssertTrue([@"http://a.org/%25/%25/" isEqualToString:
        [_fileTransfer escapePathComponentForUrlString:@"http://a.org/%/%/"]], nil);
}

- (void)testUpload_invalidServerUrl
{
    [self setServerUrlArg:@"invalid url"];
    STAssertNil([self requestForUpload], nil);
}

- (void)testUpload_missingFileData
{
    _dummyFileData = nil;
    STAssertNil([self requestForUpload], nil);
}

- (void)testUpload_serverUrlPathEscaping
{
    [self setServerUrlArg:[_fileTransfer escapePathComponentForUrlString:@"http://apache.org/spa ce%"]]; // uri encode first now
    NSURLRequest* request = [self requestForUpload];
    STAssertTrue([[[request URL] absoluteString] isEqualToString:@"http://apache.org/spa%20ce%25"], nil);
}

- (void)testUpload_nonChunked
{
    [self setChunkedModeArg:NO];
    NSURLRequest* request = [self requestForUpload];
    [self checkUploadRequest:request chunked:NO];
}

- (void)testUpload_chunked
{
    // As noted in the implementation, chunked upload is disabled pre 5.0.
    if (!IsAtLeastiOSVersion(@"5.0")) {
        return;
    }
    // Chunked is the default.
    NSURLRequest* request = [self requestForUpload];
    [self checkUploadRequest:request chunked:YES];
}

- (void)testUpload_withParams
{
    [self setChunkedModeArg:NO];
    NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:@"cookieval", kOptionsKeyCookie,
        @"val3", @"key3", nil];
    [self setParams:params];
    NSURLRequest* request = [self requestForUpload];
    NSString* payload = [[NSString alloc] initWithData:[request HTTPBody] encoding:NSUTF8StringEncoding];
    // Check that the cookie is set, and that it is not in the payload like others in the options dict.
    STAssertTrue([@"cookieval" isEqualToString:[request valueForHTTPHeaderField:@"Cookie"]], nil);
    STAssertEquals([payload rangeOfString:@"cookieval"].length, 0U, nil);
    // Check that key3 is in the payload.
    STAssertTrue([payload rangeOfString:@"key3"].length > 0, nil);
    STAssertTrue([payload rangeOfString:@"val3"].length > 0, nil);
}

- (void)testUpload_withHeaders
{
    [self setChunkedModeArg:NO];
    [self setHeaders:[NSDictionary dictionaryWithObjectsAndKeys:@"val1", @"key1",
    [NSArray arrayWithObjects:@"val2a", @"val2b", nil], @"key2", [NSNull null], @"X-Requested-With", nil]];
    NSURLRequest* request = [self requestForUpload];
    STAssertTrue([@"val1" isEqualToString:[request valueForHTTPHeaderField:@"key1"]], nil);
    STAssertTrue([@"val2a,val2b" isEqualToString:[request valueForHTTPHeaderField:@"key2"]], nil);
    STAssertTrue([@"null" isEqualToString:[request valueForHTTPHeaderField:@"X-Requested-With"]], nil);
}

@end
