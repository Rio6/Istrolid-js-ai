r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "KIWI",
    ai: function(unit) {
        this.run = function() {
            var dest; 

            var enemy = order.findThings(-1, tgt =>
                tgt.unit && condition.isEnemySide(tgt) &&
                tgt.weaponDPS > 0)[0];

            if(enemy) {
                dest = movement.fleeRange(enemy.pos, unit.weaponRange - unit.radius) ||
                    movement.inRange(enemy.pos, unit.weaponRange + unit.radius);
                if(dest) {
                    order.move(dest);
                }
                return;
            }
        }
    },
    build: function(unit) {
        var count = order.findThings(-1, tgt =>
            condition.isMyUnit(tgt) && tgt.name === unit.name).length;
        build.buildUnit(1 - count);
    }
});

r26Ai.addAiRule({
    filter: unit => unit.name === "BERRY",
    ai: function(unit) {

        this.lastPointCount = 0;

        this.run = function() {

            /*
            if(unit.energy <= 0)
                order.destruct();
                */

            var enemy = order.findThings(2500, tgt =>
                tgt.unit && //tgt.weaponDPS * 16 < unit.hp &&
                !(condition.hasWeapon(tgt, w => w instanceof parts.FlackTurret)
                    && tgt.energy > 3000) &&
                condition.isEnemySide(tgt))[0];
            if(enemy) {
                if(v2.distance(unit.pos, enemy.pos) < 1000) {
                    order.follow(enemy);
                    return;
                }
            }

            var avoidDest = movement.avoidShots(1, bullet => !bullet.instant);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            var fleeFrom = order.findThings(-1, tgt =>
                tgt.unit && condition.isEnemySide(tgt) &&
                tgt.hp >= 500)[0];// && condition.hasWeapon(tgt, w =>

            if(fleeFrom) {
                var fleeDest = movement.fleeRange(fleeFrom.pos, fleeFrom.weaponRange);
                if(fleeDest) {
                    order.move(fleeDest);
                    return;
                }
            }

            var points = order.findThings(-1, target =>
                target.commandPoint &&
                (condition.isEnemySide(target) || target.capping > 0) &&
                !(condition.inRangeWeapon(target.pos, unit.side,
                    weapon => weapon.range >= 610 &&
                    (weapon.instant || weapon.tracking)) ||
                    condition.inRangeDps(target.pos, unit.side, 100)));

            var point = movement.spread(points, this.lastPointCount !== points.length);
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                }
                return;
            }

            this.lastPointCount = points.length;

            if(enemy) {
                order.follow(enemy);
                return;
            }

            var banana = order.findThings(-1, tgt =>
                tgt.unit &&
                condition.isMyUnit(tgt) &&
                tgt.name === "BANANA")[0];

            if(banana) {
                var distBanana = v2.distance(unit.pos, banana.pos);
                if(distBanana > 1000) {
                    order.move(movement.inRange(banana.pos, 1000));
                    return;
                }

                var offsetted = v2.add(v2.scale(v2.norm(banana.vel, v2.create()), 300), banana.pos);
                if(banana.vel[0] === 0 && banana.vel[1] === 0 ||
                    v2.dot(unit.pos, banana.vel) > v2.dot(offsetted, banana.vel)) {
                    order.stop();
                    return;
                } else {
                    var bananaOrder = order.getUnitOrders(banana)[0];
                    if(bananaOrder) {
                        var dest = bananaOrder.dest;
                        if(dest) {
                            order.move(dest);
                            return;
                        }
                    }
                }

                var spawn = order.findThings(-1, tgt =>
                    tgt.spawn && condition.isEnemySide(tgt))[0];
                if(spawn) {
                    order.move(spawn.pos);
                    return;
                }
            }

            var spawn = order.findThings(-1, tgt =>
                tgt.spawn && !condition.isEnemySide(tgt))[0];

            var point = order.findThings(-1, tgt =>
                tgt.commandPoint, spawn)[0];
            if(point) {
                var dest = movement.inRange(point.pos, point.radius);
                if(dest)
                    order.move(dest);
            }
        }
    },
    build: function b(unit) {

        /*
        if(r26Ai.step < 20)
            b.last = r26Ai.step;

        if(!b.last)
            b.last = 1;

        var count = order.findThings(-1, tgt =>
            tgt.name === unit.name && condition.isMyUnit(tgt)).length;
        var bananaCount = order.findThings(-1,
            tgt => tgt.name === "BANANA" &&
            condition.isMyUnit(tgt)).length;
        var pearCount = order.findThings(-1,
            tgt => tgt.name === "PEAR" &&
            condition.isMyUnit(tgt)).length;

        if(bananaCount > 0 && (commander.money >= 676 && pearCount >= 2 || pearCount >= 1)) {
            var want = Math.min(Math.max(order.findThings(-1, tgt =>
                tgt.cost < 150 && condition.isEnemySide(tgt)).length, 5), 10);
            var pointCount = order.findThings(-1, tgt =>
                tgt.commandPoint && tgt.side === commander.side).length;

            if(r26Ai.step - b.last > unit.cost * want / (10 + pointCount) * 60) {//900) {
                build.buildUnit(want, 1);
                b.last = r26Ai.step;
            }
        } else {
            build.buildUnit(5 - count, 1);
        }
        */
    }
});

r26Ai.enabled = true;
