'use strict';

import { IEntityBody } from '../schema/IEntityBody.js';
import { TDeepMutable, CompilationRegistry } from '../registry/CompilationRegistry.js';
import { IPropertyBody } from '../schema/IPropertyBody.js';
import { DocsOutputCodeLinesFactory } from './DocsOutputCodeLinesFactory.js';


/**
 * @sealed
 */
export abstract class InterfacesOutputCodeLinesFactory extends DocsOutputCodeLinesFactory {

    public static createInterfaceOutputCodeLines(
        compilationRegistry: CompilationRegistry,
        originalEntityName: string,
        originalEntityBodyDeepMutable: TDeepMutable<IEntityBody>
    ): void {
        if (originalEntityBodyDeepMutable.types.includes('interface')) {
            const ouputCodeLines = this.createOuputCodeLines(originalEntityName, originalEntityBodyDeepMutable);
            compilationRegistry.registerOutputCodeLines(originalEntityName, ouputCodeLines);
        }
    }

    private static createOuputCodeLines(entityName: string, entityBody: IEntityBody): Array<string> {
        const inherits = entityBody.inherits && entityBody.inherits.length
            ? `extends ${entityBody.inherits.join(', ')} ` : '';
        return [
            ...this.createDocs(entityBody.docs),
            `export interface ${entityName} ${inherits}{`,
            ...this.createPropertiesOutputCodeLines(entityBody),
            '}'
        ];
    }

    private static createPropertiesOutputCodeLines(entityBody: IEntityBody): Array<string> {
        if (entityBody.properties?.constructor.name === 'Object') {
            const typedProperties = entityBody.properties as Record<string, IPropertyBody>;
            return Object.entries(typedProperties).map(([propertyName, propertyBody]) => {
                const readonly = propertyBody.keywords?.includes('writable') ? '' : 'readonly ';
                const optional = propertyBody.keywords?.includes('optional') ? '?' : '';
                const types = (propertyBody.types?.map(intersection => intersection.join(' & ')).join(' | '))
                    || ('default' in propertyBody ? typeof propertyBody.default : 'unknown');
                return [
                    ...this.createDocs(propertyBody.docs),
                    `${readonly}${propertyName}${optional}: ${types};`
                ];
            }).flatMap(x => x);
        }
        if (entityBody.properties) {
            throw new TypeError(`Currently, an interface can define properties only as an object.`);
        }
        return [];
    }

}
