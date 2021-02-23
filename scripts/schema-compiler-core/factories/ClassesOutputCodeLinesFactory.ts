'use strict';

import { IEntityBody } from '../schema/IEntityBody.js';
import { TDeepMutable, CompilationRegistry } from '../registry/CompilationRegistry.js';
import { IPropertyBody } from '../schema/IPropertyBody.js';
import { DocsOutputCodeLinesFactory } from './DocsOutputCodeLinesFactory.js';
import { MergedInterfacesEntitiesFactory } from './MergedInterfacesEntitiesFactory.js';


/**
 * @sealed
 */
export abstract class ClassesOutputCodeLinesFactory extends DocsOutputCodeLinesFactory {

    public static createClassOutputCodeLines(
        compilationRegistry: CompilationRegistry,
        originalEntityName: string,
        originalEntityBodyDeepMutable: TDeepMutable<IEntityBody>
    ): void {
        if (originalEntityBodyDeepMutable.types.includes('class')) {
            const ouputCodeLines = this.createOutputCodeLines(compilationRegistry, originalEntityName, originalEntityBodyDeepMutable);
            compilationRegistry.registerOutputCodeLines(originalEntityName, ouputCodeLines);
        }
    }

    private static createOutputCodeLines(
        compilationRegistry: CompilationRegistry,
        entityName: string,
        entityBody: IEntityBody
    ): Array<string> {
        const inherits = entityBody.inherits && entityBody.inherits.length
            ? `extends ${entityBody.inherits.join(', ')} ` : '';
        return [
            ...this.createDocs(entityBody.docs),
            `export class ${entityName} ${inherits}{`,
            ...this.createPropertiesOuputCodeLines(compilationRegistry, entityBody),
            '}'
        ];
    }

    private static createPropertiesOuputCodeLines(
        compilationRegistry: CompilationRegistry,
        entityBody: IEntityBody
    ): Array<string> {
        if (entityBody.properties?.constructor.name === 'Array') {
            const typedProperties = entityBody.properties as Array<string>;
            return typedProperties
                .map(interfaceName => this.createInterfaceBasedPropertyOutputCodeLines(compilationRegistry, interfaceName, interfaceName))
                .flatMap(x => x);
        }
        if (entityBody.properties?.constructor.name === 'Object') {
            const typedProperties = entityBody.properties as Record<string, IPropertyBody>;
            return Object.entries(typedProperties)
                .map(([rawPropertyName, propertyBody]) => {
                    const propertyName = rawPropertyName.split(/(?=[A-Z])/).join('_').toUpperCase();
                    const types = (propertyBody.types?.map(intersection => intersection.join(' & ')).join(' | ')) || 'unknown';
                    return compilationRegistry.hasEntity(types)
                        ? this.createInterfaceBasedPropertyOutputCodeLines(compilationRegistry, rawPropertyName, types)
                        : [
                            `public static readonly ${propertyName} = {`,
                            `    create(value: ${types}): ${types} {`,
                            `        return value;`,
                            `    },`,
                            `    validate(value: unknown): void {`,
                            `        `,
                            `    }`,
                            `}`
                        ];
                })
                .flatMap(x => x);
        }
        return [];
    }

    private static createInterfaceBasedPropertyOutputCodeLines(
        compilationRegistry: CompilationRegistry,
        rawPropertyName: string,
        interfaceName: string
    ): Array<string> {
        const propertyName = rawPropertyName.split(/(?=[A-Z])/).join('_').toUpperCase();
        const mergedInterfaceName = MergedInterfacesEntitiesFactory.createMergedInterfaceName(interfaceName);
        return [
            `public static readonly ${propertyName} = {`,
            `    create(properties: ${mergedInterfaceName}): ${interfaceName} {`,
            ...this.createCreationMethodBodyOutputCodeLines(compilationRegistry, interfaceName),
            `    },`,
            `    validate(value: unknown): void {`,
            `        `,
            `    }`,
            `}`
        ];
    }

    private static createCreationMethodBodyOutputCodeLines(
        compilationRegistry: CompilationRegistry,
        interfaceName: string
    ): Array<string> {
        const mergedInterfaceName = MergedInterfacesEntitiesFactory.createMergedInterfaceName(interfaceName);
        const propertiesKeySet = this.collectPropertiesKeySet(compilationRegistry, mergedInterfaceName);
        const defaultProperties = this.collectDefaultProperties(compilationRegistry, mergedInterfaceName);
        const lines = this.mergePropertiesForCreationMethodOutputCode(propertiesKeySet, defaultProperties, []);
        return [
            `return {`,
            ...lines,
            `};`
        ];
    }

    /**
     * Recursively collects all names of properties.
     * 
     * @example
     * ```ts
     * const keySet = { header: undefined, settings: { host: undefined, port: undefined } };
     * ```
     */
    private static collectPropertiesKeySet(
        compilationRegistry: CompilationRegistry,
        mergedInterfaceName: string
    ): Record<string, unknown> {
        const collectedKeySet: Record<string, unknown> = {};
        const mergedInterfaceBody = compilationRegistry.getEntityBody(mergedInterfaceName);
        if (mergedInterfaceBody.properties) {
            const typedProperties = mergedInterfaceBody.properties as Record<string, IPropertyBody>;
            Object.entries(typedProperties).forEach(([propertyName, propertyBody]) => {
                collectedKeySet[propertyName] = undefined;
                propertyBody.types?.find(intersection => intersection.find(typeName => {
                    if (compilationRegistry.hasEntity(typeName)) {
                        collectedKeySet[propertyName] = this.collectPropertiesKeySet(compilationRegistry, typeName);
                    }
                }));
            });
        }
        return collectedKeySet;
    }

    /**
     * Recursively collects all default properties.
     */
    private static collectDefaultProperties(
        compilationRegistry: CompilationRegistry,
        mergedInterfaceName: string
    ): Record<string, unknown> {
        const defaultProperties: Record<string, unknown> = {};
        const mergedInterfaceBody = compilationRegistry.getEntityBody(mergedInterfaceName);
        if (mergedInterfaceBody.properties) {
            const typedProperties = mergedInterfaceBody.properties as Record<string, IPropertyBody>;
            Object.entries(typedProperties).forEach(([propertyName, propertyBody]) => {
                if ('default' in propertyBody) {
                    defaultProperties[propertyName] = propertyBody.default;
                }
                propertyBody.types?.find(intersection => intersection.find(typeName => {
                    if (compilationRegistry.hasEntity(typeName)) {
                        defaultProperties[propertyName] = this.collectDefaultProperties(compilationRegistry, typeName);
                    }
                }));
            });
        }
        return defaultProperties;
    }

    private static mergePropertiesForCreationMethodOutputCode(
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
                const nestedLines = this.mergePropertiesForCreationMethodOutputCode(nestedKeySet, nestedDefaultProperties, [...keysPath, key]);
                lines.push(...nestedLines, '}');
            } else {
                const defaultValue = key in defaultProperties ? ` || ${JSON.stringify(defaultProperties[key])}` : '';
                const line = `${key}: ${`properties${keysPath.length > 0 ? '.' : ''}${keysPath.join('.')}.${key}`}${defaultValue},`;
                lines.push(line);
            }
        }
        return lines;
    }

}
