/*
 * This is an javascript api for istrolid ai
 *
 * How to use:
 * Call `r26Ai.addAiRule(rule)` to add an ai rule.
 *
 * A rule should be an object that has a function `filter`, a
 * class `ai` with a function `run` in it, and a function `build`.
 *
 * `filter` check whether this rule should be added to the unit,
 * class `ai` is instantized (new'd) and add to every units that matches
 * the filter.
 *
 * The `ai` object should have a run method. It is called every 30 ticks.
 * In `run`, you can call `order.findThings()` to get your targets
 * and maybe use functions in `movement.*` to get where you want to go, or just
 * use the position of the targets you have to call functions in `order.*`
 * to give orders.
 *
 * `build` is called every 3 seconds, you can use
 * `build.buildUnits(quantity, priority)` or `build.keepUnits(quantity, priority)`
 * to build units.
 *
 * Example:
 *  r26Ai.addAiRule({
 *      filter: function(unit) {
 *          return unit.name === "BANANA";
 *      },
 *      ai: function(unit) {
 *          this.run = function() {
 *              order.move([0, 0]);
 *          };
 *      },
 *      build: function(unit) {
 *          build.keepUnits(10, 1);
 *      }
 *  });
 *
 * Look at other js files for the actual use
 */

/**
 * @typedef {number[]} v2
 * @property {int} 0 x coordinate
 * @property {int} 1 y coordinate
 */
/**
 * @typedef {Object} unit
 */
/**
 * @typedef {Object} thing
 */

/**
 * Callback to check if you want this thing
 * @callback check
 * @param {thing} target - Target to check
 * @returns {boolean} - Whether you want this object or not
 */


//-----------------------------------------------------------------------------
// Override and add/hook functions to istrolid

var hook = hook || {
    process: Interpolator.prototype.process,
    timer: setInterval(() => r26Ai.tick(), 60)
//    tick: BattleMode.prototype.tick
};

Interpolator.prototype.process = function(data) {

    var newIds = [];
    for(let i in data.things) {
        for(let j in data.things[i]) {
            if(data.things[i][j][0] === "thingId" &&
                !this.things[data.things[i][j][1]]) {
                newIds.push(data.things[i][j][1]);
            }
        }
    }

    var ret = hook.process.call(this, data);

    for(let i in sim.things) {
        let thing = sim.things[i];
        if(thing.unit && thing.name !== thing.spec.name) {
            // Set unit's name so we don't have to access it through spec
            thing.name = thing.spec.name;
        }
    }

    for(let i in newIds) {
        let t = sim.things[newIds[i]];
        if(t) {
            r26Ai.addAiToUnit(t);
        }
    }

    return ret;
}

/*
BattleMode.prototype.tick = function() {
    r26Ai.tick();
    return hook.tick.call(this);
}
*/

BattleMode.prototype.genOrderId = function() {
    if(order.ordering)
        var o = this.orderId + 1;
    else
        var o = this.orderId;

    this.orderId += 2;
    return o;
}

v2.distanceSqr = function(from, to) {
    var x = to[0] - from[0];
    var y = to[1] - from[1];
    return x * x + y * y;
}

// Set bullet variables for them

// Sidewinder and missile bullet has tracking already
// but not turrets
for(let i of ["SidewinderTurret", "MissileTurret"]) {
    parts[i].prototype.tracking = true;
}

// Instant turrets have intant already
// but not bullets
for(let i of ["HeavyBeam", "PDLaserBullet", "LightBeam", "TeslaBolt"]) {
    types[i].prototype.instant = true;
}

//-----------------------------------------------------------------------------
// r26Ai add, stores and runs the ai rules

