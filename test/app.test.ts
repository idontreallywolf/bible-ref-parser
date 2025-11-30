import { expect, test } from 'vitest'

import {
    Testing,
    parseQuery,
} from '../src/index'

import { books } from '../src/books'


test('splitQueryByBooks() should return a list of propertly split queries', async (t) => {
    const cases = [
        { input: "Genesis 1:1;    Luke 10:2-4   ", expected: ["Genesis 1:1", "Luke 10:2-4"] },
        {
            input: "Genesis 1:1;Luke 10:2-4 ;Mark 3:1-2,4:2;Matthew 6:7",
            expected: ["Genesis 1:1", "Luke 10:2-4", "Mark 3:1-2,4:2", "Matthew 6:7"]
        }
    ]

    for (const { input, expected } of cases) {
        expect(Testing.splitQueryByBooks(input)).toStrictEqual(expected)
    }
})


test('isValidPositiveNumber() should return true for any non-0 positive integer, in a string', async (t) => {
    for (const i of ["1","2","10","15","100","150"]) {
        expect(Testing.isValidPositiveNumber(i)).toBe(true)
    }
})


test('isValidPositiveNumber() should return false for any integer(n <= 0) as well as non-numeric characters, in a string', async (t) => {
    for (const i of ["0","-1","a","-10","-500"]) {
        expect(Testing.isValidPositiveNumber(i), `[Failed for ${i}]`).toBe(false)
    }
})


test('replaceRomanNumbers() should replace "I" with 1, "II" with 2 and "III" with 3', async (t) => {
    const cases = [
        { input: "Peter",           expected: "Peter" },
        { input: "I Peter",         expected: "1 Peter" },
        { input: "I Timothy",       expected: "1 Timothy" },
        { input: "I Corinthians",   expected: "1 Corinthians" },
        { input: "I Thessalonians", expected: "1 Thessalonians" },
        { input: "I Samuel",        expected: "1 Samuel" },
        { input: "I Chronicles",    expected: "1 Chronicles" },
        { input: "I Kings",         expected: "1 Kings" },
        { input: "I John",          expected: "1 John" },

        { input: "II Peter",        expected: "2 Peter" },
        { input: "II John",         expected: "2 John" },
        { input: "II Timothy",      expected: "2 Timothy" },
        { input: "II Samuel",       expected: "2 Samuel" },
        { input: "II Chronicles",   expected: "2 Chronicles" },
        { input: "II Kings",        expected: "2 Kings" },

        { input: "III John",        expected: "3 John" },
        { input: "IIJohn",          expected: "2 John" },
        { input: "Isaiah",          expected: "Isaiah" },
        { input: "Isamuel",         expected: "1 samuel" },
        { input: "isAmUeL",         expected: "1 sAmUeL" }
    ]

    for (const { input, expected } of cases) {
        expect(Testing.replaceRomanNumbers(input)).toStrictEqual(expected)
    }
})


test('replaceRomanNumbers() should return the original string if no book number is present', async (t) => {
    const cases = [
        { input: "Peter",           expected: "Peter" },
        { input: "Timothy",         expected: "Timothy" },
        { input: "John",            expected: "John" },
        { input: "Thessalonians",   expected: "Thessalonians" },
        { input: "isaiah",          expected: "isaiah" },
        { input: "isa",             expected: "isa" },
        { input: "is",              expected: "is" },
    ]

    for (const { input, expected } of cases) {
        expect(Testing.replaceRomanNumbers(input)).toStrictEqual(expected)
    }
})


test('parseBookName() should return the book name (including sequence nr) along with the index at which first chapter reference begins', async (t) => {
    const cases = [
        { input: "Genesis 1:1",     expected: { bookName: "Genesis", chapterBeginIndex: 8 } },
        { input: "Genesis",         expected: { bookName: "Genesis", chapterBeginIndex: 7 } },
        { input: "1 Peter 1:1",     expected: { bookName: "1 Peter", chapterBeginIndex: 8 } },
        { input: "1 John 1",        expected: { bookName: "1 John",  chapterBeginIndex: 7 } },
        { input: "1 John    1",     expected: { bookName: "1 John",  chapterBeginIndex: 10 } },
        { input: "1   John  1",     expected: { bookName: "1 John",  chapterBeginIndex: 10 } },
        { input: "1John",           expected: { bookName: "1 John",  chapterBeginIndex: 5 } },
        { input: "Song of solomon", expected: { bookName: "Song of solomon",  chapterBeginIndex: 15 } }
    ]

    for (const { input, expected } of cases) {
        expect(Testing.parseBookName(input)).toStrictEqual(expected)
    }
})


test('isValidQuery(q) should return true for valid queries', async (t) => {
    const tests = [
        "Genesis 1",                "genesis 1",
        "Genesis 1:1",              "Genesis 1:1-2",
        "Genesis 1:1-2,4",          "Genesis 1:1-2,4-5",
        "Genesis 1:1-2,4-5,8-9",    "Genesis 1:1-2,4-5,2:3,5-6",
        "Genesis 1; Exodus 1",      "Genesis 1:10-12",
        "I Peter 1:1", "II Peter 1:1",
        "1 John 2:4;2 Peter 5:1-2", "III Peter",
        "1 Kings1:2", "1Kings1:1"
    ]

    for (const _test of tests) {
        expect(Testing.isValidQuery(_test)).toBe(true)
    }
});

