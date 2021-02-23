'use strict';

import { IEntityBody } from '../schema/IEntityBody.js';


/**
 * Wraps objects intended for modification.
 */
export type TDeepMutable<T> = { -readonly [K in keyof T]: TDeepMutable<T[K]> };


/**
 * Events that can dispath the compilation registry.
 */
type TEventName =
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
    : never;


export class CompilationRegistry {

    /**
     * Listeners of registry events.
     */
    private readonly listeners = new Map<TEventName, Array<TEventListener<TEventName>>>();

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
