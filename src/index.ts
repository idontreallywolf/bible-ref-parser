import { bookHasOneChapter, books } from "./books.js"

const QUERY_SEPARATOR = ";"

export type QueryResult = {
    books: BookData[],
    errors: string[]
}

export type ParseBookResult = {
    book: BookData | null,
    errors: string[] | null
}


export type BookData = {
    name: string,
    references: ChapterData[]
}


export type ChapterData = {
    chapter: number,
    verses: VerseRange[]
}


export type VerseRange = {
    from: number,
    to: number | undefined
}


export function parseQuery(query: string): QueryResult {
    const bookQueries = splitQueryByBooks(query)
    const queryResult: QueryResult = {
        books: [],
        errors: []
    }

    for (const bookQuery of bookQueries) {
        if (!isValidQuery(bookQuery)) {
            queryResult.errors.push(bookQuery)
            continue
        }

        const parseResult = parseBook(bookQuery)

        if (parseResult.book) {
            queryResult.books.push(parseResult.book)
        }

        if (parseResult.errors) {
            queryResult.errors.push(...parseResult.errors)
        }
    }

    return queryResult
}


function splitQueryByBooks(query: string) {
    const queryParts = query
        .split(QUERY_SEPARATOR)
        .map(qry => qry.trim())
        .filter(qry => qry.length !== 0)

    const result: string[] = []

    let lastBookName = ""
    let lastBookHasOneChapter = false

    for (const queryPart of queryParts) {
        const part = queryPart.trim()
        if (part.length === 0) { continue }

        // Detect "<book>" or "<n> <book>"
        const bookMatch = part.match(/^\d*\s*[a-zA-Z]+/)
        if (bookMatch !== null) {
            lastBookName = bookMatch[0]

            const refPart = part
                .slice(lastBookName.length)
                .trim()

            if (refPart.length === 0) {
                result.push(part)
                continue
            }

            lastBookHasOneChapter = bookHasOneChapter(lastBookName)

            const normalizedRef = lastBookHasOneChapter
                ? prependFirstChapterRef(refPart)
                : normalizeChapterRange(refPart)

            result.push(`${lastBookName} ${normalizedRef}`)
            continue
        }

        if (!lastBookName) {
            result.push(part)
            continue
        }
        
        // handle follow-up refs
        // e.g: "book 3:16; 4:10"
        //                  ^--^
        const normalizedRef = lastBookHasOneChapter
            ? prependFirstChapterRef(part)
            : normalizeChapterRange(part)

        result.push(`${lastBookName} ${normalizedRef}`)
    }

    return result
}


function prependFirstChapterRef(ref: string): string {
    return ref.includes(":") ? ref : `1:${ref}`
}


function normalizeChapterRange(ref: string): string {
    const hasRangeMarker = ref.includes("-")
    const hasVerseMarker = ref.includes(":")
    return (hasRangeMarker && !hasVerseMarker)
        ? ref.replace("-", ",")
        : ref
}


function isValidPositiveNumber(n: string) {
    let _n = parseInt(n)
    return Number.isInteger(_n) && _n > 0
}


function parseBook(query: string): ParseBookResult {
    query = replaceRomanNumbers(query)

    let { bookName, chapterBeginIndex } = parseBookName(query)

    const validatedName = validateBookName(bookName)
    if (!validatedName) {
        return { book: null, errors: [bookName] }
    }

    // if only book name is given, i.e: "Genesis;"
    // then assume reference to the first chapter
    // with no specific range
    if (chapterBeginIndex === query.length) {
        return {
            book: { name: validatedName, references: [{ chapter: 1, verses: [] }]},
            errors: []
        }
    }

    try {
        let references = parseReferences(query.slice(chapterBeginIndex))

        const referenceErrors: string[] = []

        for (let i = 0; i < references.length; i++) {
            const reference = references[i]
            if (!validateChapterNumber(validatedName, reference.chapter )) {
                references.splice(i, 1)
                referenceErrors.push(`'${reference.chapter}' is not a valid chapter of '${validatedName}'`)
            }
        }

        return {
            book: references.length > 0 
                ? { name: validatedName, references }
                : null,
            errors: referenceErrors
        }
    } catch (e) {
        return {
            book: null,
            errors: [(e as Error).message]
        }
    }
}


