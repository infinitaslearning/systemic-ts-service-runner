# systemic-ts-service-runner

Runs [systemic-ts](https://www.npmjs.com/package/systemic-ts) systems

## TL;DR

```typescript
import { systemic } from 'systemic-ts';
import { runner } from 'systemic-ts-service-runner';

const system = systemic()
  .add('config', initConfig(), { scoped: true })
  .add('logger', initLogger()).dependsOn('config')
  .add('service', initService()).dependsOn('config', 'logger');

const { logger } = await runner(system).start();
logger.info('Service started');
```

## Installation

```bash
npm install systemic-ts-service-runner
```

## Usage

```typescript
import { runner } from 'systemic-ts-service-runner';
import system from './system';
import emergencyLogger from './emergencyLogger';

runner(system, { logger: emergencyLogger }).start().then(components => {
    // Do something with the components
});
```

or with top level await:

```typescript
import { runner } from 'systemic-ts-service-runner';
import system from './system';
import emergencyLogger from './emergencyLogger';

const components = await runner(system, { logger: emergencyLogger }).start();
// Do something with the components
```
