'use strict';

import { IStageOneBuilder } from '../builders/stage-one/IStageOneBuilder.js';
import { IStageTwoBuilder } from '../builders/stage-two/IStageTwoBuilder.js';


export class BuildRegistry {

    /**
     * Contains all builders for the first stage (the merge stage).
     */
    public readonly stageOneBuilders = new Map<string, IStageOneBuilder>();

    /**
     * Contains builders for the second stage (the source code generation stage).
     * New builders can be added by on the first stage.
     */
    public readonly stageTwoBuilders = new Map<string, IStageTwoBuilder>();

    /**
     * Registers a builder for the first stage (the merge stage).
     */
    public registerStageOneBuilder(stageOneBuilderName: string, stageOneBuilder: IStageOneBuilder): void {
        this.stageOneBuilders.set(stageOneBuilderName, stageOneBuilder);
    }

    /**
     * Registers a builder for the second stage (the source code generation stage).
     */
    public registerStageTwoBuilder(stageTwoBuilderName: string, stageTwoBuilder: IStageTwoBuilder): void {
        this.stageTwoBuilders.set(stageTwoBuilderName, stageTwoBuilder);
    }

    /**
     * Checks if a specified builder of the first stage exists in the registry.
     */
    public hasStageOneBuilder(stageOneBuilderName: string): boolean {
        return this.stageOneBuilders.has(stageOneBuilderName);
    }

    /**
     * Checks if a specified builder of the second stage exists in the registry.
     */
    public hasStageTwoBuilder(stageTwoBuilderName: string): boolean {
        return this.stageTwoBuilders.has(stageTwoBuilderName);
    }

    /**
     * Returns a builder of the first stage by its name.
     */
    public getStageOneBuilder(stageOneBuilderName: string): IStageOneBuilder {
        const stageOneBuilder = this.stageOneBuilders.get(stageOneBuilderName);
        if (stageOneBuilder) {
            return stageOneBuilder;
        }
        throw new TypeError(`Registry: Unable to find a builder of the first stage: ${stageOneBuilderName}.`);
    }

    /**
     * Returns a builder of the second stage by its name.
     */
    public getStageTwoBuilder(stageTwoBuilderName: string): IStageTwoBuilder {
        const stageTwoBuilder = this.stageTwoBuilders.get(stageTwoBuilderName);
        if (stageTwoBuilder) {
            return stageTwoBuilder;
        }
        throw new TypeError(`Registry: Unable to find a builder of the second stage: ${stageTwoBuilderName}.`);
    }

}