function replaceRomanNumbers(query: string) {
    const edgeCases = [
        { words: ["isamuel", "isam", "ism"], sliceAt: 1 },
        { words: ["isaiah",  "isa",  "is"],  sliceAt: 0 }
    ]

    for (const edgeCase of edgeCases) {
        for (const word of edgeCase.words) {
            if (query.toLowerCase().startsWith(word)) {
                const ordinal = edgeCase.sliceAt === 0 ? "" : "1 "
                return `${ordinal}${query.slice(edgeCase.sliceAt)}`
            }
        }
    }

    let romanNumber = ""
    let idx

    const ordinals = [
        { text: "iii", properOrd: "3", endPosition: 3 },
        { text: "ii",  properOrd: "2", endPosition: 2 },
        { text: "i",   properOrd: "1", endPosition: 1 },
    ]

    for (const ord of ordinals) {
        if (query.toLowerCase().startsWith(ord.text)) {
            idx = ord.endPosition
            romanNumber += ord.properOrd
            break
        }
    }

    if (romanNumber === "") {
        return query
    }

    return `${romanNumber} ${query.slice(idx).trim()}`
}


function isValidQuery(q: string) {
    return (
        // Test for invalid character & book nr
        !(new RegExp("[^a-z0-9 ,–;—:-]|I{4,}", "i").test(q)) &&
        // Test for double symbols ",, :: --"
        !(new RegExp("([,:;-]\\s*?){2,}").test(q)) &&
        // test for "," followed by anything other than space or 0-9 digit
        !(new RegExp(",\\s*(?![ 0-9])", "i").test(q))
    )
}


function parseBookName(query: string) {
    let bookName = ""
    let chapterBeginIndex = 0

    let nameBeginIndex = 0

    const ordinals = [
        { text: "first",  properOrd: "1", endPosition: 5 },
        { text: "second", properOrd: "2", endPosition: 6 },
        { text: "third",  properOrd: "3", endPosition: 5 },
        { text: "1st",    properOrd: "1", endPosition: 3 },
        { text: "2nd",    properOrd: "2", endPosition: 3 },
        { text: "3rd",    properOrd: "3", endPosition: 3 },
        { text: "1",      properOrd: "1", endPosition: 1 },
        { text: "2",      properOrd: "2", endPosition: 1 },
        { text: "3",      properOrd: "3", endPosition: 1 },
    ]

    for (const ord of ordinals) {
        if (query.toLowerCase().startsWith(ord.text)) {
            nameBeginIndex = ord.endPosition
            bookName += `${ord.properOrd} `
            break
        }
    }

    let chapterNumberFound = false

    for (let i = nameBeginIndex; i < query.length; i++) {
        const char = query[i]
        if (char === " " && char === bookName.charAt(bookName.length - 1)) {
            continue
        }

        if (char.match(new RegExp("\\d+", 'i'))) {
            chapterBeginIndex = i
            chapterNumberFound = true
            break
        }

        bookName += char
    }

    bookName = bookName.trim()

    return {
        bookName,
        chapterBeginIndex: chapterNumberFound
            ? chapterBeginIndex
            : query.length 
    }
}

function validateBookName(bookName: string) {
    for (const { name, aliases } of books) {
        if (name.toLowerCase() === bookName.toLowerCase()) {
            return name
        }

        const aliasName = aliases.find(alias =>
            bookName.toLowerCase() ===
            alias.toLowerCase()
        )

        if (aliasName !== undefined) {
            return name
        }
    }

    return null
}

