'use strict';

import { ISchema } from '../../schema-compiler-core/compiler/schema/ISchema.js';


export class SchemaFileReader {

    public async readSchema(filePath: string): Promise<ISchema> {
        const jsonFileText = await Deno.readTextFile(filePath);
        const schema = <ISchema>JSON.parse(jsonFileText);
        return schema;
    }

}
