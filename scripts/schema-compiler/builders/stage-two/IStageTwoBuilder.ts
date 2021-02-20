'use strict';

export interface IStageTwoBuilder {

    /**
     * @returns TypeScript lines.
     */
    buildSourceCode(): Array<string>;

}
