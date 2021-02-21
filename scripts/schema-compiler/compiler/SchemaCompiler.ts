'use strict';

import { ISchema } from './schema/ISchema.js';
import { IEntityBody } from './schema/IEntityBody.js';
import { BuildRegistry } from './registry/BuildRegistry.js';
import { MergedInterfaceBuilder } from './builders/stage-one/builders/MergedInterfaceBuilder.js';
import { InterfaceSourceCodeBuilder } from './builders/stage-two/builders/InterfaceSourceCodeBuilder.js';
import { ClassSourceCodeBuilder } from './builders/stage-two/builders/ClassSourceCodeBuilder.js';


export class SchemaCompiler {

    /**
     * Compiles a schema into TypeScript.
     * 
     * @returns An array of TypeScript lines.
     */
    public compileSchema(schema: ISchema): Array<string> {
        const buildRegistry = new BuildRegistry();
        Object.entries(schema).forEach(([entityName, entityBody]) => {
            const mergedInterfaceBuilder = new MergedInterfaceBuilder(buildRegistry, entityName, entityBody);
            const sourceCodeBuilderClass = this.detectSourceCodeBuilderClass(entityBody);
            const sourceCodeBuilder = new sourceCodeBuilderClass(buildRegistry, entityName, entityBody);
            buildRegistry.registerStageOneBuilder(`${entityName}Merged`, mergedInterfaceBuilder);
            buildRegistry.registerStageTwoBuilder(entityName, sourceCodeBuilder);
        });
        this.buildStageOne(buildRegistry);
        return this.buildStageTwo(buildRegistry);
    }

    /**
     * Returns a proper class of a builder of the second stage.
     */
    private detectSourceCodeBuilderClass(entityBody: IEntityBody) {
        return entityBody.types.includes('class') ? ClassSourceCodeBuilder : InterfaceSourceCodeBuilder;
    }

    /**
     * Registers new entities created during the first stage.
     */
    private buildStageOne(buildRegistry: BuildRegistry): void {
        buildRegistry.stageOneBuilders.forEach(stageOneBuilder => {
            const [newEntityName, newEntityBody] = stageOneBuilder.build();
            const sourceCodeBuilderClass = this.detectSourceCodeBuilderClass(newEntityBody);
            const sourceCodeBuilder = new sourceCodeBuilderClass(buildRegistry, newEntityName, newEntityBody);
            buildRegistry.registerStageTwoBuilder(newEntityName, sourceCodeBuilder);
        });
    }

    /**
     * Constructs the source code.
     * 
     * @returns An array of TypeScript lines.
     */
    private buildStageTwo(buildRegistry: BuildRegistry): Array<string> {
        return [...buildRegistry.stageTwoBuilders.values()]
            .map(stageTwoBuilder => stageTwoBuilder.buildSourceCode())
            .flatMap(x => x);
    }

}