/** @namespace */
var r26Ai = {

    rules: [],
    enabled: false,
    step: 0,

    addAiToUnit: function(unit) {

        if(!commander || unit.owner !== commander.number)
            return;

        for(let i in r26Ai.rules) {
            let rule = r26Ai.rules[i];
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
        if(r26Ai.enabled && commander && intp.state === "running" && commander.side !== "spectators") {
            for(let i in sim.things) {
                let thing = sim.things[i];
                if(thing.r26Ai) {
                    if((r26Ai.step + thing.id) % 8 === 0) {
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

            if(r26Ai.step % 48 === 0) {
                let built = false;
                for(let i in r26Ai.rules) {
                    let rule = r26Ai.rules[i];
                    for(let j = 0; j < commander.buildBar.length; j++) {
                        let unit = buildBar.specToUnit(commander.buildBar[j]);
                        try {
                            if(unit && rule &&
                                typeof rule.build === "function" &&
                                typeof rule.filter === "function" &&
                                rule.filter(unit)) {

                                build.startBuilding(j, rule.filter);
                                rule.build(unit);

                                built = true;
                            }
                        } catch(e) {
                            console.error(e.stack);
                        }
                    }
                }
                if(built)
                    build.updateBuildQ();
            }

            r26Ai.step++;
        } else {
            build.resetBuildQueue();
            r26Ai.step = 0;
        }
    },

    /**
     * Add an ai rule and also them check and add them to all currently
     * fielded units
     *
     * Example:
     *  r26Ai.addAiRule({
     *      filter: function(unit) {
     *          return unit.name === "BANANA";
     *      },
     *      ai: function(unit) {
     *          this.run = function() {
     *              order.move([0, 0]);
     *          };
     *      },
     *      build: function(unit) {
     *          build.keepUnits(10, 1);
     *      }
     *  });
     *
     * @param {Object} rule - An object with function `filter`, class `ai` that has a function `run`, function `build`
     */
    addAiRule: function(rule) {
        r26Ai.rules.push(rule);
        if(sim) {
            for(let i in sim.things) {
                r26Ai.addAiToUnit(sim.things[i]);
            }
        }
    },

    // Clear ai rules
    clearAiRule:function() {
        r26Ai.rules = [];
    }
}

//-----------------------------------------------------------------------------
// Building functions
/** @namespace */
var build = {

    index: -1,
    filter: null,
    buildPriority: [],

    // Used in r26Ai to start recording build orders on a slot
    startBuilding: function(index, filter) {
        build.index = index;
        build.filter = filter;
    },

    // Used in r26Ai to sort out priorities and send out build orders
    updateBuildQ: function() {
        if(r26Ai.step < 48) return;

        var buildQ = [];

        build.buildPriority.sort((a, b) => a.priority - b.priority).forEach(b => {
            for(let i = 0; i < b.number; i++)
                buildQ.push(b.index);
        });

        if(!simpleEquals(buildQ, commander.buildQ)) {

            let chIndex = commander.buildQ.length;
            for(let i = 0; i < Math.max(buildQ.length, commander.buildQ.length); i++) {
                if(commander.buildQ[i] !== buildQ[i]) {
                    chIndex = i;
                    break;
                }
            }

            for(let i = chIndex; i < commander.buildQ.length; i++) {
                network.send("buildRq", commander.buildQ[i], -1);
            }

            for(let i = chIndex; i < buildQ.length; i++) {
                network.send("buildRq", buildQ[i], 1);
            }

            commander.buildQ = buildQ;

            build.resetBuildQueue();
        }
    },

    resetBuildQueue: function() {
        build.buildPriority = [];
        index = -1;
        filter = null;
    },

    /**
     * Build units so there are `number` of units on field
     *
     * @param {number} number - how many to field
     * @param {number} [priority=0] - build priority, lower number has higher priority
     */
    keepUnits: function(number, priority = 0) {
        var buildNumber = number;

        buildNumber -= order.findThings(unit => condition.isMyUnit(unit) && build.filter(unit)).length;
        build.buildPriority.forEach(p => {
            if(p.index === build.index && p.priority <= priority) {
                buildNumber -= p.number;
            }
        });

        if(buildNumber > 0) {
            build.buildPriority.push({
                index: build.index,
                number: buildNumber,
                priority: priority,
            });
        }
    },

    /**
     * Build units with a priority
     *
     * @param {number} number - how many units to build
     * @param {number} [priority=0] - build priority, lower number has higher priority
     */
    buildUnits: function(number, priority = 0) {
        if(number > 0) {
            build.buildPriority.push({
                index: build.index,
                number: number,
                priority: priority
            });
        }
    }
}

//-----------------------------------------------------------------------------
// Basic unit orders

/** @namespace */
var order = {

    oriSel: null,
    unit: null,
    ordering: false, // Used to get order id for ai orders and player orders

    // Used in r26Ai to start ordering an unit
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

    /**
     * Move order
     *
     * @param {v2} dest - destination to move to
     */
    move: function(des) {
        if(!des) return;
        var unitOrder = order.getUnitOrders(order.unit)[0];
        if(!unitOrder || !simpleEquals(unitOrder.dest, des) &&
            v2.distance(order.unit.pos, des) > 50) {

            order.ordering = true;
            battleMode.moveOrder([des], false);
            order.ordering = false;
        }
    },

    /**
     * Follow order
     *
     * unit: unit to follow (can be anything actually, includes points, stones, bullets...
     * append: whether to queue order
     */
    follow: function(unit) {
        if(!unit) return;

        var unitOrder = order.getUnitOrders(order.unit)[0];
        if(unitOrder && unitOrder.type === "Follow" &&
            unitOrder.targetId === unit.id)
            return

        order.ordering = true;
        battleMode.followOrder(unit, false);
        order.ordering = false;
    },

    /**
     * Stop order
     * It's like pressing x in game
     */
    stop: function() {
        if(condition.isBusy(order.unit) ||
            order.unit.holdPosition)
            battleMode.stopOrder();
    },

    /**
     * Hold order
     * It's like pressing z, but without toggling back to non-holding state
     */
    hold: function() {
        if(!order.unit.holdPosition)
            battleMode.holdPositionOrder();
    },

    /**
     * Unhold order
     * Send hold order if the unit is holding position
     * So it unholds
     */
    unhold: function() {
        if(order.unit.holdPosition)
            battleMode.holdPositionOrder();
    },

    /**
     * Self destruct
     * Pretty useful right?
     */
    destruct: function() {
        battleMode.selfDestructOrder();
    },

    /**
     * Runs an array of istrolid formated orders
     *
     * @param {Object[]} orders - orders to run
     */
    runOrders: function(orders) {
        var firstOrder = true;
        for(let unitOrder of orders) {
            if(unitOrder.type === "Move") {
                battleMode.moveOrder([unitOrder.dest], firstOrder);
                firstOrder = false;
            } else if(unitOrder.type === "Follow") {
                let unit = {id: unitOrder.targetId};
                battleMode.followOrder(unit, firstOrder);
                firstOrder = false;
            }
        }
    },

    /**
     * Find everything you want that's sorted in distance
     *
     * @param {check} check - function to check if this thing is what you want
     * @param {number} [range=-1] - find things within this range, if range <= 0, check everything
     * @param {v2} closeTo - sort using the distance between the target and closeTo, default is the current ordering unit position, or [0, 0] if not available
     */
    findThings: function(check, range = -1, closeTo) {
        var rst = [];
        var point = closeTo || (order.unit ? order.unit.pos : [0, 0]);

        if(typeof check === "function") {
            for(let i in sim.things) {
                let thing = sim.things[i];
                if((range <= 0 ||
                    thing.pos && v2.distanceSqr(thing.pos, point) <= range * range) &&
                    check(thing)) {
                    rst.push(thing);
                }
            }
        }
        rst.sort((a, b) =>
            v2.distanceSqr(a.pos, point) - v2.distanceSqr(b.pos, point));
        return rst;
    },

    /**
     * Finds every weapons you want on a unit
     *
     * @param {unit} unit - unit to find weapons on
     * @param {check} check - function to check if the weapon is what you want
     */
    findWeapons: function(unit, check) {
        var rst = [];
        if(unit && unit.unit && typeof check === "function") {
            for(let i in unit.weapons) {
                let weapon = unit.weapons[i];

                if(check(weapon))
                    rst.push(weapon);
            }
        }
        return rst;
    },

    /**
     * Get a unit's order
     *
     * Use this function because in local games, it's unit.orders
     * but in multiplayer games, it's unit.preOrders
     * Note that you can't get orders of units that are not yours in multiplayer
     * (Used to be able to get them but not anymore)
     *
     * @param {unit} unit - Unit to get orders from
     */
    getUnitOrders: function(unit) {
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

/** @namespace */
var condition = {

    /**
     * If the position is in # dps area
     *
     * @param {v2} pos - position to check
     * @param {string} side - your side, only checks enemys' dps not friends'
     * @param {number} dps - how much dps
     */
    inRangeDps: function(pos, side, dps) {
        var totalDps = 0;

        for(let i in sim.things) {
            let target = sim.things[i];
            if(target.unit && target.side === otherSide(side)) {
                for(let j in target.weapons) {
                    if(j === "last") continue;
                    let weapon = target.weapons[j];

                    let range = weapon.range;
                    if(v2.distanceSqr(pos, weapon.worldPos) <= range * range)
                        totalDps += weapon.dps * 16;
                }
            }
        }
        return totalDps >= dps;
    },

    /**
     * If the position is in range of specific weapons
     *
     * @param {v2} pos - position to check
     * @param {string} side - your side, not checking weapons that are on the same side
     * @param {check} check - if you want to check this weapon
     */
    inRangeWeapon: function(pos, side, check) {
        if(typeof check !== "function") return false;

        for(let i in sim.things) {
            let target = sim.things[i];
            if(target.unit && target.side === otherSide(side)) {
                for(let j in target.weapons) {
                    if(j === "last") continue;
                    let weapon = target.weapons[j];

                    let range = weapon.range;
                    if(v2.distanceSqr(pos, weapon.worldPos) <= range * range && check(weapon))
                        return true;
                }
            }
        }
        return false;
    },

    /**
     * If a unit has a certain weapon
     *
     * @param {unit} unit - unit to check
     * @param {check} check - if you want to check this weapon is on the unit
     */
    hasWeapon: function(unit, check) {
        var rst = [];
        if(unit && unit.unit && typeof check === "function") {
            for(let i in unit.weapons) {
                let weapon = unit.weapons[i];

                if(check(weapon))
                    return true;
            }
        }
        return false;
    },

    /**
     * If this unit is busy going somewhere
     *
     * @param {object} unit - unit to check
     */
    isBusy: function(unit) {
        if(unit && unit.unit) {
            return unit.orders.length + unit.preOrders.length > 0;
        }
        return false;
    },

    /**
     * If this thing is owned by commander and same side
     *
     * @param {thing} unit - unit to check
     */
    isMyUnit: function(unit) {
        return unit &&
            unit.side === commander.side &&
            unit.owner === commander.number;
    },

    /**
     * If this thing is on the enmy side
     *
     * @param {thing} unit - unit to check
     */
    isEnemySide: function(unit) {
        return unit && unit.side === otherSide(commander.side);
    },

    /**
     * If this unit has player order queued
     * Only work on your own units
     *
     * @param {unit} unit - unit to check
     */
    hasPlayerOrder: function(unit) {
        var unitOrders = order.getUnitOrders();
        if(!unit || !unitOrders) return false;

        for(let i in unitOrders) {
            let id = unitOrders[i].id;
            if(id % 2 === 0 && unit.onOrderId === id) {
                return true;
            }
        }
        return false;
    },

    /**
     * If this unit is selected by player
     *
     * @param {unit} unit - unit to cehck
     */
    unitSelected: function(unit) {
        if(!unit) return;
        for(let i in order.oriSel) {
            if(unit.id === order.oriSel[i].id) {
                return true;
            }
        }
        return false;
    }
}

//-----------------------------------------------------------------------------
// Movements

/** @namespace */
var movement = {
    dummyUnit: new types.Unit(),

    /**
     * Return a target from targets so every target is
     * spread to all units that calls this function and
     * has the same spec and side as the current ordering unit
     *
     * @param {things[]} targets - return 1 target out of the targets
     * @param {number} [count=0] - how many units for 1 target, 0 for as many as possible
     */
    spread: function(targets, count = 0) {

        if(!order.unit || !targets) return;

        var rst = [];
        for(let i in targets) {
            let target = targets[i];
            if(i === "last" || !target) continue;

            let targeted = 0;
            for(let j in sim.things) {
                let thing = sim.things[j];
                if(thing.unit &&
                    thing.id !== order.unit.id &&
                    thing.owner === order.unit.owner &&
                    thing.side === order.unit.side &&
                    simpleEquals(thing.spec, order.unit.spec) &&
                    simpleEquals(thing.tgt, target)) {
                    targeted++;
                }
            }

            if(simpleEquals(order.unit.tgt, target)) {
                var unitTgt = {
                    target: target,
                    targeted: targeted,
                };
            }

            rst.push({
                target: target,
                targeted: targeted
            });
        }

        rst.sort((a, b) => a.targeted - b.targeted);
        if(rst[0]) {
            if(count > 0 && rst[0].targeted >= count) {
                order.unit.tgt = null;
                return;
            }
            if(!unitTgt || rst[0].targeted < unitTgt.targeted) {
                order.unit.tgt = rst[0].target;
                return rst[0].target;
            } else {
                return unitTgt.target;
            }
        }
    },

    /**
     * Return a position that is inside radius of a position
     * and is closest to the current ordering unit
     *
     * @param {v2} pos - position to go in range
     * @param {number} radius - radius to stay in
     */
    inRange: function(pos, radius) {

        if(!order.unit || !pos) return;

        var oriTgt = order.unit.pos;

        var unitOrder = order.getUnitOrders(order.unit);
        if(unitOrder) {
            if(unitOrder.type === "Move") {
                oriTgt = unitOrder.dest;
            } else if(unitOrder.type === "Follow") {
                let fTarget = sim.things[unitOrder.posId];
                if(fTarget)
                    oriTgt = fTarget.pos;
            }
        }

        if(v2.distance(oriTgt, pos) <= radius - order.unit.radius)
            return;

        return v2.sub(pos, v2.scale(v2.norm(v2.sub(pos, order.unit.pos, [0, 0])), radius - order.unit.radius), v2.create());
    },

    /**
     * Return a position that is out side of the radius when
     * the unit is within the distance
     *
     * @param {v2} pos - position to flee
     * @param {number} radius - the radius to flee
     */
    fleeRange: function(pos, radius) {

        if(!order.unit || !pos) return;

        var oriTgt = order.unit.pos;

        var unitOrder = order.getUnitOrders(order.unit);
        if(unitOrder) {
            if(unitOrder.type === "Move") {
                oriTgt = unitOrder.dest;
            } else if(unitOrder.type === "Follow") {
                let fTarget = sim.things[unitOrder.posId];
                if(fTarget)
                    oriTgt = fTarget.pos;
            }
        }

        if(v2.distance(oriTgt, pos) >= radius + order.unit.radius)
            return;

        return v2.sub(pos, v2.scale(v2.norm(v2.sub(pos, order.unit.pos, [0, 0])), radius + order.unit.radius), v2.create());
    },

    /**
     * Return a position that (try to) avoid all shots
     * that matches check function
     * It's basically moving to the opposite direction of bullets without stopping
     *
     * @param {number} avoidDamage - damage to avoid
     * @param {check} check - check if you want to avoid this bullet
     */
    avoidShots: function(avoidDamage, check) {
        if(!order.unit) return;

        var hitTime = function(unit, shot, margin) {

            /*
             * a^2 + b^2 = c^2
             * u = unit pos, s = shot pos, v = relative velocity, d = distance when touching, t = time
             * u + t*v - s = relative distance after time
             * (u.x + t*v.x - s.x)^2 + (u.y + t*v.y - s.y)^2 = d^2
             * t^2 * (v.x^2 + v.y^2) + t * (2*u.x*v.x - 2*s.x*v.x + 2*u.y*v.y - 2*s.y*v.y) + (u.x^2 - 2*u.x*s.x + s.x^2 + u.y^2 - 2*u.y*s.y + s.y^2 - d^2)
             * --------------------------------
             * a*t^2 + b*t + c = 0
             * t = (-b +- sqrt(b^2 - 4*a*c)) / 2*a
             */

            var sqr = function(x) {
                return x * x;
            };

            var v = {
                x: shot.vel[0] - unit.vel[0],
                y: shot.vel[1] - unit.vel[1]
            };

            var u = {
                x: unit.pos[0],
                y: unit.pos[1]
            };

            var s = {
                x: shot.pos[0],
                y: shot.pos[1]
            };

            var d = unit.radius + shot.radius + margin;

            var a = sqr(v.x) + sqr(v.y);
            var b = 2 * s.x * v.x - 2 * u.x * v.x + 2 * s.y * v.y - 2 * u.y * v.y;
            var c = sqr(s.x) - 2 * s.x * u.x + sqr(u.x) + sqr(s.y) - 2 * s.y * u.y + sqr(u.y) - sqr(d);

            return (-b - Math.sqrt(sqr(b) - 4 * a * c)) / (2 * a);
        };

        sim.spacesRebuild();

        var avoidTime = 48;
        var avoidMargin = 100;

        var avoidCount = 0;
        var avoidPos = v2.create();

        let bulletSpaces = sim.bulletSpaces[otherSide(order.unit.side)];
        bulletSpaces.findInRange(order.unit.pos, order.unit.radius + 1000, bullet => {
            if(bullet && bullet.damage >= avoidDamage && (!check || check(bullet))) {
                if(bullet.instant) {
                } else if(bullet.hitPos) {
                    let time = v2.distance(bullet.pos, bullet.hitPos) / v2.mag(bullet.vel);
                    if(time < avoidTime && v2.distance(bullet.hitPos, v2.add(v2.scale(order.unit.vel, time, v2.create()), order.unit.pos)) < bullet.aoe + order.unit.radius + avoidMargin) {
                        v2.add(avoidPos, bullet.hitPos);
                        avoidCount++;
                    }
                } else {
                    let time = hitTime(order.unit, bullet, avoidMargin);
                    if(bullet.tracking && bullet.target && bullet.target.id === order.unit.id
                        || time > 0 && time < avoidTime) {

                        v2.add(avoidPos, bullet.pos);
                        avoidCount++;
                    }
                }
            }
        });

        if(avoidCount > 0) {
            var unitAngleVel = v2.mag(order.unit.vel) > 0 ? order.unit.vel : v2.pointTo(v2.create(), order.unit.rot);
            var avoidDest = v2.sub(order.unit.pos, v2.scale(avoidPos, 1 / avoidCount), v2.create());
            var destAngle = v2.angle(unitAngleVel) - v2.angle(avoidDest);
            var turnAngle = Math.min(
                order.unit.turnSpeed * (v2.mag(order.unit.vel) + 500) / order.unit.maxSpeed * 0.2, // max angle without losing speed
                Math.abs(destAngle)
            );

            if(destAngle < 0 && destAngle > -Math.PI || destAngle > Math.PI) {
                v2.rotate(unitAngleVel, turnAngle, avoidDest);
            } else {
                v2.rotate(unitAngleVel, -turnAngle, avoidDest);
            }

            return v2.add(v2.scale(v2.norm(avoidDest), v2.mag(order.unit.vel) + 500), order.unit.pos);
        }
    }
}
