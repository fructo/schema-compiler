'use strict';

import { IRegistrableModel } from './IRegistrableModel.js';


/**
 * Events that can dispath the compilation registry.
 */
type TEventName =
    'register-model' |
    'register-model-silently' |
    'register-output-code-lines';


/**
 * Listener of an event that is dispatched by the registry.
 */
type TEventListener<T extends TEventName> =
    T extends 'register-model' | 'register-model-silently' ? (
        model: IRegistrableModel
    ) => void
    : T extends 'register-output-code-lines' ? (
        outputCodeLines: Array<string>
    ) => void
    : never;


export class CompilationRegistry {

    /**
     * Listeners of registry events.
     */
    protected readonly listeners = new Map<TEventName, Array<TEventListener<TEventName>>>();

    /**
     * Attaches a listener to the registry.
     */
    public on<T extends TEventName>(eventName: T, listener: TEventListener<T>): void {
        const listeners = this.listeners.get(eventName) || [];
        listeners.push(listener);
        this.listeners.set(eventName, listeners);
    }

    /**
     * Registered models.
     * Key: model name
     * Value: model
     */
    private readonly models = new Map<string, IRegistrableModel>();

    /**
     * Registers a model.
     * Dispatches an event ('register-model').
     * 
     * @param model - A model to be registered.
     */
    public registerModel(model: IRegistrableModel): void {
        this._registerModel('register-model', model);
    }

    /**
     * Silently registers a model.
     * Dispatches an event ('register-model-silently').
     * 
     * @param model - A model to be registered.
     */
    public registerModelSilently(model: IRegistrableModel): void {
        this._registerModel('register-model-silently', model);
    }

    /**
     * Performs the registation of a model.
     * Dispatches a specified event.
     * 
     * @throws An error if the model is already registered.
     */
    private _registerModel(
        eventName: 'register-model' | 'register-model-silently',
        model: IRegistrableModel
    ): void {
        if (this.hasModel(model.name)) {
            throw new TypeError(`CRITICAL: REGISTRY: ${model.name} is already registered.`);
        }
        this.models.set(model.name, model);
        const listeners = <Array<TEventListener<'register-model'>>>this.listeners.get(eventName);
        listeners.forEach(listener => listener(model));
    }

    /**
     * Checks if a specified model exists in the registry.
     */
    public hasModel(modelName: string): boolean {
        return this.models.has(modelName);
    }

    /**
     * Returns a model from the registry.
     * 
     * @param modelName - A name of a model to seek for.
     * @throws An error if the model does not exist.
     */
    public getModel<T extends IRegistrableModel>(modelName: string): T {
        const model = this.models.get(modelName);
        if (model) {
            return <T>model;
        }
        throw new TypeError(`${modelName} does not exist.`);
    }

    /**
     * Dispatches an event ('register-output-code-lines').
     */
    public registerOutputCodeLines(outputCodeLines: Array<string>): void {
        const listeners = <Array<TEventListener<'register-output-code-lines'>>>this.listeners.get('register-output-code-lines');
        listeners.forEach(listener => listener(outputCodeLines));
    }

}
