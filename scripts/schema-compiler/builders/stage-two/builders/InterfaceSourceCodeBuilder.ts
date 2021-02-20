'use strict';

import { IPropertyBody } from '../../../schema/IPropertyBody.js';
import { SourceCodeBuilder } from './SourceCodeBuilder.js';


export class InterfaceSourceCodeBuilder extends SourceCodeBuilder {

    /**
     * @override
     */
    public buildSourceCode(): Array<string> {
        return this.constructInterfaceSourceCode();
    }

    /**
     * Constructs the interface.
     * 
     * @returns TypeScript lines.
     */
    private constructInterfaceSourceCode(): Array<string> {
        const inherits = this.entityBody.inherits && this.entityBody.inherits.length
            ? `extends ${this.entityBody.inherits.join(', ')} ` : '';
        return [
            ...this.constructDocs(this.entityBody.docs),
            `export interface ${this.entityName} ${inherits}{`,
            ...this.constructPropertiesSourceCode(),
            '}'
        ];
    }

    /**
     * Constructs all properties of an interface.
     * 
     * @remarks
     * If the default value of a property is specified, its type is used.
     * 
     * @returns TypeScript lines.
     */
    private constructPropertiesSourceCode(): Array<string> {
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Object') {
            const typedProperties = this.entityBody.properties as Record<string, IPropertyBody>;
            return Object.entries(typedProperties)
                .map(([propertyName, propertyBody]) => {
                    const docs = this.constructDocs(propertyBody.docs);
                    const readonly = propertyBody.keywords?.includes('writable') ? '' : 'readonly ';
                    const optional = propertyBody.keywords?.includes('optional') ? '?' : '';
                    const types = (propertyBody.types?.map(intersection => intersection.join(' & ')).join(' | '))
                        || ('default' in propertyBody ? typeof propertyBody.default : 'unknown');
                    return [
                        ...docs,
                        `${readonly}${propertyName}${optional}: ${types};`
                    ].map(row => `${' '.repeat(4)}${row}`);
                })
                .flatMap(x => x);
        }
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Array') {
            throw new TypeError(`Currently, an interface cannot define properties as an array: ${this.entityName}.`);
        }
        return [];
    }

}