test('isValidQuery(q) should return false for invalid queries', async (test) => {
    const tests = [
        "Genesis 1,,",          "Genesis 1:1--1",
        "Genesis 1::::1-2",     "Genesis 1::1--2,4",
        "Genesis 1:1-2-,4-5",   "Genesis 1:1-2,-4-5,8-9",
        "Genesis 1,2-:3,5-6",   "Genesis 2:-3,5-6",
        "Genesis 1:,1-2,4-5",   "Genesis 1,:1-2,4-5",
        "Genesis 1,:,1-2,4-5",  "Genesis 1,-1-2,4-5",
        "Genesis 1,-1-2,4-5",   "John# 1:1", "Mark $1:2",
        "IIII Peter 1:1",       "!\\ _/**;:_--:;:",
        "##", "#!\"@,",         "Genesis 1:2, Galatians 1:8",
        "Genesis 1:2, Gal1:8",  "Mat 1, Gal 1",
        "Mat 1:2, Gal 1"
    ]

    for (const _test of tests) {
        expect(Testing.isValidQuery(_test), `failed ${_test}`).toBe(false)
    }
});


test('parseVerseRange() should return expected range object, e.g { from: N, to: N | undefined }', async (t) => {
    const cases = [
        { input: "1", expected: { from: 1, to: undefined } },
        { input: "1-5", expected: { from: 1, to: 5 } },
        { input: "10-20", expected: { from: 10, to: 20 } },
        { input: "3-", expected: { from: 3, to: undefined } },
    ];

    for (const { input, expected } of cases) {
        expect(Testing.parseVerseRange(input)).toStrictEqual(expected)
    }
});


test('queryPriorityIsByVerse() should return the expected boolean', async (t) => {
    const cases = [
        { input: "1,2,3:1,4", expected: false },
        { input: "1:1,2,3:1,4", expected: true },
    ]

    for (const { input, expected } of cases) {
        expect(Testing.queryPriorityIsByVerse(input)).toBe(expected)
    }
})

test('parseReferenceWithVersePriority() should return a list of correct reference objects', async (t) => {
    const cases = [
        { input: "1:1",          expected: [{ chapter: 1, verses: [{ from: 1, to: undefined }] }] },
        { input: "1:",           expected: [{ chapter: 1, verses: [{ from: 1, to: undefined }] }] },
        { input: "1:1-2",        expected: [{ chapter: 1, verses: [{ from: 1, to: 2 }] }] },
        { input: "1:1-2,4-6",    expected: [{ chapter: 1, verses: [{ from: 1, to: 2 }, {from: 4, to: 6}] }] },
        { input: "1:1-2,4-6,",   expected: [{ chapter: 1, verses: [{ from: 1, to: 2 }, {from: 4, to: 6}] }] },
        { input: "1:1-2,2:1",    expected: [
            { chapter: 1, verses: [{ from: 1, to: 2 }] },
            { chapter: 2, verses: [{ from: 1, to: undefined }]}
        ] },
    ]

    for (const { input, expected } of cases) {
        expect(Testing.parseReferenceWithVersePriority(input), `Case (${input})`).toStrictEqual(expected)
    }
})

test('parseReferenceWithChapterPriority() should return a list of correct reference objects', async (t) => {
    const cases = [
        { input: "1,2:1,3", expected: [{ chapter: 1, verses: [] }, { chapter: 2, verses: [{ from: 1, to: undefined }] }, { chapter: 3, verses: [] }] },
        { input: "1,2:1,3:1-2,4", expected: [
            { chapter: 1, verses: [] },
            { chapter: 2, verses: [{ from: 1, to: undefined }] },
            { chapter: 3, verses: [{ from: 1, to: 2 }] },
            { chapter: 4, verses: [] }
        ]},
    ]

    for (const { input, expected } of cases) {
        expect(Testing.parseReferenceWithChapterPriority(input)).toStrictEqual(expected)
    }
})


test('parseReferences() should return a list of correct reference objects, based on priority check', async (t) => {
    const cases = [
        { input: "1:",           expected: [{ chapter: 1, verses: [{ from: 1, to: undefined }] }] },
        { input: "1:1",          expected: [{ chapter: 1, verses: [{ from: 1, to: undefined }] }] },
        { input: "1:1-2",        expected: [{ chapter: 1, verses: [{ from: 1, to: 2 }] }] },
        { input: "1:1-2,4-6",    expected: [{ chapter: 1, verses: [{ from: 1, to: 2 }, {from: 4, to: 6}] }] },
        { input: "1:1-2,4-6,",   expected: [{ chapter: 1, verses: [{ from: 1, to: 2 }, {from: 4, to: 6}] }] },

        { input: "1,2:1,3", expected: [
            { chapter: 1, verses: [] },
            { chapter: 2, verses: [{ from: 1, to: undefined }] },
            { chapter: 3, verses: [] }
        ]},
        
        { input: "1:1-2,2:1",    expected: [
            { chapter: 1, verses: [{ from: 1, to: 2 }] },
            { chapter: 2, verses: [{ from: 1, to: undefined }]}
        ]},
        
        { input: "1,2:1,3:1-2,4", expected: [
            { chapter: 1, verses: [] },
            { chapter: 2, verses: [{ from: 1, to: undefined }] },
            { chapter: 3, verses: [{ from: 1, to: 2 }] },
            { chapter: 4, verses: [] }
        ]},
    ]

    for (const { input, expected } of cases) {
        expect(Testing.parseReferences(input)).toStrictEqual(expected)
    }
})


