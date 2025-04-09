// import assert from 'node:assert'
// import test from 'node:test'
import { expect, test } from 'vitest'

import {
    isValidPositiveNumber,
    isValidQuery,
    splitQueryByBooks,
    parseBookName,
    replaceRomanNumbers,
    queryPriorityIsByVerse,
    parseReferenceWithVersePriority,
    parseReferenceWithChapterPriority,
    parseReferences,
    parseVerseRange,
    parseBook,
} from '../index'


test('splitQueryByBooks() should return a list of propertly split queries', async (t) => {
    const cases = [
        { input: "Genesis 1:1;    Luke 10:2-4   ", expected: ["Genesis 1:1", "Luke 10:2-4"] },
        { input: "Genesis 1:1;Luke 10:2-4 ;Mark 3:1-2,4:2;Matthew 6:7", expected: ["Genesis 1:1", "Luke 10:2-4", "Mark 3:1-2,4:2", "Matthew 6:7"] },
    ]

    for (const { input, expected } of cases) {
        expect(splitQueryByBooks(input)).toStrictEqual(expected)
    }
})


test('isValidPositiveNumber() should return true for any non-0 positive integer, in a string', async (t) => {
    for (const i of ["1","2","10","15","100","150"]) {
        expect(isValidPositiveNumber(i)).toBe(true)
    }
})


test('isValidPositiveNumber() should return false for any integer(n <= 0) as well as non-numeric characters, in a string', async (t) => {
    for (const i of ["0","-1","a","-10","-500"]) {
        expect(isValidPositiveNumber(i), `[Failed for ${i}]`).toBe(false)
    }
})


test('replaceRomanNumbers() should replace "I" with 1, "II" with 2 and "III" with 3', async (t) => {
    const cases = [
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
    ]

    for (const { input, expected } of cases) {
        expect(replaceRomanNumbers(input)).toStrictEqual(expected)
    }
})


test('replaceRomanNumbers() should return the original string if no book number is present', async (t) => {
    const cases = [
        { input: "Peter",           expected: "Peter" },
        { input: "Timothy",         expected: "Timothy" },
        { input: "John",            expected: "John" },
        { input: "Thessalonians",   expected: "Thessalonians" },
    ]

    for (const { input, expected } of cases) {
        expect(replaceRomanNumbers(input)).toStrictEqual(expected)
    }
})


test('parseBookName() should return the book name (including sequence nr) along with the index at which first chapter reference begins', async (t) => {
    const cases = [
        { input: "Genesis 1:1", expected: { bookName: "Genesis", chapterBeginIndex: 8 } },
        { input: "Genesis",     expected: { bookName: "Genesis", chapterBeginIndex: 0 } },
        { input: "1 Peter 1:1", expected: { bookName: "1 Peter", chapterBeginIndex: 8 } },
        { input: "1 John 1",    expected: { bookName: "1 John",  chapterBeginIndex: 7 } },
        { input: "1 John    1", expected: { bookName: "1 John",  chapterBeginIndex: 10 } },
        { input: "1   John  1", expected: { bookName: "1 John",  chapterBeginIndex: 10 } },
        { input: "1John",       expected: { bookName: "1 John",  chapterBeginIndex: 0 } },
    ]

    for (const { input, expected } of cases) {
        expect(parseBookName(input)).toStrictEqual(expected)
    }
})


test('isValidQuery(q) should return true for valid queries', async (t) => {
    const tests = [
        "Genesis 1",                "genesis 1",
        "Genesis 1:1",              "Genesis 1:1-2",
        "Genesis 1:1-2,4",          "Genesis 1:1-2,4-5",
        "Genesis 1:1-2,4-5,8-9",    "Genesis 1:1-2,4-5,2:3,5-6",
        "Genesis 1; Exodus 1",      "I Peter 1:1", "II Peter 1:1",
        "1 John 2:4;2 Peter 5:1-2", "III Peter",
        "1 Kings1:2", "1Kings1:1"
    ]

    for (const _test of tests) {
        expect(isValidQuery(_test)).toBe(true)
    }
});

test('isValidQuery(q) should return false for invalid queries', async (t) => {
    const tests = [
        "Genesis 1,,",          "Genesis 1:1--1",
        "Genesis 1::::1-2",     "Genesis 1::1--2,4",
        "Genesis 1:1-2-,4-5",   "Genesis 1:1-2,-4-5,8-9",
        "Genesis 1,2-:3,5-6",   "Genesis 2:-3,5-6",
        "Genesis 1:,1-2,4-5",   "Genesis 1,:1-2,4-5",
        "Genesis 1,:,1-2,4-5",  "Genesis 1,-1-2,4-5",
        "Genesis 1,-1-2,4-5",   "John# 1:1", "Mark $1:2",
        "IIII Peter 1:1"
    ]

    for (const _test of tests) {
        expect(isValidQuery(_test)).toBe(false)
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
        // assert.deepStrictEqual(parseVerseRange(input), expected, `Failed for input: ${input}`);
        expect(parseVerseRange(input)).toStrictEqual(expected)
    }
});


test('queryPriorityIsByVerse() should return the expected boolean', async (t) => {
    const cases = [
        { input: "1,2,3:1,4", expected: false },
        { input: "1:1,2,3:1,4", expected: true },
    ]

    for (const { input, expected } of cases) {
        // assert.equal(queryPriorityIsByVerse(input), expected, `Failed for input: ${input}`);
        expect(queryPriorityIsByVerse(input)).toBe(expected)
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
        // assert.deepStrictEqual(parseReferenceWithVersePriority(input), expected, `Failed for input: ${input}`);
        expect(parseReferenceWithVersePriority(input), `Case (${input})`).toStrictEqual(expected)
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
        // assert.deepStrictEqual(parseReferenceWithChapterPriority(input), expected, `Failed for input: ${input}`);
        expect(parseReferenceWithChapterPriority(input)).toStrictEqual(expected)
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
        expect(parseReferences(input)).toStrictEqual(expected)
    }
})


test('parseBook() should return the expected bookData', async (t) => {
    const cases = [
        { input: "1Kings1:2", expected: {
            book: "1 Kings",
            references: [
                { chapter: 1, verses: [{ from: 2, to: undefined }] }
            ]
        }},

        { input: "III John 1", expected: {
            book: "3 John",
            references: []
        }}
    ]

    for (const { input, expected } of cases) {
        expect(parseBook(input)).toStrictEqual(expected)
    }
})