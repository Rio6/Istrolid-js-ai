# Istrolid Javascript AI API
This is a library for coding Istrolid AI in Javascript

## Contents

[Crash Course](#crash-course)

[Example](#example)

[Documentation](https://f4tornado.github.io/Istrolid-JS-Ai-Docs/)

[Installation](#installation)

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
 r26Ai.clearAiRule();

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
 
 r26Ai.enabled = true;
```

## Installation

1. Get Istrolid on Steam
2. Go to you steam folder, and go to steamapps/common/istrolid/resources
3. Extract app.asar to a folder app however you like. I recomend using [this](https://github.com/electron/asar)
4. Create 2 Javascript files in the JS folder.
5. Copy the code from the r26Ai.js file into one, and reference both in game.html
6. Write your AI in the other file!
