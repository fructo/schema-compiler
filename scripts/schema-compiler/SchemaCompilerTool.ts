'use strict';

import { ISchema } from './compiler/schema/ISchema.js';
import { SchemaCompiler } from './compiler/SchemaCompiler.js';
import { SourceCodeFormatter } from './formatter/SourceCodeFormatter.js';


export class SchemaCompilerTool {

    private readonly compiler = new SchemaCompiler();
    private readonly formatter = new SourceCodeFormatter();

    /**
     * Compiles a schema into TypeScript.
     * 
     * @returns An array of TypeScript lines.
     */
    public compileSchema(schema: ISchema): Array<string> {
        const sourceCode = this.compiler.compileSchema(schema);
        const formattedSourceCode = this.formatter.formatLines(sourceCode);
        return formattedSourceCode;
    }

}
