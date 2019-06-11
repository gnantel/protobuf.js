var tape = require("tape");

var protobuf = require("..");

tape.test("sfixed64 (grpc)", function(test) {

    var root = protobuf.Root.fromJSON({
        nested: {
            test: {
                nested: {
                    Inner: {
                        fields: {
                            string1: {
                                type: 'string',
                                id: 1
                            },
                            string2: {
                                type: 'string',
                                id: 2
                            }
                        }
                    },
                    Outer: {
                        fields: {
                            string1: {
                                type: 'string',
                                id: 1
                            },
                            string2: {
                                type: 'string',
                                id: 2
                            },
                            inner: {
                                type: 'Inner',
                                id: 3
                            }
                        },
                    }
                }
            }
        }
    });

    var Test = root.lookup("test.Outer");

    var buffer = Test.encode({
        string1: 'abc',
        string2: 'def',
        inner: {
            string1: 'ghi',
            string2: 'jkl'
        }
    }).finish();

    var rootWithUnknowns = protobuf.Root.fromJSON({
        nested: {
            test: {
                nested: {
                    Inner: {
                        fields: {
                            string2: {
                                type: 'string',
                                id: 2
                            }
                        }
                    },
                    OuterWithUnknowns: {
                        fields: {
                            string1: {
                                type: 'string',
                                id: 1
                            },
                            inner: {
                                type: 'Inner',
                                id: 3
                            }
                        },
                    }
                }
            }
        }
    });

    var TestWithUnknowns = rootWithUnknowns.lookup("test.OuterWithUnknowns");

    var decodedWithUnknowns = TestWithUnknowns.decode(buffer, undefined, true);
    var object = TestWithUnknowns.toObject(decodedWithUnknowns, { unknowns: true });

    test.equal(object.$$unk.length, 1, "should preserve one unknown field in outer object");
    test.equal(object.inner.$$unk.length, 1, "should preserve one unknown field in inner object");
    test.notOk('string2' in object, "unknown fields should not be decoded");
    test.notOk('string1' in object.inner, "unknown fields should not be decoded");

    var message = TestWithUnknowns.fromObject(object);
    var encodedBuffer = TestWithUnknowns.encode(message).finish();

    test.equal(buffer.length, encodedBuffer.length, "should re-encode unknown fields resulting in buffer equal in length to original")

    test.end();

});
