'use strict';

import { InterfaceModel } from '../models/InterfaceModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { IRegistrableModel } from '../registry/IRegistrableModel.js';
import { BinaryExpressionTree } from '../utils/BinaryExpressionTree.js';


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
            ...this.createPropertiesOutputLines(model.properties),
            `}`
        ];
    }

    private createPropertiesOutputLines(properties: Array<PropertyModel>): Array<string> {
        return properties
            .map(propertyModel => {
                return [
                    ...propertyModel.type instanceof BinaryExpressionTree
                        ? [`${propertyModel.name}: ${propertyModel.type.toString()};`]
                        : [`${propertyModel.name}: {`,
                        ...this.createPropertiesOutputLines(propertyModel.type),
                            `};`
                        ]
                ];
            })
            .flatMap(x => x);
    }

}
