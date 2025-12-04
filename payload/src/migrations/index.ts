import * as migration_20251204_071934 from './20251204_071934';

export const migrations = [
  {
    up: migration_20251204_071934.up,
    down: migration_20251204_071934.down,
    name: '20251204_071934'
  },
];
