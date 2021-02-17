'use strict';

import test from 'ava';

import { docs, schema, SchemaCompiler } from '@fructo/schema-compiler';


test('SchemaCompiler.compile() constructs empty TypeScript classes', t => {
    const compiler = new SchemaCompiler();
    const SCHEMA = {
        'MyClass': [
            schema`class`,
            docs`My Class Description`,
            {
            }
        ]
    };
    const compiledCode = compiler.compileSchema(SCHEMA);
    t.deepEqual(compiledCode, [
        '/**',
        ' * My Class Description',
        ' */',
        'class MyClass {',
        '}'
    ]);
});    
