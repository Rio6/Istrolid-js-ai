/*
 * This is an javascript api for istrolid ai
 *
 * How to use:
 * Call r26Ai.addAiRule(rule) to add an ai rule
 * A rule should have a function filter and a class ai with function run
 * Filter function check whether this rule should be added to the unit
 * class ai is instanized (if that's a word) for every units that matches
 * the filter
 *
 * You call order.findThings() to get your targets
 * and maybe use functions in movement to get where you want to go
 * or just use the position of the targets you have
 * to call functions in order to order
 *
 * Look at other js files for the actual use
 */

//-----------------------------------------------------------------------------
// Override and add/hook functions to istrolid

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

    for(var i in sim.things) {
        var thing = sim.things[i];
        if(thing.unit && thing.name !== thing.spec.name) {
            // Set unit's name so we don't have to access it through spec
            thing.name = thing.spec.name;
        }
    }

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

// Set bullet variables for them

// Sidewinder and missile bullet has tracking already
// but not turrets
for(var i of ["SidewinderTurret", "MissileTurret"]) {
    parts[i].prototype.tracking = true;
}

// Instant turrets have intant already
// but not bullets
for(var i of ["HeavyBeam", "PDLaserBullet", "LightBeam", "TeslaBolt"]) {
    types[i].prototype.instant = true;
}

//-----------------------------------------------------------------------------
// r26Ai add, stores and runs the ai rules

var r26Ai = {

    rules: [],
    fieldRule: null,
    enabled: false,
    step: 0,

    addAiToUnit: function(unit) {

        if(unit.owner !== commander.number)
            return;

        for(var i in r26Ai.rules) {
            var rule = r26Ai.rules[i];
            try {
                if(rule &&
                    typeof rule.filter === "function" &&
                    typeof rule.ai === "function" &&
                    rule.filter(unit)) {

                    unit.r26Ai = new rule.ai(unit);
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
                    }
                }
            }
            order.stopOrdering();

            if(r26Ai.step % 60 === 0) {
                for(var i in r26Ai.rules) {
                    var rule = r26Ai.rules[i];
                    for(var j = 0; j < commander.buildBar.length; j++) {
                        var unit = buildBar.specToUnit(commander.buildBar[j]);
                        try {
                            if(unit && rule &&
                                typeof rule.build === "function" &&
                                typeof rule.filter === "function" &&
                                rule.filter(unit)) {

                                build.startBuilding(j);
                                rule.build();
                            }
                        } catch(e) {
                            console.error(e.stack);
                        }
                    }
                }
                build.updateBuildQ();
            }

            r26Ai.step++;
        }
    },

    /*
     * Add an ai rule and also them check and add them to all currently
     * fielded units
     *
     * rule: an object with function filter, class ai that has a function run
     *
     * Example:
     *  {
     *      filter: function(unit) {},
     *      ai: function(unit) {
     *          this.run = function() {};
     *      }
     *  }
     */
    addAiRule: function(rule) {
        r26Ai.rules.push(rule);
        for(var i in sim.things) {
            r26Ai.addAiToUnit(sim.things[i]);
        }
    },

    // Clear ai rules
    clearAiRule:function() {
        r26Ai.rules = [];
    },

    // Fielding rule <- still buggy
    setFieldRule: function(rule) {
        if(typeof rule === "function")
            r26Ai.fieldRule = rule;
        else
            r26Ai.fieldRule = null;
    }
}

