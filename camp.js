r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "MELON",
    ai: function(unit) {
        this.getValue = function(team) {
            var rst = 0;
            for(var player of intp.players) {
                if(player.side === team) {
                    rst += player.money;
                    for(var i in intp.things) {
                        var thing = intp.things[i];
                        if(thing.unit && thing.owner === player.number) {
                            rst += thing.cost;
                        }
                    }
                }
            }
            return rst;
        }

        this.run = function() {
            var vDiff = this.getValue(commander.side) - this.getValue(otherSide(commander.side));

            var eSpawn = order.findThings(tgt =>
                tgt.spawn && tgt.side !== unit.side)[0];

            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side !== unit.side &&
                tgt.cloak === 0 &&
                (tgt.cost > 300 || tgt.maxHP > 300), 2200)[0];

            var enemyDist = 10000;
            if(enemy) {
                enemyDist = v2.distance(unit.pos, enemy.pos);
                if(enemyDist < 2000 &&
                    (v2.mag(enemy.vel) <= unit.speed || Math.abs(v2.angle(v2.sub(unit.pos, enemy.pos, [])) - v2.angle(enemy.vel)) < Math.PI / 2)) {
                    order.follow(enemy);
                    return;
                }
            }

            var closestMelons = order.findThings(tgt =>
                tgt.unit && tgt.name === unit.name && tgt.side === unit.side
                , -1, eSpawn.pos);

            if(closestMelons.length >= 2 && closestMelons[0].id === unit.id &&
                v2.distance(closestMelons[1].pos, eSpawn.pos) - v2.distance(unit.pos, eSpawn.pos) > unit.radius * 2) {

                if(enemyDist < unit.weaponRange)
                    order.hold();
                else {
                    order.stop();
                    return;
                }
            } else {
                var distAway = Math.min(10000 - Math.max(vDiff * 2, 2000),
                    closestMelons[0] ? (v2.distance(closestMelons[0].pos, eSpawn.pos) + unit.radius * 2) : 9000);
                if(v2.distance(unit.pos, eSpawn.pos) <= distAway) {
                    if(enemyDist < unit.weaponRange)
                        order.hold();
                    else {
                        order.stop();
                        return;
                    }
                } else
                    order.unhold();
            }

            if(enemy)
                order.follow(enemy);
            else
                order.move(eSpawn.pos);
        }
    },
    build: function(unit) {
        if(commander.money > unit.cost)
            build.buildUnits(1, 0);
    }
});

r26Ai.addAiRule({
    filter: unit => unit.mainWeapon instanceof parts.RingTurret && unit.cost < 100,
    ai: function(unit) {
        this.run = function() {

            var avoidDest = movement.avoidShots(unit.hp);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            if(unit.energy / unit.storeEnergy > 0.8) this.resting = false;

            if(this.resting || !unit.mainWeapon.working) {
                order.stop();
                this.resting = true;
                return;
            }

            var enemy = movement.spread(order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side), 1000));
            if(enemy) {
                let toSend = Math.floor(enemy.cost / unit.cost);
                let toFollow = movement.spread([enemy], toSend);
                if(toFollow) {
                    order.follow(toFollow);
                    return;
                }
            }

            var avoidDest = movement.avoidShots(0);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            var point = movement.spread(order.findThings(tgt =>
                tgt.commandPoint &&
                (tgt.side !== unit.side || tgt.capping > 0)).slice(0, 2));
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    },
    build: function b(unit) {

        if(!b.last || b.last > sim.step) {
            b.last = -1000;
            return;
        }

        var want = 6;
        var pointCount = order.findThings(tgt =>
            tgt.commandPoint && tgt.side === commander.side).length;

        if(sim.step - b.last > unit.cost * want / (10 + pointCount) * 16 * 1.8) {
            build.buildUnits(want, 1);
            b.last = sim.step;
        }
    }
});

r26Ai.addAiRule({
    filter: unit => unit.name === "RASPBERRY",
    ai: function(unit) {
        this.run = function() {

            var avoidDest = movement.avoidShots(unit.hp);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            var eSpawn = order.findThings(tgt =>
                tgt.spawn && tgt.side !== unit.side)[0];

            var melon = order.findThings(tgt =>
                tgt.unit && tgt.name === "MELON" && tgt.side === unit.side, -1, eSpawn.pos)[0];

            var enemy = movement.spread(order.findThings(tgt =>
                tgt.unit && tgt.side !== unit.side &&
                tgt.hp <= 300, 3000));
            if(enemy && (!melon || v2.distance(eSpawn.pos, enemy.pos) - v2.distance(eSpawn.pos, melon.pos) > -1500)) {
                order.follow(enemy);
            } else {
                var avoidDest = movement.avoidShots(20);
                if(avoidDest) {
                    order.move(avoidDest);
                    return;
                }

                if(melon) {
                    let toDist = melon.radius + unit.radius + 100;
                    if(v2.distance(unit.pos, melon.pos) > 500)
                        order.move(movement.inRange(melon.pos, toDist));
                }
            }
        };
    },
    build: function() {
        var melonCount = order.findThings(tgt =>
            tgt.name === "MELON" && condition.isMyUnit(tgt)).length;
        build.keepUnits(Math.min(melonCount, 2), 3);
    }
});

r26Ai.enabled = true;
