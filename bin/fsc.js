#!/usr/bin/env node
'use strict';

import { exec } from 'child_process';

const DENO = 'deno run --allow-read';
const TOOL_PATH = './dist/scripts/schema-compiler-deno/SchemaCompilerTool.js';

const args = process.argv.slice(2).join(' ');

exec(`${DENO} ${TOOL_PATH} ${args}`, (error, stdout, stderr) => {
    if (error || stderr) {
        console.error(error || stderr);
    } else {
        console.log(stdout);
    }
});
