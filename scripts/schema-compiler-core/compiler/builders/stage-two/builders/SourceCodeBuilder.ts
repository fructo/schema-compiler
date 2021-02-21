'use strict';

import { IEntityBody } from '../../../schema/IEntityBody.js';
import { BuildRegistry } from '../../../registry/BuildRegistry.js';

import { IStageTwoBuilder } from '../IStageTwoBuilder.js';


/**
 * The creation of source codes is the second stage of the compilation.
 */
export abstract class SourceCodeBuilder implements IStageTwoBuilder {

    constructor(
        protected readonly registry: BuildRegistry,
        public readonly entityName: string,
        protected readonly entityBody: IEntityBody
    ) { }

    /**
     * @override
     */
    public abstract buildSourceCode(): Array<string>;

    /**
     * Constructs documentation string.
     * 
     * @param docs - An array of documentation rows.
     * @returns TypeScript lines.
     */
    protected constructDocs(docs?: Array<string>): Array<string> {
        return docs && docs.length ? [
            '/**',
            ...docs.map(doc => ` * ${doc}`),
            ' */'
        ] : [];
    }

}
