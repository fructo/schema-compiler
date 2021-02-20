'use strict';

import { IEntityBody } from '../../../schema/IEntityBody.js';
import { IPropertyBody } from '../../../schema/IPropertyBody.js';
import { BuildRegistry } from '../../../registry/BuildRegistry.js';

import { IStageOneBuilder } from '../IStageOneBuilder.js';


/**
 * The creation of merged interfaces is the first stage of the compilation.
 */
export class MergedInterfaceBuilder implements IStageOneBuilder {

    /**
     * @override
     */
    public builtEntity?: [string, IEntityBody];

    constructor(
        private readonly registry: BuildRegistry,
        public readonly entityName: string,
        private readonly entityBody: IEntityBody
    ) { }

    /**
     * Constructs an interface with all merges done.
     * 
     * The merges include:
     * - Ancestor properties.
     * - Default values.
     * 
     * @override
     * @returns A tuple of interface name and its body.
     */
    public build(): [string, IEntityBody] {
        const properties = this.mergeProperties();
        this.builtEntity = [`${this.entityName}Merged`, { types: ['interface'], properties }];
        return this.builtEntity;
    }

    private mergeProperties(): Record<string, IPropertyBody> {
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Array') {
            console.log(`WARNING: MERGE: ${this.entityName} defines properties as an array, ignoring.`);
        }
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Object') {
            const typedProperties = this.entityBody.properties as Record<string, IPropertyBody>;
            const preparedProperties = this.renameNestedProperties(typedProperties);
            const mergedWithAncestorsProperties = this.mergeEntityAndAncestorsProperties(preparedProperties);
            return mergedWithAncestorsProperties;
        }
        return {};
    }

    /**
     * Merges entity properties with ancestor properties.
     */
    private mergeEntityAndAncestorsProperties(entityProperties: Record<string, IPropertyBody>): Record<string, IPropertyBody> {
        let properties = entityProperties;
        this.entityBody.inherits?.map(ancestorName => {
            const ancestorMergedEntityBuilder = this.registry.getStageOneBuilder(`${ancestorName}Merged`);
            const ancestorMergedEntity = ancestorMergedEntityBuilder.builtEntity;
            if (ancestorMergedEntity) {
                const [, ancestorBody] = ancestorMergedEntity;
                if (ancestorBody.properties) {
                    const typedAncestorProperties = ancestorBody.properties as Record<string, IPropertyBody>;
                    properties = this.mergeAncestorAndChildProperties(typedAncestorProperties, properties);
                }
            }
        });
        return properties;
    }

    /**
     * Merges ancestor and its child properties.
     * 
     * @returns A new object with merged properties.
     */
    private mergeAncestorAndChildProperties(
        ancestorProperties: Record<string, IPropertyBody>,
        childProperties: Record<string, IPropertyBody>
    ): Record<string, IPropertyBody> {
        const properties: Record<string, IPropertyBody> = {};
        Object.keys(ancestorProperties).forEach(ancestorPropertyName => {
            const ancestorPropertyBody = ancestorProperties[ancestorPropertyName];
            if (ancestorPropertyName in childProperties) {
                const childPropertyBody = childProperties[ancestorPropertyName];
                const mergedPropertyBody: IPropertyBody = {
                    ...ancestorPropertyBody,
                    ...childPropertyBody,
                    keywords: [...new Set([...ancestorPropertyBody.keywords || [], ...childPropertyBody.keywords || []])],
                };
                properties[ancestorPropertyName] = mergedPropertyBody;
            } else {
                properties[ancestorPropertyName] = ancestorPropertyBody;
            }
        });
        Object
            .keys(childProperties)
            .filter(childPropertyName => !(childPropertyName in ancestorProperties))
            .forEach(childPropertyName => properties[childPropertyName] = childProperties[childPropertyName]);
        return properties;
    }

    /**
     * If one of the properties uses an interface as a type,
     * the type name will be extended with "Merged".
     * 
     * This substitution is necessary because nested properties can have default values.
     * If the original interface is used, properties with default values will stay required.
     * 
     * @returns A new object with renamed nested properties.
     */
    private renameNestedProperties(properties: Record<string, IPropertyBody>): Record<string, IPropertyBody> {
        const newEntries = Object.entries(properties).map(([propertyName, propertyBody]) => {
            const types = propertyBody.types?.map(intersection => intersection.map(typeName => {
                if (this.registry.hasStageOneBuilder(`${typeName}Merged`)) {
                    return `${typeName}Merged`;
                }
                return typeName;
            }));
            return [propertyName, { ...propertyBody, types }];
        });
        return Object.fromEntries(newEntries) as Record<string, IPropertyBody>;
    }

}
