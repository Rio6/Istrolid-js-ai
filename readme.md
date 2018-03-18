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

# Installation

1. Install tampermonkey on your browser
2. Click the tampermonkey icon and click "create an new script"
3. Copy this code I asked for [here](https://stackoverflow.com/questions/48999415/simply-require-ing-a-3rd-party-library-results-in-javascript-errors/49000497?noredirect=1#comment85041490_49000497)
```javascript
// ==UserScript==
// @name         Istrolid.com, use Istrolid Javascript AI API
// @version      0.2
// @match        *://www.istrolid.com/game.html*
// @grant        none
// ==/UserScript==

/*-- Wait for game to load.  Try to find an event or node that signals
    this, instead of one or two timers.
*/
var sfStrtTmr  = setInterval(() => {
    if (typeof Interpolator  === "function") {
        clearInterval (sfStrtTmr);
        setTimeout (loadPoorScript, 1111);
    }
}, 333);

function loadPoorScript(url){
    var newNode     = document.createElement('script');
        newNode.onload  = runScriptMain;
    if (!url) {
        newNode.src = "https://rawgit.com/Rio6/Istrolid-js-ai/master/r26Ai.js";
    } else {
        newNode.src = url;
    }
    document.body.appendChild(newNode);
}

function runScriptMain() {
    //  ALL OF YOUR CODE GOES HERE.
    console.log ("r26Ai: ",r26Ai);
}
```
5. paste your code into the `runScriptMain()` function
