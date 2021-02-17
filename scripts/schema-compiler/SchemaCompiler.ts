'use strict';

export function schema(strings: TemplateStringsArray): string {
    return strings.join('');
}


export function inherit(strings: TemplateStringsArray): string {
    return `inherit:${strings.join('')}`;
}


export function docs(strings: TemplateStringsArray): string {
    return `docs:${strings.join('')}`;
}


export class SchemaCompiler {

    public compileSchema(schema: Record<string, unknown>): Array<string> {
        return (Object
            .entries(schema) as Array<[string, Array<string>]>)
            .map(([name, body]) => [...this.constructClass(name, body), ...this.constructInterface(name, body)])
            .flatMap(x => x);
    }

    private constructClass(name: string, body: Array<unknown>): Array<string> {
        if (body[0] === 'class') {
            const docs = this.constructDocs(body);
            return [...docs, `class ${name} {`, '}'];
        }
        return [];
    }

    private constructInterface(name: string, body: Array<unknown>): Array<string> {
        if (body[0] === 'interface') {
            const docs = this.constructDocs(body);
            const inherit = this.construcInherit(body);
            const properties = this.constructInterfaceProperties(body);
            return [...docs, `interface ${name} ${inherit}{`, ...properties, '}'];
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

    private constructInterfaceProperties(body: Array<unknown>): Array<string> {
        const properties = body[body.length - 1];
        if (properties && typeof properties === 'object') {
            return Object.entries(properties)
                .map(([name, body]) => this.constructInterfaceProperty(name, body))
                .flatMap(x => x);
        }
        return [];
    }

    private constructInterfaceProperty(name: string, body: Array<unknown>): Array<string> {
        const docs = this.constructDocs(body);
        const [types, keywords] = body.filter(value => value && typeof value === 'object' && value.constructor.name === 'Array') as [Array<Array<string>>, Array<string>];
        return [
            ...docs,
            `${keywords.includes('readonly') ? 'readonly ' : ''}${name}` +
            `${keywords.includes('optional') ? '?' : ''}: ` +
            types.map(intersection => intersection.join(' & ')).join(' | ')
            + ';'
        ].map(row => `${' '.repeat(4)}${row}`);
    }

    private construcInherit(body: Array<unknown>): string {
        const ancestors = (body
            .filter(value => typeof value === 'string') as Array<string>)
            .filter(value => value.startsWith('inherit:'))
            .map(row => row.replace('inherit:', ''))
            .map(row => row.trim())
            .join(', ');
        return ancestors ? `extends ${ancestors} ` : '';
    }

}