//-----------------------------------------------------------------------------
// Building functions
var build = {

    index: 0,
    buildPriority: [],

    startBuilding: function(index) {
        build.index = index;
    },

    updateBuildQ: function() {
        var buildQ = [];
        build.buildPriority.sort((a, b) => a.priority - b.priority);
        build.buildPriority.forEach(b => {
            for(var i = 0; i < b.number; i++)
                buildQ.push(b.index);
        });

        if(!simpleEquals(buildQ, commander.buildQ)) {
            var chIndex = commander.buildQ.length;
            for(var i in buildQ) {
                if(commander.buildQ[i] !== buildQ[i]) {
                    chIndex = i;
                    break;
                }
            }

            if(chIndex >= 0) {
                for(var i = chIndex; i < commander.buildQ.length; i++) {
                    network.send("buildRq", commander.buildQ[i], -1);
                }

                for(var i = chIndex; i < buildQ.length; i++) {
                    network.send("buildRq", buildQ[i], 1);
                }

                commander.buildQ = buildQ;
            }
        }

        build.buildPriority = [];
    },

    buildUnit(number, priority) {
        build.buildPriority.push({
            index: build.index,
            number: number,
            priority: priority
        });
    }
}

//-----------------------------------------------------------------------------
// Basic unit orders

var order = {

    oriSel: null,
    unit: null,

    // Used in r26Ai to start order an unit
    startOrdering: function(unit) {
        if(!order.oriSel)
            order.oriSel = commander.selection;
        order.unit = unit;
        battleMode.selectUnitsIds([unit.id]);
    },

    // Used in r26Ai to stop ordering and restore selections
    stopOrdering: function() {
        if(order.oriSel)
            battleMode.selectUnits(order.oriSel);
        order.oriSel = null;
        order.unit = null;
    },

    /*
     * Move order
     *
     * dest: destination to move to
     * append: whether to queue order
     */
    move: function(des, append) {
        if(v2.distance(order.unit.pos, des) > 50)
            battleMode.moveOrder([des], append);
    },

    /*
     * Follow order
     *
     * unit: unit to follow (can be anything actually, includes points, stones, bullets...
     * append: whether to queue order
     */
    follow: function(unit, append) {
        if(!unit) return;

        var unitOrder = order.getUnitOrders(order.unit)[0];
        if(unitOrder &&
            unitOrder.type === "Follow" &&
            unitOrder.targetId === unit.id)
            return
        battleMode.followOrder(unit, append);
    },

    /*
     * Stop order
     * It's like pressing x in game
     */
    stop: function() {
        if(condition.isBusy(order.unit) ||
            order.unit.holdPosition)
            battleMode.stopOrder();
    },

    /*
     * Hold order
     * It's like pressing z, but without toggling back to non-holding state
     */
    hold: function() {
        if(!order.unit.holdPosition)
            battleMode.holdPositionOrder();
    },

    /*
     * Unhold order
     * Send hold order if the unit is holding position
     * So it unholds
     */
    unhold: function() {
        if(order.unit.holdPosition)
            battleMode.holdPositionOrder();
    },

    /*
     * Self destruct
     * Pretty useful right?
     */
    destruct: function() {
        battleMode.selfDestructOrder();
    },

    /*
     * Find everything you want that's sorted in distance
     *
     * range: find things within this range, if range <= 0, check everything
     * check: function to check if this thing is what you want
     * closeTo: sort using the distance between the target and closeTo
     *      default is the current ordering unit,
     *      or a unit with pos [0, 0] if not available
     */
    findThings: function(range, check, closeTo) {
        var rst = [];
        var unit = closeTo || order.unit || {pos: [0, 0]};

        if(typeof check === "function") {
            for(var i in sim.things) {
                var thing = sim.things[i];
                if((range <= 0 ||
                    thing.pos && v2.distanceSqr(unit.pos, thing.pos) <= range * range) &&
                    check(thing)) {
                    rst.push(thing);
                }
            }
        }
        rst.sort((a, b) =>
            v2.distanceSqr(a.pos, unit.pos) - v2.distanceSqr(b.pos, unit.pos));
        return rst;
    },

    /*
     * Get a unit's order
     * Use this function because in local games, it's unit.orders
     * but in multiplayer games, it's unit.preOrders
     * Note that you can't get orders of units that are not yours in multiplayer
     * (Used to be able to get them but not anymore)
     */
    getUnitOrders(unit) {
        var unit = unit || order.unit;
        if(unit) {
            if(unit.orders && unit.orders.length > 0)
                return unit.orders;
            else if(unit.preOrders.length > 0)
                return unit.preOrders;
        }
        return [];
    }
}

