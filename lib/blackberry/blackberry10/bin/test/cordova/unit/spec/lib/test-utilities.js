var xml2js = require("xml2js");

function getObjectByProperty(array, propertyName, propertyValue) {
    for (var i = 0; i < array.length; i++) {
        if (propertyValue === array[i][propertyName]) {
            return array[i];
        }
    }
}

module.exports = {
    getAccessListForUri: function (accessListArray, uriValue) {
        return getObjectByProperty(accessListArray, "uri", uriValue);
    },
    
    getFeatureByID: function (featureArray, featureID) {
        return getObjectByProperty(featureArray, "id", featureID);
    },
    
    mockResolve: function (path) {
        //Mock resolve because of a weird issue where resolve would return an 
        //invalid path on Mac if it cannot find the directory (c:/ doesnt exist on mac)
        spyOn(path, "resolve").andCallFake(function (to) {
            if (arguments.length === 2) {
                //Handle optional from attribute
                return path.normalize(path.join(arguments[0], arguments[1]));
            } else {
                return path.normalize(to);
            }
        });
    },
    
    cloneObj: function (obj) {
        var newObj = (obj instanceof Array) ? [] : {}, i;
        
        for (i in obj) {
            if (i === 'clone') continue;
            
            if (obj[i] && typeof obj[i] === "object") {
                newObj[i] = this.cloneObj(obj[i]);
            } else {
                newObj[i] = obj[i];
            }
        }
    
        return newObj;
    },

    mockParsing: function (data, error) {
        spyOn(xml2js, "Parser").andReturn({
            parseString: function (fileData, callback) {
                //call callback with no error and altered xml2jsConfig data
                callback(error, data);
            }
        });
    }
};

describe("test-utilities", function () {
    var testUtilities = require("./test-utilities");
    
    it("can clone objects using cloneObj", function () {
        var obj = {
                A: "A",
                B: "B",
                C: { 
                    CA: "CA",
                    CB: "CB",
                    CC: {
                        CCA: "CCA"
                    }
                }
            },
            clonedObj = testUtilities.cloneObj(obj);
        
        //not the same object
        expect(clonedObj).not.toBe(obj);
        
        //has the same data
        expect(clonedObj).toEqual(obj);
    });
});
