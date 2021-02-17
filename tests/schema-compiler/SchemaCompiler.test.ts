'use strict';

import test from 'ava';

import { docs, inherit, schema, SchemaCompiler } from '@fructo/schema-compiler';


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

test('SchemaCompiler.compile() constructs empty TypeScript interfaces', t => {
    const compiler = new SchemaCompiler();
    const SCHEMA = {
        'MyInterface': [
            schema`interface`,
            docs`My Interface Description`,
            {
            }
        ]
    };
    const compiledCode = compiler.compileSchema(SCHEMA);
    t.deepEqual(compiledCode, [
        '/**',
        ' * My Interface Description',
        ' */',
        'interface MyInterface {',
        '}'
    ]);
});

test('SchemaCompiler.compile() constructs an interface property', t => {
    const compiler = new SchemaCompiler();
    const SCHEMA = {
        'MyInterface': [
            schema`interface`,
            docs`My Interface Description`,
            {
                'myProperty': [
                    docs`My Property Description`,
                    [['string'], ['number']],
                    ['readonly', 'optional']
                ]
            }
        ]
    };
    const compiledCode = compiler.compileSchema(SCHEMA);
    t.deepEqual(compiledCode, [
        '/**',
        ' * My Interface Description',
        ' */',
        'interface MyInterface {',
        '    /**',
        '     * My Property Description',
        '     */',
        '    readonly myProperty?: string | number;',
        '}'
    ]);
});

test('SchemaCompiler.compile() constructs interface inheritance', t => {
    const compiler = new SchemaCompiler();
    const SCHEMA = {
        'MyAncestorInterface': [
            schema`interface`
        ],
        'MyInterface': [
            schema`interface`,
            inherit`MyAncestorInterface`
        ]
    };
    const compiledCode = compiler.compileSchema(SCHEMA);
    t.deepEqual(compiledCode, [
        `interface MyAncestorInterface {`,
        '}',
        'interface MyInterface extends MyAncestorInterface {',
        '}'
    ]);
});