test('validateBookName() should return false for books that are not in the list', async (t) => {
    const books = [
        "kebab", "pasta",
        "idk", "jenesis",
        "peer"
    ]

    for (const book of books) {
        expect(Testing.validateBookName(book)).toBe(null)
    }
})


test('validateBookName() should return true for books that are in the list', async (t) => {
    for (const { name, aliases } of books) {
        expect(Testing.validateBookName(name)).toEqual(name)
        for (const alias of aliases) {
            expect(Testing.validateBookName(alias)).toEqual(name)
        }
    }
})


test('parseBook() should return the expected bookData', async (t) => {
    const cases = [
        { input: "1Kings1:2", expected: {
            book: { name: "1 Kings", references: [{ chapter: 1, verses: [{ from: 2, to: undefined }] }] },
            error: null
        } },

        { input: "III John 1", expected: {
            book: { name: "3 John", references: [{ chapter: 1, verses: [] }] },
            error: null
        }},

        { input: "Gen 1", expected: {
            book: { name: "Genesis", references: [{ chapter: 1, verses: [] }] },
            error: null
        } },

        { input: "2 Pt 1:2", expected: {
            book: { name: "2 Peter", references: [{ chapter: 1, verses: [{ from: 2, to: undefined }]}] },
            error: null
        } },

        { input: "2 Pet 1:2", expected: {
            book: { name: "2 Peter", references: [{ chapter: 1, verses: [{ from: 2, to: undefined }]}] },
            error: null
        } },

        { input: "Mark 2", expected: {
            book: { name: "Mark", references: [{ chapter: 2, verses: []}] },
            error: null
        } },

        { input: "2nd Peter",   expected: { book: { name: "2 Peter",   references: [] }, error: null } },
        { input: "First John",  expected: { book: { name: "1 John",    references: [] }, error: null } },
        { input: "1 John",      expected: { book: { name: "1 John",    references: [] }, error: null } },
        { input: "1st John",    expected: { book: { name: "1 John",    references: [] }, error: null } },
        { input: "first JOHN",  expected: { book: { name: "1 John",    references: [] }, error: null } },
        { input: "2ndtim",      expected: { book: { name: "2 Timothy", references: [] }, error: null } },
        { input: "isa",         expected: { book: { name: "Isaiah",    references: [] }, error: null } },
        { input: "isam",        expected: { book: { name: "1 Samuel",  references: [] }, error: null } },
        { input: "Ism",         expected: { book: { name: "1 Samuel",  references: [] }, error: null } },
        { input: "IIsm",        expected: { book: { name: "2 Samuel",  references: [] }, error: null } },
        { input: "iSaIAH",      expected: { book: { name: "Isaiah",    references: [] }, error: null } },

//        { input: "! Genesis",   expected: { book: null, error: "!Genesis" } },
    ]

    for (const { input, expected } of cases) {
        expect(Testing.parseBook(input)).toStrictEqual(expected)
    }
})


test('parseQuery() should return the expected bookData[]', async (t) => {
    const cases = [
        { 
            input: "1Kings1:2;IIIJohn1",
            expected: {
                books: [
                    {
                        name: "1 Kings",
                        references: [
                            { chapter: 1, verses: [{ from: 2, to: undefined }] }
                        ]
                    },
                    { name: "3 John", references: [{ chapter: 1, verses: [] }] }
                ],
                errors: []
            }
        },

        {
            input: "III John 1:1-2;Genesis 1:10-12",
            expected: {
                books: [
                    {
                        name: "3 John",
                        references: [{ chapter: 1, verses: [{ from: 1, to: 2 }] }]
                    },
                    {
                        name: "Genesis",
                        references: [{ chapter: 1, verses: [{ from: 10, to: 12 }] }]
                    }
                ],
                errors: []
            }
        },

        {
            input: ";##;#!\"@,;Genesis 1:10-12;song of solomon",
            expected: {
                books: [
                    {
                        name: "Genesis",
                        references: [{ chapter: 1, verses: [{ from: 10, to: 12 }] }]
                    },
                    {
                        name: "Song of Solomon",
                        references: []
                    }
                ],
                errors: ["##", "#!\"@,"]
            }
        }
    ]

    for (const { input, expected } of cases) {
        expect(parseQuery(input)).toStrictEqual(expected)
    }
})