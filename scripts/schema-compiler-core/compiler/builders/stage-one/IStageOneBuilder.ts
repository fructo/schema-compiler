'use strict';

import { IEntityBody } from '../../schema/IEntityBody.js';


export interface IStageOneBuilder {

    /**
     * Constructed by {@link IStageOneBuilder.build} new merged entity.
     */
    builtEntity?: [string, IEntityBody];

    build(): [string, IEntityBody];

}
