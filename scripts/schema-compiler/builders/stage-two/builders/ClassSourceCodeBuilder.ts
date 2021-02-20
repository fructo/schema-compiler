'use strict';

import { IPropertyBody } from 'scripts/schema-compiler/schema/IPropertyBody.js';
import { SourceCodeBuilder } from './SourceCodeBuilder.js';


export class ClassSourceCodeBuilder extends SourceCodeBuilder {

    /**
     * @override
     */
    public buildSourceCode(): Array<string> {
        return this.constructClassSourceCode();
    }

    /**
     * Constructs the class.
     * 
     * @returns TypeScript lines.
     */
    private constructClassSourceCode(): Array<string> {
        const inherits = this.entityBody.inherits && this.entityBody.inherits.length
            ? `extends ${this.entityBody.inherits.join(', ')} ` : '';
        return [
            ...this.constructDocs(this.entityBody.docs),
            `export class ${this.entityName} ${inherits}{`,
            ...this.constructPropertiesSourceCode(),
            '}'
        ];
    }

    /**
     * Constructs all properties of a class.
     * 
     * @returns TypeScript lines.
     */
    private constructPropertiesSourceCode(): Array<string> {
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Array') {
            const typedProperties = this.entityBody.properties as Array<string>;
            return typedProperties
                .map(interfaceName => {
                    const propertyName = interfaceName.split(/(?=[A-Z])/).join('_').toUpperCase();
                    return [
                        `public static readonly ${propertyName} = {`,
                        `    create(properties: ${interfaceName}Merged): ${interfaceName} {`,
                        ...this.constructCreationMethodBodySourceCode(interfaceName),
                        `    },`,
                        `    validate(value: unknown): void {`,
                        `        `,
                        `    }`,
                        `}`
                    ].map(row => `${' '.repeat(4)}${row}`);
                })
                .flatMap(x => x);
        }
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Object') {
            throw new TypeError(`Currently, a class cannot define properties as an object: ${this.entityName}.`);
        }
        return [];
    }

    /**
     * @returns TypeScript lines.
     */
    private constructCreationMethodBodySourceCode(interfaceName: string): Array<string> {
        const propertiesKeySet = this.collectPropertiesKeySet(`${interfaceName}Merged`);
        const defaultProperties = this.collectDefaultProperties(`${interfaceName}Merged`);
        const lines = this.mergePropertiesForCreationMethodSourceCode(propertiesKeySet, defaultProperties, []);
        return [
            `return {`,
            ...lines,
            `};`
        ].map(row => `${' '.repeat(4 * 2)}${row}`);
    }

    /**
     * Recursively collects all names of properties.
     * 
     * @example
     * ```ts
     * const keySet = { header: undefined, settings: { host: undefined, port: undefined } };
     * ```
     */
    private collectPropertiesKeySet(mergedInterfaceName: string): Record<string, unknown> {
        const collectedKeySet: Record<string, unknown> = {};
        const mergedInterfaceBuilder = this.registry.getStageOneBuilder(mergedInterfaceName);
        const mergedInterfaceEntity = mergedInterfaceBuilder.builtEntity;
        if (mergedInterfaceEntity) {
            const [, mergedEntityBody] = mergedInterfaceEntity;
            const properties = mergedEntityBody.properties;
            if (properties) {
                const typedProperties = properties as Record<string, IPropertyBody>;
                Object.entries(typedProperties).forEach(([propertyName, propertyBody]) => {
                    collectedKeySet[propertyName] = undefined;
                    propertyBody.types?.find(intersection => intersection.find(typeName => {
                        if (this.registry.hasStageOneBuilder(typeName)) {
                            collectedKeySet[propertyName] = this.collectPropertiesKeySet(typeName);
                        }
                    }));
                });
            }
        }
        return collectedKeySet;
    }

    /**
     * Recursively collects all default properties.
     */
    private collectDefaultProperties(mergedInterfaceName: string): Record<string, unknown> {
        const defaultProperties: Record<string, unknown> = {};
        const mergedInterfaceBuilder = this.registry.getStageOneBuilder(mergedInterfaceName);
        const mergedInterfaceEntity = mergedInterfaceBuilder.builtEntity;
        if (mergedInterfaceEntity) {
            const [, mergedEntityBody] = mergedInterfaceEntity;
            const properties = mergedEntityBody.properties;
            if (properties) {
                const typedProperties = properties as Record<string, IPropertyBody>;
                Object.entries(typedProperties).forEach(([propertyName, propertyBody]) => {
                    if ('default' in propertyBody) {
                        defaultProperties[propertyName] = propertyBody.default;
                    }
                    propertyBody.types?.find(intersection => intersection.find(typeName => {
                        if (this.registry.hasStageOneBuilder(typeName)) {
                            defaultProperties[propertyName] = this.collectDefaultProperties(typeName);
                        }
                    }));
                });
            }
        }
        return defaultProperties;
    }

    private mergePropertiesForCreationMethodSourceCode(
        propertiesKeySet: Record<string, unknown>,
        defaultProperties: Record<string, unknown>,
        keysPath: Array<string>
    ): Array<string> {
        const lines = [];
        for (const key of Object.keys(propertiesKeySet)) {
            if (propertiesKeySet[key]) {
                const nestedKeySet = propertiesKeySet[key] as Record<string, unknown>;
                const nestedDefaultProperties = defaultProperties[key] as Record<string, unknown> || {};
                lines.push(`${key}: {`);
                const nestedLines = this.mergePropertiesForCreationMethodSourceCode(nestedKeySet, nestedDefaultProperties, [...keysPath, key]);
                lines.push(...nestedLines, '}');
            } else {
                const defaultValue = JSON.stringify(defaultProperties[key]);
                const line = `${key}: ${`properties${keysPath.length > 0 ? '.' : ''}${keysPath.join('.')}.${key}`} || ${defaultValue},`;
                lines.push(line);
            }
        }
        return lines;
    }

}
