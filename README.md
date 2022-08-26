# oneconf
Easily define and load environment variables via a simple type declaration.

The package uses `dotenv` to load environment variables from the `.env` file as well.

## Usage
The package provides a single function which loads in environment variables based on the `Config` type declared in the file located at `path`.

`function loadConfig<T>(path: string): T;`

```typescript
// config.ts
export type Config = {
    production: boolean;
    redis: {
        hostName: string;
        port: number;
    },
    appBaseUrl: string;
}
```

```
// .env
PRODUCTION=false
REDIS.HOST_NAME=redis://localhost
REDIS.PORT=6379
APP_BASE_URL=http://localhost:3000
```

```typescript
// index.ts
import {loadConfig} from "oneconf";
import {Config} from "./path/to/config"

const config = loadConfig<Config>('./path/to/config.ts')
```
Which yields the following config object:
```typescript
const config: Config = {
    production: false,
    redis: {
        hostName: 'redis://localhost',
        port: 6379,
    },
    appBaseUrl: 'http://localhost:3000'
}
```

Available types for config keys are `string`, `boolean`, and `number` currently.