'use strict';

import { ITreeElement } from '../utils/BinaryExpressionTree.js';


export interface IRegistrableModel extends ITreeElement {

    /**
     * Model name.
     */
    readonly name: string;

}
