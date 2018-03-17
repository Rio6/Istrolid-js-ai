/*
 * Use BANANA as main ship (spinal plasma brawler)
 * 2 PEAR follow 1 BANANA (phase brawler)
 * 3 LYCHEE in front of 1 BANANA (tri-torp boat)
 * 5 BERRY on field to cap (lb fighters)
 */

r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "BANANA",
    ai: function(unit) {
        this.run = function() {
            var enemy = order.findThings(4000, tgt =>
                tgt.unit && condition.isEnemySide(tgt) &&
                tgt.cloak === 0 &&
                (tgt.cost > 500 || tgt.maxHP > 800)
                && tgt.maxSpeed * 16 < 150)[0];
            if(enemy) {
                if(v2.distance(unit.pos, enemy.pos) < 1270)
                    order.hold();
                else
                    order.unhold();

                order.follow(enemy);
                return;
            }

            order.unhold();

            var spawn = order.findThings(-1, tgt =>
                    tgt.spawn && condition.isEnemySide(tgt))[0];

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

        if(r26Ai.step < 200)
            b.spawned = false;

        if(!b.spawned) {
            var pointCount = order.findThings(-1, tgt =>
                tgt.commandPoint && tgt.side === commander.side).length;
            if(commander.money <= 1700 || pointCount <= 2) {
                b.spawned = true;
            }
        }

        if(commander.money < 2328) {
            if(!b.spawned)
                return;
        } else {
            b.spawned = true;
        }

        var pearCount = order.findThings(-1,
            tgt => tgt.name === "PEAR" &&
            condition.isMyUnit(tgt)).length;
        var bananaCount = order.findThings(-1,
            tgt => tgt.name === "BANANA" &&
            condition.isMyUnit(tgt)).length;

        if(bananaCount > 0 && bananaCount * 2 <= pearCount)
            build.buildUnit(1, 5);
        else
            build.buildUnit(1 - bananaCount, 2);
    }
});

