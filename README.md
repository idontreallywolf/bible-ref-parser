# Bible Reference Parser

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Node.js package to parses Bible references into structured objects. It supports complex references such as `Genesis 1:1-2; II Peter; John 1:1,3-5,8`.


## Installation

```bash
npm install @idrw/bible-ref-parser
```

## Usage

### Example query, with errors
```typescript
import { parseQuery } from '@idrw/bible-ref-parser';

const result: QueryResult = parseQuery("! pasta;RM-RF/;1John1:2,2:1;IIPeter1:1;IJohn2:4;#--324;1 kebab 2:1;'_&%\"!\"¥");
```

```json
{
    "books": [
        {
            "name": "1 John",
            "references": [
                { "chapter": 1, "verses": [{ "from": 2 }] },
                { "chapter": 2, "verses": [{ "from": 1 }] }
            ]
        },
        {
            "name": "2 Peter",
            "references": [
                { "chapter": 1, "verses": [{ "from": 1 }] }
            ]
        },
        {
            "name": "1 John",
            "references": [
                { "chapter": 2, "verses": [{ "from": 4 }] }
            ]
        }
    ],
    "errors": ["! pasta", "RM-RF/", "#--324", "1 kebab", "'_&%\"!\"¥"]
}
```

### Example query, without errors
```typescript
import { parseQuery } from '@idrw/bible-ref-parser';

const result: QueryResult = parseQuery("Genesis 1:1-2; II Peter; John 1:1,3-5,8");
```

```json
{
    "books": [
        {
            "name": "Genesis",
            "references": [
                { "chapter": 1, "verses": [{ "from": 1, "to": 2 }] }
            ]
        },
        { "name": "2 Peter", "references": [] },
        {
            "name": "John",
            "references": [
                {
                    "chapter": 1,
                    "verses": [
                        { "from": 1 },
                        { "from": 3, "to": 5 },
                        { "from": 8 }
                    ]
                }
            ]
        }
    ],
    "errors": []
}
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

