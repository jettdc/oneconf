import {loadConfig} from "../src/index";

export type Config = {
    redis: {
        hostName: string;
        port: number;
        socket: {
            test: string;
            testBoolean: boolean;
        }
    },
    fat: Fatty;
}

type Fatty = {
    a: string;
    b: string;
}

const c = loadConfig<Config>('./config')

console.log(c)

// {
//     'REDIS.HOST_NAME': 'string',
//     'REDIS.PORT': 'number',
//     'REDIS.SOCKET.TEST': 'string[]',
//     'REDIS.SOCKET.B': 'boolean',
//     'FAT.A': 'string',
//     'FAT.B': 'string'
// }
