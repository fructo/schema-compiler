'use strict';

import { IEntityBody } from './IEntityBody.js';

export interface ISchema {
    [entityName: string]: IEntityBody;
}
