import assert from 'node:assert'
import test from 'node:test'

import {
    PRIORITY,
    replaceRomanNumbers,
    queryPriorityIsByVerse,
    parseReferenceWithVersePriority,
    parseReferenceWithChapterPriority,
    isValidQuery,
    parseVerseRange
} from '../index.js'


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
        assert.deepStrictEqual(replaceRomanNumbers(input), expected, `Failed for input: ${input}`);
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
        assert.deepStrictEqual(replaceRomanNumbers(input), expected, `Failed for input: ${input}`);
    }
})


test('isValidQuery(q) should return true for valid queries', async (t) => {
    const tests = [
        "Genesis 1",                "genesis 1",
        "Genesis 1:1",              "Genesis 1:1-2",
        "Genesis 1:1-2,4",          "Genesis 1:1-2,4-5",
        "Genesis 1:1-2,4-5,8-9",    "Genesis 1:1-2,4-5,2:3,5-6",
        "Genesis 1; Exodus 1",
        "1 John 2:4;2 Peter 5:1-2"
    ]
    for (const _test of tests) {
        assert.equal(isValidQuery(_test), true, `Failed for input: ${_test}`)
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
        "Genesis 1,-1-2,4-5"
    ]
    for (const _test of tests) {
        assert.equal(isValidQuery(_test), false, `Failed for input: ${_test}`)
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
        assert.deepStrictEqual(parseVerseRange(input), expected, `Failed for input: ${input}`);
    }
});


test('checkQueryPriority() should return the expected boolean', async (t) => {
    const cases = [
        { input: "1,2,3:1,4", expected: false },
        { input: "1:1,2,3:1,4", expected: true },
    ]

    for (const { input, expected } of cases) {
        assert.equal(queryPriorityIsByVerse(input), expected, `Failed for input: ${input}`);
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
        assert.deepStrictEqual(parseReferenceWithVersePriority(input), expected, `Failed for input: ${input}`);
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
        assert.deepStrictEqual(parseReferenceWithChapterPriority(input), expected, `Failed for input: ${input}`);
    }
})