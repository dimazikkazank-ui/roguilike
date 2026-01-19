// Game Constants - Centralized definitions for all magic numbers

// ================== PLAYER STATS ==================
export const PLAYER_BASE_MAX_HEALTH = 500;
export const PLAYER_BASE_STRENGTH = 16;
export const PLAYER_BASE_AGILITY = 12;
export const PLAYER_BASE_DAMAGE = 15; // baseDamage = 15 + strength

// ================== HIT CHANCE ==================
export const HIT_CHANCE_BASE = 50; // Base hit chance percentage
export const HIT_CHANCE_AGILITY_MODIFIER = 0.3; // (attacking.agility - defending.agility - 50) * modifier
export const HIT_CHANCE_BASE_CHECK = 70; // checkHit base chance
export const HIT_CHANCE_MIN = 5; // Minimum hit chance
export const HIT_CHANCE_MAX = 95; // Maximum hit chance
export const HIT_CHANCE_AGILITY_CAP = 95; // Player getHitChance cap

// ================== BLOCKING ==================
export const BLOCK_DAMAGE_REDUCTION = 0.1; // Blocked damage is reduced to 10%
export const BLOCK_MINIMUM_DAMAGE = 1; // Minimum damage when blocking
export const BLOCK_AGILITY_REDUCTION = 1; // Enemy agility reduction per successful block

// ================== ENEMY STATS ==================
export const ENEMY_SYMBOLS = ["z", "v", "g", "O", "s", "m"];
export const ENEMY_SYMBOL_ZOMBIE = "z";
export const ENEMY_SYMBOL_VAMPIRE = "v";
export const ENEMY_SYMBOL_GHOST = "g";
export const ENEMY_SYMBOL_OGRE = "O";
export const ENEMY_SYMBOL_SNAKE = "s";
export const ENEMY_SYMBOL_MIMIC = "m";

// Zombie stats
export const ZOMBIE_HOSTILITY = 4;
export const ZOMBIE_AGILITY = 25;
export const ZOMBIE_STRENGTH = 125;
export const ZOMBIE_HEALTH = 50;

// Vampire stats
export const VAMPIRE_HOSTILITY = 6;
export const VAMPIRE_AGILITY = 75;
export const VAMPIRE_STRENGTH = 125;
export const VAMPIRE_HEALTH = 50;

// Ghost stats
export const GHOST_HOSTILITY = 2;
export const GHOST_AGILITY = 75;
export const GHOST_STRENGTH = 25;
export const GHOST_HEALTH = 75;

// Ogre stats
export const OGRE_HOSTILITY = 4;
export const OGRE_AGILITY = 25;
export const OGRE_STRENGTH = 100;
export const OGRE_HEALTH = 150;

// Snake stats
export const SNAKE_HOSTILITY = 6;
export const SNAKE_AGILITY = 100;
export const SNAKE_STRENGTH = 30;
export const SNAKE_HEALTH = 100;

// Mimic stats
export const MIMIC_HOSTILITY = 1;
export const MIMIC_AGILITY = 45;
export const MIMIC_STRENGTH = 50;
export const MIMIC_HEALTH = 100;

// Default enemy stats
export const DEFAULT_ENEMY_HOSTILITY = 4;
export const DEFAULT_ENEMY_AGILITY = 10;
export const DEFAULT_ENEMY_STRENGTH = 10;
export const DEFAULT_ENEMY_HEALTH = 100;

// ================== ENEMY REWARD CALCULATION ==================
export const REWARD_DIFFICULTY_SCORE_HEALTH_FACTOR = 0.3;
export const REWARD_DIFFICULTY_SCORE_STRENGTH_FACTOR = 0.5;
export const REWARD_DIFFICULTY_SCORE_AGILITY_FACTOR = 0.2;
export const REWARD_TYPE_BONUS_OGRE = 1.5;
export const REWARD_TYPE_BONUS_VAMPIRE = 1.4;
export const REWARD_TYPE_BONUS_SNAKE = 1.2;
export const REWARD_MINIMUM = 10;
export const REWARD_ROUNDING_DIVISOR = 5;

// ================== ENEMY SPECIAL ATTACKS ==================
export const OGRE_STRIKE_DAMAGE_REDUCTION = 0.3;
export const OGRE_STRIKE_BASE_DAMAGE = 50; // (strength - 50) * REDUCTION
export const ZOMBIE_GHOST_DAMAGE_BONUS = 30;
export const VAMPIRE_DAMAGE_HEALTH_RATIO = 10; // damage = maxHealth / 10
export const SNAKE_DAMAGE_BONUS = 30;
export const SNAKE_SLEEP_CHANCE = 15; // percentage

