/*
 * Copyright 2011 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var srcPath = __dirname + "/../../../../lib/",
    Whitelist = require(srcPath + "policy/whitelist").Whitelist;

describe("whitelist", function () {
    describe("when user includes a wildcard access", function () {
        it("can allow access to any domain not from XHR using uri *", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : true,
                accessList : null
            });

            expect(whitelist.isAccessAllowed("http://www.google.com")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.msn.com")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.cnn.com")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.rim.com")).toEqual(true);
            expect(whitelist.isAccessAllowed("local:///index.html")).toEqual(true);
            expect(whitelist.isAccessAllowed("file://store/home/user/documents/file.doc")).toEqual(true);
        });
        it("can allow access to explicit domains only when XHR using uri *", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : true,
                accessList : [
                    {
                        uri : "http://google.com",
                        allowSubDomain : true,
                        features : null
                    }
                ]
            });

            expect(whitelist.isAccessAllowed("http://www.google.com", true)).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.google.com/a/b/c", true)).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.msn.com", true)).toEqual(false);
            expect(whitelist.isAccessAllowed("http://www.cnn.com", true)).toEqual(false);
        });
    });

    describe("when user does not include a wildcard access", function () {
        it("can deny all web access when no uris are whitelisted", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : null
            });

            expect(whitelist.isAccessAllowed("http://www.google.com")).toEqual(false);
        });

        it("can deny all API access when no uris are whitelisted", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : null
            });

            expect(whitelist.isFeatureAllowed("http://www.google.com"), "blackberry.app").toEqual(false);
        });

        it("can return empty feature list when nothing is whitelisted", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : null
            });

            expect(whitelist.getFeaturesForUrl("http://www.google.com")).toEqual([]);
        });

        it("can allow access to whitelisted HTTP URL", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://google.com",
                    allowSubDomain : true,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.google.com")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.cnn.com")).toEqual(false);
        });

        it("can allow access to whitelisted URL with different case (host)", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://google.com",
                    allowSubDomain : true,
                    features : null
                },
                {
                    uri : "http://ABC.com",
                    allowSubDomain : true,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.GOOGLE.com")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.abc.com")).toEqual(true);
        });

        it("can allow access to whitelisted URL with different case (path)", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://google.com/SOME/path",
                    allowSubDomain : true,
                    features : null
                },
                {
                    uri : "http://google.com/another/path",
                    allowSubDomain : true,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.google.com/some/path")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.google.com/ANOTHER/path")).toEqual(true);
        });

        it("can deny access to non-whitelisted HTTP URL", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://google.com",
                    allowSubDomain : true,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.cnn.com")).toEqual(false);
        });

        it("can allow access to whitelisted feature for whitelisted HTTP uris", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [
                    {
                        uri : "http://google.com",
                        allowSubDomain : false,
                        features : [{
                            id : "blackberry.app",
                            required : true,
                            version : "1.0.0"
                        }]
                    }, {
                        uri: "http://smoketest1-vmyyz.labyyz.testnet.rim.net:8080/",
                        allowSubDomain: false,
                        features: [{
                            id : "blackberry.app",
                            required : true,
                            version : "1.0.0"
                        }]
                    }
                ]
            });

            expect(whitelist.isFeatureAllowed("http://google.com", "blackberry.app")).toEqual(true);
            expect(whitelist.isFeatureAllowed("http://smoketest1-vmyyz.labyyz.testnet.rim.net:8080/a/webworks.html", "blackberry.app")).toEqual(true);
        });

        it("can deny access to non-whitelisted feature for whitelisted HTTP uris", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://google.com",
                    allowSubDomain : false,
                    features : [{
                        id : "blackberry.app",
                        required : true,
                        version : "1.0.0"
                    }]
                }]
            });

            expect(whitelist.isFeatureAllowed("http://google.com", "blackberry.io.file")).toEqual(false);
        });

        it("can get all whitelisted features for url", function () {
            var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://google.com",
                        allowSubDomain : false,
                        features : [{
                            id : "blackberry.app",
                            required : true,
                            version : "1.0.0"
                        }, {
                            id : "blackberry.media.camera",
                            required : true,
                            version : "1.0.0"
                        }, {
                            id : "blackberry.io.dir",
                            required : true,
                            version : "1.0.0"
                        }]
                    }]
                });

            expect(whitelist.getFeaturesForUrl("http://google.com")).toContain("blackberry.app");
            expect(whitelist.getFeaturesForUrl("http://google.com")).toContain("blackberry.media.camera");
            expect(whitelist.getFeaturesForUrl("http://google.com")).toContain("blackberry.io.dir");
            expect(whitelist.getFeaturesForUrl("http://www.wikipedia.org")).toEqual([]);
        });

        it("can allow access for query strings using a query string wildcard", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://www.google.com/search?*",
                    allowSubDomain : true,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.google.com/search?q=awesome")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.google.com/search?a=anyLetter")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://www.google.com/search")).toEqual(false);
            expect(whitelist.isAccessAllowed("http://www.google.com/blah?q=awesome")).toEqual(false);
        });

        it("can deny access for query strings without a query string wildcard", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://www.google.com/search",
                    allowSubDomain : true,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.google.com/search?q=awesome", true)).toEqual(false);
            expect(whitelist.isAccessAllowed("http://www.google.com/search?a=anyLetter", true)).toEqual(false);
        });

        it("can allow access for ports given just the whitelist url", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://www.awesome.com",
                    allowSubDomain : true,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.awesome.com:9000")).toEqual(true);
        });

        it("allows api access for ports given just the whitelist url", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://www.awesome.com",
                    allowSubDomain : true,
                    features : [{
                        id : "blackberry.app",
                        required : true,
                        version : "1.0.0"
                    }]
                }]
            });

            expect(whitelist.isFeatureAllowed("http://www.awesome.com:8080", "blackberry.app")).toEqual(true);
        });

        it("allows api access for child pages with ports given just the whitelist url", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://smoketest8-vmyyz.labyyz.testnet.rim.net/",
                    allowSubDomain : true,
                    features : [{
                        id : "blackberry.app",
                        required : true,
                        version : "1.0.0"
                    }]
                }]
            });

            expect(whitelist.isFeatureAllowed("http://www.smoketest8-vmyyz.labyyz.testnet.rim.net:8080//webworks.html", "blackberry.app")).toEqual(true);
        });

        it("can allow folder level access of whitelisted uris", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://www.awesome.com/parent/child",
                    allowSubDomain : false,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.awesome.com/parent/child")).toEqual(true);
        });

        it("can deny access to parent folders of whitelisted uris", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://www.awesome.com/parent/child",
                    allowSubDomain : false,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.awesome.com/parent")).toEqual(false);
        });

        it("can deny access to sibling folders of whitelisted uris", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://www.awesome.com/parent/child/",
                    allowSubDomain : false,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://www.awesome.com/parent/sibling/")).toEqual(false);
        });

        it("can deny access to sibling folders of whitelisted uris", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://rim4.awesome.com/goodChild/index.html",
                    allowSubDomain : false,
                    features : null
                }]
            });

            expect(whitelist.isAccessAllowed("http://rim4.awesome.com/goodChild/index.html")).toEqual(true);
            expect(whitelist.isAccessAllowed("http://rim4.awesome.com/badChild/index.html")).toEqual(false);
        });

        it("can get whitelisted features at a folder level", function () {
            var list1 = [{
                    id : "blackberry.app",
                    required : true,
                    version : "1.0.0"
                }],
                list2 = [{
                    id : "blackberry.media.camera",
                    required : true,
                    version : "1.0.0"
                }],
                whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://google.com/ninjas",
                        allowSubDomain : true,
                        features : list1
                    }, {
                        uri : "http://google.com/pirates",
                        allowSubDomain : true,
                        features : list2
                    }]
                });

            expect(whitelist.getFeaturesForUrl("http://google.com/ninjas")).toEqual(["blackberry.app"]);
            expect(whitelist.getFeaturesForUrl("http://google.com/pirates")).toEqual(["blackberry.media.camera"]);
        });

        it("can allow API permissions at a folder level", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://google.com/ninjas",
                    allowSubDomain : true,
                    features : [{
                        id : "blackberry.app",
                        required : true,
                        version : "1.0.0"
                    }]
                }, {
                    uri : "http://google.com/pirates",
                    allowSubDomain : true,
                    features : [{
                        id : "blackberry.media.camera",
                        required : true,
                        version : "1.0.0"
                    }]
                }]
            });

            expect(whitelist.isFeatureAllowed("http://google.com/ninjas", "blackberry.app")).toEqual(true);
            expect(whitelist.isFeatureAllowed("http://google.com/pirates", "blackberry.media.camera")).toEqual(true);
        });

        it("can deny API permissions at a folder level", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://google.com/ninjas",
                    allowSubDomain : true,
                    features : [{
                        id : "blackberry.app",
                        required : true,
                        version : "1.0.0"
                    }]
                }, {
                    uri : "http://google.com/pirates",
                    allowSubDomain : true,
                    features : [{
                        id : "blackberry.media.camera",
                        required : true,
                        version : "1.0.0"
                    }]
                }]
            });

            expect(whitelist.isFeatureAllowed("http://google.com/ninjas", "blackberry.media.camera")).toEqual(false);
            expect(whitelist.isFeatureAllowed("http://google.com/pirates", "blackberry.app")).toEqual(false);
        });

        it("can allow access specific folder rules to override more general domain rules", function () {
            var whitelist = new Whitelist({
                hasMultiAccess : false,
                accessList : [{
                    uri : "http://google.com",
                    allowSubDomain : true,
                    features : [{
                        id : "blackberry.app",
                        required : true,
                        version : "1.0.0"
                    }]
                }, {
                    uri : "http://google.com/folder",
                    allowSubDomain : true,
                    features : [{
                        id : "blackberry.media.camera",
                        required : true,
                        version : "1.0.0"
                    }]
                }]
            });

            expect(whitelist.isFeatureAllowed("http://google.com/folder", "blackberry.app")).toEqual(false);
            expect(whitelist.isFeatureAllowed("http://google.com/folder", "blackberry.media.camera")).toEqual(true);
        });

        describe("when access uris have subdomains", function () {
            it("can get whitelisted features for subdomains", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://google.com",
                        allowSubDomain : true,
                        features : [{
                            id : "blackberry.system",
                            required : true,
                            version : "1.0.0.0"
                        }, {
                            id : "blackberry.media.microphone",
                            required : true,
                            version : "1.0.0.0"
                        }]
                    }]
                });

                expect(whitelist.getFeaturesForUrl("http://code.google.com")).toContain("blackberry.media.microphone");
                expect(whitelist.getFeaturesForUrl("http://code.google.com")).toContain("blackberry.system");
                expect(whitelist.getFeaturesForUrl("http://translate.google.com/lang=en")).toContain("blackberry.media.microphone");
                expect(whitelist.getFeaturesForUrl("http://translate.google.com/lang=en")).toContain("blackberry.system");
                expect(whitelist.getFeaturesForUrl("http://blah.goooooogle.com")).toEqual([]);
            });

            it("can allow access to whitelisted features for the subdomains", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://google.com",
                        allowSubDomain : true,
                        features : [{
                            id : "blackberry.app",
                            required : true,
                            version : "1.0.0"
                        }]
                    }]
                });

                expect(whitelist.isFeatureAllowed("http://abc.google.com", "blackberry.app")).toEqual(true);
                expect(whitelist.isFeatureAllowed("http://xyz.google.com", "blackberry.app")).toEqual(true);
            });

            it("can allow access to subdomains of whitelisted uris", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [
                        {
                            uri : "http://awesome.com/",
                            allowSubDomain : true,
                            features : null
                        }, {
                            uri: "http://smoketest9-vmyyz.labyyz.testnet.rim.net:8080",
                            allowSubDomain: true,
                            features: null
                        }
                    ]
                });

                expect(whitelist.isAccessAllowed("http://subdomain.awesome.com")).toEqual(true);
                expect(whitelist.isAccessAllowed("http://www.smoketest9-vmyyz.labyyz.testnet.rim.net:8080")).toEqual(true);
            });

            it("can disallow access to subdomains of whitelisted uris", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://awesome.com/",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("http://subdomain.awesome.com")).toEqual(false);
            });

            it("can disallow access to subdomains of a specified uri", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://awesome.com/",
                        allowSubDomain : true,
                        features : null
                    }, {
                        uri : "http://moreawesome.com/",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("http://subdomain.moreawesome.com")).toEqual(false);
            });

            it("can allow specific subdomain rules to override more general domain rules when subdomains are allowed", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://google.com",
                        allowSubDomain : true,
                        features : [{
                            id : "blackberry.app",
                            required : true,
                            version : "1.0.0"
                        }]
                    }, {
                        uri : "http://sub.google.com",
                        allowSubDomain : true,
                        features : [{
                            id : "blackberry.media.camera",
                            required : true,
                            version : "1.0.0"
                        }]
                    }]
                });

                expect(whitelist.isFeatureAllowed("http://sub.google.com", "blackberry.app")).toEqual(false);
                expect(whitelist.isFeatureAllowed("http://sub.google.com", "blackberry.media.camera")).toEqual(true);
            });

            it("can get whitelisted features for a more specific subdomain", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://google.com",
                        allowSubDomain : false,
                        features : [{
                            id : "blackberry.app",
                            required : true,
                            version : "1.0.0"
                        }]
                    }, {
                        uri : "http://sub.google.com",
                        allowSubDomain : false,
                        features : [{
                            id : "blackberry.media.camera",
                            required : true,
                            version : "1.0.0"
                        }]
                    }]
                });

                expect(whitelist.getFeaturesForUrl("http://google.com")).toContain("blackberry.app");
                expect(whitelist.getFeaturesForUrl("http://sub.google.com")).toContain("blackberry.media.camera");
                expect(whitelist.getFeaturesForUrl("http://sub.google.com")).not.toContain("blckberry.app");
                expect(whitelist.getFeaturesForUrl("http://code.google.com")).toEqual([]);
            });

            it("can allow specific subdomain rules to override more general domain rules when subdomains are disallowed", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://google.com",
                        allowSubDomain : false,
                        features : [{
                            id : "blackberry.app",
                            required : true,
                            version : "1.0.0"
                        }]
                    }, {
                        uri : "http://sub.google.com",
                        allowSubDomain : false,
                        features : [{
                            id : "blackberry.media.camera",
                            required : true,
                            version : "1.0.0"
                        }]
                    }]
                });

                expect(whitelist.isFeatureAllowed("http://sub.google.com", "blackberry.app")).toEqual(false);
                expect(whitelist.isFeatureAllowed("http://sub.google.com", "blackberry.media.camera")).toEqual(true);
            });
        });

        describe("when uris with other protocols are requested", function () {
            it("can allow access to whitelisted HTTPS URL", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "https://google.com",
                        allowSubDomain : true,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("https://www.google.com")).toEqual(true);
                expect(whitelist.isAccessAllowed("https://www.cnn.com")).toEqual(false);
            });

            it("can deny access to non-whitelisted HTTPS URL", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "https://google.com",
                        allowSubDomain : true,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("https://www.cnn.com")).toEqual(false);
            });

            it("can allow access to local URLs", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "WIDGET_LOCAL",    // packager always inserts a local access into access list
                        allowSubDomain : false
                    }]
                });

                expect(whitelist.isAccessAllowed("local:///index.html")).toEqual(true);
                expect(whitelist.isAccessAllowed("local:///appDir/subDir/index.html")).toEqual(true);
            });

            it("can allow access to whitelisted features for local URLs", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "WIDGET_LOCAL",    // packager always inserts a local access into access list
                        allowSubDomain : false,
                        features : [{
                            id : "blackberry.media.microphone",
                            required : true,
                            version : "2.0.0"
                        }, {
                            id : "blackberry.media.camera",
                            required : true,
                            version : "1.0.0"
                        }]
                    }]
                });

                expect(whitelist.isFeatureAllowed("local:///index.html", "blackberry.media.microphone")).toEqual(true);
                expect(whitelist.isFeatureAllowed("local:///index.html", "blackberry.media.camera")).toEqual(true);
            });

            it("can allow access to whitelisted file URL", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "file://store/home/user/documents",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("file://store/home/user/documents/file.doc")).toEqual(true);
            });

            it("can access file if rule specifed was file:///", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [
                        {
                            uri : "file:///accounts/1000/shared/documents/textData.txt",
                            allowSubDomain : false,
                            features: []
                        }
                    ]
                });

                expect(whitelist.isAccessAllowed("file:///accounts/1000/shared/documents/textData.txt")).toEqual(true);
                expect(whitelist.isAccessAllowed("file:///etc/passwd")).toEqual(false);
            });

            it("can access file if rule specifed was file:///", function () {
                var whitelist = new Whitelist({
                    "hasMultiAccess": false,
                    "accessList": [
                        {
                            "features": [],
                            "uri": "WIDGET_LOCAL",
                            "allowSubDomain": true
                        },
                        {
                            "features": [],
                            "uri": "file:///accounts/1000/shared/documents/textData.txt"
                        }
                    ]
                });
                expect(whitelist.isAccessAllowed("file:///etc/passwd", false)).toEqual(false);
            });

            it("can deny file access when access file:/// with no rule", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : null
                });

                expect(whitelist.isAccessAllowed("file:///accounts/1000/shared/documents/textData.txt")).toEqual(false);
            });

            it("can allow access to whitelisted file URL from an external startup page", function () {
                var whitelist = new Whitelist({
                    content: "http://www.google.com",
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "file://store/home/user/documents",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("file://store/home/user/documents/file.doc")).toEqual(true);
            });

            it("can allow access to whitelisted local URL from an external startup page", function () {
                var whitelist = new Whitelist({
                    content: "http://www.google.com",
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "local://localpage.html",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("local://localpage.html")).toEqual(true);
            });

            it("can allow access to whitelisted file URL from an external startup page with wildcard access", function () {
                var whitelist = new Whitelist({
                    content: "http://www.google.com",
                    hasMultiAccess : true
                });

                expect(whitelist.isAccessAllowed("file://store/home/user/documents/file.doc")).toEqual(true);
            });

            it("can allow access to whitelisted local URL from an external startup page with wildcard access", function () {
                var whitelist = new Whitelist({
                    content: "http://www.google.com",
                    hasMultiAccess : true
                });

                expect(whitelist.isAccessAllowed("local://localpage.html")).toEqual(true);
            });

            it("can deny file URL access when no file urls are whitelisted", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : null
                });

                expect(whitelist.isAccessAllowed("file://store/home/user/documents/file.doc")).toEqual(false);
            });

            it("can allow access to a subfolder of a whitelisted file URL", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "file://store/home/user/",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("file://store/home/user/documents/file.doc")).toEqual(true);
            });

            it("can deny access to a different folder of a whitelisted file URL", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://store.com/home/user/documents",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("http://store.com/home/user/documents/file.doc")).toEqual(true);
                expect(whitelist.isAccessAllowed("http://store.com/file2.doc")).toEqual(false);
            });

            it("can allow access to RTSP protocol urls", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "rtsp://media.com",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("rtsp://media.com/video.avi")).toEqual(true);
            });

            it("always allows access to data-uris", function () {
                var whitelist = new Whitelist({
                    hasMultiAccess : false,
                    accessList : [{
                        uri : "http://awesome.com",
                        allowSubDomain : false,
                        features : null
                    }]
                });

                expect(whitelist.isAccessAllowed("data:image/png;base64,zamagawdbase64string")).toEqual(true);
            });
        });
    });
});