function validateChapterNumber(bookName: string, chapter: number) {
    const book = books.find(b => b.name === bookName)!

    if (chapter >= 1 && chapter <= book.chapters) {
        return true
    }

    return false
}


function parseReferences(query: string) {
    if (queryPriorityIsByVerse(query)) {
        return parseReferenceWithVersePriority(query)
    }

    return parseReferenceWithChapterPriority(query)
}


function queryPriorityIsByVerse(query: string) {
    const firstCommaIndex = query.indexOf(",")
    const firstColonIndex = query.indexOf(":")
    const a = firstColonIndex < 0
    const b = firstCommaIndex < 0

    if (a && b) { return false }
    if (b) { return true }
    if (a) { return false }

    // 1, 2, 3:1, 4         — requests for chapter 1, 2, 3(v1) and 4
    // 1:1, 2 , 3:1 , 4     — requests for chapter 1(v1, v2), 3(v1, v4)
    return firstColonIndex < firstCommaIndex
}


function parseReferenceWithVersePriority(query: string) {
    let refs: ChapterData[] = []
    let temp = ""
    let currentChapter: ChapterData | undefined = undefined

    for (let i = 0; i < query.length; i++) {
        if (query[i] === " ") { continue }

        if (query[i] === ":") {
            if (currentChapter) {
                refs.push(currentChapter)
                currentChapter = undefined
            }

            currentChapter = {
                chapter: parseChapterNumber(temp),
                verses: []
            }

            if (i === query.length - 1) {
                currentChapter.verses.push({ from: 1, to: undefined })
                refs.push(currentChapter)
                return refs
            }

            temp = ""
            continue
        }

        if (query[i] === ",") {
            currentChapter?.verses.push(parseVerseRange(temp))

            if (i === query.length - 1) {
                if (currentChapter) {
                    refs.push(currentChapter)
                }
                return refs
            }

            temp = ""
            continue
        }

        temp += query[i]
    }

    if (currentChapter) {
        refs.push(currentChapter)
        if (temp.length > 0) {
            currentChapter.verses.push(parseVerseRange(temp))
        }
    }

    return refs
}


function parseReferenceWithChapterPriority(query: string) {
    const refs: ChapterData[] = []
    let temp = ""
    let currentChapter: ChapterData | undefined = undefined
    let lookingForVerse = false

    for (let i = 0; i < query.length; i++) {
        const char = query[i];

        if (char === " ") { continue }

        if (char === ":") {
            lookingForVerse = true
            currentChapter = { chapter: parseChapterNumber(temp), verses: [] }
            temp = ""
            continue
        }
// John 3:16, Galatian 1
        if (char === ",") {
            if (lookingForVerse) {
                currentChapter!.verses.push(parseVerseRange(temp))
                refs.push(currentChapter!)
                currentChapter = undefined
                lookingForVerse = false
                temp = ""
                continue
            }

            currentChapter = undefined
            refs.push({ chapter: parseChapterNumber(temp), verses: [] })
            temp = ""
            continue
        }

        temp += char
    }

    if (temp.length > 0) {
        if (lookingForVerse) {
            currentChapter!.verses.push(parseVerseRange(temp))
        } else {
            currentChapter = { chapter: parseChapterNumber(temp), verses: [] }
        }
    }

    if (currentChapter) {
        refs.push(currentChapter)
    }

    return refs;
}


function parseChapterNumber(s: string) {
    if (!isValidPositiveNumber(s)) {
        throw new Error(`Invalid chapter number: ${s}`)
    }

    return parseInt(s)
}


function parseVerseRange(rangeString: string): VerseRange {
    let rangeParts = rangeString.split("-")

    return {
        from: parseInt(rangeParts[0]),
        to: (rangeParts.length === 1 || rangeParts[1].length === 0)
            ? undefined
            : parseInt(rangeParts[1])
    }
}

export const Testing = {
    normalizeChapterRange,
    prependFirstChapterRef,
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
    validateBookName,
    parseBook,
}