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
     build: function(unit) {
         build.buildUnit(1, 1);
     }
 });
```

Look at other js files for the actual use

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
