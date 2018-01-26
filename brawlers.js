/*
 * Use BANANA as main ship
 * 2 PEARs follow 1 BANANA
 * 3 LONGAN in front of 1 BANANA
 * 5 BERRY on field to cap
 */

ai.clearAiRule();

ai.addAiRule({
    filter: unit => unit.spec.name === "BANANA",
    ai: function(unit) {
        this.run = function() {
            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side) &&
                tgt.cost > 500 && tgt.maxSpeed * 16 < 100 &&
                v2.distance(tgt.pos, unit.pos) < 2000)[0];
            if(enemy) {
                if(v2.distance(unit.pos, enemy.pos) < 1270)
                    order.hold();
                else
                    order.unhold();

                order.follow(enemy);
                return;
            }

            order.unhold();

            var spawn = order.findThings(tgt =>
                tgt.spawn && tgt.side !== unit.side);
            var point = order.findThings(tgt =>
                tgt.commandPoint, spawn[0])[0];
            if(point) {
                var dest = movement.inRange(unit, point.pos, point.radius);
                if(dest)
                    order.move(dest);
            }
        }
    }
});

ai.addAiRule({
    filter: unit => unit.spec.name === "PEAR",

    ai: function(unit) {

        this.run = function() {
            var banana = order.findThings(tgt =>
                tgt.unit &&
                tgt.owner === unit.owner && tgt.side === unit.side &&
                tgt.spec.name === "BANANA")[0];
            if(banana) {
                var distBanana = v2.distance(unit.pos, banana.pos);
                if(distBanana > 2000) {
                    order.follow(banana);
                    return;
                }

                var enemy = order.findThings(tgt =>
                    tgt.unit && tgt.side === otherSide(unit.side) &&
                    tgt.hp > 800)[0];
                if(enemy) {
                    order.follow(enemy);
                    if(v2.distance(enemy.pos, banana.pos) < 2000) {
                        order.unhold();
                        return;
                    }
                }

                if(v2.dot(unit.pos, banana.vel) > v2.dot(banana.pos, banana.vel)) {
                    order.hold();
                    return;
                } else {
                    order.unhold();
                    if(!enemy && banana.preOrders[0]) {
                        var dest;
                        if(banana.preOrders[0].dest)
                            dest = banana.preOrders[0].dest;
                        else
                            dest = sim.things[banana.preOrders[0].targetId].pos;

                        order.move(dest);
                        return;
                    }
                }
            }
        }
    }
});

ai.addAiRule({
    filter: unit => unit.spec.name === "BERRY",
    ai: function(unit) {
        this.run = function() {

            if(unit.energy <= 0)
                order.destruct();

            /*
            var enemy = movement.spread(unit, order.findThings(target =>
                target.unit && target.side === otherSide(unit.side) &&
                v2.distance(unit.pos, target.pos) < 1000));
                */
            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side) &&
                v2.distance(unit.pos, tgt.pos) < 1000)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            var point = movement.spread(unit, order.findThings(tgt =>
                tgt.commandPoint &&
                (tgt.side !== unit.side || tgt.capping > 0)));
            if(point) {
                var tgtPos = movement.inRange(unit, unit.tgt.pos, unit.tgt.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    }
});

ai.addAiRule({
    filter: unit => unit.spec.name === "LONGAN",
    ai: function(unit) {

        this.run = function() {
            var banana = order.findThings(tgt =>
                tgt.unit && tgt.side === unit.side &&
                tgt.spec.name === "BANANA" && tgt.owner === commander.number,
                unit)[0];
            if(banana) {
                var distBanana = v2.distance(unit.pos, banana.pos);
                if(distBanana > 800) {
                    order.follow(banana);
                    return;
                }

                var enemy = order.findThings(tgt =>
                    tgt.unit && tgt.side === otherSide(unit.side) &&
                    v2.distance(tgt.pos, banana.pos) < 600, banana)[0];
                if(enemy) {
                    order.follow(enemy);
                    return;
                }

                var offsetted = v2.add(v2.scale(v2.norm(banana.vel, v2.create), 300), banana.pos);
                if(v2.dot(unit.pos, banana.vel) > v2.dot(offsetted, banana.vel)) {
                    order.stop();
                    return;
                } else if(banana.preOrders[0]) {
                    var dest;
                    if(banana.preOrders[0].dest)
                        dest = banana.preOrders[0].dest;
                    else
                        dest = sim.things[banana.preOrders[0].targetId].pos;

                    order.move(dest);
                    return;
                }
            }
        }
    }
});

ai.setFieldRule((unit, number) => {

    if(number > 0) return;

    if(unit.name === "BANANA") {
        var bananaCount = order.findThings(
            tgt => tgt.unit && tgt.spec.name === "BANANA").length;
        if(bananaCount > 0 && commander.money > unit.cost + 500 ||
            bananaCount <= 0 && commander.money > unit.cost)
            return 1;
    } else if(unit.name === "PEAR") {
        var pearCount = order.findThings(
            tgt => tgt.unit && tgt.spec.name === "PEAR").length;
        var bananaCount = order.findThings(
            tgt => tgt.unit && tgt.spec.name === "BANANA").length;
        if(pearCount < bananaCount * 2 && bananaCount > 0 && commander.money > unit.cost)
            return 1;
    } else if(unit.name === "BERRY") {
        if(number < 1 && order.findThings(tgt => tgt.unit &&
            tgt.spec.name === "BERRY").length < 5)
            return 1;
    } else if(unit.name === "LONGAN" && commander.money > unit.cost * 3) {
        var bananaCount = order.findThings(
            tgt => tgt.unit && tgt.spec.name === "BANANA").length;
        var longanCount = order.findThings(
            tgt => tgt.unit && tgt.spec.name === "LONGAN").length;
        if(longanCount < bananaCount * 3)
            return 1;
    }

    return 0;
});

ai.enabled = true;
