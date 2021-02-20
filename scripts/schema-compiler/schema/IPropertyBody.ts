'use strict';

export interface IPropertyBody {
    readonly types?: Array<Array<string>>;
    readonly default?: unknown;
    readonly docs?: Array<string>;
    readonly keywords?: Array<'optional' | 'writable'>
    readonly example?: unknown;
}
