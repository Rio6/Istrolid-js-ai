# Istrolid Javascript AI API
This is a library for coding Istrolid AI in Javascript

[Documentation](https://Rio6.github.io/Istrolid-js-ai)

## Crash Course
Call `r26Ai.addAiRule(rule)` to add an ai rule.

Rule is an object, with 3 properties, `filter`, `ai`, and `build`.

`filter` is a function with the argument `unit`.
It should return true if your rule should be applied to that unit.

`tick` runs every tick

`ai` is an object with a `run` function. The run function is called every 30 ticks.
In `run`, you can call `order.findThings()` to get your targets
and maybe use functions in `movement.*` to get where you want to go, or just
use the position of the targets you have to call functions in `order.*`
to give orders.

`build` is called every 3 seconds, you can use `build.buildUnit(quantity, priority)` or `build.keepUnits(quantity, priority)` to
field units.

## Example:
A swarm ai
```javascript
// Clear the rule in case there are rules already loaded
// so the rules are not conflicting
r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "BERRY", // You can also use other properties, like unit.spec
    tick: function(unit) {},
    ai: function(unit) {
        // This is the ai code
        this.run = function() {

            // Get an enemy unit
            var enemy = order.findThings(
                    tgt => tgt.unit && condition.isEnemySide(tgt),
                1000)[0];
            if(enemy) {
                // Follow command on enemy = target
                order.follow(enemy);
                // Return so actions after don't run
                return;
            }

            // order.findThings() returns an array of points here
            // Pass it to movement.spread, it returns 1 of the point
            var point = movement.spread(order.findThings(target =>
                target.commandPoint &&
                (target.side !== unit.side || target.capping > 0)));
            if(point) {
                // Move to the point
                order.move(point.pos);
                return;
            }
        }
    },
    // This is the spawning code
    build: function() {
        build.keepUnits(100, 1); // Keep 100 units on field
    }
});

r26Ai.enabled = true;
```

## Installation
### Copy + paste
1. Open developer console (press f12 on browser, f10 in steam version)
2. Copy whole content of `r26Ai.js` and paste it into the console
3. Copy your ai code into the console
### Use a browser monkey
1. Get [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or a similiar addon
2. Use it to run `r26Ai.js` and your ai file on [http://istrolid.com/game.html](http://istrolid.com/game.html)
### Install on steam version
1. Get Istrolid on Steam
2. Go to you steam folder, and go to `steamapps/common/istrolid/resources`
3. Extract app.asar to a folder app. I recommend using [this](https://github.com/electron/asar)
4. Put `r26Ai.js` inside `js` folder
5. Create another javascript file in the folder
6. Reference both files in `game.html` ie. `<script src="js/r26Ai.js"><script>`
7. Write your AI in the second file!
### Use a loader
A mod loader keeps your api up to date. You might not want that, though. Updates can break your ai.

You can use [my mod loader](https://gist.github.com/Rio6/7bef6ef21628efd37c3019634a5312a9) to load the api using this url: [https://raw.githubusercontent.com/Rio6/Istrolid-js-ai/master/r26Ai.js](https://raw.githubusercontent.com/Rio6/Istrolid-js-ai/master/r26Ai.js),
and then load your ai with local mod.
