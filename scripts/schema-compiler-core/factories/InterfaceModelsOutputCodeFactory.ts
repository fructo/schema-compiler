'use strict';

import { InterfaceModel } from '../models/InterfaceModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import { TypeModel } from '../models/TypeModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { IRegistrableModel } from '../registry/IRegistrableModel.js';


export class InterfaceModelsOutputCodeLinesFactory {

    constructor(
        private readonly registry: CompilationRegistry
    ) {
        this.registry.on('register-model', (model) => {
            this.processModel(model);
        });
        this.registry.on('register-model-silently', (model) => {
            this.processModel(model);
        });
    }

    private processModel(model: IRegistrableModel): void {
        if (model instanceof InterfaceModel) {
            const outputLines = this.createOutputCodeLines(model);
            this.registry.registerOutputCodeLines(model.name, outputLines);
        }
    }

    private createOutputCodeLines(model: InterfaceModel): Array<string> {
        const ancestorsAsString = model.ancestors.map(ancestor => ancestor.name).join(', ');
        return [
            `export interface ${model.name} ${ancestorsAsString ? `extends ${ancestorsAsString} ` : ''}{`,
            ...this.createPropertiesOutputLines(model),
            `}`
        ];
    }

    private createPropertiesOutputLines(model: InterfaceModel): Array<string> {
        return model.properties
            .map(propertyModel => {
                return [
                    `${propertyModel.name}: ${this.createPropertyType(propertyModel)};`,
                ];
            })
            .flatMap(x => x);
    }

    private createPropertyType(propertyModel: PropertyModel): string {
        if (propertyModel.hasConstantValue) {
            return JSON.stringify(propertyModel.constantValue);
        }
        const type = propertyModel.type.toString((value) => {
            if (value instanceof TypeModel) {
                return value.type;
            }
            if (value instanceof InterfaceModel) {
                return value.name;
            }
            return JSON.stringify(value);
        });
        return type;
    }

}
