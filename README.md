# Bible Reference Parser

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`bible-ref-parser` is a Node.js package that parses Bible references into structured objects. It supports complex references such as `Genesis 1:1-2; II Peter; John 1:1,3-5,8` and converts them into accessible data formats.


## Installation

```bash
npm install bible-ref-parser
```

## Usage

```typescript
import { parseQuery } from 'bible-ref-parser';

const query = "Genesis 1:1-2; II Peter; John 1:1,3-5,8";
const result: BookData[] = parseQuery(query);

console.log(result);
```

```
[
    {
        book: "Genesis",
        references: [
            { chapter: 1, verses: [{ from: 1, to: 2 }] }
        ]
    },
    {
        book: "2 Peter",
        references: []
    },
    {
        book: "John",
        references: [
            { chapter: 1, verses: [
                { from: 1, to: undefined },
                { from: 3, to: 5 },
                { from: 8, to: undefined }
            ] }
        ]
    }
]
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

