/*
 * Use BANANA as main ship
 * 2 PEARs follow 1 BANANA
 * 3 LONGAN in front of 1 BANANA
 * 5 BERRY on field to cap
 */

r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.spec.name === "BANANA",
    ai: function(unit) {
        this.run = function() {
            var enemy = order.findThings(2000, tgt =>
                tgt.unit && tgt.side === otherSide(unit.side) &&
                tgt.cost > 500 && tgt.maxSpeed * 16 < 150)[0];
            if(enemy) {
                if(v2.distance(unit.pos, enemy.pos) < 1270)
                    order.hold();
                else
                    order.unhold();

                order.follow(enemy);
                return;
            }

            order.unhold();

            /*
            var pears = order.findThings(2000, tgt =>
                tgt.unit && tgt.spec.name === "PEAR" &&
                tgt.owner === unit.owner && tgt.side === unit.side);
            */

            var spawn = order.findThings(-1, tgt =>
                    tgt.spawn && tgt.side !== unit.side)[0];
            /*
            if(pears.length < 2) {
                spawn = order.findThings(-1, tgt =>
                    tgt.spawn && tgt.side === unit.side[0]);
            } else {
                spawn = order.findThings(-1, tgt =>
                    tgt.spawn && tgt.side !== unit.side[0]);
            }
            */

            var point = order.findThings(-1, tgt =>
                tgt.commandPoint, spawn)[0];
            if(point) {
                var dest = movement.inRange(point.pos, point.radius);
                if(dest)
                    order.move(dest);
            }
        }
    }
});

r26Ai.addAiRule({
    filter: unit => unit.spec.name === "PEAR",

    ai: function(unit) {

        this.run = function() {
            var banana = order.findThings(-1, tgt =>
                tgt.unit &&
                tgt.owner === unit.owner && tgt.side === unit.side &&
                tgt.spec.name === "BANANA")[0];
            if(banana) {
                var bananaOrder = order.getUnitOrders(banana)[0];
                var distBanana = v2.distance(unit.pos, banana.pos);
                if(distBanana > 2000) {
                    order.follow(banana);
                    return;
                }

                var enemy = movement.spread(order.findThings(-1, tgt =>
                    tgt.unit && tgt.side === otherSide(unit.side) &&
                    tgt.maxHP > 500 &&
                    bananaOrder && tgt.id !== bananaOrder.targetId));
                if(enemy) {
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
                var enemy = movement.spread(order.findThings(-1, tgt =>
                    tgt.unit && tgt.side === otherSide(unit.side) &&
                    tgt.hp > 800));
                if(enemy) {
                    order.follow(enemy);
                    return;
                }

                var spawn = order.findThings(-1, tgt =>
                    tgt.spawn && tgt.side !== unit.side)[0];
                var point = order.findThings(-1, tgt =>
                    tgt.commandPoint, spawn)[0];
                if(point) {
                    var dest = movement.inRange(point.pos, point.radius);
                    if(dest)
                        order.move(dest);
                }
            }
        }
    }
});

r26Ai.addAiRule({
    filter: unit => unit.spec.name === "BERRY",
    ai: function(unit) {

        this.lastPointCount = 0;

        this.run = function() {

            if(unit.energy <= 0)
                order.destruct();

            var enemy = order.findThings(1000, tgt =>
                tgt.unit && tgt.side === otherSide(unit.side))[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            var avoidDest = movement.avoidShots(1);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            var points = order.findThings(-1, target =>
                target.commandPoint &&
                (target.side !== unit.side || target.capping > 0) &&
                !(condition.inRangeWeapon(target.pos, unit.side,
                    weapon => weapon.range > 800 && weapon.dps >= 55 &&
                    (weapon.instant || weapon.tracking)) ||
                    condition.inRangeDps(target.pos, unit.side, unit.hp)));

            if(this.lastPointCount !== points.length) {
                unit.tgt = null;
                this.lastPointCount = points.length;
            }

            var point = movement.spread(points);
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                }
                return;
            }

            var banana = order.findThings(-1, tgt =>
                tgt.unit &&
                tgt.owner === unit.owner && tgt.side === unit.side &&
                tgt.spec.name === "BANANA")[0];
            if(banana) {
                order.follow(banana);
                return;
            }
        }
    }
});

r26Ai.addAiRule({
    filter: unit => unit.spec.name === "LONGAN",
    ai: function(unit) {

        this.run = function() {

            var avoidDest = movement.avoidShots(0, bullet => bullet.aoe);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            var banana = order.findThings(-1, tgt =>
                tgt.unit && tgt.side === unit.side &&
                tgt.spec.name === "BANANA" && tgt.owner === commander.number,
                unit)[0];
            if(banana) {
                var distBanana = v2.distance(unit.pos, banana.pos);
                if(distBanana > 1000) {
                    order.follow(banana);
                    return;
                }

                var enemy = order.findThings(1000, tgt =>
                    tgt.unit && tgt.side === otherSide(unit.side), banana)[0];
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
                    tgt.unit && tgt.side === otherSide(unit.side))[0];
                if(enemy) {
                    order.follow(enemy);
                    return;
                }
            }

            var spawn = order.findThings(-1, tgt =>
                tgt.spawn && tgt.side !== unit.side)[0];
            var point = order.findThings(-1, tgt =>
                tgt.commandPoint, spawn)[0];
            if(point) {
                var dest = movement.inRange(point.pos, point.radius);
                if(dest)
                    order.move(dest);
            }
        }
    }
});

r26Ai.setFieldRule((unit, number) => {

    if(number > 0) return;

    if(unit.name === "BANANA") {
        var bananaCount = order.findThings(-1,
            tgt => tgt.unit && tgt.spec.name === "BANANA").length;
        if(bananaCount > 0 && commander.money > unit.cost + 500 ||
            bananaCount <= 0 && commander.money > unit.cost)
            return 1;
    } else if(unit.name === "PEAR") {
        var pearCount = order.findThings(-1,
            tgt => tgt.unit && tgt.spec.name === "PEAR").length;
        var bananaCount = order.findThings(-1,
            tgt => tgt.unit && tgt.spec.name === "BANANA").length;
        if(pearCount < bananaCount * 2 && bananaCount > 0 && commander.money > unit.cost)
            return 1;
    } else if(unit.name === "BERRY") {
        if(number < 1 && order.findThings(-1, tgt => tgt.unit &&
            tgt.spec.name === "BERRY").length < 5)
            return 1;
    } else if(unit.name === "LONGAN" && commander.money > unit.cost) {
        var bananaCount = order.findThings(-1,
            tgt => tgt.unit && tgt.spec.name === "BANANA").length;
        var longanCount = order.findThings(-1,
            tgt => tgt.unit && tgt.spec.name === "LONGAN").length;
        if(longanCount < bananaCount * 3)
            return 1;
    }

    return 0;
});

r26Ai.enabled = true;
