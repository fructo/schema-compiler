'use strict';


export class SchemaFileReader {

    public async readSchema(filePath: string): Promise<Record<string, unknown>> {
        const jsonFileText = await Deno.readTextFile(filePath);
        const schema = <Record<string, unknown>>JSON.parse(jsonFileText);
        return schema;
    }

}
