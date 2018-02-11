# Istrolid Javascript AI API
This is an javascript api for istrolid ai

## How to use
Call `r26Ai.addAiRule(rule)` to add an ai rule.

A rule should be an object that has a function `filter`, a
class `ai` with a function `run` in it, and a function `build`.

`filter` check whether this rule should be added to the unit,
class `ai` is instantized (new'd) and add to every units that matches
the filter.

The `ai` object should have a run method. It is called every 30 ticks.
In `run`, you can call `order.findThings()` to get your targets
and maybe use functions in `movement.*` to get where you want to go, or just
use the position of the targets you have to call functions in `order.*`
to give orders.

`build` is called every 60 ticks, you can use `build.buildUnit()` to
build units.

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
     build: function() {
         build.buildUnit(1, 1);
     }
 });
```

Look at other js files for the actual use
