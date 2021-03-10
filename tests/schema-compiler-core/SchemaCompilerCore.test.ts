'use strict';

import test from 'ava';

import { SchemaCompilerCore } from '@fructo/schema-compiler';


test('dummy', t => {
    new SchemaCompilerCore().compileSchema({
        "TString": {
            "description": "is_string",
            "rule": "typeof value === 'string'",
            "type": "string"
        },
        "TNumber": {
            "description": "is_number",
            "rule": "typeof value === 'number'",
            "type": "number"
        },
        "ISettings": {
            "properties": {
                "host": "TString | '127.0.0.1'",
                "port": "TNumber | 42",
                "uf": {
                    "o": "TString | 10"
                }
            }
        },
        "IMessage": {
            "properties": {
                "header": "(TString | TString) & TString"
            }
        },
        "IMessageSettingsLoad": {
            "ancestors": "IMessage",
            "properties": {
                "header": "'message-settings-load'",
                "settings": "ISettings"
            }
        },
        "MessageFromDaemon": [
            "IMessageSettingsLoad"
        ],
        "Ok": {
            "properties": {
                "MI": "TString"
            }
        }
    });
    t.pass();
});
