//
//  ExifTestTests.h
//  ExifTestTests
//
//  Created by Lorin Beer on 2013-03-18.
//
//

#import <SenTestingKit/SenTestingKit.h>

#import "../ExifTest/CDVJpegHeaderWriter.h"

#define ARC4RANDOM_MAX 0x100000000

@interface ExifTestTests : SenTestCase {
    CDVJpegHeaderWriter * testHeaderWriter;
    NSNumber * testErrorThreshhold;
}

- (void) testContinuedFractionWithUInt;
- (void) testContinuedFractionWithUFloat;
- (void) testContinuedFractionsWorstCase;
- (void) testFormatHexFromDecimal;
- (void) testFormatNumberWithLeadingZeroes;
- (void) testUnsignedRationalToString;
- (void) testSignedRationalToString;
@end