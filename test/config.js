"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
const c = (0, index_1.loadConfig)('./config');
console.log(c);
// {
//     'REDIS.HOST_NAME': 'string',
//     'REDIS.PORT': 'number',
//     'REDIS.SOCKET.TEST': 'string[]',
//     'REDIS.SOCKET.B': 'boolean',
//     'FAT.A': 'string',
//     'FAT.B': 'string'
// }
