'use strict';

import { SchemaCompilerCore } from '../schema-compiler-core/SchemaCompilerCore.js';
import { SchemaFileReader } from './reader/SchemaFileReader.js';
import { OutputFileWriter } from './writer/OutputFileWriter.js';


export class SchemaCompilerTool {

    private readonly compilerCore = new SchemaCompilerCore();
    private readonly reader = new SchemaFileReader();
    private readonly writer = new OutputFileWriter();

    public async compileSchema(): Promise<void> {
        const schema = await this.reader.readSchema(Deno.args[0]);
        const sourceCode = this.compilerCore.compileSchema(schema);
        try {
            await this.writer.writeSourceCode(sourceCode);
        } catch (error) {
            console.error(error);
        }
    }

}

void new SchemaCompilerTool().compileSchema();
