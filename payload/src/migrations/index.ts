import * as migration_20251205_041519 from './20251205_041519';

export const migrations = [
  {
    up: migration_20251205_041519.up,
    down: migration_20251205_041519.down,
    name: '20251205_041519'
  },
];
