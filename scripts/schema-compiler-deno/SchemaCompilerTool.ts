'use strict';

import { SchemaCompilerCore } from '../schema-compiler-core/SchemaCompilerCore.js';
import { SchemaFileReader } from './reader/SchemaFileReader.js';


export class SchemaCompilerTool {

    private readonly compilerCore = new SchemaCompilerCore();
    private readonly reader = new SchemaFileReader();

    public async compileSchema(): Promise<void> {
        const schema = await this.reader.readSchema(Deno.args[0]);
        const sourceCode = this.compilerCore.compileSchema(schema);
        console.log(sourceCode);
    }

}

void new SchemaCompilerTool().compileSchema();
