import * as migration_20251205_041519 from './20251205_041519';
import * as migration_20251207_134708 from './20251207_134708';

export const migrations = [
  {
    up: migration_20251205_041519.up,
    down: migration_20251205_041519.down,
    name: '20251205_041519',
  },
  {
    up: migration_20251207_134708.up,
    down: migration_20251207_134708.down,
    name: '20251207_134708'
  },
];
