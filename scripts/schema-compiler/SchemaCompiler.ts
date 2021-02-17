'use strict';

export function schema(strings: TemplateStringsArray): string {
    return strings.join('');
}


export function docs(strings: TemplateStringsArray): string {
    return `docs:${strings.join('')}`;
}


export class SchemaCompiler {

    public compileSchema(schema: Record<string, unknown>): Array<string> {
        return (Object
            .entries(schema) as Array<[string, Array<string>]>)
            .map(([name, body]) => this.constructClass(name, body))
            .flatMap(x => x);
    }

    private constructClass(name: string, body: Array<unknown>): Array<string> {
        if (body[0] === 'class') {
            const docs = this.constructDocs(body);
            return [...docs, `class ${name} {`, '}'];
        }
        return [];
    }

    /**
     * Constructs documentation strings.
     * 
     * If the body has no documentation strings, an empty array is returned.
     */
    private constructDocs(body: Array<unknown>): Array<string> {
        const rows = (body
            .filter(value => typeof value === 'string') as Array<string>)
            .filter(value => value.startsWith('docs:'))
            .map(row => row.replace('docs:', ''))
            .map(row => row.trim())
            .map(row => ` * ${row}`);
        return rows.length ? ['/**', ...rows, ' */'] : [];
    }

}
