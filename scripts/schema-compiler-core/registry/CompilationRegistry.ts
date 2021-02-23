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


/**
 * Argument for {@link CompilationRegistryEventsManager.dispatchEvent}.
 */
type TEvent<T extends TEventName> =
    T extends 'register-entity' | 'register-entity-silently' ? {
        originalEntityName: string,
        originalEntityBodyDeepMutable: TDeepMutable<IEntityBody>
    } : T extends 'register-output-code-lines' ? {
        originalEntityName: string,
        outputCodeLines: Array<string>
    } : never;


abstract class CompilationRegistryEventsManager {

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
     * Passes an event to the listeners.
     * 
     * @throws An error if the event name is unknown.
     */
    protected dispatchEvent<T extends TEventName>(
        eventName: T,
        event: TEvent<T>
    ): void {
        const listeners = this.listeners.get(eventName);
        if (listeners) {
            if (['register-entity', 'register-entity-silently'].includes(eventName)) {
                const typedEvent = event as TEvent<'register-entity'>;
                listeners.forEach(listener => {
                    const typedListener = listener as TEventListener<'register-entity'>;
                    typedListener(
                        this as unknown as CompilationRegistry,
                        typedEvent.originalEntityName,
                        typedEvent.originalEntityBodyDeepMutable
                    );
                });
            } else if (['register-output-code-lines'].includes(eventName)) {
                const typedEvent = event as TEvent<'register-output-code-lines'>;
                listeners.forEach(listener => {
                    const typedListener = listener as TEventListener<'register-output-code-lines'>;
                    typedListener(
                        this as unknown as CompilationRegistry,
                        typedEvent.originalEntityName,
                        typedEvent.outputCodeLines
                    );
                });
            } else {
                throw new TypeError(`CRITICAL: REGISTRY: Event ${eventName} is unknown.`);
            }
        } else {
            console.log(`WARNING: REGISTRY: Event ${eventName} does not have a listener.`);
        }
    }

}


export class CompilationRegistry extends CompilationRegistryEventsManager {

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
    private _registerEntity(eventName: TEventName, entityName: string, entityBody: IEntityBody): void {
        if (this.hasEntity(entityName)) {
            throw new TypeError(`CRITICAL: REGISTRY: ${entityName} is already registered.`);
        }
        this.entities.set(entityName, entityBody);
        this.dispatchEvent(eventName, {
            originalEntityName: entityName,
            originalEntityBodyDeepMutable: this.getEntityBody(entityName)
        });
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
        this.dispatchEvent('register-output-code-lines', {
            originalEntityName: entityName,
            outputCodeLines
        });
    }

}
