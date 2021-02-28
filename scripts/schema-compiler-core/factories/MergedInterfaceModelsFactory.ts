'use strict';

import { InterfaceModel } from '../models/InterfaceModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';


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

    private createMergedInterfaceModel(originalModel: InterfaceModel): InterfaceModel {
        return new InterfaceModel({
            name: this.createMergedInterfaceName(originalModel),
            properties: this.createMergedPropertiesModels(originalModel)
        });
    }

    private createMergedInterfaceName(originalModel: InterfaceModel): string {
        return `${originalModel.name}MergedInterface`;
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
        const clonedProperties = originalProperties.map(property => property.clone());
        clonedProperties.map(property => property.type.mapValues((value) => {
            if (value instanceof InterfaceModel) {
                const mergedModelName = this.createMergedInterfaceName(value);
                const mergedModel = this.registry.getModel(mergedModelName);
                return mergedModel;
            }
            return value;
        }));
        return clonedProperties;
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
