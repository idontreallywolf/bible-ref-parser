import { books } from "./books.js"

const QUERY_SEPARATOR = ";"

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


export function parseQuery(query: string): BookData[] {
    const bookQueries = splitQueryByBooks(query)

    let bookDataList: BookData[] = []

    for (const bookQuery of bookQueries) {
        if (!isValidQuery(bookQuery)) {
            continue
        }

        const bookData = parseBook(bookQuery)

        if (bookData) {
            bookDataList.push(bookData)
        }
    }

    return bookDataList
}


function splitQueryByBooks(query: string) {
    return query
        .split(QUERY_SEPARATOR)
        .map(qry => qry.trim())
        .filter(qry => qry.length !== 0)
}


function isValidPositiveNumber(n: string) {
    let _n = parseInt(n)
    return Number.isInteger(_n) && _n > 0
}


function parseBook(query: string): BookData | null {
    query = replaceRomanNumbers(query)

    let { bookName, chapterBeginIndex } = parseBookName(query)

    const validatedName = validateBookName(bookName)
    if (!validatedName) {
        return null
    }

    let references = parseReferences(query.slice(chapterBeginIndex))

    return { name: validatedName, references }
}


function replaceRomanNumbers(query: string) {
    let romanNumber = 0
    let idx

    for (let i = 0; i < query.length; i++) {
        if (query[i] === "I") {
            romanNumber += 1
            continue
        }

        idx = (query[i] === " ") ? (i + 1) : i
        break
    }

    if (romanNumber === 0) {
        return query
    }

    return `${romanNumber} ${query.slice(idx)}`
}


function isValidQuery(q: string) {
    return (
        !(new RegExp("[^a-z0-9 ,–;—:-]|I{4,}", "i").test(q)) &&
        !(new RegExp("([,:-]{2,})|(:,)|(,:)|(-:)|(:-)|(-,)|(,-)").test(q))
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

    for (let i = nameBeginIndex; i < query.length; i++) {
        const char = query[i]
        if (char == " ") {
            continue
        }

        if (char.match(new RegExp("\\d+", 'i'))) {
            chapterBeginIndex = i
            break
        }

        bookName += char
    }

    bookName = bookName.trim()

    return {
        bookName,
        chapterBeginIndex
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


function parseReferences(query: string) {
    if (queryPriorityIsByVerse(query)) {
        return parseReferenceWithVersePriority(query)
    }

    return parseReferenceWithChapterPriority(query)
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

    if (temp.length > 0 && currentChapter) {
        currentChapter.verses.push(parseVerseRange(temp))
        refs.push(currentChapter)
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

        if (currentChapter) {
            refs.push(currentChapter)
        }
    }

    return refs;
}


function queryPriorityIsByVerse(query: string) {
    const firstCommaIndex = query.indexOf(",")
    const firstColonIndex = query.indexOf(":")

    if (firstCommaIndex < 0) {
        return true
    }

    if (firstColonIndex < 0) {
        return false
    }

    // 1, 2, 3:1, 4         — requests for chapter 1, 2, 3(v1) and 4
    // 1:1, 2 , 3:1 , 4     — requests for chapter 1(v1, v2), 3(v1, v4)
    return firstColonIndex < firstCommaIndex
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