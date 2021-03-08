'use strict';

export type TMutable<T> = { -readonly [P in keyof T]: T[P] };


/**
 * @sealed
 */
export abstract class TypeUtil {

    /**
     * Returns true if an object is an array.
     * 
     * @param obj - An object to be checked.
     */
    public static isArray(obj: unknown): boolean {
        return typeof obj === 'object' && obj !== null && obj.constructor.name === 'Array';
    }

    /**
     * Returns true if an object is a dictionary.
     * 
     * @param obj - An object to be checked.
     */
    public static isDictionary(obj: unknown): boolean {
        return typeof obj === 'object' && obj !== null && obj.constructor.name === 'Object';
    }

    /**
     * Returns true if an object is a string.
     * 
     * @param obj - An object to be checked.
     */
    public static isString(obj: unknown): boolean {
        return typeof obj === 'string';
    }

}
