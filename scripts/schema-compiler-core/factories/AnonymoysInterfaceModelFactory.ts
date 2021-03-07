'use strict';

import { InterfaceModelsFactory } from './InterfaceModelsFactory.js';
import { InterfaceModel } from '../models/InterfaceModel.js';


export class AnonymousInterfaceModelsFactory extends InterfaceModelsFactory {

    private nextInterfaceIndex = 0;

    public fromModelSchema(schema: unknown): InterfaceModel {
        const anonymousInterfaceName = this.generateAnonymousInterfaceName();
        return super.fromModelSchema(anonymousInterfaceName, schema) as InterfaceModel;
    }

    private generateAnonymousInterfaceName(): string {
        return `IAnonymousInterface${this.nextInterfaceIndex++}`;
    }

}
