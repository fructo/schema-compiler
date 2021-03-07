'use strict';

import {
    TLanguageStructureModelSchema,
    TLanguageStructureModelArraySchema,
    TLanguageStructureModelDictionarySchema,
    TLanguageStructurePropertiesModelArraySchema,
    TLanguageStructurePropertiesModelDictionarySchema,
    LanguageStructureModel
} from '../models/LanguageStructureModel.js';

import { PropertyModelsFactory } from './PropertyModelsFactory.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { TypeUtil } from '../utils/TypeUtil.js';


/**
 * This class contains creation logic for Interfaces and Classes.
 */
export abstract class LanguageStructureModelsFactory<
    Model extends LanguageStructureModel,
    PropertiesModelArraySchema extends TLanguageStructurePropertiesModelArraySchema,
    PropertiesModelDictionarySchema extends TLanguageStructurePropertiesModelDictionarySchema,
    ModelArraySchema extends TLanguageStructureModelArraySchema,
    ModelDictionarySchema extends TLanguageStructureModelDictionarySchema<PropertiesModelArraySchema, PropertiesModelDictionarySchema>,
    ModelSchema extends TLanguageStructureModelSchema<ModelArraySchema, ModelDictionarySchema>
    >{

    /**
     * Model class.
     * Used to construct new models.
     */
    protected abstract modelClass: new (...args: Array<any>) => Model;

    constructor(
        private readonly registry: CompilationRegistry,
        private readonly propertyModelsFactory: PropertyModelsFactory
    ) { }

    /**
     * Creates a model by its schema.
     * Registers the model in the compilation registry.
     * 
     * @param modelName - Model name.
     * @param modelSchema - Model schema.
     * @returns Undefined if the name does not match the naming convention, otherwise a new model.
     * @throws An error if the syntax is wrong.
     */
    public fromModelSchema(modelName: string, modelSchema: ModelSchema | unknown): Model | undefined {
        if (this.checkNamingConventionOfLanguageStructureName(modelName)) {
            if (TypeUtil.isArray(modelSchema)) {
                return this.fromModelArraySchema(modelName, modelSchema as ModelArraySchema);
            }
            if (TypeUtil.isDictionary(modelSchema)) {
                return this.fromModelObjectSchema(modelName, modelSchema as ModelDictionarySchema);
            }
            throw new SyntaxError(`${modelName} defines a model not as an object or an array.`);
        }
    }

    /**
     * Checks if a language structure name matches the naming convention.
     * 
     * @param modelName - Structure name.
     */
    protected abstract checkNamingConventionOfLanguageStructureName(modelName: string): boolean;

    /**
     * Creates a model if the model schema is an array.
     * Registers the model in the compilation registry.
     * 
     * @param modelName - Model name.
     * @param modelSchema - Model schema as an array.
     * @returns New model.
     */
    private fromModelArraySchema(modelName: string, modelSchema: ModelArraySchema): Model {
        const properties = modelSchema.map(dependencyName => {
            const dependencyModel = this.registry.getModel(dependencyName);
            const propertyName = this.performNamingConventionOnPropertyNameOfModelArraySchema(dependencyName);
            return this.propertyModelsFactory.fromModel(propertyName, dependencyModel);
        });
        const model = new this.modelClass({ name: modelName, properties });
        this.registry.registerModel(model);
        return model;
    }

    /**
     * Creates a new property name based on the specified name and naming convention.
     * 
     * @param dependencyName - A name of a model (interface or class).
     */
    protected abstract performNamingConventionOnPropertyNameOfModelArraySchema(dependencyName: string): string;

    /**
     * Creates a model if the model schema is a dictionary.
     * Registers the model in the compilation registry.
     * 
     * @param modelName - Model name.
     * @param modelSchema - Model schema as a dictionary.
     * @returns New model.
     */
    private fromModelObjectSchema(modelName: string, modelSchema: ModelDictionarySchema): Model {
        const ancestorsNames = (modelSchema.ancestors || '').split(',').filter(s => s).map(name => name.trim());
        const ancestors = ancestorsNames.map(ancestorName => this.registry.getModel(ancestorName));
        const rawProperties = modelSchema.properties || [];
        if (TypeUtil.isArray(rawProperties)) {
            const properties = (rawProperties as PropertiesModelArraySchema).map(dependecyName => {
                const dependecyModel = this.registry.getModel(dependecyName);
                const propertyName = this.performNamingConventionOnPropertyNameOfModelArraySchema(dependecyName);
                return this.propertyModelsFactory.fromModel(propertyName, dependecyModel);
            });
            const model = new this.modelClass({ name: modelName, ancestors, properties });
            this.registry.registerModel(model);
            return model;
        }
        if (TypeUtil.isDictionary(rawProperties)) {
            const properties = Object.entries(rawProperties).map(([propertyName, propertyModelObjectSchema]) => {
                return this.propertyModelsFactory.fromPropertyModelSchema(propertyName, propertyModelObjectSchema);
            });
            const model = new this.modelClass({ name: modelName, ancestors, properties });
            this.registry.registerModel(model);
            return model;
        }
        throw new SyntaxError(`${modelName} does not define properties as an array or dictionary.`);
    }

}