r26Ai.addAiRule({
    filter: unit => unit.name === "PEAR",

    ai: function(unit) {

        this.lastEnemyCount = 0;

        this.run = function() {
            var banana = order.findThings(-1, tgt =>
                tgt.unit &&
                condition.isMyUnit(tgt) &&
                tgt.name === "BANANA")[0];
            if(banana) {
                var bananaOrder = order.getUnitOrders(banana)[0];
                var distBanana = v2.distance(unit.pos, banana.pos);
                if(distBanana > 2000) {
                    order.follow(banana);
                    return;
                }

                var enemies = order.findThings(-1, tgt =>
                    tgt.unit && condition.isEnemySide(tgt) &&
                    tgt.maxHP > 500);

                var enemy = enemies[0];

                if(enemy) {
                    if(v2.distance(enemy.pos, unit.pos) > 1500) {

                        if(enemies.length >= 3 && bananaOrder)
                            enemies = enemies.filter(tgt => tgt.id !== bananaOrder.targetId);

                        enemy = movement.spread(enemies, enemies.length !== this.lastEnemyCount);
                    }

                    this.lastEnemyCount = enemies.length;

                    order.follow(enemy);
                    if(v2.distance(enemy.pos, banana.pos) < 2000) {
                        order.unhold();
                        return;
                    }
                } else {
                    if(bananaOrder) {
                        var dest;
                        if(bananaOrder.dest)
                            dest = bananaOrder.dest;
                        else
                            dest = sim.things[bananaOrder.targetId].pos;

                        order.move(dest);
                    }
                }

                if(banana.vel[0] === 0 && banana.vel[1] === 0 ||
                    v2.dot(unit.pos, banana.vel) > v2.dot(banana.pos, banana.vel)) {
                    order.hold();
                } else {
                    order.unhold();
                }
            } else {

                order.unhold();

                var enemy = order.findThings(-1, tgt =>
                    tgt.unit && condition.isEnemySide(tgt) &&
                    tgt.maxHP > 500)[0];
                if(enemy) {
                    order.follow(enemy);
                    return;
                }

                var spawn = order.findThings(-1, tgt =>
                    tgt.spawn && condition.isEnemySide(tgt))[0];
                var point = order.findThings(-1, tgt =>
                    tgt.commandPoint, spawn)[0];
                if(point) {
                    var dest = movement.inRange(point.pos, point.radius);
                    if(dest)
                        order.move(dest);
                }
            }
        }
    },
    build: function(unit) {
        var pearCount = order.findThings(-1,
            tgt => tgt.name === "PEAR" &&
            condition.isMyUnit(tgt)).length;
        var bananaCount = order.findThings(-1,
            tgt => tgt.name === "BANANA" &&
            condition.isMyUnit(tgt)).length;

        build.buildUnit(bananaCount * 2 - pearCount, 2);
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

        if(r26Ai.step < 20)
            b.last = r26Ai.step;

        if(!b.last)
            b.last = 1;

        var count = order.findThings(-1, tgt =>
            tgt.name === unit.name && condition.isMyUnit(tgt) && tgt.energy > 300).length;
        var bananaCount = order.findThings(-1,
            tgt => tgt.name === "BANANA" &&
            condition.isMyUnit(tgt)).length;
        var pearCount = order.findThings(-1,
            tgt => tgt.name === "PEAR" &&
            condition.isMyUnit(tgt)).length;

        if(bananaCount > 0 && !(commander.money >= 676 && pearCount < 2 || pearCount < 1)) {
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
    }
});

r26Ai.addAiRule({
    filter: unit => unit.name === "LYCHEE",
    ai: function(unit) {

        this.run = function() {

            var avoidDest = movement.avoidShots(150, bullet => bullet.hitPos);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            var banana = order.findThings(-1, tgt =>
                tgt.unit && condition.isMyUnit(tgt) &&
                tgt.name === "BANANA" && condition.isMyUnit(tgt),
                unit)[0];
            if(banana) {
                var distBanana = v2.distance(unit.pos, banana.pos);
                if(distBanana > 1000) {
                    order.follow(banana);
                    return;
                }

                var enemy = order.findThings(1000, tgt =>
                    tgt.unit && condition.isEnemySide(tgt), banana)[0];
                if(enemy) {
                    order.follow(enemy);
                    return;
                }

                var offsetted = v2.add(v2.scale(v2.norm(banana.vel, v2.create()), 300), banana.pos);
                if(banana.vel[0] === 0 && banana.vel[1] === 0 ||
                    v2.dot(unit.pos, banana.vel) > v2.dot(offsetted, banana.vel)) {
                    order.stop();
                    return;
                } else {
                    var bananaOrder = order.getUnitOrders(banana)[0];
                    if(!enemy && bananaOrder) {
                        var dest;
                        if(bananaOrder.dest)
                            dest = bananaOrder.dest;
                        else
                            dest = sim.things[bananaOrder.targetId].pos;

                        order.move(dest);
                        return;
                    }
                }
            } else {
                var enemy = order.findThings(-1, tgt =>
                    tgt.unit && condition.isEnemySide(tgt))[0];
                if(enemy) {
                    order.follow(enemy);
                    return;
                }
            }

            var spawn = order.findThings(-1, tgt =>
                tgt.spawn && condition.isEnemySide(tgt))[0];
            var point = order.findThings(-1, tgt =>
                tgt.commandPoint, spawn)[0];
            if(point) {
                var dest = movement.inRange(point.pos, point.radius);
                if(dest)
                    order.move(dest);
            }
        }
    },
    build: function(unit) {
        var count = order.findThings(-1, tgt => tgt.name === unit.name &&
            condition.isMyUnit(tgt)).length;
        var bananaCount = order.findThings(-1,
            tgt => tgt.name === "BANANA" &&
            condition.isMyUnit(tgt)).length;
        build.buildUnit(bananaCount * 3 - count, 4);
    }
});

r26Ai.enabled = true;
