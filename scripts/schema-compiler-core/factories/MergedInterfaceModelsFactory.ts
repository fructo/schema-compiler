'use strict';

import { InterfaceModel } from '../models/InterfaceModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { BinaryExpressionTree } from '../utils/BinaryExpressionTree.js';
import { TMutable } from '../utils/TypeUtil.js';


/**
 * Creates and registers a new model of an interface merged with its ancestors.
 * 
 * Merged interface creation algorithm:
 * - Rename original name (create a name for a merged interface).
 * - Rename nested properties (make references to merged interfaces).
 * - Inject properties from ancestors.
 * - Make a property optional if a default value exists.
 * - Remove ancestors to avoid conflicts because of optional values.
 */
export class MergedInterfaceModelsFactory {

    constructor(
        private readonly registry: CompilationRegistry
    ) {
        this.registry.on('register-model', (model) => {
            if (model instanceof InterfaceModel) {
                const mergedModel = this.createMergedInterfaceModel(model);
                this.registry.registerModelSilently(mergedModel);
            }
        });
    }

    public static createMergedInterfaceName(interfaceName: string): string {
        return `${interfaceName}MergedInterface`;
    }

    private createMergedInterfaceModel(originalModel: InterfaceModel): InterfaceModel {
        return new InterfaceModel({
            name: this.createMergedInterfaceName(originalModel),
            properties: this.createMergedPropertiesModels(originalModel)
        });
    }

    private createMergedInterfaceName(originalModel: InterfaceModel): string {
        return MergedInterfaceModelsFactory.createMergedInterfaceName(originalModel.name);
    }

    private createMergedPropertiesModels(originalModel: InterfaceModel): Array<PropertyModel> {
        const mergedAncestors = originalModel.ancestors.map(ancestor => {
            const mergedAncestorName = this.createMergedInterfaceName(ancestor);
            return this.registry.getModel<InterfaceModel>(mergedAncestorName);
        });
        const clonedAncestorsProperties = mergedAncestors
            .map(model => model.properties)
            .flatMap(x => x)
            .map(property => property.clone());
        const referencedProperties = this.createPropertiesWithReferencesToMergedInterfaces(originalModel.properties);
        const allProperties = [...referencedProperties, ...clonedAncestorsProperties];
        return this.resolveDuplicates(allProperties);
    }

    private createPropertiesWithReferencesToMergedInterfaces(originalProperties: Array<PropertyModel>): Array<PropertyModel> {
        const clonedProperties: Array<TMutable<PropertyModel>> = originalProperties.map(property => property.clone());
        return clonedProperties.map(property => {
            if (property.type instanceof BinaryExpressionTree) {
                property.type = property.type.map(value => {
                    if (value instanceof InterfaceModel) {
                        const mergedModelName = this.createMergedInterfaceName(value);
                        const mergedModel = this.registry.getModel(mergedModelName);
                        return mergedModel;
                    }
                    return value;
                });
            } else {
                property.type = this.createPropertiesWithReferencesToMergedInterfaces(property.type);
            }
            return property;
        });
    }

    private resolveDuplicates(properties: Array<PropertyModel>): Array<PropertyModel> {
        const knownNames = new Set<string>();
        return properties.filter(property => {
            const isDuplicate = knownNames.has(property.name);
            knownNames.add(property.name);
            return !isDuplicate;
        });
    }

}
