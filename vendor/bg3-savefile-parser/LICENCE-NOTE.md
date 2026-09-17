# Licence of the vendored parser

This file is a note written by this project, not a file copied from upstream.
It records the grant the vendored code is redistributed under and where that
grant is stated, because the upstream repository carries no `LICENSE` file.

## The grant

[danielsamuels/bg3-savefile-parser](https://github.com/danielsamuels/bg3-savefile-parser)
declares its licence in its own project metadata. At commit
`9578ff7c46a1aa40c805f6b7beecf907f10fb3b8`, the revision vendored here,
`pyproject.toml` reads:

```toml
name = "bg3-savefile-parser"
version = "0.1.0"
description = "Parse Baldur's Gate 3 save files and report character gear, spells, and quests"
license = { text = "MIT" }
authors = [{ name = "Daniel Finch", email = "daniel.samuels1@gmail.com" }]
```

That declaration covers the repository, so it covers the TypeScript parser
under `ts/parser/` vendored here as well as the Python implementation it was
ported from. `pyproject.toml` itself is not vendored, since this project runs
no Python; it is quoted above so the grant can be checked without a clone.

MIT permits redistribution and modification, including the local modifications
`../../THIRD_PARTY.md` documents, provided the notice below travels with the
code.

## What this does not cover

`data/gamedata.json` is a table of item, spell, class and quest names
extracted from Baldur's Gate 3. That content belongs to Larian Studios and is
governed by their terms, not by the licence above; no grant from the parser's
author reaches it. Its redistribution is a separate question and is not
settled by this file.

## MIT License

Copyright (c) Daniel Finch

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
