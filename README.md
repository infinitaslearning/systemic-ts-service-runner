# @ilpt/systemic-ts-service-runner

Runs [@ilpt/systemic-ts](https://www.npmjs.com/package/@ilpt/systemic-ts) systems

## TL;DR

```typescript
import { systemic } from '@ilpt/systemic-ts';
import { runner } from '@ilpt/systemic-ts-service-runner';

const system = systemic()
  .add('config', initConfig(), { scoped: true })
  .add('logger', initLogger()).dependsOn('config')
  .add('service', initService()).dependsOn('config', 'logger');

runner(system).start();
```

## Installation

```bash
npm install @ilpt/systemic-ts-service-runner
```

## Usage

```typescript
import { runner } from '@ilpt/systemic-ts-service-runner';
import system from './system';
import emergencyLogger from './emergencyLogger';

runner(system, { logger: emergencyLogger }).start().then(components => {
    // Do something with the components
});
```

or with top level await:

```typescript
import { runner } from '@ilpt/systemic-ts-service-runner';
import system from './system';
import emergencyLogger from './emergencyLogger';

const components = await runner(system, { logger: emergencyLogger }).start();
// Do something with the components
```
