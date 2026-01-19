# Project Team 01 — JavaScript_Bootcamp

**Summary:**
In this team project, you'll develop a console-based roguelike game using JavaScript and the blessed library (a JavaScript adaptation of curses) — inspired by the classic 1980 game Rogue.

💡 [Click here](https://new.oprosso.net/p/4cb31ec3f47a4596bc758ea1861fb624) **to share feedback on this project**. It's anonymous and helps us improve the course.
We recommend completing the survey right after you finish the project.

## Contents
1. [Chapter I](#chapter-i)
   * [Instructions](#instructions)
2. [Chapter II](#chapter-ii)
   * [General Information](#general-information)
     * [Rogue 1980](#rogue-1980)
     * [Application Architecture](#application-architecture)
3. [Chapter III](#chapter-iii)
   * [Task 0. How Did We Get Here?](#task-0-how-did-we-get-here)
   * [Task 1. The Essential Essences of the Game](#task-1-the-essential-essences-of-the-game)
   * [Task 2. Energetic Gameplay](#task-2-energetic-gameplay)
   * [Task 3. Procedural World](#task-3-procedural-world)
   * [Task 4. Cozy 2D](#task-4-cozy-2d)
   * [Task 5. Cartridge with a Battery](#task-5-cartridge-with-a-battery)
   * [Task 6. Extra: You Shall Not Pass!](#task-6-extra-you-shall-not-pass)
   * [Task 7. Extra: The Art of Balance](#task-7-extra-the-art-of-balance)
   * [Task 8. Extra: Imagine You Are a Table](#task-8-extra-imagine-you-are-a-table)
   * [Task 9. Extra: Full 3D](#task-9-extra-full-3d)

## Chapter I
## Instructions

1. Throughout the course, you'll often feel uncertain and lacking information — that's part of the experience.
Remember, the repository and Google are always there for you. So are your peers and Rocket.Chat. Collaborate. Explore. Use common sense. Don't be afraid to make mistakes.
2. Be critical of your sources. Cross-check. Think. Analyze. Compare.
3. Read tasks carefully — and re-read them again.
4. Examples deserve attention too. They might include things not explicitly described in the task itself.
5. You may encounter inconsistencies — when something in a task or example contradicts what you thought you knew. Try to figure it out. If you can't — write down your question and work through it as you go. Don't leave questions unresolved.
6. If something seems unclear or impossible — it probably just feels that way. Break it down. Most parts will make sense on their own.
7. You'll come across many different kinds of tasks. The bonus ones are for the curious and meticulous. They're harder and optional — but completing them will give you extra knowledge and experience.
8. Don't try to game the system or your peers — you'd only be cheating yourself.
9. Got a question? Ask the person to your right. Didn't help? Ask the one to your left.
10. When you ask for help, always make sure you understand the why, how, and what for. Otherwise the help won't mean much.
11. Always push to the develop branch only! The master branch will be ignored. Work inside the src directory.
12. Your directory should not contain any files other than those specified in the tasks.

## Chapter II
## General Information

### Rogue 1980

![RogueMap](misc/images/rogue-map-2.png)

![Dungeon](misc/images/dungeon.png)

Rogue is a computer game developed in 1980 by Epyx. Its central theme is dungeon exploration.
The game was hugely popular on university Unix systems in the early 1980s and gave rise to an entire genre known as roguelike games.

In Rogue, you play a classic fantasy adventurer.
The game begins on the top level of an uncharted dungeon full of monsters and treasure.
As you descend into the randomly generated levels, the enemies become stronger and the challenge increases.

Each dungeon level consists of a 3x3 grid of rooms or dead-end hallways, sometimes ending in a room.
Later versions also include "mazes" — twisty corridors with dead ends.

Unlike most adventure games of that time, Rogue used procedural generation, making each playthrough unique and unpredictable — equally so for beginners and seasoned players.

The player has three core stats: health, strength, and experience.
All three can increase by using potions and scrolls, or decrease by stepping into traps or reading cursed scrolls.
A wide range of magical items — potions, scrolls, wands, weapons, armor, and food — creates a highly varied gameplay experience with many ways to win or lose.

### Application Architecture

When building applications that include data, business logic, and user interfaces, a multilayered architecture is commonly used.
A classic and widely adopted structure might include the following layers:
* Presentation layer (View, UI)
* Business logic layer (Domain)
* Data access layer (Data Source)

Separating logic between the domain and presentation layers helps structure the code more clearly and maintain components with different levels of stability.

The **presentation** layer should include the code responsible for handling UI rendering and user input.
This is where interactions with the blessed library (the JavaScript version of curses) and the domain layer should be handled.

The **domain** layer contains pure business logic that is framework-independent.
In this project, that includes defining the logic for game entities such as the game itself, the player, enemies, levels, the map, and more —
as well as the mechanics of the gameplay.

For example, the player's location and the logic that updates their position and state should be implemented in the domain layer,
and only passed to the *presentation* layer for rendering.

In line with Clean Architecture, the business logic layer must not depend on other layers.
To achieve this, you'll need to apply the dependency inversion principle.

To facilitate communication between layers, you can also implement a variation of the **MVC** pattern family (e.g., **MVP**, **MVVM**, **MVPVM**).
These patterns link **Model** (application logic) and **View** (UI) through dedicated binding layers like **Controller**, **Presenter**, or **ViewModel**.

Different languages and frameworks have their own conventions for organizing these layers,
but the core idea remains the same.

The **data layer** in your application will be responsible for:
* Storing the history of past game sessions
* Managing data related to the current game state

## Chapter III

## Task 0. How Did We Get Here?

Your game application must:
* Be written in JavaScript ES14
* Use a console interface built with the blessed library
* Be fully keyboard-controlled
* Follow a clean, layered architecture
* Implement the logic of the classic 1980 game Rogue, with some simplifications
  (specific gameplay requirements are detailed in the next sections)
* Where mechanics are unspecified, you may refer to the original 1980 game for guidance

## Task 1. The Essential Essences of the Game

The game must follow the layered architecture described in the "Application Architecture" section.
The layers should include: domain/gameplay, rendering, and data management.

Start by implementing the domain layer, which defines the core game entities.
Here's a suggested (but not exhaustive) list of entities and base attributes:
* GameSession
* Level
* Room
* Corridor
* Character:
  * maxHealth
  * currentHealth
  * agility
  * strength
  * equippedWeapon
* Inventory
* Enemy:
  * type
  * health
  * agility
  * strength
  * hostility
* Item:
  * type
  * subtype
  * health (amount restored by food)
  * maxHealthBoost (for scrolls and potions, also increases current health)
  * agilityBoost (from scrolls and potions)
  * strengthBoost (from scrolls, potions, and weapons)
  * value (for treasures)

## Task 2. Energetic Gameplay

Implement the gameplay logic in the **domain layer**, independent of the **presentation** and **data layers**.

### Gameplay Logic:
* The game consists of 21 dungeon levels
* Each level must include 9 rooms, connected by corridors
  Any room should be reachable from any other via the corridors
* Enemies and items may appear in any room except the starting room
* The player controls a character who can move, interact with items, and fight enemies
* The goal is to find the exit on each level and progress downward through all 21 levels
* On each level, the player starts at a random position in the starting room, which is guaranteed to be free of enemies
* When the player dies, the game state resets
* With each new level enemy count and difficulty increase. helpful items become rarer, more treasures drop from defeated enemies
* After each game (win or loss), the player's result is saved in a scoreboard, including the deepest level reached, the amount of treasure collected. The scoreboard must be sorted by treasure amount
* The game is turn-based — actions only happen after the player acts.

### Character Logic:
* Health tracks the player's current HP. If HP drops to 0 or below, the game ends
* Max health determines how much can be restored by food
* Agility affects hit chance — both for the player and enemies
* Strength determines base damage (without a weapon) and modifiers in weapon-based damage calculations
* Defeating enemies grants treasure, based on their difficulty
* The player can pick up items and store them in an inventory
* Using items can permanently or temporarily modify player stats
* Reaching a level's exit automatically moves the player to the next level

### Enemy Logic:
Each enemy has health, agility, strength (like the player), and hostility — the detection radius that triggers pursuit

Enemy types:
1. Zombie (green z): low agility, medium strength & hostility, high health.
2. Vampire (red v): high agility, hostility, and health, medium strength. Drains max health from the player on hit. First attack against it always misses.
3. Ghost (white g): high agility, low strength, hostility, and health, teleports randomly, becomes invisible unless in combat.
4. Ogre (yellow O): moves two tiles per turn, very high strength and health, rests for one turn after attacking. Always counterattacks. Low agility, medium hostility.
5. Snake Mage (white s): very high agility. Moves diagonally, constantly switching directions. Attacks have a chance to put the player to sleep for 1 turn. High hostility.

* Each enemy type has its own movement pattern
* Once pursuit starts, enemies follow the shortest path to the player
* If an enemy should chase the player but can't reach them, it continues to wander randomly

### Environment Logic:
* Each item type has unique behavior:
  * Treasure: has value, affects final score; only drops from defeated enemies
  * Food: restores health
  * Potions: temporarily boost agility, strength, or max health
  * Scrolls: permanently boost agility, strength, or max health
  * Weapons: add strength; using one changes the damage formula
* Increasing max health also increases current health by the same amount
* If a potion's effect wears off and health drops to 0 or less, the player's health must be set to a minimum survivable value
* The inventory holds all item types.
* When a character steps on an item, it should be automatically added to the backpack if there's space available. Each item type can be stored up to 9 units, except for treasures, which are collected in a single shared slot.
* Food, potions, scrolls are consumed on use
* Switching weapons drops the old one to a nearby tile

### Dungeon Logic:
* Difficulty increases with depth
* Each level consists of:
  * Rooms, connected by corridors
  * Enemies and items are distributed throughout
  * Player and enemies can move between rooms
  * A guaranteed exit to the next level
* Reaching the exit on the final level ends the game

### Combat Logic:
Combat is turn-based and initiated by moving toward an enemy.
Each turn consists of three phases:
1. Hit check — a random roll based on attacker's and defender's agility
2. Damage calculation — based on strength and modifiers (e.g., weapon)
3. Damage application — subtracted from health; death occurs at ≤ 0

* Upon defeat, enemies drop a random amount of treasure, based on their hostility, strength, agility and health.

## Task 3. Procedural World

Implement a level generation module in the **domain** layer.

* Each level must be logically divided into 9 sectors, each containing a randomly generated room with random size and position
* Rooms are connected via randomly generated corridors. Corridors have geometry, can be walked through, and must be generated and stored as coordinate paths
* The generation algorithm must ensure that the resulting graph of rooms is connected and error-free
* One room is marked as the starting room, and another as the exit room. The player spawns in the starting room. The exit room contains a block that teleports the player to the next level when touched.
* An example level generation implementation is available in the code-samples folder

## Task 4. Cozy 2D

Implement game rendering using the blessed library in the **presentation** layer, relying on the necessary **domain** entities.

### Rendering
* Environment:
  * Render walls, floors, doorways, and connecting corridors
* Actors:
  * Render the player, enemies, and collectible items
* UI:
  * Render the game interface, including:
    * Status panel
    * Inventory panel
    * Simple in-game menu
* Fog of war — the rendered scene depends on the game state:
  * Unexplored rooms and corridors are not visible
  * Explored rooms not currently occupied by the player show walls only
  * The player's current room shows walls, floor, actors, and items
  * Adjacent rooms visible from the corridor show only parts in the line of sight, calculated using Ray Casting and Bresenham's line algorithm

A sample rendering implementation is provided in the code-samples folder

### Controls
* Player movement — W, A, S, D
* Inventory actions:
  * Use weapon: h
  * Eat food: j
  * Use potion: k
  * Read scroll: e
* When using any inventory item, display a numbered list (1–9) of that item type and prompt the player to select one
* When choosing a weapon, allow the player to unequip (select 0) instead of dropping it

### Statistics
* Track and display a separate run history view, sorted by treasure collected
* Include the following metrics: total treasure, level reached, enemies defeated, food consumed, potions used, scrolls read, hits dealt and received, tiles traveled.

## Task 5. Cartridge with a Battery

Implement the **datalayer**, responsible for saving and loading game progress to/from a ``.json`` file.

* After completing each level, store:
  * All collected stats
  * Current level index
* Upon restarting the game, if the player chooses to continue, levels must regenerate using saved state
  * All player progress (stats, inventory, location, etc.) must be restored
  * The full game state, including positions and attributes of entities, must be loaded
* Also save cumulative run history
  * When viewing the leaderboard, display the player's best runs, even if they were not completed

## Task 6 (Bonus). You Shall Not Pass!

* Generate doors between rooms and corridors, along with corresponding keys. Implement a colored key system, similar to classic DOOM
* To ensure players aren't locked out of progression, use modified DFS/BFS algorithms to validate key placement and avoid softlocks

## Task 7 (Bonus). The Art of Balance

* Add a system for adaptive difficulty scaling. If the player advances too easily, increase difficulty. If the player struggles, increase helpful item frequency and reduce enemy count/difficulty. For example, if the player frequently loses health, generate more healing items

## Task 8 (Bonus). Imagine You're a Table

* Add a new enemy type: the Mimic (white m). Disguises itself as an item Attributes: high agility, low strength, high health, low hostility.

## Task 9 (Bonus). Full 3D

* Add a 3D rendering mode:
  * Switches the main view to first-person 3D
  * The 2D map remains as a mini-map in the corner
  * Controls adapt:
    * W — move forward
    * S — move backward
    * A — turn left
    * D — turn right
* Use Ray Casting and the blessed library for 3D rendering of rooms and corridors
* Room and tunnel walls should be textured, making movement visually clear

A sample 3D rendering implementation is available in the code-samples folder