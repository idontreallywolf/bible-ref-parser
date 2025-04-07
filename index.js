// temporary
const books = [
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings",
    "1 Chronicles", "2 Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Proverbs",
    "Ecclesiastes",
    "Song of Solomon",
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "1 Corinthians", "2 Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter", "2 Peter",
    "1 John", "2 John", "3 John",
    "Jude",
    "Revelation",
]

const QUERY_SEPARATOR = ";"


export const PRIORITY = Object.freeze({
    VERSE: 0,
    CHAPTER: 1
})


export function parseQuery(q) {
    const bookQueries = splitQueryByBooks(q)

    let queries = []

    for (const query of bookQueries) {
        queries.push(parseBook(query))
    }

    return queries
}


export function splitQueryByBooks(q) {
    return q.split(QUERY_SEPARATOR).map(qry => qry.trim())
}


export function isValidPositiveNumber(n) {
    n = parseInt(n)
    return Number.isInteger(n) || n > 0
}


function parseBook(query) {
    query = replaceRomanNumbers(query)

    if (!isValidQuery(query)) {
        throw new Error("Invalid query")
    }

    let { bookName, chapterBeginIndex } = parseBookName(query)

    query = query.slice(chapterBeginIndex)

    // 1:1-2,4-5,2:
    let references = parseReferences(query)
    return { book: bookName, references }
}


export function replaceRomanNumbers(query) {
    let romanNumber = 0

    for (let i = 0; i < query.length; i++) {
        if (query[i] === "I") { romanNumber += 1 }

        // break: because highest number
        // in canon books is 3,
        // which appears in "III John"
        if (i == 3) { break }
    }

    if (romanNumber === 0) {
        return query
    }

    return `${romanNumber} ${query.slice(romanNumber + 1)}`
}


export function isValidQuery(q) {
    return (
        !(new RegExp("[^a-z0-9 ,–;—:-]", "i").test(q)) &&
        !(new RegExp("([,:-]{2,})|(:,)|(,:)|(-:)|(:-)|(-,)|(,-)").test(q))
    )
}


export function parseBookName(query) {
    let bookName = ""
    let chapterBeginIndex = undefined

    for (let i = 0; i < query.length; i++) {
        const char = query[i]
        if (i === 0 && isValidPositiveNumber(char)) {
            bookName += char
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


export function parseReferences(query) {
    const isVersePriority = queryPriorityIsByVerse(query)

    if (isVersePriority) {
        return parseReferenceWithVersePriority(query)
    }

    return parseReferenceWithChapterPriority(query)
}


export function parseReferenceWithVersePriority(query) {
    let refs = []
    let temp = ""
    let currentChapter = undefined

    for (let i = 0; i < query.length; i++) {
        if (query[i] === " ") { continue }

        if (query[i] === ":") {
            if (currentChapter) {
                refs.push(currentChapter)
                currentChapter = {}
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
            currentChapter.verses.push(parseVerseRange(temp))

            if (i === query.length - 1) {
                refs.push(currentChapter)
                return refs
            }

            temp = ""
            continue
        }

        temp += query[i]
    }

    if (temp.length > 0) {
        currentChapter.verses.push(parseVerseRange(temp))
        refs.push(currentChapter)
    }

    return refs
}


export function parseReferenceWithChapterPriority(query) {
    const refs = []
    let temp = ""
    let currentChapter = undefined
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
                currentChapter.verses.push(parseVerseRange(temp))
                refs.push(currentChapter)
                currentChapter = {}
                lookingForVerse = false
                temp = ""
                continue
            }

            currentChapter = {}
            refs.push({ chapter: parseChapterNumber(temp), verses: [] })
            temp = ""
            continue
        }

        temp += char
    }

    if (temp.length > 0) {
        if (lookingForVerse) {
            currentChapter.verses.push(parseVerseRange(temp))
        } else {
            currentChapter = { chapter: parseChapterNumber(temp), verses: [] }
        }

        refs.push(currentChapter)
    }

    return refs;
}


export function queryPriorityIsByVerse(query) {
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


export function parseChapterNumber(s) {
    if (!isValidPositiveNumber(s)) {
        throw new Error(`Invalid chapter number: ${s}`)
    }

    return parseInt(s)
}


export function parseVerseRange(s) {
    s = s.split("-")

    return {
        from: parseInt(s[0]),
        to: (s.length === 1 || s[1].length === 0)
            ? undefined
            : parseInt(s[1])
    }
}
