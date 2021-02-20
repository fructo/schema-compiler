'use strict';

import { IPropertyBody } from './IPropertyBody.js';


export interface IEntityBody {
    readonly types: Array<'interface' | 'class'>;
    readonly inherits?: Array<string>;
    readonly docs?: Array<string>;
    readonly properties?: Record<string, IPropertyBody> | Array<string>;
}
