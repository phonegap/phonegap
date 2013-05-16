//
//  ExifTestTests.m
//  ExifTestTests
//
//  Created by Lorin Beer on 2013-03-18.
//
//

#import <SenTestingKit/SenTestingKit.h>

#import "ExifTestTests.h"
#import "../ExifTest/CDVJpegHeaderWriter.m"


@implementation ExifTestTests

- (void)setUp
{
    [super setUp];
    testHeaderWriter = [[CDVJpegHeaderWriter alloc] init];
    testErrorThreshhold = [NSNumber numberWithDouble: 0.000001];
    NSLog(@"%x", ~10+1);
    
    
}

- (void)tearDown
{
    // Tear-down code here.
    
    [super tearDown];
}

//==================================================================================================
// rational approximation of decimal by continued fraction tests
//==================================================================================================

// tests continued fraction with random int
- (void)testContinuedFractionWithUInt {
    NSLog(@"Continued Fraction Test with random int value, numerator should be generated value, denominator should be 1");
    NSNumber * numerator = @0;
    NSNumber * denominator = @0;
    NSNumber * testValue = [NSNumber numberWithInt: abs(arc4random())];
    [testHeaderWriter decimalToUnsignedRational: testValue
                  withResultNumerator: &numerator
                withResultDenominator: &denominator];
    STAssertEquals([numerator intValue],
                   [testValue intValue],
                   @"Numerator did not match");
    STAssertEquals([denominator intValue],
                   1,
                   @"denominator was not one");
}

// tests continued fraction with random float
- (void)testContinuedFractionWithUFloat {
    NSLog(@"Continued Fraction Test with random double value, resulting fraction should be within acceptable error threshhold");
    NSNumber * threshhold = @0.1;
    NSNumber * numerator = @0;
    NSNumber * denominator = @0;
    NSLog(@"%f",((double)arc4random() / ARC4RANDOM_MAX) * 100.0f);
    NSNumber * testValue = [NSNumber numberWithDouble:
                                ((double)arc4random() / ARC4RANDOM_MAX) * 100.0f];

    [testHeaderWriter decimalToUnsignedRational: testValue
                            withResultNumerator: &numerator
                          withResultDenominator: &denominator];
    NSLog(@"%lf, %lf",[testValue doubleValue], [numerator doubleValue]/[denominator doubleValue]);

    STAssertEqualsWithAccuracy([testValue doubleValue],
                               [numerator doubleValue]/[denominator doubleValue],
                               [threshhold doubleValue],
                               @"rational approximation did not meet acceptable error threshhold");
    
}

// tests continued fraction in sqrt(2) worst case
- (void)testContinuedFractionsWorstCase {
    NSLog(@"Continued Fraction Test with provable worst case ~sqrt(2), resulting fraction should be within acceptable error threshhold");
    NSNumber * threshhold = @0.1;
    NSNumber * numerator = @0;
    NSNumber * denominator = @0;
    NSNumber * testValue = [NSNumber numberWithDouble: sqrt(2)];
    [testHeaderWriter decimalToUnsignedRational: testValue
                            withResultNumerator: &numerator
                          withResultDenominator: &denominator];
    STAssertEqualsWithAccuracy([testValue doubleValue],
                               [numerator doubleValue]/[denominator doubleValue],
                               [threshhold doubleValue],
                               @"rational approximation did not meet acceptable error threshhold");
}

// tests format hex from a decimal
- (void) testFormatHexFromDecimal {
    NSNumber * testValue = @1;
    NSNumber * testPlaces = @8;
    NSString * result = nil;
    result = [testHeaderWriter formattedHexStringFromDecimalNumber: testValue
                                                        withPlaces: testPlaces];
    // assert not nil
    STAssertNotNil(result, @"nil renturned from formattedHexStringFromDecimalNumber");
    // assert correct number of places
    STAssertEquals([result length], [testPlaces unsignedIntegerValue],
                   @"returned string to wrong number of places. Should be = %i Was = %i",
                   [testPlaces intValue],
                   [result length]);
    // assert correct hex representation
    STAssertTrueNoThrow([result isEqualToString:@"00000001"], @"result should be equal to @00000001");

}

// tests format number string with leading zeroes
- (void) testFormatNumberWithLeadingZeroes {
    NSString * result = nil;
    NSNumber * testValue = @8769; // Exif SubIFD Offset Tag
    NSNumber * testPlaces = @6;
    result = [testHeaderWriter formatNumberWithLeadingZeroes: testValue
                                                  withPlaces: testPlaces];
    STAssertNotNil(result, @"nil renturned from formattedHexStringFromDecimalNumber");
    STAssertEquals([result length],
                   [testPlaces unsignedIntegerValue],
                   @"returned string to wrong number of places. Should be = %i Was = %i",
                   [testPlaces intValue],
                   [result length]);
    // assert correct hex representation
    STAssertTrueNoThrow([result isEqualToString:@"008769"], @"result was = %@ should be = @008769", result);
}

- (void) testUnsignedRationalToString {
    NSString * result = nil;
    NSNumber * numerator = @1;
    NSNumber * denominator = @10;
    result = [testHeaderWriter formatRationalWithNumerator: numerator
                                           withDenominator: denominator
                                                  asSigned: FALSE];
    NSLog(result);
    STAssertNotNil(result, @"nil returned from testUnsignedRationalToString");
    STAssertTrueNoThrow([result length]==16, @"returned string with wrong length. Exif rationals are 8 bytes, string has %ld bytes",[result length]/2);
    STAssertTrueNoThrow([result isEqualToString:@"000000010000000a"], @"result was = %@ should be = @0000000100000010", result);
}

- (void) testSignedRationalToString {
    NSString * result = nil;
    NSNumber * numerator = @-1;
    NSNumber * denominator = @-10;
    result = [testHeaderWriter formatRationalWithNumerator: numerator
                                           withDenominator: denominator
                                                  asSigned: TRUE];
    NSLog(result);
    STAssertNotNil(result, @"nil returned from testSignedRationalToString");
    STAssertTrueNoThrow([result length]==16, @"returned string with wrong length. Exif rationals are 8 bytes, string has %ld bytes",[result length]/2);
    STAssertTrueNoThrow([result isEqualToString:@"fffffffffffffff6"], @"result was = %@ should be = @000000FF000000F6", result);
}

@end
