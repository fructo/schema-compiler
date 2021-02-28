'use strict';

import { IEntityBody } from '../schema/IEntityBody.js';
import { IRegistrableModel } from './IRegistrableModel.js';


/**
 * Wraps objects intended for modification.
 */
export type TDeepMutable<T> = { -readonly [K in keyof T]: TDeepMutable<T[K]> };


/**
 * Events that can dispath the compilation registry.
 */
type TEventName =
    'register-model' |
    'register-model-silently' |
    'register-entity' |
    'register-entity-silently' |
    'register-output-code-lines';


/**
 * Listener of an event that is dispatched by the registry.
 */
type TEventListener<T extends TEventName> =
    T extends 'register-entity' | 'register-entity-silently' ? (
        compilationRegistry: CompilationRegistry,
        originalEntityName: string,
        originalEntityBodyDeepMutable: TDeepMutable<IEntityBody>
    ) => void
    : T extends 'register-output-code-lines' ? (
        compilationRegistry: CompilationRegistry,
        originalEntityName: string,
        outputCodeLines: Array<string>
    ) => void
    : T extends 'register-model' | 'register-model-silently' ? (
        model: IRegistrableModel
    ) => void
    : never;


class NewCompilationRegistry {

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

}


export class CompilationRegistry extends NewCompilationRegistry {

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
     * Registered entities.
     * Key: entity name
     * Value: entity body
     */
    private readonly entities = new Map<string, IEntityBody>();

    /**
     * Registers an entity for the compilation.
     * Dispatches an event ('register-entity').
     * 
     * @throws An error if the entity is already registered.
     */
    public registerEntity(entityName: string, entityBody: IEntityBody): void {
        this._registerEntity('register-entity', entityName, entityBody);
    }

    /**
     * Silently registers an entity for the compilation.
     * Dispatches an event ('register-entity-silently').
     * 
     * @throws An error if the entity is already registered.
     */
    public registerEntitySilently(entityName: string, entityBody: IEntityBody): void {
        this._registerEntity('register-entity-silently', entityName, entityBody);
    }

    /**
     * Performs the registation of an entity.
     * 
     * @throws An error if the entity is already registered.
     */
    private _registerEntity(
        eventName: 'register-entity' | 'register-entity-silently',
        entityName: string, entityBody: IEntityBody
    ): void {
        if (this.hasEntity(entityName)) {
            throw new TypeError(`CRITICAL: REGISTRY: ${entityName} is already registered.`);
        }
        this.entities.set(entityName, entityBody);
        const listeners = <Array<TEventListener<'register-entity'>>>this.listeners.get(eventName);
        listeners.forEach(listener => listener(this, entityName, this.getEntityBody(entityName)));
    }

    /**
     * Checks if a specified entity exists in the registry.
     */
    public hasEntity(entityName: string): boolean {
        return this.entities.has(entityName);
    }

    /**
     * Returns a deep copy of a body of an entity by its name.
     * The deep copy can be safely modified without any risks.
     */
    public getEntityBody(entityName: string): TDeepMutable<IEntityBody> {
        const originalEntityBody = this.entities.get(entityName);
        if (originalEntityBody) {
            return <TDeepMutable<IEntityBody>>JSON.parse(JSON.stringify(originalEntityBody));
        }
        throw new TypeError(`CRITICAL: REGISTRY: Entity ${entityName} does not exist.`);
    }

    /**
     * Dispatches an event ('register-output-code-lines').
     */
    public registerOutputCodeLines(entityName: string, outputCodeLines: Array<string>): void {
        const listeners = <Array<TEventListener<'register-output-code-lines'>>>this.listeners.get('register-output-code-lines');
        listeners.forEach(listener => listener(this, entityName, outputCodeLines));
    }

}
