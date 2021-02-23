'use strict';

export abstract class DocsOutputCodeLinesFactory {

    /**
     * Creates TypeScript lines of a documentation string.
     * 
     * @param docs - An array of documentation lines.
     * @returns TypeScript lines.
     */
    protected static createDocs(docs?: Array<string>): Array<string> {
        return docs && docs.length ? [
            '/**',
            ...docs.map(doc => ` * ${doc}`),
            ' */'
        ] : [];
    }

}