// ================== ROOM GENERATION ==================
export const ROOM_MIN_HEIGHT = 4;
export const ROOM_MAX_HEIGHT = 7;
export const ROOM_MIN_WIDTH = 8;
export const ROOM_MAX_WIDTH = 14;
export const ROOM_BORDER_SIZE = 4; // Height and width added for borders
export const ROOM_PADDING = 2; // Padding inside room border
export const ROOM_GRID_ROWS = 3;
export const ROOM_GRID_COLS = 3;
export const MAX_ROOMS_IN_LEVEL = 9;

// ================== ROOM CONNECTIONS ==================
export const ROOM_HORIZONTAL_NEIGHBOR_OFFSET = 1;
export const ROOM_VERTICAL_NEIGHBOR_OFFSET = 3;

// ================== LEVEL GENERATION ==================
export const LEVEL_COUNT = 21; // Used in depth factor calculation
export const DEPTH_FACTOR_BASE = 1;
export const ITEM_SPAWN_BASE_SKIP_CHANCE = 0.5; // 0% → 50%
export const MAX_SKIP_CHANCE = 0.95;
export const MIN_ITEMS_PER_ROOM = 1;
export const MAX_ITEMS_PER_ROOM = 4;
export const FOOD_REGEN_MAX_PERCENT = 20;
export const AGILITY_INCREASE_MAX_PERCENT = 10;
export const STRENGTH_INCREASE_MAX_PERCENT = 10;

// Enemy count scaling
export const MIN_ENEMIES_PER_ROOM = 1;
export const MAX_ENEMIES_PER_ROOM = 4;
export const ENEMY_COUNT_BASE = 1;
export const ENEMY_COUNT_DEPTH_MULTIPLIER = 2;
export const EASY_MODE_ENEMY_REDUCTION = 1;
export const HARD_MODE_ENEMY_ADDITION = 1;

// Weapon generation
export const WEAPON_COUNT = 5;
export const WEAPON_STRENGTH_MIN = 30;
export const WEAPON_STRENGTH_MAX = 51; // Max is exclusive, so 50 is actual max

// Elixir/Scroll generation
export const ELIXIR_SCROLL_DURATION_MIN = 30;
export const ELIXIR_SCROLL_DURATION_MAX = 61; // Max is exclusive, so 60 is actual max
export const STAT_TYPES_COUNT = 3; // health, agility, strength

// ================== ITEM SYMBOLS ==================
export const ITEM_SYMBOL_FOOD = "♥";
export const ITEM_SYMBOL_ELIXIR = "♦";
export const ITEM_SYMBOL_SCROLL = "¶";
export const ITEM_SYMBOL_WEAPON = "†";
export const ITEM_SYMBOL_TREASURE = "T";
export const ITEM_SYMBOLS = ["♥", "♦", "¶", "†", "T"];

// ================== ROOM SYMBOLS ==================
export const ROOM_SYMBOL_FLOOR = "•";
export const ROOM_SYMBOL_WALL = " ";
export const ROOM_SYMBOL_DOOR = "D";
export const ROOM_SYMBOL_PLAYER = "P";
export const ROOM_SYMBOL_EXIT = ">";

// ================== DIFFICULTY ADJUSTMENT ==================
export const DIFFICULTY_ENEMIES_FACTOR = 0.3;
export const DIFFICULTY_ITEMS_FACTOR = -0.2;
export const DIFFICULTY_DAMAGE_LOW_THRESHOLD = 30;
export const DIFFICULTY_DAMAGE_MID_THRESHOLD = 80;
export const DIFFICULTY_DAMAGE_LOW_SCORE = 0.5;
export const DIFFICULTY_DAMAGE_MID_SCORE = 0;
export const DIFFICULTY_DAMAGE_HIGH_SCORE = -0.5;
export const DIFFICULTY_SCORE_MIN = 0;
export const DIFFICULTY_SCORE_MAX = 2;
export const DIFFICULTY_STAT_MULTIPLIER_MIN = 0.7;
export const DIFFICULTY_STAT_MULTIPLIER_MAX = 1.6;
export const DIFFICULTY_SPAWN_MULTIPLIER_MIN = 0.7;
export const DIFFICULTY_SPAWN_MULTIPLIER_MAX = 1.6;
export const DIFFICULTY_ITEM_MULTIPLIER_MIN = 0.6;
export const DIFFICULTY_ITEM_MULTIPLIER_MAX = 1.4;
export const DIFFICULTY_STAT_MULTIPLIER_FACTOR = 0.6;
export const DIFFICULTY_SPAWN_MULTIPLIER_FACTOR = 0.8;
export const DIFFICULTY_ITEM_MULTIPLIER_FACTOR = 0.6;
export const EASY_MODE_THRESHOLD = 0.3;
export const HARD_MODE_THRESHOLD = 0.8;

// ================== WEAPON STRENGTH CALCULATION ==================
export const WEAPON_STRENGTH_FACTOR = 1; // strengthFactor = player.strength / BASE_STRENGTH

// ================== LEVEL CONNECTION ==================
export const MIN_ROOMS_WITH_CONNECTIONS = 1; // Minimum rooms that should have connections
