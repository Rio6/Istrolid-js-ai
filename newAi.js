/*
 * This is an javascript api for istrolid ai
 * Look at the very last part of this file to figure out how to use
 */

var hook = hook || {
    process: Interpolator.prototype.process,
    tick: BattleMode.prototype.tick
};

Interpolator.prototype.process = function(data) {
    var newIds = [];
    for(var i in data.things) {
        for(var j in data.things[i]) {
            if(data.things[i][j][0] === "thingId" &&
                !this.things[data.things[i][j][1]]) {
                newIds.push(data.things[i][j][1]);
            }
        }
    }
    var ret = hook.process.call(this, data);

    for(var i in newIds) {
        var t = sim.things[newIds[i]];
        if(t) {
            ai.addAiToUnit(t);
        }
    }

    return ret;
}

BattleMode.prototype.tick = function() {
    ai.tick();
    return hook.tick.call(this);
}

v2.distanceSqr = function(from, to) {
    var x = to[0] - from[0];
    var y = to[1] - from[1];
    return x * x + y * y;
}

//-----------------------------------------------------------------------------

var ai = {

    rules: [],
    fieldRule: null,
    enabled: false,
    step: 0,

    addAiToUnit: function(unit) {
        if(unit.owner !== commander.number)
            return;

        for(var i in ai.rules) {
            try {
                if(typeof ai.rules[i].filter === "function" && ai.rules[i].filter(unit)) {
                    unit.r26Ai = new ai.rules[i].ai(unit);
                }
            } catch(e) {
                console.error(e.stack);
            }
        }
    },

    tick: function() {
        if(ai.enabled && intp.state === "running" && commander.side !== "spectators") {
            for(var i in sim.things) {
                var thing = sim.things[i];
                if(thing.r26Ai) {
                    if((ai.step + thing.id) % 30 === 0) {
                        order.startOrdering(thing);
                        try {
                            thing.r26Ai.run();
                        } catch(e) {
                            console.error(e.stack);
                        }
                        order.stopOrdering();
                    }
                }
            }

            if(ai.step % 30 === 0) {
                try {
                    if(typeof fieldRule === "function") {
                        for(var i = 0; i < 10; i++) {
                            var number = fieldRule(buildBar.specToUnit(commander.buildBar[i]));
                            if(number !== 0)
                                network.send("buildRq", i, number);
                        }
                    }
                } catch(e) {
                    console.error(e.stack);
                }
            }
            ai.step++;
        }
    },

    addAiRule: function(rule) {
        ai.rules.push(rule);
        for(var i in sim.things) {
            ai.addAiToUnit(sim.things[i]);
        }
    },

    clearAiRule:function() {
        ai.rules = [];
    },

    setFieldRule: function(rule) {
        if(typeof rule === "function")
            fieldRule = rule;
        else
            fieldRule = null;
    }
}

//-----------------------------------------------------------------------------

var order = {

    oriSel: [],
    unit: null,

    startOrdering: function(unit) {
        if(order.oriSel.length === 0)
            order.oriSel = commander.selection;
        order.unit = unit;
        battleMode.selectUnitsIds([unit.id]);
    },

    stopOrdering: function() {
        battleMode.selectUnits(order.oriSel);
        order.oriSel = [];
    },

    move: function(pos, append) {
        if(v2.distance(order.unit.pos, pos) > 50)
            battleMode.moveOrder([pos], append);
    },

    follow: function(unit, append) {
        if(order.unit.orders[0] &&
            order.unit.orders[0].type === "Follow" &&
            order.unit.orders[0].targetId === unit.id)
            return
        battleMode.followOrder(unit, append);
    },

    stop: function() {
        if(order.unit.orders.length > 0 || order.unit.holdPosition)
            battleMode.stopOrder();
    },

    hold: function() {
        if(!order.unit.holdPosition)
            battleMode.holdPositionOrder();
    },

    unhold: function() {
        if(!order.unit.holdPosition)
            battleMode.holdPositionOrder();
    },

    destruct: function() {
        battleMode.selfDestructOrder();
    },

    findThing: function(unit, check) {
        var rst = [];
        if(typeof check === "function") {
            for(var i in sim.things) {
                var thing = sim.things[i];
                if(check(thing)) {
                    rst.push(thing);
                }
            }
        }
        rst.sort((a, b) => 
            v2.distanceSqr(a.pos, unit.pos) - v2.distanceSqr(b.pos, unit.pos));
        return rst;
    }
}

//-----------------------------------------------------------------------------

var movement = {
    spread: function(unit, targets) {
        var rst = [];
        for(var i in targets) {
            var target = targets[i];
            if(!target || typeof target === "function") continue;

            if(unit.tgt === target)
                return target;

            var targeted = 0;
            for(var j in sim.things) {
                var thing = sim.things[j];
                if(thing.unit &&
                    thing.id !== unit.id &&
                    thing.side === unit.side &&
                    JSON.stringify(thing.spec) === JSON.stringify(unit.spec) &&
                    thing.tgt === target) {
                    targeted++;
                }
            }
            rst.push({
                target: target,
                targeted: targeted
            });
        }
        rst.sort((a, b) => a.targeted - b.targeted);
        if(rst[0]) {
            unit.tgt = rst[0].target;
            return rst[0].target;
        }
    },

    inRange: function(unit, target, radius) {

        var oriTgt = unit.pos;

        if(unit.orders[0]) {
            var order = unit.orders[0];
            if(order.type === "Move")
                oriTgt = order.dest;
            else if(order.type === "Follow")
                oriTgt = sim.things[order.targetId].pos;
        }

        if(v2.distanceSqr(oriTgt, target) < radius * radius)
            return;

        return v2.sub(target, v2.scale(v2.norm(v2.sub(target, unit.pos, [0, 0])), radius - unit.radius), v2.create());
    }
}
