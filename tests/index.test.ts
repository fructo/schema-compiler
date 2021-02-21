'use strict';

import test from 'ava';

import * as module from '@fructo/schema-compiler';


function testModuleExports() {
    const EXPORTS = [
        'SchemaCompilerCore',
    ];
    EXPORTS.forEach(unit => {
        test(`The module exports ${unit}`, t => {
            t.true(unit in module);
        });
    });
}

testModuleExports();
