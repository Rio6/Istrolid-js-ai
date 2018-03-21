# Istrolid Javascript AI API
This is a library for coding Istrolid AI in Javascript

## Contents

[Crash Course](../readme.md#14)

[Example]()

[Documentation]()

[Installation]()

## Crash Course
Call `r26Ai.addAiRule(rule)` to add an ai rule.

Rule is an object, with 3 properties, `filter`, `ai`, and `build`.

`filter` is a function with the argument `unit`.
It should return true if your rule should be applied to that unit.

`ai` is an object with a `run` function. The run function is called every 30 ticks.
In `run`, you can call `order.findThings()` to get your targets
and maybe use functions in `movement.*` to get where you want to go, or just
use the position of the targets you have to call functions in `order.*`
to give orders.

`build` is called every 60 ticks, you can use `build.buildUnit(quantity, priority)` to
field units.

## Example:
```javascript
 r26Ai.addAiRule({
     filter: function(unit) {
         return unit.name === "BANANA";
     },
     ai: function(unit) {
         this.run = function() {
             order.move([0, 0]);
         };
     },
     build: function(unit) {
         build.buildUnit(1, 1);
     }
 });
```

## Documentation

[`otherSide`]()

[`commander.side`]()

[`r26Ai`]()

[`r26Ai.enabled`]()

[`r26Ai.addAiRule`]()

[`r26Ai.clearAiRule`]()

[`build`]()

[`build.buildUnit`]()

[`order`]()

[`order.move`]()

[`order.follow`]()

[`order.stop`]()

[`order.hold`]()

[`order.unhold`]()

[`order.destruct`]()

[`order.findThings`]()

[`order.getUnitOrders`]()

[`condition`]()

[`condition.inRangeDps`]()

[`condition.inRangeWeapon`]()

[`condition.hasWeapon`]()

[`condition.isBusy`]()

[`condition.isMyUnit`]()

[`condition.isEnemySide`]()

[`movement`]()

[`movement.spread`]()

[`movement.inRange`]()

[`movement.fleeRange`]()

[`movement.avoidShots`]()


#### `otherSide(side)`

returns opposite side passed `side` (returns `"beta"` if passed `"alpha"`, and returns `"alpha"` if passed `"beta"`)

#### `commander.side`

variable for which side you are on in a game, defined to `"alpha"`, `"beta"`, `"spectators"`, or `"neutral"`

### `r26Ai`

Basic commands necessary to start work on AI

#### `r26Ai.enabled`

Set this equal to true at the end if you want to use the AI

#### `r26Ai.addAiRule(info)`

Adds an AI rule

Info is an object with 3 properties

1. `filter(unit)` Filter is a function that takes an argument unit. It should return true or false based on wheher you want to apply your rule to that unit

2. `ai(unit)` AI is a function that contains the function `this.run()` Run is where you put your AI code

3. `build(unit)` Build is where you put the code to spawn in units.

#### `r26Ai.clearAiRule()`

Deletes all the AI rules

### `build`

These functions are used for fielding units

#### `build.buildUnit(amt, priority)`

Fields `amt` number of units  if `priority` is high enough

### `order`

These functions execute orders

#### `order.move(des)`

Move a unit to pos, an array like: [x, y]

[0, 0] moves unit to the center of the screen

#### `order.follow(thing)`

Makes a ship follow another `thing`. `thing` can be any object, a command point, a ship, a bullet, etc.

#### `order.stop()`

Makes a unit stop. Same as pressing X in game

#### `order.hold()`

Same as pressing Z, but won't unhold.

#### `order.unhold()`

Opposite of `order.hold()`, It unholds but doesn't hold.

#### `order.destruct()`

Make a unit self destruct

#### `order.findThings(range, unit, pos)`

Get an array of units, that are within the range `range` (pass -1 if you want to check everywhere) and cause the function `unit` to return true when its passed into it.

The ships are sorted by the distance to `pos`, an array. The default to `pos` is the unit commanding.

#### `order.getUnitOrders(unit)`

Returns what order is being executed on the unit passed to `unit`

### `condition`

These functions check if things are true or false

#### `condition.inRangeDps(pos, side, dps)`

Checks if a posistion, `pos` [x, y], is in a DPS zone of `dps` or higher

`side` is whether its friendly or enemy dps. Either `"alpha"` or `"beta"`

#### `condition.inRangeWeapon(pos, side, check)`

`pos` Position to check (`[x, y]`)
`side` Which side has the weapon
`check` Function to return true if passed the weapon you want to check

#### `condition.hasWeapon(unit, check)`

`unit` Unit to check
`check` Function to return true if passed the weapon you want to check

#### `condition.isBusy(unit)`

Checks whether unit `unit` is execution any orders

#### `condition.isMyUnit(unit)`

Checks whether unit `unit` is owned by you

#### `condition.isEnemySide(unit)`

Checks whether a unit is owned by the enemy

### `movement`

These function return `[x, y]` values to use in `order.move(pos)`

#### `movement.spread(targets, findNew)`

Returns a position from a list so that all units get different points.

`targets` A list of targets to spread to
`findNew`

#### `movement.inRange(pos, rad)`

Returns closest position within a circle to the unit

`pos` Position of the circle `[x, y]`
`rad` Radius of the circle

#### `movement.fleeRange(pos, rad)`

Returns closest position outside a circle to the unit

`pos` Position of the circle `[x, y]`
`rad` Radius of the circle

#### `movement.avoidShots(damage, check)`

`damage` The damage value of the shot to avoid
`check` A function to check whether you want to avoid a shot

## Installation

1. Get Istrolid on Steam
2. Go to you steam folder, and go to steamapps/common/istrolid/resources
3. Extract app.asar to a folder app however you like. I recomend using [this](https://github.com/electron/asar)
4. Create 2 Javascript files in the JS folder.
5. Copy the code from the r26Ai.js file into one, and reference both in game.html
6. Write your AI in the other file!
