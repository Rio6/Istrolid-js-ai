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
            r26Ai.addAiToUnit(t);
        }
    }

    return ret;
}

BattleMode.prototype.tick = function() {
    r26Ai.tick();
    return hook.tick.call(this);
}

v2.distanceSqr = function(from, to) {
    var x = to[0] - from[0];
    var y = to[1] - from[1];
    return x * x + y * y;
}

// Turrets don't have tracking flag
// Set it for them
parts.SidewinderTurret.prototype.tracking = true;
parts.MissileTurret.prototype.tracking = true;

//-----------------------------------------------------------------------------

var r26Ai = {

    rules: [],
    fieldRule: null,
    enabled: false,
    step: 0,

    addAiToUnit: function(unit) {
        if(unit.owner !== commander.number)
            return;

        for(var i in r26Ai.rules) {
            try {
                if(typeof r26Ai.rules[i].filter === "function" && r26Ai.rules[i].filter(unit)) {
                    unit.r26Ai = new r26Ai.rules[i].ai(unit);
                }
            } catch(e) {
                console.error(e.stack);
            }
        }
    },

    tick: function() {
        if(r26Ai.enabled && intp.state === "running" && commander.side !== "spectators") {
            for(var i in sim.things) {
                var thing = sim.things[i];
                if(thing.r26Ai) {
                    if((r26Ai.step + thing.id) % 30 === 0) {
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

            if(r26Ai.step % 60 === 0) {
                try {
                    if(typeof r26Ai.fieldRule === "function") {
                        for(var i = 0; i < 10; i++) {
                            var number = r26Ai.fieldRule(
                                buildBar.specToUnit(commander.buildBar[i]),
                                commander.buildQ.filter(x => x === i).length);
                            if(number !== 0)
                                network.send("buildRq", i, number);
                        }
                    }
                } catch(e) {
                    console.error(e.stack);
                }
            }
            r26Ai.step++;
        }
    },

    addAiRule: function(rule) {
        r26Ai.rules.push(rule);
        for(var i in sim.things) {
            r26Ai.addAiToUnit(sim.things[i]);
        }
    },

    clearAiRule:function() {
        r26Ai.rules = [];
    },

    setFieldRule: function(rule) {
        if(typeof rule === "function")
            r26Ai.fieldRule = rule;
        else
            r26Ai.fieldRule = null;
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
        order.unit = null;
    },

    move: function(pos, append) {
        if(v2.distance(order.unit.pos, pos) > 50)
            battleMode.moveOrder([pos], append);
    },

    follow: function(unit, append) {
        var order = unit.orders[0] || unit.preOrders[0];
        if(order &&
            order.type === "Follow" &&
            order.targetId === unit.id)
            return
        battleMode.followOrder(unit, append);
    },

    stop: function() {
        if(order.unit.orders.length > 0 ||
            order.unit.preOrders.length > 0 ||
            order.unit.holdPosition)
            battleMode.stopOrder();
    },

    hold: function() {
        if(!order.unit.holdPosition)
            battleMode.holdPositionOrder();
    },

    unhold: function() {
        if(order.unit.holdPosition)
            battleMode.holdPositionOrder();
    },

    destruct: function() {
        battleMode.selfDestructOrder();
    },

    findThings: function(check, closeTo) {
        var rst = [];
        var unit = closeTo || order.unit || {pos: [0, 0]};

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

var condition = {
    inRangeDps: function(pos, side, dps) {
        var totalDps = 0;

        for(var i in sim.things) {
            var target = sim.things[i];
            if(target.unit && target.side === otherSide(side)) {
                for(var j in target.weapons) {
                    if(j === "last") continue;
                    var weapon = target.weapons[j];

                    var range = weapon.range;
                    if(v2.distanceSqr(pos, weapon.worldPos) <= range * range)
                        totalDps += weapon.dps * 16;
                }
            }
        }
        return totalDps >= dps;
    },

    inRangeWeapon: function(pos, side, check) {
        if(typeof check !== "function") return false;

        for(var i in sim.things) {
            var target = sim.things[i];
            if(target.unit && target.side === otherSide(side)) {
                for(var j in target.weapons) {
                    if(j === "last") continue;
                    var weapon = target.weapons[j];

                    var range = weapon.range;
                    if(v2.distanceSqr(pos, weapon.worldPos) <= range * range && check(weapon))
                        return true;
                }
            }
        }
        return false;
    },

    isBusy: function(unit) {
        if(unit && unit.unit) {
            return unit.orders.length + unit.preOrders.length > 0;
        }
        return false;
    }
}

//-----------------------------------------------------------------------------

var movement = {
    spread: function(unit, targets) {

        if(!unit || !targets) return;

        var rst = [];
        for(var i in targets) {
            var target = targets[i];
            if(i === "last" || !target) continue;

            if(simpleEquals(unit.tgt, target))
                return target;

            var targeted = 0;
            for(var j in sim.things) {
                var thing = sim.things[j];
                if(thing.unit &&
                    thing.id !== unit.id &&
                    thing.side === unit.side &&
                    simpleEquals(thing.spec, unit.spec) &&
                    simpleEquals(thing.tgt, target)) {
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

        if(!unit || !target) return;

        var oriTgt = unit.pos;

        var order = unit.orders[0] || unit.preOrders[0];
        if(order) {
            if(order.type === "Move") {
                oriTgt = order.dest;
            } else if(order.type === "Follow") {
                var fTarget = sim.things[order.targetId];
                if(fTarget)
                    oriTgt = fTarget.pos;
            }
        }

        if(v2.distanceSqr(oriTgt, target) < radius * radius)
            return;

        return v2.sub(target, v2.scale(v2.norm(v2.sub(target, unit.pos, [0, 0])), radius - unit.radius), v2.create());
    }
}
