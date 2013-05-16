/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

describe('File API', function() {
    // Adding a Jasmine helper matcher, to report errors when comparing to FileError better.
    var fileErrorMap = {
        1: 'NOT_FOUND_ERR',
        2: 'SECURITY_ERR',
        3: 'ABORT_ERR',
        4: 'NOT_READABLE_ERR',
        5: 'ENCODING_ERR',
        6: 'NO_MODIFICATION_ALLOWED_ERR',
        7: 'INVALID_STATE_ERR',
        8: 'SYNTAX_ERR',
        9: 'INVALID_MODIFICATION_ERR',
        10:'QUOTA_EXCEEDED_ERR',
        11:'TYPE_MISMATCH_ERR',
        12:'PATH_EXISTS_ERR'
    };
    beforeEach(function() {
        this.addMatchers({
            toBeFileError: function(code) {
                var error = this.actual;
                this.message = function(){
                    return "Expected FileError with code " + fileErrorMap[error.code] + " (" + error.code + ") to be " + fileErrorMap[code] + "(" + code + ")";
                };
                return (error.code == code);
            },
            toCanonicallyMatch:function(path){
                this.message = function(){
                    return "Expected paths to match : " + path + " should be " + this.actual;
                };

                var a = path.split("/").join("").split("\\").join("");
                var b = this.actual.split("/").join("").split("\\").join("");

                return a == b;
            }
        });
    });

    // HELPER FUNCTIONS

    // deletes specified file or directory
    var deleteEntry = function(name, success, error) {
        // deletes entry, if it exists
        window.resolveLocalFileSystemURI(root.toURL() + '/' + name,
            function(entry) {
                if (entry.isDirectory === true) {
                    entry.removeRecursively(success, error);
                } else {
                    entry.remove(success, error);
                }
            }, success);
    };
    // deletes file, if it exists, then invokes callback
    var deleteFile = function(fileName, callback) {
        root.getFile(fileName, null,
                // remove file system entry
                function(entry) {
                    entry.remove(callback, function() { console.log('[ERROR] deleteFile cleanup method invoked fail callback.'); });
                },
                // doesn't exist
                callback);
    };
    // deletes and re-creates the specified file
    var createFile = function(fileName, success, error) {
        deleteEntry(fileName, function() {
            root.getFile(fileName, {create: true}, success, error);
        }, error);
    };
    // deletes and re-creates the specified directory
    var createDirectory = function(dirName, success, error) {
        deleteEntry(dirName, function() {
           root.getDirectory(dirName, {create: true}, success, error);
        }, error);
    };

    var createFail = function(module) {
        return jasmine.createSpy().andCallFake(function(err) {
            console.log('[ERROR ' + module + '] ' + JSON.stringify(err));
        });
    };

    var createWin = function(module) {
        return jasmine.createSpy().andCallFake(function() {
            console.log('[ERROR ' + module + '] Unexpected success callback');
        });
    };

    describe('FileError object', function() {
        it("file.spec.1 should define FileError constants", function() {
            expect(FileError.NOT_FOUND_ERR).toBe(1);
            expect(FileError.SECURITY_ERR).toBe(2);
            expect(FileError.ABORT_ERR).toBe(3);
            expect(FileError.NOT_READABLE_ERR).toBe(4);
            expect(FileError.ENCODING_ERR).toBe(5);
            expect(FileError.NO_MODIFICATION_ALLOWED_ERR).toBe(6);
            expect(FileError.INVALID_STATE_ERR).toBe(7);
            expect(FileError.SYNTAX_ERR).toBe(8);
            expect(FileError.INVALID_MODIFICATION_ERR).toBe(9);
            expect(FileError.QUOTA_EXCEEDED_ERR).toBe(10);
            expect(FileError.TYPE_MISMATCH_ERR).toBe(11);
            expect(FileError.PATH_EXISTS_ERR).toBe(12);
        });
    });

    describe('LocalFileSystem', function() {

        it("file.spec.2 should define LocalFileSystem constants", function() {
            expect(LocalFileSystem.TEMPORARY).toBe(0);
            expect(LocalFileSystem.PERSISTENT).toBe(1);
        });

        describe('window.requestFileSystem', function() {
            it("file.spec.3 should be defined", function() {
                expect(window.requestFileSystem).toBeDefined();
            });
            it("file.spec.4 should be able to retrieve a PERSISTENT file system", function() {
                var win = jasmine.createSpy().andCallFake(function(fileSystem) {
                    expect(fileSystem).toBeDefined();
                    expect(fileSystem.name).toBeDefined();
                    expect(fileSystem.name).toBe("persistent");
                    expect(fileSystem.root).toBeDefined();
                }),
                fail = createFail('window.requestFileSystem');

                // retrieve PERSISTENT file system
                runs(function() {
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, win, fail);
                });

                waitsFor(function() { return win.wasCalled; }, "success callback never called", Tests.TEST_TIMEOUT);

                runs(function() {
                    expect(fail).not.toHaveBeenCalled();
                    expect(win).toHaveBeenCalled();
                });
            });
            it("file.spec.5 should be able to retrieve a TEMPORARY file system", function() {
                var win = jasmine.createSpy().andCallFake(function(fileSystem) {
                    expect(fileSystem).toBeDefined();
                    expect(fileSystem.name).toBeDefined();
                    expect(fileSystem.name).toBe("temporary");
                    expect(fileSystem.root).toBeDefined();
                }),
                fail = createFail('window.requestFileSystem');

                // Request the file system
                runs(function() {
                    window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, win, fail);
                });

                waitsFor(function() { return win.wasCalled; }, "success callback never called", Tests.TEST_TIMEOUT);

                runs(function() {
                    expect(fail).not.toHaveBeenCalled();
                    expect(win).toHaveBeenCalled();
                });
            });
            it("file.spec.6 should error if you request a file system that is too large", function() {
                var fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.QUOTA_EXCEEDED_ERR);
                }),
                win = createWin('window.requestFileSystem');

                // Request the file system
                runs(function() {
                    window.requestFileSystem(LocalFileSystem.TEMPORARY, 1000000000000000, win, fail);
                });

                waitsFor(function() { return fail.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

                runs(function() {
                    expect(win).not.toHaveBeenCalled();
                    expect(fail).toHaveBeenCalled();
                });
            });
            it("file.spec.7 should error out if you request a file system that does not exist", function() {
                var fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.SYNTAX_ERR);
                }),
                win = createWin('window.requestFileSystem');

                // Request the file system
                runs(function() {
                    window.requestFileSystem(-1, 0, win, fail);
                });

                waitsFor(function() { return fail.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

                runs(function() {
                    expect(win).not.toHaveBeenCalled();
                    expect(fail).toHaveBeenCalled();
                });
            });
        });

        describe('window.resolveLocalFileSystemURI', function() {
            it("file.spec.3 should be defined", function() {
                expect(window.resolveLocalFileSystemURI).toBeDefined();
            });
            it("file.spec.9 should resolve a valid file name", function() {
                var fileName = "resolve.file.uri",
                win = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.name).toCanonicallyMatch(fileName);

                    // cleanup
                    deleteEntry(fileName);
                }),
                fail = createFail('window.resolveLocalFileSystemURI');
                resolveCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // lookup file system entry
                    runs(function() {
                        window.resolveLocalFileSystemURI(entry.toURL(), win, fail);
                    });

                    waitsFor(function() { return win.wasCalled; }, "resolveLocalFileSystemURI callback never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                });

                // create a new file entry
                runs(function() {
                    createFile(fileName, resolveCallback, fail);
                });

                waitsFor(function() { return resolveCallback.wasCalled; }, "createFile callback never called", Tests.TEST_TIMEOUT);
            });
            it("file.spec.10 resolve valid file name with parameters", function() {
                var fileName = "resolve.file.uri.params",
                win = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.name).toBe(fileName);

                    // cleanup
                    deleteEntry(fileName);
                }),
                fail = createFail('window.resolveLocalFileSystemURI');
                resolveCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // lookup file system entry
                    runs(function() {
                        window.resolveLocalFileSystemURI(entry.toURL() + "?1234567890", win, fail);
                    });

                    waitsFor(function() { return win.wasCalled; }, "resolveLocalFileSystemURI callback never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                });

                // create a new file entry
                runs(function() {
                    createFile(fileName, resolveCallback, fail);
                });

                waitsFor(function() { return resolveCallback.wasCalled; }, "createFile callback never called", Tests.TEST_TIMEOUT);
            });
            it("file.spec.11 should error (NOT_FOUND_ERR) when resolving (non-existent) invalid file name", function() {
                var fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                }),
                win = createWin('window.resolveLocalFileSystemURI');

                // lookup file system entry
                runs(function() {
                    window.resolveLocalFileSystemURI("file:///this.is.not.a.valid.file.txt", win, fail);
                });

                waitsFor(function() { return fail.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

                runs(function() {
                    expect(fail).toHaveBeenCalled();
                    expect(win).not.toHaveBeenCalled();
                });
            });
            it("file.spec.12 should error (ENCODING_ERR) when resolving invalid URI with leading /", function() {
                var fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.ENCODING_ERR);
                }),
                win = createWin('window.resolveLocalFileSystemURI');

                // lookup file system entry
                runs(function() {
                    window.resolveLocalFileSystemURI("/this.is.not.a.valid.url", win, fail);
                });

                waitsFor(function() { return fail.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

                runs(function() {
                    expect(fail).toHaveBeenCalled();
                    expect(win).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('Metadata interface', function() {
        it("file.spec.13 should exist and have the right properties", function() {
            var metadata = new Metadata();
            expect(metadata).toBeDefined();
            expect(metadata.modificationTime).toBeDefined();
        });
    });

    describe('Flags interface', function() {
        it("file.spec.13 should exist and have the right properties", function() {
            var flags = new Flags(false, true);
            expect(flags).toBeDefined();
            expect(flags.create).toBeDefined();
            expect(flags.create).toBe(false);
            expect(flags.exclusive).toBeDefined();
            expect(flags.exclusive).toBe(true);
        });
    });

    describe('FileSystem interface', function() {
        it("file.spec.15 should have a root that is a DirectoryEntry", function() {
            var win = jasmine.createSpy().andCallFake(function(entry) {
                expect(entry).toBeDefined();
                expect(entry.isFile).toBe(false);
                expect(entry.isDirectory).toBe(true);
                expect(entry.name).toBeDefined();
                expect(entry.fullPath).toBeDefined();
                expect(entry.getMetadata).toBeDefined();
                expect(entry.moveTo).toBeDefined();
                expect(entry.copyTo).toBeDefined();
                expect(entry.toURL).toBeDefined();
                expect(entry.remove).toBeDefined();
                expect(entry.getParent).toBeDefined();
                expect(entry.createReader).toBeDefined();
                expect(entry.getFile).toBeDefined();
                expect(entry.getDirectory).toBeDefined();
                expect(entry.removeRecursively).toBeDefined();
            }),
            fail = createFail('FileSystem');

            runs(function() {
                window.resolveLocalFileSystemURI(root.toURL(), win, fail);
            });

            waitsFor(function() { return win.wasCalled; }, "success callback never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(fail).not.toHaveBeenCalled();
                expect(win).toHaveBeenCalled();
            });
        });
    });

    describe('DirectoryEntry', function() {
        it("file.spec.16 getFile: get Entry for file that does not exist", function() {
            var fileName = "de.no.file",
                filePath = root.fullPath + '/' + fileName,
                fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                }),
                win = createWin('DirectoryEntry');

            // create:false, exclusive:false, file does not exist
            runs(function() {
                root.getFile(fileName, {create:false}, win, fail);
            });

            waitsFor(function() { return fail.wasCalled; }, "error callback never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(fail).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
            });
        });
        it("file.spec.17 etFile: create new file", function() {
            var fileName = "de.create.file",
                filePath = root.fullPath + '/' + fileName,
                win = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(entry.fullPath).toBe(filePath);
                    // cleanup
                    entry.remove(null, null);
                }),
                fail = createFail('DirectoryEntry');

            // create:true, exclusive:false, file does not exist
            runs(function() {
                root.getFile(fileName, {create: true}, win, fail);
            });

            waitsFor(function() { return win.wasCalled; }, "success callback never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(win).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.18 getFile: create new file (exclusive)", function() {
            var fileName = "de.create.exclusive.file",
                filePath = root.fullPath + '/' + fileName,
                win = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toBe(fileName);
                    expect(entry.fullPath).toBe(filePath);

                    // cleanup
                    entry.remove(null, null);
                }),
                fail = createFail('DirectoryEntry');

            // create:true, exclusive:true, file does not exist
            runs(function() {
                root.getFile(fileName, {create: true, exclusive:true}, win, fail);
            });

            waitsFor(function() { return win.wasCalled; }, "success callback never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(win).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.19 getFile: create file that already exists", function() {
            var fileName = "de.create.existing.file",
                filePath = root.fullPath + '/' + fileName,
                getFile = jasmine.createSpy().andCallFake(function(file) {
                    // create:true, exclusive:false, file exists
                    runs(function() {
                        root.getFile(fileName, {create:true}, win, fail);
                    });

                    waitsFor(function() { return win.wasCalled; }, "win was never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                fail = createFail('DirectoryEntry'),
                win = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(entry.fullPath).toBe(filePath);

                    // cleanup
                    entry.remove(null, fail);
                });
            // create file to kick off it
            runs(function() {
                root.getFile(fileName, {create:true}, getFile, fail);
            });

            waitsFor(function() { return getFile.wasCalled; }, "getFile was never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.20 getFile: create file that already exists (exclusive)", function() {
            var fileName = "de.create.exclusive.existing.file",
                filePath = root.fullPath + '/' + fileName,
                existingFile,
                getFile = jasmine.createSpy().andCallFake(function(file) {
                    existingFile = file;
                    // create:true, exclusive:true, file exists
                    runs(function() {
                        root.getFile(fileName, {create:true, exclusive:true}, win, fail);
                    });

                    waitsFor(function() { return fail.wasCalled; }, "fail never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(fail).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                    });
                }),
                fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.PATH_EXISTS_ERR);

                    // cleanup
                    existingFile.remove(null, fail);
                }),
                win = createWin('DirectoryEntry');

            // create file to kick off it
            runs(function() {
                root.getFile(fileName, {create:true}, getFile, fail);
            });

            waitsFor(function() { return getFile.wasCalled; }, "getFile never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.21 getFile: get Entry for existing file", function() {
            var fileName = "de.get.file",
                filePath = root.fullPath + '/' + fileName,
                win = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(entry.fullPath).toCanonicallyMatch(filePath);

                    entry.remove(null, fail); //clean up
                }),
                fail = createFail('DirectoryEntry'),
                getFile = jasmine.createSpy().andCallFake(function(file) {
                    // create:false, exclusive:false, file exists
                    runs(function() {
                        root.getFile(fileName, {create:false}, win, fail);
                    });

                    waitsFor(function() { return win.wasCalled; }, "getFile success callback", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                });

            // create file to kick off it
            runs(function() {
                root.getFile(fileName, {create:true}, getFile, fail);
            });

            waitsFor(function() { return getFile.wasCalled; }, "file creation", Tests.TEST_TIMEOUT);
        });
        it("file.spec.22 DirectoryEntry.getFile: get FileEntry for invalid path", function() {
            var fileName = "de:invalid:path",
                fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.ENCODING_ERR);
                }),
                win = createWin('DirectoryEntry');

            // create:false, exclusive:false, invalid path
            runs(function() {
                root.getFile(fileName, {create:false}, win, fail);
            });

            waitsFor(function() { return fail.wasCalled; }, "fail never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(fail).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
            });

        });
        it("file.spec.23 DirectoryEntry.getDirectory: get Entry for directory that does not exist", function() {
            var dirName = "de.no.dir",
                dirPath = root.fullPath + '/' + dirName,
                fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                }),
                win = createWin('DirectoryEntry');

            // create:false, exclusive:false, directory does not exist
            runs(function() {
                root.getDirectory(dirName, {create:false}, win, fail);
            });

            waitsFor(function() { return fail.wasCalled; }, "fail never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(fail).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
            });
        });
        it("file.spec.24 DirectoryEntry.getDirectory: create new dir with space then resolveFileSystemURI", function() {
            var dirName = "de create dir",
                dirPath = root.fullPath + '/' + dirName,
                getDir = jasmine.createSpy().andCallFake(function(dirEntry) {
                    var dirURI = dirEntry.toURL();
                    // now encode URI and try to resolve
                    runs(function() {
                        window.resolveLocalFileSystemURI(dirURI, win, fail);
                    });

                    waitsFor(function() { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });

                }), win = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);

                    // cleanup
                    directory.remove(null, fail);
                }),
                fail = createFail('DirectoryEntry');

            // create:true, exclusive:false, directory does not exist
            runs(function() {
                root.getDirectory(dirName, {create: true}, getDir, fail);
            });

            waitsFor(function() { return getDir.wasCalled; }, "getDir never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.25 DirectoryEntry.getDirectory: create new dir with space resolveFileSystemURI with encoded URI", function() {
            var dirName = "de create dir",
                dirPath = root.fullPath + '/' + dirName,
                getDir = jasmine.createSpy().andCallFake(function(dirEntry) {
                    var dirURI = dirEntry.toURL();
                    // now encode URI and try to resolve
                    runs(function() {
                        window.resolveLocalFileSystemURI(encodeURI(dirURI), win, fail);
                    });

                    waitsFor(function() { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                win = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);
                    // cleanup
                    directory.remove(null, fail);
                }),
                fail = createFail('DirectoryEntry');

            // create:true, exclusive:false, directory does not exist
            runs(function() {
                root.getDirectory(dirName, {create: true}, getDir, fail);
            });

            waitsFor(function() { return getDir.wasCalled; }, "getDir never called", Tests.TEST_TIMEOUT);
        });

        it("file.spec.26 DirectoryEntry.getDirectory: create new directory", function() {
            var dirName = "de.create.dir",
                dirPath = root.fullPath + '/' + dirName,
                win = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);

                    // cleanup
                    directory.remove(null, fail);
                }),
                fail = createFail('DirectoryEntry');

            // create:true, exclusive:false, directory does not exist
            runs(function() {
                root.getDirectory(dirName, {create: true}, win, fail);
            });

            waitsFor(function() { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(win).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });

        it("file.spec.27 DirectoryEntry.getDirectory: create new directory (exclusive)", function() {
            var dirName = "de.create.exclusive.dir",
                dirPath = root.fullPath + '/' + dirName,
                win = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);

                    // cleanup
                    directory.remove(null, fail);
                }),
                fail = createFail('DirectoryEntry');
            // create:true, exclusive:true, directory does not exist
            runs(function() {
                root.getDirectory(dirName, {create: true, exclusive:true}, win, fail);
            });

            waitsFor(function() { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(win).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.28 DirectoryEntry.getDirectory: create directory that already exists", function() {
            var dirName = "de.create.existing.dir",
                dirPath = root.fullPath + '/' + dirName,
                getDir = jasmine.createSpy().andCallFake(function(directory) {
                    // create:true, exclusive:false, directory exists
                    runs(function() {
                        root.getDirectory(dirName, {create:true}, win, fail);
                    });

                    waitsFor(function() { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                win = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);
                    expect(directory.fullPath).toCanonicallyMatch(dirPath);

                    // cleanup
                    directory.remove(null, fail);
                }),
                fail = createFail('DirectoryEntry');

            // create directory to kick off it
            runs(function() {
                root.getDirectory(dirName, {create:true}, getDir, this.fail);
            });

            waitsFor(function() { return getDir.wasCalled; }, "getDir never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.29 DirectoryEntry.getDirectory: create directory that already exists (exclusive)", function() {
            var dirName = "de.create.exclusive.existing.dir",
                dirPath = root.fullPath + '/' + dirName,
                existingDir,
                getDir = jasmine.createSpy().andCallFake(function(directory) {
                    existingDir = directory;
                    // create:true, exclusive:true, directory exists
                    runs(function() {
                        root.getDirectory(dirName, {create:true, exclusive:true}, win, fail);
                    });

                    waitsFor(function() { return fail.wasCalled; }, "fail never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(fail).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                    });
                }),
                fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.PATH_EXISTS_ERR);

                    // cleanup
                    existingDir.remove(null, fail);
                }),
                win = createWin('DirectoryEntry');

            // create directory to kick off it
            runs(function() {
                root.getDirectory(dirName, {create:true}, getDir, fail);
            });

            waitsFor(function() { return getDir.wasCalled; }, "getDir never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.30 DirectoryEntry.getDirectory: get Entry for existing directory", function() {
            var dirName = "de.get.dir",
                dirPath = root.fullPath + '/' + dirName,
                getDir = jasmine.createSpy().andCallFake(function(directory) {
                    // create:false, exclusive:false, directory exists
                    runs(function() {
                        root.getDirectory(dirName, {create:false}, win, fail);
                    });

                    waitsFor(function() { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                win = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.name).toCanonicallyMatch(dirName);

                    expect(directory.fullPath).toCanonicallyMatch(dirPath);

                    // cleanup
                    directory.remove(null, fail);
                }),
                fail = createFail('DirectoryEntry');

            // create directory to kick off it
            root.getDirectory(dirName, {create:true}, getDir, fail);
        });
        it("file.spec.31 DirectoryEntry.getDirectory: get DirectoryEntry for invalid path", function() {
            var dirName = "de:invalid:path",
                fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.ENCODING_ERR);
                }),
                win = createWin('DirectoryEntry');

            // create:false, exclusive:false, invalid path
            runs(function() {
                root.getDirectory(dirName, {create:false}, win, fail);
            });

            waitsFor(function() { return fail.wasCalled; }, "fail never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(fail).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
            });
        });
        it("file.spec.32 DirectoryEntry.getDirectory: get DirectoryEntry for existing file", function() {
            var fileName = "de.existing.file",
                existingFile,
                filePath = root.fullPath + '/' + fileName,
                getDir = jasmine.createSpy().andCallFake(function(file) {
                    existingFile = file;
                    // create:false, exclusive:false, existing file
                    runs(function() {
                        root.getDirectory(fileName, {create:false}, win, fail);
                    });

                    waitsFor(function() { return fail.wasCalled; }, "fail never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(fail).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                    });
                }),
                fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.TYPE_MISMATCH_ERR);

                    // cleanup
                    existingFile.remove(null, null);
                }),
                win = createWin('DirectoryEntry');

            // create file to kick off it
            runs(function() {
                root.getFile(fileName, {create:true}, getDir, fail);
            });

            waitsFor(function() { return getDir.wasCalled; }, "getDir was called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.33 DirectoryEntry.getFile: get FileEntry for existing directory", function() {
            var dirName = "de.existing.dir",
                existingDir,
                dirPath = root.fullPath + '/' + dirName,
                getFile = jasmine.createSpy().andCallFake(function(directory) {
                    existingDir = directory;
                    // create:false, exclusive:false, existing directory
                    runs(function() {
                        root.getFile(dirName, {create:false}, win, fail);
                    });

                    waitsFor(function() { return fail.wasCalled; }, "fail never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(fail).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                    });
                }),
                fail = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.TYPE_MISMATCH_ERR);

                    // cleanup
                    existingDir.remove(null, null);
                }),
                win = createWin('DirectoryEntry');

            // create directory to kick off it
            runs(function() {
                root.getDirectory(dirName, {create:true}, getFile, fail);
            });

            waitsFor(function() { return getFile.wasCalled; }, "getFile never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.34 DirectoryEntry.removeRecursively on directory", function() {
            var dirName = "de.removeRecursively",
                subDirName = "dir",
                dirPath = root.fullPath + '/' + dirName,
                //subDirPath = this.root.fullPath + '/' + subDirName,
                subDirPath = dirPath + '/' + subDirName,
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // delete directory
                    var deleteDirectory = jasmine.createSpy().andCallFake(function(directory) {
                        runs(function() {
                            entry.removeRecursively(remove, fail);
                        });

                        waitsFor(function() { return remove.wasCalled; }, "remove never called", Tests.TEST_TIMEOUT);
                    });
                    // create a sub-directory within directory
                    runs(function() {
                        entry.getDirectory(subDirName, {create: true}, deleteDirectory, fail);
                    });

                    waitsFor(function() { return deleteDirectory.wasCalled; }, "deleteDirectory never called", Tests.TEST_TIMEOUT);
                }),
                remove = jasmine.createSpy().andCallFake(function() {
                    // it that removed directory no longer exists
                    runs(function() {
                        root.getDirectory(dirName, {create:false}, win, dirExists);
                    });

                    waitsFor(function() { return dirExists.wasCalled; }, "dirExists never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(dirExists).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                    });
                }),
                dirExists = jasmine.createSpy().andCallFake(function(error){
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                }),
                fail = createFail('DirectoryEntry'),
                win = createWin('DirectoryEntry');

            // create a new directory entry to kick off it
            runs(function() {
                root.getDirectory(dirName, {create:true}, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.35 createReader: create reader on existing directory", function() {
            // create reader for root directory
            var reader = root.createReader();
            expect(reader).toBeDefined();
            expect(typeof reader.readEntries).toBe('function');
        });
        it("file.spec.36 removeRecursively on root file system", function() {
            var remove = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NO_MODIFICATION_ALLOWED_ERR);
                }),
                win = createWin('DirectoryEntry');

            // remove root file system
            runs(function() {
                root.removeRecursively(win, remove);
            });

            waitsFor(function() { return remove.wasCalled; }, "remove never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(win).not.toHaveBeenCalled();
                expect(remove).toHaveBeenCalled();
            });
        });
    });

    describe('DirectoryReader interface', function() {
        describe("readEntries", function() {
            it("file.spec.37 should read contents of existing directory", function() {
                var reader,
                    win = jasmine.createSpy().andCallFake(function(entries) {
                        expect(entries).toBeDefined();
                        expect(entries instanceof Array).toBe(true);
                    }),
                    fail = createFail('DirectoryReader');

                // create reader for root directory
                reader = root.createReader();
                // read entries
                runs(function() {
                    reader.readEntries(win, fail);
                });

                waitsFor(function() { return win.wasCalled; }, "win never called", Tests.TEST_TIMEOUT);

                runs(function() {
                    expect(win).toHaveBeenCalled();
                    expect(fail).not.toHaveBeenCalled();
                });
            });
            it("file.spec.38 should read contents of directory that has been removed", function() {
                var dirName = "de.createReader.notfound",
                    dirPath = root.fullPath + '/' + dirName,
                    entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                        // read entries
                        var readEntries = jasmine.createSpy().andCallFake(function() {
                            var reader = directory.createReader();

                            runs(function() {
                                reader.readEntries(win, itReader);
                            });

                            waitsFor(function() { return itReader.wasCalled; }, "itReader never called", Tests.TEST_TIMEOUT);
                        });
                        // delete directory
                        runs(function() {
                            directory.removeRecursively(readEntries, fail);
                        });

                        waitsFor(function() { return readEntries.wasCalled; }, "readEntries never called", Tests.TEST_TIMEOUT);
                    }),
                    itReader = jasmine.createSpy().andCallFake(function(error) {
                        var itDirectoryExists = jasmine.createSpy().andCallFake(function(error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                        });

                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.NOT_FOUND_ERR);

                        runs(function() {
                            root.getDirectory(dirName, {create:false}, win, itDirectoryExists);
                        });

                        waitsFor(function() { return itDirectoryExists.wasCalled; }, "itDirectoryExists never called", Tests.TEST_TIMEOUT);

                        runs(function() {
                            expect(itDirectoryExists).toHaveBeenCalled();
                            expect(win).not.toHaveBeenCalled();
                        });
                    }),
                    fail = createFail('DirectoryReader'),
                    win = createWin('DirectoryReader');

                // create a new directory entry to kick off it
                runs(function() {
                    root.getDirectory(dirName, {create:true}, entryCallback, fail);
                });

                waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
            });
        });
    });

    describe('File', function() {
        it("file.spec.39 constructor should be defined", function() {
            expect(File).toBeDefined();
            expect(typeof File).toBe('function');
        });
        it("file.spec.40 should be define File attributes", function() {
            var file = new File();
            expect(file.name).toBeDefined();
            expect(file.fullPath).toBeDefined();
            expect(file.type).toBeDefined();
            expect(file.lastModifiedDate).toBeDefined();
            expect(file.size).toBeDefined();
        });
    });

    describe('FileEntry', function() {
        it("file.spec.41 should be define FileEntry methods", function() {
            var fileName = "fe.methods",
                itFileEntry = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(typeof fileEntry.createWriter).toBe('function');
                    expect(typeof fileEntry.file).toBe('function');

                    // cleanup
                    fileEntry.remove(null, fail);
                }),
                fail = createFail('FileEntry');

            // create a new file entry to kick off it
            runs(function() {
                root.getFile(fileName, {create:true}, itFileEntry, fail);
            });

            waitsFor(function() { return itFileEntry.wasCalled; }, "itFileEntry never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itFileEntry).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.42 createWriter should return a FileWriter object", function() {
            var fileName = "fe.createWriter",
                itFile,
                entryCallback = jasmine.createSpy().andCallFake(function(fileEntry) {
                    itFile = fileEntry;

                    runs(function() {
                        fileEntry.createWriter(itWriter, fail);
                    });

                    waitsFor(function() { return itWriter.wasCalled; }, "itWriter", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itWriter).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                itWriter = jasmine.createSpy().andCallFake(function(writer) {
                    expect(writer).toBeDefined();
                    expect(writer instanceof FileWriter).toBe(true);

                    // cleanup
                    itFile.remove(null, fail);
                }),
                fail = createFail('FileEntry');

            // create a new file entry to kick off it
            runs(function() {
                root.getFile(fileName, {create:true}, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.43 file should return a File object", function() {
            var fileName = "fe.file",
                newFile,
                entryCallback = jasmine.createSpy().andCallFake(function(fileEntry) {
                    newFile = fileEntry;

                    runs(function() {
                        fileEntry.file(itFile, fail);
                    });

                    waitsFor(function() { return itFile.wasCalled; }, "itFile never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itFile).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                itFile = jasmine.createSpy().andCallFake(function(file) {
                    expect(file).toBeDefined();
                    expect(file instanceof File).toBe(true);

                    // cleanup
                    newFile.remove(null, fail);
                }),
                fail = createFail('FileEntry');

            // create a new file entry to kick off it
            runs(function() {
                root.getFile(fileName, {create:true}, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.44 file: on File that has been removed", function() {
            var fileName = "fe.no.file",
                entryCallback = jasmine.createSpy().andCallFake(function(fileEntry) {
                    // create File object
                    var getFile = jasmine.createSpy().andCallFake(function() {
                        runs(function() {
                            fileEntry.file(win, itFile);
                        });

                        waitsFor(function() { return itFile.wasCalled; }, "itFile never called", Tests.TEST_TIMEOUT);

                        runs(function() {
                            expect(itFile).toHaveBeenCalled();
                            expect(win).not.toHaveBeenCalled();
                        });
                    });
                    // delete file
                    runs(function() {
                        fileEntry.remove(getFile, fail);
                    });

                    waitsFor(function() { return getFile.wasCalled; }, "getFile never called", Tests.TEST_TIMEOUT);
                }),
                itFile = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                }),
                fail = createFail('FileEntry'),
                win = createWin('FileEntry');

            // create a new file entry to kick off it
            runs(function() {
                root.getFile(fileName, {create:true}, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
    });
    describe('Entry', function() {
        it("file.spec.45 Entry object", function() {
            var fileName = "entry",
                fullPath = root.fullPath + '/' + fileName,
                fail = createFail('Entry'),
                itEntry = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.name).toCanonicallyMatch(fileName);
                    expect(entry.fullPath).toCanonicallyMatch(fullPath);
                    expect(typeof entry.getMetadata).toBe('function');
                    expect(typeof entry.setMetadata).toBe('function');
                    expect(typeof entry.moveTo).toBe('function');
                    expect(typeof entry.copyTo).toBe('function');
                    expect(typeof entry.toURL).toBe('function');
                    expect(typeof entry.remove).toBe('function');
                    expect(typeof entry.getParent).toBe('function');
                    expect(typeof entry.createWriter).toBe('function');
                    expect(typeof entry.file).toBe('function');

                    // cleanup
                    deleteEntry(fileName);
                });

            // create a new file entry
            runs(function() {
                createFile(fileName, itEntry, fail);
            });

            waitsFor(function() { return itEntry.wasCalled; }, "itEntry", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itEntry).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.46 Entry.getMetadata on file", function() {
            var fileName = "entry.metadata.file",
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    runs(function() {
                        entry.getMetadata(itMetadata, fail);
                    });

                    waitsFor(function() { return itMetadata.wasCalled; }, "itMetadata never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itMetadata).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                fail = createFail('Entry'),
                itMetadata = jasmine.createSpy().andCallFake(function(metadata) {
                    expect(metadata).toBeDefined();
                    expect(metadata.modificationTime instanceof Date).toBe(true);

                    // cleanup
                    deleteEntry(fileName);
                });

            // create a new file entry
            createFile(fileName, entryCallback, fail);
        });
        it("file.spec.47 Entry.getMetadata on directory", function() {
            var dirName = "entry.metadata.dir",
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    runs(function() {
                        entry.getMetadata(itMetadata, fail);
                    });

                    waitsFor(function() { return itMetadata.wasCalled; }, "itMetadata never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itMetadata).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                fail = createFail('Entry'),
                itMetadata = jasmine.createSpy().andCallFake(function(metadata) {
                    expect(metadata).toBeDefined();
                    expect(metadata.modificationTime instanceof Date).toBe(true);

                    // cleanup
                    deleteEntry(dirName);
                });

            // create a new directory entry
            runs(function() {
                createDirectory(dirName, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.48 Entry.getParent on file in root file system", function() {
            var fileName = "entry.parent.file",
                rootPath = root.fullPath,
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    runs(function() {
                        entry.getParent(itParent, fail);
                    });

                    waitsFor(function() { return itParent.wasCalled; }, "itCalled never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itParent).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                itParent = jasmine.createSpy().andCallFake(function(parent) {
                    expect(parent).toBeDefined();
                    expect(parent.fullPath).toCanonicallyMatch(rootPath);

                    // cleanup
                    deleteEntry(fileName);
                });

            // create a new file entry
            runs(function() {
                createFile(fileName, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.49 Entry.getParent on directory in root file system", function() {
            var dirName = "entry.parent.dir",
                rootPath = root.fullPath,
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    runs(function() {
                        entry.getParent(itParent, fail);
                    });

                    waitsFor(function() { return itParent.wasCalled; }, "itParent never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itParent).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                itParent = jasmine.createSpy().andCallFake(function(parent) {
                    expect(parent).toBeDefined();
                    expect(parent.fullPath).toCanonicallyMatch(rootPath);

                    // cleanup
                    deleteEntry(dirName);
                });

            // create a new directory entry
            runs(function() {
                createDirectory(dirName, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.50 Entry.getParent on root file system", function() {
            var rootPath = root.fullPath,
                itParent = jasmine.createSpy().andCallFake(function(parent) {
                    expect(parent).toBeDefined();
                    expect(parent.fullPath).toCanonicallyMatch(rootPath);
                }),
                fail = createFail('Entry');

            // create a new directory entry
            runs(function() {
                root.getParent(itParent, fail);
            });

            waitsFor(function() { return itParent.wasCalled; }, "itParent never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itParent).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.51 Entry.toURL on file", function() {
            var fileName = "entry.uri.file",
                rootPath = root.fullPath,
                itURI = jasmine.createSpy().andCallFake(function(entry) {
                    var uri = entry.toURL();
                    expect(uri).toBeDefined();
                    expect(uri.indexOf(rootPath)).not.toBe(-1);

                    // cleanup
                    deleteEntry(fileName);
                }),
                fail = createFail('Entry');

            // create a new file entry
            runs(function() {
                createFile(fileName, itURI, fail);
            });

            waitsFor(function() { return itURI.wasCalled; }, "itURI never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itURI).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.52 Entry.toURL on directory", function() {
            var dirName = "entry.uri.dir",
                rootPath = root.fullPath,
                itURI = jasmine.createSpy().andCallFake(function(entry) {
                    var uri = entry.toURL();
                    expect(uri).toBeDefined();
                    expect(uri.indexOf(rootPath)).not.toBe(-1);

                    // cleanup
                    deleteEntry(dirName);
                }),
                fail = createFail('Entry');

            // create a new directory entry
            runs(function() {
                createDirectory(dirName, itURI, fail);
            });

            waitsFor(function() { return itURI.wasCalled; }, "itURI never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itURI).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.53 Entry.remove on file", function() {
            var fileName = "entry.rm.file",
                fullPath = root.fullPath + '/' + fileName,
                win = createWin('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    var checkRemove = jasmine.createSpy().andCallFake(function() {
                        runs(function() {
                            root.getFile(fileName, null, win, itRemove);
                        });

                        waitsFor(function() { return itRemove.wasCalled; }, "itRemove never called", Tests.TEST_TIMEOUT);

                        runs(function() {
                            expect(win).not.toHaveBeenCalled();
                            expect(fail).not.toHaveBeenCalled();
                            expect(itRemove).toHaveBeenCalled();
                        });
                    });
                    expect(entry).toBeDefined();

                    runs(function() {
                        entry.remove(checkRemove, fail);
                    });

                    waitsFor(function() { return checkRemove.wasCalled; }, "checkRemove never called", Tests.TEST_TIMEOUT);
                }),
                itRemove = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                    // cleanup
                    deleteEntry(fileName);
                }),
                fail = createFail('Entry');

            // create a new file entry
            runs(function() {
                createFile(fileName, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.54 remove on empty directory", function() {
            var dirName = "entry.rm.dir",
                fullPath = root.fullPath + '/' + dirName,
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    var checkRemove = jasmine.createSpy().andCallFake(function() {
                        runs(function() {
                            root.getDirectory(dirName, null, win, itRemove);
                        });

                        waitsFor(function() { return itRemove.wasCalled; }, "itRemove never called", Tests.TEST_TIMEOUT);

                        runs(function() {
                            expect(itRemove).toHaveBeenCalled();
                            expect(win).not.toHaveBeenCalled();
                            expect(fail).not.toHaveBeenCalled();
                        });
                    });

                    expect(entry).toBeDefined();

                    runs(function() {
                        entry.remove(checkRemove, fail);
                    });

                    waitsFor(function() { return checkRemove.wasCalled; }, "checkRemove never called", Tests.TEST_TIMEOUT);
                }),
                itRemove = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                    // cleanup
                    deleteEntry(dirName);
                }),
                win = createWin('Entry'),
                fail = createFail('Entry');

            // create a new directory entry
            runs(function() {
                createDirectory(dirName, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.55 remove on non-empty directory", function() {
            var dirName = "entry.rm.dir.not.empty",
                fullPath = root.fullPath + '/' + dirName,
                fileName = "remove.txt",
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    var checkFile = jasmine.createSpy().andCallFake(function(error) {
                        expect(error).toBeDefined();
                        expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                        // verify that dir still exists
                        runs(function() {
                            root.getDirectory(dirName, null, itRemove, fail);
                        });

                        waitsFor(function() { return itRemove.wasCalled; }, "itRemove never called", Tests.TEST_TIMEOUT);

                        runs(function() {
                            expect(win).not.toHaveBeenCalled();
                            expect(fail).not.toHaveBeenCalled();
                            expect(itRemove).toHaveBeenCalled();
                        });
                    });
                    // delete directory
                    var deleteDirectory = jasmine.createSpy().andCallFake(function(fileEntry) {
                        runs(function() {
                            entry.remove(win, checkFile);
                        });

                        waitsFor(function() { return checkFile.wasCalled; }, "checkFile never called", Tests.TEST_TIMEOUT);
                    });
                    // create a file within directory, then try to delete directory
                    runs(function() {
                        entry.getFile(fileName, {create: true}, deleteDirectory, fail);
                    });

                    waitsFor(function() { return deleteDirectory.wasCalled; }, "deleteDirectory never called", Tests.TEST_TIMEOUT);
                }),
                itRemove = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.fullPath).toCanonicallyMatch(fullPath);
                    // cleanup
                    deleteEntry(dirName);
                }),
                win = createWin('Entry'),
                fail = createFail('Entry');

            // create a new directory entry
            runs(function() {
                createDirectory(dirName, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.56 remove on root file system", function() {
            var itRemove = jasmine.createSpy().andCallFake(function(error) {
                expect(error).toBeDefined();
                expect(error).toBeFileError(FileError.NO_MODIFICATION_ALLOWED_ERR);
            }),
            win = createWin('Entry');

            // remove entry that doesn't exist
            runs(function() {
                root.remove(win, itRemove);
            });

            waitsFor(function() { return itRemove.wasCalled; }, "itRemove never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(win).not.toHaveBeenCalled();
                expect(itRemove).toHaveBeenCalled();
            });
        });
        it("file.spec.57 copyTo: file", function() {
            var file1 = "entry.copy.file1",
                file2 = "entry.copy.file2",
                fullPath = root.fullPath + '/' + file2,
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // copy file1 to file2
                    runs(function() {
                        entry.copyTo(root, file2, itCopy, fail);
                    });

                    waitsFor(function() { return itCopy.wasCalled; }, "itCopy never called", Tests.TEST_TIMEOUT);
                }),
                itCopy = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.fullPath).toCanonicallyMatch(fullPath);
                    expect(entry.name).toCanonicallyMatch(file2);

                    runs(function() {
                        root.getFile(file2, {create:false}, itFileExists, fail);
                    });

                    waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(fail).not.toHaveBeenCalled();
                        expect(itFileExists).toHaveBeenCalled();
                    });
                }),
                itFileExists = jasmine.createSpy().andCallFake(function(entry2) {
                    // a bit redundant since copy returned this entry already
                    expect(entry2).toBeDefined();
                    expect(entry2.isFile).toBe(true);
                    expect(entry2.isDirectory).toBe(false);
                    expect(entry2.fullPath).toCanonicallyMatch(fullPath);
                    expect(entry2.name).toCanonicallyMatch(file2);

                    // cleanup
                    deleteEntry(file1);
                    deleteEntry(file2);
                });

            // create a new file entry to kick off it
            runs(function() {
                createFile(file1, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.58 copyTo: file onto itself", function() {
            var file1 = "entry.copy.fos.file1",
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // copy file1 onto itself
                    runs(function() {
                        entry.copyTo(root, null, win, itCopy);
                    });

                    waitsFor(function() { return itCopy.wasCalled; }, "itCopy never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itCopy).toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                    });
                }),
                fail = createFail('Entry'),
                win = createWin('Entry'),
                itCopy = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);

                    // cleanup
                    deleteEntry(file1);
                });

            // create a new file entry to kick off it
            runs(function() {
                createFile(file1, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.59 copyTo: directory", function() {
            var file1 = "file1",
                srcDir = "entry.copy.srcDir",
                dstDir = "entry.copy.dstDir",
                dstPath = root.fullPath + '/' + dstDir,
                filePath = dstPath + '/' + file1,
                entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                    var copyDir = jasmine.createSpy().andCallFake(function(fileEntry) {
                        // copy srcDir to dstDir
                        runs(function() {
                            directory.copyTo(root, dstDir, itCopy, fail);
                        });

                        waitsFor(function() { return itCopy.wasCalled; }, "itCopy never called", Tests.TEST_TIMEOUT);
                    });

                    // create a file within new directory
                    runs(function() {
                        directory.getFile(file1, {create: true}, copyDir, fail);
                    });

                    waitsFor(function() { return copyDir.wasCalled; }, "copyDir never called", Tests.TEST_TIMEOUT);
                }),
                itCopy = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.fullPath).toCanonicallyMatch(dstPath);
                    expect(directory.name).toCanonicallyMatch(dstDir);

                    runs(function() {
                        root.getDirectory(dstDir, {create:false}, itDirExists, fail);
                    });

                    waitsFor(function() { return itDirExists.wasCalled; }, "itDirExists never called", Tests.TEST_TIMEOUT);
                }),
                itDirExists = jasmine.createSpy().andCallFake(function(dirEntry) {
                     expect(dirEntry).toBeDefined();
                     expect(dirEntry.isFile).toBe(false);
                     expect(dirEntry.isDirectory).toBe(true);
                     expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                     expect(dirEntry.name).toCanonicallyMatch(dstDir);

                     runs(function() {
                         dirEntry.getFile(file1, {create:false}, itFileExists, fail);
                     });

                     waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

                     runs(function() {
                         expect(itFileExists).toHaveBeenCalled();
                         expect(fail).not.toHaveBeenCalled();
                     });
                }),
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.isFile).toBe(true);
                    expect(fileEntry.isDirectory).toBe(false);
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                    expect(fileEntry.name).toCanonicallyMatch(file1);

                    // cleanup
                    deleteEntry(srcDir);
                    deleteEntry(dstDir);
                }),
                fail = createFail('Entry');

            // create a new directory entry to kick off it
            runs(function() {
                createDirectory(srcDir, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.60 copyTo: directory to backup at same root directory", function() {
            var file1 = "file1",
                srcDir = "entry.copy.srcDirSame",
                dstDir = "entry.copy.srcDirSame-backup",
                dstPath = root.fullPath + '/' + dstDir,
                filePath = dstPath + '/' + file1,
                fail = createFail('Entry copyTo: directory to backup at same root'),
                entryCallback = function(directory) {
                    var copyDir = function(fileEntry) {
                        // copy srcDir to dstDir
                        directory.copyTo(root, dstDir, itCopy, fail);
                    };
                    // create a file within new directory
                    directory.getFile(file1, {create: true}, copyDir, fail);
                },
                itCopy = function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.fullPath).toCanonicallyMatch(dstPath);
                    expect(directory.name).toCanonicallyMatch(dstDir);

                    root.getDirectory(dstDir, {create:false}, itDirExists, fail);
                },
                itDirExists = function(dirEntry) {
                     expect(dirEntry).toBeDefined();
                     expect(dirEntry.isFile).toBe(false);
                     expect(dirEntry.isDirectory).toBe(true);
                     expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                     expect(dirEntry.name).toCanonicallyMatch(dstDir);

                     dirEntry.getFile(file1, {create:false}, itFileExists, fail);
                },
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    var cleanSrc = jasmine.createSpy();
                    var cleanDst = jasmine.createSpy();
                    runs(function() {
                        expect(fileEntry).toBeDefined();
                        expect(fileEntry.isFile).toBe(true);
                        expect(fileEntry.isDirectory).toBe(false);
                        expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                        expect(fileEntry.name).toCanonicallyMatch(file1);
                        expect(fail).not.toHaveBeenCalled();

                        // cleanup
                        deleteEntry(srcDir, cleanSrc);
                        deleteEntry(dstDir, cleanDst);
                    });

                    waitsFor(function() { return cleanSrc.wasCalled && cleanDst.wasCalled; }, "cleanSrc and cleanDst cleanup methods", Tests.TEST_TIMEOUT);
                });

            // create a new directory entry to kick off it
            runs(function() {
                createDirectory(srcDir, entryCallback, fail);
            });

            waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists", 10000);
        });
        it("file.spec.61 copyTo: directory onto itself", function() {
            var file1 = "file1",
                srcDir = "entry.copy.dos.srcDir",
                srcPath = root.fullPath + '/' + srcDir,
                filePath = srcPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry copyTo: directory onto itself'),
                entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                    var copyDir = jasmine.createSpy().andCallFake(function(fileEntry) {
                        // copy srcDir onto itself
                        runs(function() {
                            directory.copyTo(root, null, win, itCopy);
                        });

                        waitsFor(function() { return itCopy.wasCalled; }, "itCopy never called", Tests.TEST_TIMEOUT);
                    });
                    // create a file within new directory
                    runs(function() {
                        directory.getFile(file1, {create: true}, copyDir, fail);
                    });

                    waitsFor(function() { return copyDir.wasCalled; }, "copyDir never called", Tests.TEST_TIMEOUT);
                }),
                itCopy = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);

                    runs(function() {
                        root.getDirectory(srcDir, {create:false}, itDirectoryExists, fail);
                    });

                    waitsFor(function() { return itDirectoryExists.wasCalled; }, "itDirectoryExists", Tests.TEST_TIMEOUT);
                }),
                itDirectoryExists = jasmine.createSpy().andCallFake(function(dirEntry) {
                    // returning confirms existence so just check fullPath entry
                    expect(dirEntry).toBeDefined();
                    expect(dirEntry.fullPath).toCanonicallyMatch(srcPath);

                    runs(function() {
                        dirEntry.getFile(file1, {create:false}, itFileExists, fail);
                    });

                    waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                        expect(itFileExists).toHaveBeenCalled();
                    });
                }),
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // cleanup
                    deleteEntry(srcDir);
                });

            // create a new directory entry to kick off it
            runs(function() {
                createDirectory(srcDir, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.62 copyTo: directory into itself", function() {
            var srcDir = "entry.copy.dis.srcDir",
                dstDir = "entry.copy.dis.dstDir",
                fail = createFail('Entry'),
                win = createWin('Entry'),
                srcPath = root.fullPath + '/' + srcDir,
                entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                    // copy source directory into itself
                    runs(function() {
                        directory.copyTo(directory, dstDir, win, itCopy);
                    });

                    waitsFor(function() { return itCopy.wasCalled; }, "itCopy", Tests.TEST_TIMEOUT);
                }),
                itCopy = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);

                    runs(function() {
                        root.getDirectory(srcDir, {create:false}, itDirectoryExists, fail);
                    });

                    waitsFor(function() { return itDirectoryExists.wasCalled; }, "itDirectoryExists never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itDirectoryExists).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                itDirectoryExists = jasmine.createSpy().andCallFake(function(dirEntry) {
                    // returning confirms existence so just check fullPath entry
                    expect(dirEntry).toBeDefined();
                    expect(dirEntry.fullPath).toCanonicallyMatch(srcPath);

                    // cleanup
                    deleteEntry(srcDir);
                });

            // create a new directory entry to kick off it
            runs(function() {
                createDirectory(srcDir, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.63 copyTo: directory that does not exist", function() {
            var file1 = "entry.copy.dnf.file1",
                dstDir = "entry.copy.dnf.dstDir",
                filePath = root.fullPath + '/' + file1,
                dstPath = root.fullPath + '/' + dstDir,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // copy file to target directory that does not exist
                    runs(function() {
                        directory = new DirectoryEntry();
                        directory.fullPath = dstPath;
                        entry.copyTo(directory, null, win, itCopy);
                    });

                    waitsFor(function() { return itCopy.wasCalled; }, "itCopy never called", Tests.TEST_TIMEOUT);
                }),
                itCopy = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                    runs(function() {
                        root.getFile(file1, {create: false}, itFileExists, fail);
                    });

                    waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itFileExists).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // cleanup
                    deleteEntry(file1);
                });

            // create a new file entry to kick off it
            runs(function() {
                createFile(file1, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.64 copyTo: invalid target name", function() {
            var file1 = "entry.copy.itn.file1",
                file2 = "bad:file:name",
                filePath = root.fullPath + '/' + file1,
                fail = createFail('Entry'),
                win = createWin('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // copy file1 to file2
                    runs(function() {
                        entry.copyTo(root, file2, win, itCopy);
                    });

                    waitsFor(function() { return itCopy.wasCalled; }, "itCopy never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(fail).not.toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                        expect(itCopy).toHaveBeenCalled();
                    });
                }),
                itCopy = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.ENCODING_ERR);

                    // cleanup
                    deleteEntry(file1);
                });

            // create a new file entry
            runs(function() {
                createFile(file1, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.65 moveTo: file to same parent", function() {
            var file1 = "entry.move.fsp.file1",
                file2 = "entry.move.fsp.file2",
                srcPath = root.fullPath + '/' + file1,
                dstPath = root.fullPath + '/' + file2,
                fail = createFail('Entry'),
                win = createWin('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // move file1 to file2
                    runs(function() {
                        entry.moveTo(root, file2, itMove, fail);
                    });

                    waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);
                }),
                itMove = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.fullPath).toCanonicallyMatch(dstPath);
                    expect(entry.name).toCanonicallyMatch(file2);

                    runs(function() {
                        root.getFile(file2, {create:false}, itMovedExists, fail);
                    });

                    waitsFor(function() { return itMovedExists.wasCalled; }, "itMovedExists never called", Tests.TEST_TIMEOUT);
                }),
                itMovedExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(dstPath);

                    runs(function() {
                        root.getFile(file1, {create:false}, win, itOrig);
                    });

                    waitsFor(function() { return itOrig.wasCalled; }, "itOrig never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                        expect(itOrig).toHaveBeenCalled();
                    });
                }),
                itOrig = jasmine.createSpy().andCallFake(function(error) {
                    //expect(navigator.fileMgr.itFileExists(srcPath) === false, "original file should not exist.");
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);

                    // cleanup
                    deleteEntry(file1);
                    deleteEntry(file2);
                });

            // create a new file entry to kick off it
            runs(function() {
                createFile(file1, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.66 moveTo: file to new parent", function() {
            var file1 = "entry.move.fnp.file1",
                dir = "entry.move.fnp.dir",
                srcPath = root.fullPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                dstPath = root.fullPath + '/' + dir + '/' + file1,
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // move file1 to new directory
                    var moveFile = jasmine.createSpy().andCallFake(function(directory) {
                        var itMove = jasmine.createSpy().andCallFake(function(entry) {
                            expect(entry).toBeDefined();
                            expect(entry.isFile).toBe(true);
                            expect(entry.isDirectory).toBe(false);
                            expect(entry.fullPath).toCanonicallyMatch(dstPath);
                            expect(entry.name).toCanonicallyMatch(file1);
                            // it the moved file exists
                            runs(function() {
                                directory.getFile(file1, {create:false}, itMovedExists, fail);
                            });

                            waitsFor(function() { return itMovedExists.wasCalled; }, "itMovedExists never called", Tests.TEST_TIMEOUT);
                        });
                        // move the file
                        runs(function() {
                            entry.moveTo(directory, null, itMove, fail);
                        });

                        waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);
                    });

                    // create a parent directory to move file to
                    runs(function() {
                        root.getDirectory(dir, {create: true}, moveFile, fail);
                    });

                    waitsFor(function() { return moveFile.wasCalled; }, "moveFile never called", Tests.TEST_TIMEOUT);
                }),
                itMovedExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(dstPath);

                    runs(function() {
                        root.getFile(file1, {create:false}, win, itOrig);
                    });

                    waitsFor(function() { return itOrig.wasCalled; }, "itOrig never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                        expect(itOrig).toHaveBeenCalled();
                    });
                }),
                itOrig = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);

                    // cleanup
                    deleteEntry(file1);
                    deleteEntry(dir);
                });

            // ensure destination directory is cleaned up first
            runs(function() {
                deleteEntry(dir, function() {
                    // create a new file entry to kick off it
                    createFile(file1, entryCallback, fail);
                }, fail);
            });
            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.67 moveTo: directory to same parent", function() {
            var file1 = "file1",
                srcDir = "entry.move.dsp.srcDir",
                dstDir = "entry.move.dsp.dstDir",
                srcPath = root.fullPath + '/' + srcDir,
                dstPath = root.fullPath + '/' + dstDir,
                filePath = dstPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                    var moveDir = jasmine.createSpy().andCallFake(function(fileEntry) {
                        // move srcDir to dstDir
                        runs(function() {
                            directory.moveTo(root, dstDir, itMove, fail);
                        });

                        waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);
                    });
                    // create a file within directory
                    runs(function() {
                        directory.getFile(file1, {create: true}, moveDir, fail);
                    });

                    waitsFor(function() { return moveDir.wasCalled; }, "moveDir never called", Tests.TEST_TIMEOUT);
                }),
                itMove = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.fullPath).toCanonicallyMatch(dstPath);
                    expect(directory.name).toCanonicallyMatch(dstDir);
                    // it that moved file exists in destination dir

                    runs(function() {
                        directory.getFile(file1, {create:false}, itMovedExists, fail);
                    });

                    waitsFor(function() { return itMovedExists.wasCalled; }, "itMovedExists never called", Tests.TEST_TIMEOUT);
                }),
                itMovedExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // check that the moved file no longer exists in original dir
                    runs(function() {
                        root.getFile(file1, {create:false}, win, itOrig);
                    });

                    waitsFor(function() { return itOrig.wasCalled; }, "itOrig never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                        expect(itOrig).toHaveBeenCalled();
                    });
                }),
                itOrig = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);

                    // cleanup
                    deleteEntry(srcDir);
                    deleteEntry(dstDir);
                });

            // ensure destination directory is cleaned up before it
            runs(function() {
                deleteEntry(dstDir, function() {
                    // create a new directory entry to kick off it
                    createDirectory(srcDir, entryCallback, fail);
                }, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.68 moveTo: directory to same parent with same name", function() {
            var file1 = "file1",
                srcDir = "entry.move.dsp.srcDir",
                dstDir = "entry.move.dsp.srcDir-backup",
                srcPath = root.fullPath + '/' + srcDir,
                dstPath = root.fullPath + '/' + dstDir,
                filePath = dstPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                    var moveDir = jasmine.createSpy().andCallFake(function(fileEntry) {
                        // move srcDir to dstDir
                        runs(function() {
                            directory.moveTo(root, dstDir, itMove, fail);
                        });

                        waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);
                    });
                    // create a file within directory
                    runs(function() {
                        directory.getFile(file1, {create: true}, moveDir, fail);
                    });

                    waitsFor(function() { return moveDir.wasCalled; }, "moveDir never called", Tests.TEST_TIMEOUT);
                }),
                itMove = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.fullPath).toCanonicallyMatch(dstPath);
                    expect(directory.name).toCanonicallyMatch(dstDir);
                    // check that moved file exists in destination dir
                    runs(function() {
                        directory.getFile(file1, {create:false}, itMovedExists, null);
                    });

                    waitsFor(function() { return itMovedExists.wasCalled; }, "itMovedExists never called", Tests.TEST_TIMEOUT);
                }),
                itMovedExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                    // check that the moved file no longer exists in original dir
                    runs(function() {
                        root.getFile(file1, {create:false}, win, itOrig);
                    });

                    waitsFor(function() { return itOrig.wasCalled; }, "itOrig never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                        expect(itOrig).toHaveBeenCalled();
                    });
                }),
                itOrig = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);

                    // cleanup
                    deleteEntry(srcDir);
                    deleteEntry(dstDir);
                });

            // ensure destination directory is cleaned up before it
            runs(function() {
                deleteEntry(dstDir, function() {
                    // create a new directory entry to kick off it
                    createDirectory(srcDir, entryCallback, fail);
                }, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.69 moveTo: directory to new parent", function() {
            var file1 = "file1",
                srcDir = "entry.move.dnp.srcDir",
                dstDir = "entry.move.dnp.dstDir",
                srcPath = root.fullPath + '/' + srcDir,
                dstPath = root.fullPath + '/' + dstDir,
                filePath = dstPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                    var moveDir = jasmine.createSpy().andCallFake(function(fileEntry) {
                        // move srcDir to dstDir
                        runs(function() {
                            directory.moveTo(root, dstDir, itMove, fail);
                        });

                        waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);
                    });
                    // create a file within directory
                    runs(function() {
                        directory.getFile(file1, {create: true}, moveDir, fail);
                    });

                    waitsFor(function() { return moveDir.wasCalled; }, "moveDir never called", Tests.TEST_TIMEOUT);
                }),
                itMove = jasmine.createSpy().andCallFake(function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.fullPath).toCanonicallyMatch(dstPath);
                    expect(directory.name).toCanonicallyMatch(dstDir);
                    // it that moved file exists in destination dir
                    runs(function() {
                        directory.getFile(file1, {create:false}, itMovedExists, fail);
                    });

                    waitsFor(function() { return itMovedExists.wasCalled; }, "itMovedExists never called", Tests.TEST_TIMEOUT);
                }),
                itMovedExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);
                    // it that the moved file no longer exists in original dir
                    runs(function() {
                        root.getFile(file1, {create:false}, win, itOrig);
                    });

                    waitsFor(function() { return itOrig.wasCalled; }, "itOrig never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                        expect(itOrig).toHaveBeenCalled();
                    });
                }),
                itOrig = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);

                    // cleanup
                    deleteEntry(srcDir);
                    deleteEntry(dstDir);
                });

            // ensure destination directory is cleaned up before it
            runs(function() {
                deleteEntry(dstDir, function() {
                    // create a new directory entry to kick off it
                    createDirectory(srcDir, entryCallback, fail);
                }, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.70 moveTo: directory onto itself", function() {
            var file1 = "file1",
                srcDir = "entry.move.dos.srcDir",
                srcPath = root.fullPath + '/' + srcDir,
                filePath = srcPath + '/' + file1,
                fail = createFail('Entry'),
                win = createWin('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                    var moveDir = jasmine.createSpy().andCallFake(function(fileEntry) {
                        // move srcDir onto itself
                        runs(function() {
                            directory.moveTo(root, null, win, itMove);
                        });

                        waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);
                    });
                    // create a file within new directory
                    runs(function() {
                        directory.getFile(file1, {create: true}, moveDir, fail);
                    });

                    waitsFor(function() { return moveDir.wasCalled; }, "moveDir never called", Tests.TEST_TIMEOUT);
                }),
                itMove = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);

                    // it that original dir still exists
                    runs(function() {
                        root.getDirectory(srcDir, {create:false}, itDirectoryExists, fail);
                    });

                    waitsFor(function() { return itDirectoryExists.wasCalled; }, "itDirectoryExists", Tests.TEST_TIMEOUT);
                }),
                itDirectoryExists = jasmine.createSpy().andCallFake(function(dirEntry) {
                    // returning confirms existence so just check fullPath entry
                    expect(dirEntry).toBeDefined();
                    expect(dirEntry.fullPath).toCanonicallyMatch(srcPath);

                    runs(function() {
                        dirEntry.getFile(file1, {create:false}, itFileExists, fail);
                    });

                    waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itFileExists).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // cleanup
                    deleteEntry(srcDir);
                });

            // create a new directory entry to kick off it
            runs(function() {
                createDirectory(srcDir, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.71 moveTo: directory into itself", function() {
            var srcDir = "entry.move.dis.srcDir",
                dstDir = "entry.move.dis.dstDir",
                srcPath = root.fullPath + '/' + srcDir,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(directory) {
                    // move source directory into itself
                    runs(function() {
                        directory.moveTo(directory, dstDir, win, itMove);
                    });

                    waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);
                }),
                itMove = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                    // make sure original directory still exists
                    runs(function() {
                        root.getDirectory(srcDir, {create:false}, itDirectoryExists, fail);
                    });

                    waitsFor(function() { return itDirectoryExists.wasCalled; }, "itDirectoryExists never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(fail).not.toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                        expect(itDirectoryExists).toHaveBeenCalled();
                    });
                }),
                itDirectoryExists = jasmine.createSpy().andCallFake(function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.fullPath).toCanonicallyMatch(srcPath);

                    // cleanup
                    deleteEntry(srcDir);
                });

            // create a new directory entry to kick off it
            runs(function() {
                createDirectory(srcDir, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.72 moveTo: file onto itself", function() {
            var file1 = "entry.move.fos.file1",
                filePath = root.fullPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = jasmine.createSpy().andCallFake(function(entry) {
                    // move file1 onto itself
                    runs(function() {
                        entry.moveTo(root, null, win, itMove);
                    });

                    waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);
                }),
                itMove = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);

                    //it that original file still exists
                    runs(function() {
                        root.getFile(file1, {create:false}, itFileExists, fail);
                    });

                    waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

                    runs(function() {
                        expect(itFileExists).toHaveBeenCalled();
                        expect(win).not.toHaveBeenCalled();
                        expect(fail).not.toHaveBeenCalled();
                    });
                }),
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // cleanup
                    deleteEntry(file1);
                });

            // create a new file entry to kick off it
            runs(function() {
                createFile(file1, entryCallback, fail);
            });

            waitsFor(function() { return entryCallback.wasCalled; }, "entryCallback never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.73 moveTo: file onto existing directory", function() {
            var file1 = "entry.move.fod.file1",
                dstDir = "entry.move.fod.dstDir",
                subDir = "subDir",
                dirPath = root.fullPath + '/' + dstDir + '/' + subDir,
                filePath = root.fullPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = function(entry) {
                    var createSubDirectory = function(directory) {
                        var moveFile = function(subDirectory) {
                            var itMove = function(error) {
                                expect(error).toBeDefined();
                                expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                                // check that original dir still exists
                                directory.getDirectory(subDir, {create:false}, itDirectoryExists, fail);
                            };
                            // move file1 onto sub-directory
                            entry.moveTo(directory, subDir, win, itMove);
                        };
                        // create sub-directory
                        directory.getDirectory(subDir, {create: true}, moveFile, fail);
                    };
                    // create top level directory
                    root.getDirectory(dstDir, {create: true}, createSubDirectory, fail);
                },
                itDirectoryExists = function(dirEntry) {
                    expect(dirEntry).toBeDefined();
                    expect(dirEntry.fullPath).toCanonicallyMatch(dirPath);
                    // check that original file still exists
                    root.getFile(file1, {create:false},itFileExists, fail);
                },
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // cleanup
                    deleteEntry(file1);
                    deleteEntry(dstDir);
                });

            // ensure destination directory is cleaned up before it
            runs(function() {
                deleteEntry(dstDir, function() {
                    // create a new file entry to kick off it
                    createFile(file1, entryCallback, fail);
                }, fail);
            });

            waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itFileExists).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.74 moveTo: directory onto existing file", function() {
            var file1 = "entry.move.dof.file1",
                srcDir = "entry.move.dof.srcDir",
                dirPath = root.fullPath + '/' + srcDir,
                filePath = root.fullPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = function(entry) {
                    var moveDir = function(fileEntry) {
                        // move directory onto file
                        entry.moveTo(root, file1, win, itMove);
                    };
                    // create file
                    root.getFile(file1, {create: true}, moveDir, fail);
                },
                itMove = function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                    // it that original directory exists
                    root.getDirectory(srcDir, {create:false}, itDirectoryExists, fail);
                },
                itDirectoryExists = function(dirEntry) {
                    // returning confirms existence so just check fullPath entry
                    expect(dirEntry).toBeDefined();
                    expect(dirEntry.fullPath).toCanonicallyMatch(dirPath);
                    // it that original file exists
                    root.getFile(file1, {create:false}, itFileExists, fail);
                },
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // cleanup
                    deleteEntry(file1);
                    deleteEntry(srcDir);
                });

            // create a new directory entry to kick off it
            runs(function() {
                createDirectory(srcDir, entryCallback, fail);
            });

            waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itFileExists).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.75 copyTo: directory onto existing file", function() {
            var file1 = "entry.copy.dof.file1",
                srcDir = "entry.copy.dof.srcDir",
                dirPath = root.fullPath + '/' + srcDir,
                filePath = root.fullPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = function(entry) {
                    var copyDir = function(fileEntry) {
                        // move directory onto file
                        entry.copyTo(root, file1, win, itMove);
                    };
                    // create file
                    root.getFile(file1, {create: true}, copyDir, fail);
                },
                itMove = function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);
                    //check that original dir still exists
                    root.getDirectory(srcDir, {create:false}, itDirectoryExists, fail);
                },
                itDirectoryExists = function(dirEntry) {
                    // returning confirms existence so just check fullPath entry
                    expect(dirEntry).toBeDefined();
                    expect(dirEntry.fullPath).toCanonicallyMatch(dirPath);
                    // it that original file still exists
                    root.getFile(file1, {create:false}, itFileExists, fail);
                },
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // cleanup
                    deleteEntry(file1);
                    deleteEntry(srcDir);
                });

            // create a new directory entry to kick off it
            runs(function() {
                createDirectory(srcDir, entryCallback, fail);
            });

            waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itFileExists).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.76 moveTo: directory onto directory that is not empty", function() {
            var srcDir = "entry.move.dod.srcDir",
                dstDir = "entry.move.dod.dstDir",
                subDir = "subDir",
                srcPath = root.fullPath + '/' + srcDir,
                dstPath = root.fullPath + '/' + dstDir + '/' + subDir,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = function(entry) {
                    var createSubDirectory = function(directory) {
                        var moveDir = function(subDirectory) {
                            // move srcDir onto dstDir (not empty)
                            entry.moveTo(root, dstDir, win, itMove);
                        };
                        var itMove = function(error) {
                            expect(error).toBeDefined();
                            expect(error).toBeFileError(FileError.INVALID_MODIFICATION_ERR);

                            // it that destination directory still exists
                            directory.getDirectory(subDir, {create:false}, itDirectoryExists, fail);
                        };
                        // create sub-directory
                        directory.getDirectory(subDir, {create: true}, moveDir, fail);
                    };
                    // create top level directory
                    root.getDirectory(dstDir, {create: true}, createSubDirectory, fail);
                },
                itDirectoryExists = function(dirEntry) {
                    // returning confirms existence so just check fullPath entry
                    expect(dirEntry).toBeDefined();
                    expect(dirEntry.fullPath).toCanonicallyMatch(dstPath);
                    // it that source directory exists
                    root.getDirectory(srcDir,{create:false}, itSrcDirectoryExists, fail);
                },
                itSrcDirectoryExists = jasmine.createSpy().andCallFake(function(srcEntry){
                    expect(srcEntry).toBeDefined();
                    expect(srcEntry.fullPath).toCanonicallyMatch(srcPath);
                    // cleanup
                    deleteEntry(srcDir);
                    deleteEntry(dstDir);
                });

            // ensure destination directory is cleaned up before it
            runs(function() {
                deleteEntry(dstDir, function() {
                    // create a new file entry to kick off it
                    createDirectory(srcDir, entryCallback, fail);
                }, fail);
            });

            waitsFor(function() { return itSrcDirectoryExists.wasCalled; }, "itSrcDirectoryExists never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itSrcDirectoryExists).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.77 moveTo: file replace existing file", function() {
            var file1 = "entry.move.frf.file1",
                file2 = "entry.move.frf.file2",
                file1Path = root.fullPath + '/' + file1,
                file2Path = root.fullPath + '/' + file2,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = function(entry) {
                    var moveFile = function(fileEntry) {
                        // replace file2 with file1
                        entry.moveTo(root, file2, itMove, fail);
                    };
                    // create file
                    root.getFile(file2, {create: true}, moveFile,fail);
                },
                itMove = function(entry) {
                    expect(entry).toBeDefined();
                    expect(entry.isFile).toBe(true);
                    expect(entry.isDirectory).toBe(false);
                    expect(entry.fullPath).toCanonicallyMatch(file2Path);
                    expect(entry.name).toCanonicallyMatch(file2);

                    // it that old file does not exists
                    root.getFile(file1, {create:false}, win, itFileMoved);
                },
                itFileMoved = function(error){
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);
                    // it that new file exists
                    root.getFile(file2, {create:false}, itFileExists, fail);
                },
                itFileExists = jasmine.createSpy().andCallFake(function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(file2Path);

                    // cleanup
                    deleteEntry(file1);
                    deleteEntry(file2);
                });

            // create a new directory entry to kick off it
            runs(function() {
                createFile(file1, entryCallback, fail);
            });

            waitsFor(function() { return itFileExists.wasCalled; }, "itFileExists never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itFileExists).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.78 moveTo: directory replace empty directory", function() {
            var file1 = "file1",
                srcDir = "entry.move.drd.srcDir",
                dstDir = "entry.move.drd.dstDir",
                srcPath = root.fullPath + '/' + srcDir,
                dstPath = root.fullPath + '/' + dstDir,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                filePath = dstPath + '/' + file1,
                entryCallback = function(directory) {
                    var mkdir = function(fileEntry) {
                        // create destination directory
                        root.getDirectory(dstDir, {create: true}, moveDir, fail);
                    };
                    var moveDir = function(fileEntry) {
                        // move srcDir to dstDir
                        directory.moveTo(root, dstDir, itMove, fail);
                    };
                    // create a file within source directory
                    directory.getFile(file1, {create: true}, mkdir, fail);
                },
                itMove = function(directory) {
                    expect(directory).toBeDefined();
                    expect(directory.isFile).toBe(false);
                    expect(directory.isDirectory).toBe(true);
                    expect(directory.fullPath).toCanonicallyMatch(dstPath);
                    expect(directory.name).toCanonicallyMatch(dstDir);
                    // check that old directory contents have been moved
                    directory.getFile(file1, {create:false}, itFileExists, fail);
                },
                itFileExists = function(fileEntry) {
                    expect(fileEntry).toBeDefined();
                    expect(fileEntry.fullPath).toCanonicallyMatch(filePath);

                    // check that old directory no longer exists
                    root.getDirectory(srcDir, {create:false}, win, itRemoved);
                },
                itRemoved = jasmine.createSpy().andCallFake(function(error){
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);

                    // cleanup
                    deleteEntry(srcDir);
                    deleteEntry(dstDir);
                });

            // ensure destination directory is cleaned up before it
            runs(function() {
                deleteEntry(dstDir, function() {
                    // create a new directory entry to kick off it
                    createDirectory(srcDir, entryCallback, fail);
                }, fail);
            });

            waitsFor(function() { return itRemoved.wasCalled; }, "itRemoved never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itRemoved).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.79 moveTo: directory that does not exist", function() {
            var file1 = "entry.move.dnf.file1",
                dstDir = "entry.move.dnf.dstDir",
                filePath = root.fullPath + '/' + file1,
                dstPath = root.fullPath + '/' + dstDir,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = function(entry) {
                    // move file to directory that does not exist
                    directory = new DirectoryEntry();
                    directory.fullPath = dstPath;
                    entry.moveTo(directory, null, win, itMove);
                },
                itMove = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.NOT_FOUND_ERR);

                    // cleanup
                    deleteEntry(file1);
                });

            // create a new file entry to kick off it
            runs(function() {
                createFile(file1, entryCallback, fail);
            });

            waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itMove).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.80 moveTo: invalid target name", function() {
            var file1 = "entry.move.itn.file1",
                file2 = "bad:file:name",
                filePath = root.fullPath + '/' + file1,
                win = createWin('Entry'),
                fail = createFail('Entry'),
                entryCallback = function(entry) {
                    // move file1 to file2
                    entry.moveTo(root, file2, win, itMove);
                },
                itMove = jasmine.createSpy().andCallFake(function(error) {
                    expect(error).toBeDefined();
                    expect(error).toBeFileError(FileError.ENCODING_ERR);

                    // cleanup
                    deleteEntry(file1);
                });

            // create a new file entry to kick off it
            runs(function() {
                createFile(file1,entryCallback, fail);
            });

            waitsFor(function() { return itMove.wasCalled; }, "itMove never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(itMove).toHaveBeenCalled();
                expect(win).not.toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });

    describe('FileReader', function() {
        it("file.spec.81 should have correct methods", function() {
            var reader = new FileReader();
            expect(reader).toBeDefined();
            expect(typeof reader.readAsBinaryString).toBe('function');
            expect(typeof reader.readAsDataURL).toBe('function');
            expect(typeof reader.readAsText).toBe('function');
            expect(typeof reader.readAsArrayBuffer).toBe('function');
            expect(typeof reader.abort).toBe('function');
        });
    });

    describe('read method', function(){
        it("file.spec.82 should error out on non-existent file", function() {
            var reader = new FileReader();
            var verifier = jasmine.createSpy().andCallFake(function(evt) {
                expect(evt).toBeDefined();
                expect(evt.target.error).toBeFileError(FileError.NOT_FOUND_ERR);
            });
            reader.onerror = verifier;
            var myFile = new File();
            myFile.fullPath = root.fullPath + '/' + "doesnotexist.err";

            reader.readAsText(myFile);

            waitsFor(function() { return verifier.wasCalled; }, "verifier never called", Tests.TEST_TIMEOUT);
        });
        it("file.spec.83 should be able to read native blob objects", function() {
            // Skip test if blobs are not supported (e.g.: Android 2.3).
            if (typeof Blob == 'undefined') {
                return;
            }
            var contents = 'asdf';
            var uint8Array = new Uint8Array(contents.length);
            for (var i = 0; i < contents.length; ++i) {
              uint8Array[i] = contents.charCodeAt(i);
            }
            var Builder = window.BlobBuilder || window.WebKitBlobBuilder;
            var blob;
            if (Builder) {
                var builder = new Builder();
                builder.append(uint8Array.buffer);
                builder.append(contents);
                blob = builder.getBlob("text/plain");
            } else {
                try {
                    // iOS 6 does not support Views, so pass in the buffer.
                    blob = new Blob([uint8Array.buffer, contents]);
                } catch (e) {
                    // Skip the test if we can't create a blob (e.g.: iOS 5).
                    if (e instanceof TypeError) {
                        return;
                    }
                    throw e;
                }
            }
            var verifier = jasmine.createSpy().andCallFake(function(evt) {
                expect(evt).toBeDefined();
                expect(evt.target.result).toBe('asdfasdf');
            });
            var reader = new FileReader();
            reader.onloadend = verifier;
            reader.readAsText(blob);

            waitsFor(function() { return verifier.wasCalled; }, "verifier never called", 300);
        });

        function writeDummyFile(writeBinary, callback) {
            var fileName = "dummy.txt",
                fileEntry = null,
                writerFail = createFail('createWriter'),
                getFileFail = createFail('getFile'),
                fileFail = createFail('file'),
                callback = jasmine.createSpy().andCallFake(callback),
                fileData = '\u20AC\xEB - There is an exception to every rule.  Except this one.',
                fileDataAsBinaryString = '\xe2\x82\xac\xc3\xab - There is an exception to every rule.  Except this one.',
                createWriter = function(fe) {
                    fileEntry = fe;
                    fileEntry.createWriter(writeFile, writerFail);
                },
                // writes file and reads it back in
                writeFile = function(writer) {
                    writer.onwriteend = function() {
                        fileEntry.file(function(f) {
                            callback(fileEntry, f, fileData, fileDataAsBinaryString);
                        }, fileFail);
                    };
                    writer.write(fileData);
                };
            fileData += writeBinary ? 'bin:\x01\x00' : '';
            fileDataAsBinaryString += writeBinary ? 'bin:\x01\x00' : '';
            // create a file, write to it, and read it in again
            root.getFile(fileName, {create: true}, createWriter, getFileFail);
            waitsForAny(getFileFail, writerFail, fileFail, callback);
        }

        function runReaderTest(funcName, writeBinary, verifierFunc, sliceStart, sliceEnd) {
            writeDummyFile(writeBinary, function(fileEntry, file, fileData, fileDataAsBinaryString) {
                var readWin = jasmine.createSpy().andCallFake(function(evt) {
                    expect(evt).toBeDefined();
                    verifierFunc(evt, fileData, fileDataAsBinaryString);
                });

                var reader = new FileReader();
                var readFail = createFail(funcName);
                reader.onload = readWin;
                reader.onerror = readFail;
                if (sliceEnd !== undefined) {
                    file = file.slice(sliceStart, sliceEnd);
                } else if (sliceStart !== undefined) {
                    file = file.slice(sliceStart);
                }
                reader[funcName](file);

                waitsForAny(readWin, readFail);
            });
        }

        function arrayBufferEqualsString(buf, str) {
            var buf = new Uint8Array(ab);
            var match = buf.length == str.length;

            for (var i = 0; match && i < buf.length; i++) {
                match = buf[i] == str.charCodeAt(i);
            }
            return match;
        }

        it("file.spec.84 should read file properly, readAsText", function() {
            runReaderTest('readAsText', false, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result).toBe(fileData);
            });
        });
        it("file.spec.85 should read file properly, Data URI", function() {
            runReaderTest('readAsDataURL', true, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result.substr(0,23)).toBe("data:text/plain;base64,");
                expect(evt.target.result.slice(23)).toBe(atob(fileData));
            });
        });
        it("file.spec.86 should read file properly, readAsBinaryString", function() {
            runReaderTest('readAsBinaryString', true, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result).toBe(fileDataAsBinaryString);
            });
        });
        it("file.spec.87 should read file properly, readAsArrayBuffer", function() {
            runReaderTest('readAsArrayBuffer', true, function(evt, fileData, fileDataAsBinaryString) {
                expect(arrayBufferEqualsString(evt.target.result, fileDataAsBinaryString)).toBe(true);
            });
        });
        it("file.spec.88 should read sliced file: readAsText", function() {
            runReaderTest('readAsText', false, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result).toBe(fileDataAsBinaryString.slice(10, 40));
            }, 10, 40);
        });
        it("file.spec.89 should read sliced file: slice past eof", function() {
            runReaderTest('readAsText', false, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result).toBe(fileData.slice(-5, 9999));
            }, -5, 9999);
        });
        it("file.spec.90 should read sliced file: slice to eof", function() {
            runReaderTest('readAsText', false, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result).toBe(fileData.slice(-5));
            }, -5);
        });
        it("file.spec.91 should read empty slice", function() {
            runReaderTest('readAsText', false, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result).toBe('');
            }, 0, 0);
        });
        it("file.spec.92 should read sliced file properly, readAsDataURL", function() {
            runReaderTest('readAsDataURL', true, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result.slice(0, 23)).toBe("data:text/plain;base64,");
                expect(evt.target.result.slice(23)).toBe(atob(fileDataAsBinaryString.slice( 10, -3)));
            }, 10, -3);
        });
        it("file.spec.93 should read sliced file properly, readAsBinaryString", function() {
            runReaderTest('readAsBinaryString', true, function(evt, fileData, fileDataAsBinaryString) {
                expect(evt.target.result).toBe(fileDataAsBinaryString.slice(-10, -5));
            }, -10, -5);
        });
        it("file.spec.94 should read sliced file properly, readAsArrayBuffer", function() {
            runReaderTest('readAsArrayBuffer', true, function(evt, fileData, fileDataAsBinaryString) {
                expect(arrayBufferEqualsString(evt.target.result, fileDataAsBinaryString.slice(0, -1))).toBe(true);
            }, 0, -1);
        });
    });

    describe('FileWriter', function(){
        it("file.spec.81 should have correct methods", function() {
            // retrieve a FileWriter object
            var fileName = "writer.methods",
                fail = createFail('FileWriter'),
                verifier = jasmine.createSpy().andCallFake(function(writer) {
                    expect(writer).toBeDefined();
                    expect(typeof writer.write).toBe('function');
                    expect(typeof writer.seek).toBe('function');
                    expect(typeof writer.truncate).toBe('function');
                    expect(typeof writer.abort).toBe('function');

                    // cleanup
                    deleteFile(fileName);
                }),
                it_writer = function(fileEntry) {
                    fileEntry.createWriter(verifier, fail);
                };

            // it FileWriter
            runs(function() {
                root.getFile(fileName, {create: true}, it_writer, fail);
            });

            waitsFor(function() { return verifier.wasCalled; }, "verifier never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(fail).not.toHaveBeenCalled();
                expect(verifier).toHaveBeenCalled();
            });
        });
        it("file.spec.96 should be able to write and append to file, createWriter", function() {
            var fileName = "writer.append",
                theWriter,
                filePath = root.fullPath + '/' + fileName,
                // file content
                rule = "There is an exception to every rule.",
                // for checkin file length
                length = rule.length,
                fail = createFail('FileWriter'),
                verifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // append some more stuff
                    var exception = "  Except this one.";
                    theWriter.onwriteend = anotherVerifier;
                    length += exception.length;
                    theWriter.seek(theWriter.length);
                    theWriter.write(exception);
                }),
                anotherVerifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // cleanup
                    deleteFile(fileName);
                }),
                // writes initial file content
                write_file = function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        theWriter = writer;
                        writer.onwriteend = verifier;
                        writer.write(rule);
                    }, fail);
                };

            // create file, then write and append to it
            runs(function() {
                createFile(fileName, write_file);
            });

            waitsFor(function() { return anotherVerifier.wasCalled; }, "verifier never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(fail).not.toHaveBeenCalled();
                expect(verifier).toHaveBeenCalled();
                expect(anotherVerifier).toHaveBeenCalled();
            });
        });
        it("file.spec.97 should be able to write and append to file, File object", function() {
            var fileName = "writer.append",
                theWriter,
                filePath = root.fullPath + '/' + fileName,
                // file content
                rule = "There is an exception to every rule.",
                // for checking file length
                length = rule.length,
                verifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // append some more stuff
                    var exception = "  Except this one.";
                    theWriter.onwriteend = anotherVerifier;
                    length += exception.length;
                    theWriter.seek(theWriter.length);
                    theWriter.write(exception);
                }),
                anotherVerifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // cleanup
                    deleteFile(fileName);
                }),
                // writes initial file content
                write_file = function(file) {
                    theWriter = new FileWriter(file);
                    theWriter.onwriteend = verifier;
                    theWriter.write(rule);
                };

            // create file, then write and append to it
            runs(function() {
                var file = new File();
                file.fullPath = filePath;
                write_file(file);
            });

            waitsFor(function() { return anotherVerifier.wasCalled; }, "verifier", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(verifier).toHaveBeenCalled();
                expect(anotherVerifier).toHaveBeenCalled();
            });
        });
        it("file.spec.98 should be able to seek to the middle of the file and write more data than file.length", function() {
            var fileName = "writer.seek.write",
                filePath = root.fullPath + '/' + fileName,
                theWriter,
                // file content
                rule = "This is our sentence.",
                // for iting file length
                length = rule.length,
                fail = createFail('FileWriter'),
                verifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // append some more stuff
                    var exception = "newer sentence.";
                    theWriter.onwriteend = anotherVerifier;
                    length = 12 + exception.length;
                    theWriter.seek(12);
                    theWriter.write(exception);
                }),
                anotherVerifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // cleanup
                    deleteFile(fileName);
                }),
                // writes initial file content
                write_file = function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        theWriter = writer;
                        theWriter.onwriteend = verifier;
                        theWriter.write(rule);
                    }, fail);
                };

            // create file, then write and append to it
            runs(function() {
                createFile(fileName, write_file);
            });

            waitsFor(function() { return anotherVerifier.wasCalled; }, "verifier never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(verifier).toHaveBeenCalled();
                expect(anotherVerifier).toHaveBeenCalled();
            });
        });
        it("file.spec.99 should be able to seek to the middle of the file and write less data than file.length", function() {
            var fileName = "writer.seek.write2",
                filePath = root.fullPath + '/' + fileName,
                // file content
                rule = "This is our sentence.",
                theWriter,
                fail = createFail('FileWriter'),
                // for iting file length
                length = rule.length,
                verifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // append some more stuff
                    var exception = "new.";
                    theWriter.onwriteend = anotherVerifier;
                    length = 8 + exception.length;
                    theWriter.seek(8);
                    theWriter.write(exception);
                }),
                anotherVerifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // cleanup
                    deleteFile(fileName);
                }),
                // writes initial file content
                write_file = function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        theWriter = writer;
                        theWriter.onwriteend = verifier;
                        theWriter.write(rule);
                    }, fail);
                };

            // create file, then write and append to it
            runs(function() {
                createFile(fileName, write_file);
            });

            waitsFor(function() { return anotherVerifier.wasCalled; }, "verifier never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(verifier).toHaveBeenCalled();
                expect(anotherVerifier).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.100 should be able to write XML data", function() {
            var fileName = "writer.xml",
                filePath = root.fullPath + '/' + fileName,
                fail = createFail('FileWriter'),
                theWriter,
                // file content
                rule = '<?xml version="1.0" encoding="UTF-8"?>\n<it prop="ack">\nData\n</it>\n',
                // for iting file length
                length = rule.length,
                verifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // cleanup
                    deleteFile(fileName);
                }),
                // writes file content
                write_file = function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        theWriter = writer;
                        theWriter.onwriteend = verifier;
                        theWriter.write(rule);
                    }, fail);
                };

            // creates file, then write XML data
            runs(function() {
                createFile(fileName, write_file);
            });

            waitsFor(function() { return verifier.wasCalled; }, "verifier", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(verifier).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.101 should be able to write JSON data", function() {
            var fileName = "writer.json",
                filePath = root.fullPath + '/' + fileName,
                theWriter,
                // file content
                rule = '{ "name": "Guy Incognito", "email": "here@there.com" }',
                fail = createFail('FileWriter'),
                // for iting file length
                length = rule.length,
                verifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(length);
                    expect(theWriter.position).toBe(length);

                    // cleanup
                    deleteFile(fileName);
                }),
                // writes file content
                write_file = function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        theWriter = writer;
                        theWriter.onwriteend = verifier;
                        theWriter.write(rule);
                    }, fail);
                };

            // creates file, then write JSON content
            runs(function() {
                createFile(fileName, write_file);
            });

            waitsFor(function() { return verifier.wasCalled; }, "verifier", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(verifier).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.102 should be able to seek", function() {
            var fileName = "writer.seek",
                // file content
                rule = "There is an exception to every rule.  Except this one.",
                theWriter,
                // for iting file length
                length = rule.length,
                fail = createFail('FileWriter'),
                verifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.position).toBe(length);
                    theWriter.seek(-5);
                    expect(theWriter.position).toBe(length-5);
                    theWriter.seek(length + 100);
                    expect(theWriter.position).toBe(length);
                    theWriter.seek(10);
                    expect(theWriter.position).toBe(10);

                    // cleanup
                    deleteFile(fileName);
                }),
                // writes file content and its writer.seek
                seek_file = function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        theWriter = writer;
                        theWriter.onwriteend = verifier;
                        theWriter.seek(-100);
                        expect(theWriter.position).toBe(0);
                        theWriter.write(rule);
                    }, fail);
                };

            // creates file, then write JSON content
            runs(function() {
                createFile(fileName, seek_file);
            });

            waitsFor(function() { return verifier.wasCalled; }, "verifier never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(verifier).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
        it("file.spec.103 should be able to truncate", function() {
            var fileName = "writer.truncate",
                rule = "There is an exception to every rule.  Except this one.",
                fail = createFail('FileWriter'),
                theWriter,
                // writes file content
                write_file = function(fileEntry) {
                    fileEntry.createWriter(function(writer) {
                        theWriter = writer;
                        theWriter.onwriteend = function(evt) {
                            truncate_file(theWriter);
                        };
                        theWriter.write(rule);
                    }, fail);
                },
                verifier = jasmine.createSpy().andCallFake(function(evt) {
                    expect(theWriter.length).toBe(36);
                    expect(theWriter.position).toBe(36);

                    // cleanup
                    deleteFile(fileName);
                }),
                // and its writer.truncate
                truncate_file = function(writer) {
                    writer.onwriteend = verifier;
                    writer.truncate(36);
                };

            // creates file, writes to it, then truncates it
            runs(function() {
                createFile(fileName, write_file);
            });

            waitsFor(function() { return verifier.wasCalled; }, "verifier never called", Tests.TEST_TIMEOUT);

            runs(function() {
                expect(verifier).toHaveBeenCalled();
                expect(fail).not.toHaveBeenCalled();
            });
        });
    });
});
