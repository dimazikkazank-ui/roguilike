import { clamp } from "./utils.js";
import {
  DIFFICULTY_ENEMIES_FACTOR,
  DIFFICULTY_ITEMS_FACTOR,
  DIFFICULTY_DAMAGE_LOW_THRESHOLD,
  DIFFICULTY_DAMAGE_MID_THRESHOLD,
  DIFFICULTY_DAMAGE_LOW_SCORE,
  DIFFICULTY_DAMAGE_MID_SCORE,
  DIFFICULTY_DAMAGE_HIGH_SCORE,
  DIFFICULTY_SCORE_MIN,
  DIFFICULTY_SCORE_MAX,
  DIFFICULTY_STAT_MULTIPLIER_MIN,
  DIFFICULTY_STAT_MULTIPLIER_MAX,
  DIFFICULTY_SPAWN_MULTIPLIER_MIN,
  DIFFICULTY_SPAWN_MULTIPLIER_MAX,
  DIFFICULTY_ITEM_MULTIPLIER_MIN,
  DIFFICULTY_ITEM_MULTIPLIER_MAX,
  DIFFICULTY_STAT_MULTIPLIER_FACTOR,
  DIFFICULTY_SPAWN_MULTIPLIER_FACTOR,
  DIFFICULTY_ITEM_MULTIPLIER_FACTOR,
  EASY_MODE_THRESHOLD,
  HARD_MODE_THRESHOLD,
} from "./constants.js";

export class Difficulty {
  constructor() {
    this.resetLevelMetrics();
    this.global = {
      totalRuns: 0,
      totalEnemiesDefeated: 0,
      totalDamageTaken: 0,
    };
  }

  resetLevelMetrics() {
    this.levelMetrics = {
      enemiesKilled: 0,
      damageTaken: 0,
      itemsUsed: 0,
      startTime: Date.now(),
    };
  }

  observeCombatEvent(event) {
    if (!event || !event.type) return;
    const m = this.levelMetrics;
    switch (event.type) {
      case "enemyKilled":
        m.enemiesKilled += event.value || 1;
        this.global.totalEnemiesDefeated += event.value || 1;
        break;
      case "damageTaken":
        m.damageTaken += event.value || 0;
        this.global.totalDamageTaken += event.value || 0;
        break;
      case "itemUsed":
        m.itemsUsed += event.value || 1;
        break;
      case "levelComplete":
        // Could record elapsed time
        break;
      default:
        break;
    }
  }

  // Compute modifiers for next level
  adjustForNextLevel() {
    const m = this.levelMetrics;
    // Basic normalized metrics
    const enemies = m.enemiesKilled || 0;
    const dmg = m.damageTaken || 0;
    const items = m.itemsUsed || 0;

    // compute a simple score: more enemies killed and less damage => tougher
    const score = clamp(
      enemies * DIFFICULTY_ENEMIES_FACTOR +
        (items ? items * DIFFICULTY_ITEMS_FACTOR : 0) +
        (dmg < DIFFICULTY_DAMAGE_LOW_THRESHOLD
          ? DIFFICULTY_DAMAGE_LOW_SCORE
          : dmg < DIFFICULTY_DAMAGE_MID_THRESHOLD
          ? DIFFICULTY_DAMAGE_MID_SCORE
          : DIFFICULTY_DAMAGE_HIGH_SCORE),
      DIFFICULTY_SCORE_MIN,
      DIFFICULTY_SCORE_MAX
    );

    const enemyStatMultiplier = clamp(
      1 + (score - 0.5) * DIFFICULTY_STAT_MULTIPLIER_FACTOR,
      DIFFICULTY_STAT_MULTIPLIER_MIN,
      DIFFICULTY_STAT_MULTIPLIER_MAX
    );
    const spawnCountModifier = clamp(
      1 + (score - 0.5) * DIFFICULTY_SPAWN_MULTIPLIER_FACTOR,
      DIFFICULTY_SPAWN_MULTIPLIER_MIN,
      DIFFICULTY_SPAWN_MULTIPLIER_MAX
    );
    const itemSpawnModifier = clamp(
      1 - (score - 0.5) * DIFFICULTY_ITEM_MULTIPLIER_FACTOR,
      DIFFICULTY_ITEM_MULTIPLIER_MIN,
      DIFFICULTY_ITEM_MULTIPLIER_MAX
    );

    const easyMode = score < EASY_MODE_THRESHOLD;
    const hardMode = score > HARD_MODE_THRESHOLD;

    return {
      easyMode,
      hardMode,
      modifiers: {
        enemyStatMultiplier,
        spawnCountModifier,
        itemSpawnModifier,
      },
    };
  }
}

export default Difficulty;