//-----------------------------------------------------------------------------
// Funtions that let you check stuff

var condition = {

    /*
     * If the position is in # dps area
     *
     * pos: position to check
     * side: your side, it only checks enemys' dps not friends'
     * dps: how much dps
     */
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

    /*
     * If the position is in range of specific weapons
     *
     * pos: position to check
     * side: your side, not checking weapons that are on the same side
     * check: a function that check if this weapon is the weapon that
     *  you want to test the range
     */
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

    /*
     * If this unit is busy going somewhere
     *
     * unit: unit to check
     */
    isBusy: function(unit) {
        if(unit && unit.unit) {
            return unit.orders.length + unit.preOrders.length > 0;
        }
        return false;
    }
}

//-----------------------------------------------------------------------------
// Movements

var movement = {
    dummyUnit: new types.Unit(),

    /*
     * Return a target from targets so every target is
     * spread to all units that calls this function and
     * has the same spec and side as the current ordering unit
     *
     * targets: return 1 target out of the targets
     */
    spread: function(targets) {

        if(!order.unit || !targets) return;

        var rst = [];
        for(var i in targets) {
            var target = targets[i];
            if(i === "last" || !target) continue;

            if(simpleEquals(order.unit.tgt, target))
                return target;

            var targeted = 0;
            for(var j in sim.things) {
                var thing = sim.things[j];
                if(thing.unit &&
                    thing.id !== order.unit.id &&
                    thing.side === order.unit.side &&
                    simpleEquals(thing.spec, order.unit.spec) &&
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
            order.unit.tgt = rst[0].target;
            return rst[0].target;
        }
    },

    /*
     * Return a position that is inside radius of a position
     * and is closest to the current ordering unit
     *
     * pos: position to go in range
     * radius: the range radius
     */
    inRange: function(pos, radius) {

        if(!order.unit || !pos) return;

        var oriTgt = order.unit.pos;

        var unitOrder = order.getUnitOrders(order.unit);
        if(unitOrder) {
            if(unitOrder.type === "Move") {
                oriTgt = unitOrder.dest;
            } else if(unitOrder.type === "Follow") {
                var fTarget = sim.things[unitOrder.posId];
                if(fTarget)
                    oriTgt = fTarget.pos;
            }
        }

        if(v2.distanceSqr(oriTgt, pos) < radius * radius)
            return;

        return v2.sub(pos, v2.scale(v2.norm(v2.sub(pos, order.unit.pos, [0, 0])), radius - order.unit.radius), v2.create());
    },

    /*
     * Return a position that (try to) avoid all shots
     * that matches check function
     * This function uses istrolid's avoidShots function
     *
     * avoidDamage: damage to avoid
     * check: a function that check if you want to avoid this bullet
     */
    avoidShots: function(avoidDamage, check) {
        if(!order.unit) return;

        var unitClone = Object.assign(movement.dummyUnit, order.unit);
        sim.spacesRebuild();

        if(typeof check === "function") {
            var bulletSpaces = sim.bulletSpaces[otherSide(order.unit.side)];
            bulletSpaces.findInRange(order.unit.pos, order.unit.radius + 500, bullet => {
                if(bullet && !check(bullet)) {
                    var things = bulletSpaces.hash.get(bulletSpaces.key(bullet.pos));
                    if(things) {
                        var i = things.indexOf(bullet);
                        if(i !== -1) {
                            things.splice(i, 1);
                        }
                    }
                }
            });
        }

        if(ais.avoidShots(unitClone, avoidDamage, null)) {
            return unitClone.orders[0].dest;
        }
    }
}
