# Istrolid Javascript AI API
This is an javascript api for istrolid ai

## How to use
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

### `R26Ai`

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

#### `build.buildUnit(amt, priority)`

Fields `amt` number of units  if `priority` is high enough

### `order`

#### `order.startOrdering(unit)`

All orders will be applied to the unit passed to `unit`

#### `order.stopOrdering()`

Orders will not be applied to the unit selected in `order.startOrdering(unit)` unless `order.startOrdering(unit)` gets called again

#### `order.move(des)`

Move a unit to pos, an array like: [x, y]

[0, 0] moves unit to the center of the screen

# Installation

1. Get Istrolid on Steam
2. Go to you steam folder, and go to steamapps/common/istrolid/resources
3. Extract app.asar to a folder app however you like. I recomend using [this](https://github.com/electron/asar)
4. Create 2 Javascript files in the JS folder.
5. Copy the code from the r26Ai.js file into one, and reference both in game.html
6. Write your AI in the other file!
