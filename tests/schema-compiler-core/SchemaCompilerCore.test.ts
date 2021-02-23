'use strict';

import test from 'ava';

import { ISchema, SchemaCompilerCore } from '@fructo/schema-compiler';


function isSubset(main: Array<string>, subset: Array<string>) {
    return main.join('').includes(subset.join(''));
}


test('SchemaCompilerCore.compileSchema() constructs empty TypeScript classes', t => {
    const compiler = new SchemaCompilerCore();
    const SCHEMA: ISchema = {
        MyClass: {
            types: ['class'],
            docs: [
                'My Class Description'
            ]
        }
    };
    const compiledCode = compiler.compileSchema(SCHEMA);
    t.true(isSubset(compiledCode, [
        '/**',
        ' * My Class Description',
        ' */',
        'export class MyClass {',
        '}'
    ]));
});

test('SchemaCompilerCore.compileSchema() constructs empty TypeScript interfaces', t => {
    const compiler = new SchemaCompilerCore();
    const SCHEMA: ISchema = {
        MyInterface: {
            types: ['interface'],
            docs: [
                'My Interface Description'
            ]
        }
    };
    const compiledCode = compiler.compileSchema(SCHEMA);
    t.true(isSubset(compiledCode, [
        '/**',
        ' * My Interface Description',
        ' */',
        'export interface MyInterface {',
        '}'
    ]));
});

test('SchemaCompilerCore.compileSchema() constructs an interface property', t => {
    const compiler = new SchemaCompilerCore();
    const SCHEMA: ISchema = {
        MyInterface: {
            types: ['interface'],
            docs: [
                'My Interface Description'
            ],
            properties: {
                myProperty: {
                    types: [['string'], ['number']],
                    keywords: ['optional'],
                    docs: [
                        'My Property Description'
                    ]
                }
            }
        }
    };
    const compiledCode = compiler.compileSchema(SCHEMA);
    t.true(isSubset(compiledCode, [
        '/**',
        ' * My Interface Description',
        ' */',
        'export interface MyInterface {',
        '    /**',
        '     * My Property Description',
        '     */',
        '    readonly myProperty?: string | number;',
        '}'
    ]));
});

test('SchemaCompilerCore.compileSchema() constructs interface inheritance', t => {
    const compiler = new SchemaCompilerCore();
    const SCHEMA: ISchema = {
        MyAncestorInterface: {
            types: ['interface']
        },
        MyInterface: {
            types: ['interface'],
            inherits: ['MyAncestorInterface']
        }
    };
    const compiledCode = compiler.compileSchema(SCHEMA);
    t.true(isSubset(compiledCode, [
        `export interface MyAncestorInterface {`,
        '}'
    ]));
    t.true(isSubset(compiledCode, [
        'export interface MyInterface extends MyAncestorInterface {',
        '}'
    ]));
});
