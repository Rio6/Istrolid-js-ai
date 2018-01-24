ai.clearAiRule();

ai.addAiRule({
    filter: unit => unit.spec.name === "BANANA",
    ai: function(unit) {
        this.run = function() {
            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side) &&
                tgt.cost > 500 &&
                v2.distance(tgt.pos, unit.pos) < 2000,
                unit)[0];
            if(enemy) {
                if(v2.distance(unit.pos, enemy.pos) < 1500)
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

        var spawns = order.findThings(tgt => tgt.spawn);
        this.s2s = v2.create();
        v2.sub(spawns[1].pos, spawns[0].pos, this.s2s);

        this.run = function() {
            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side) &&
                tgt.cost > 500 &&
                v2.distance(tgt.pos, unit.pos) < 2200,
                unit)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            var banana = order.findThings(tgt =>
                tgt.unit &&
                tgt.owner === unit.owner && tgt.side === unit.side &&
                tgt.spec.name === "BANANA", unit)[0];
            if(banana) {
                if(v2.distance(unit.pos, banana.pos) > 2000) {
                    order.follow(banana);
                    return;
                }

                if(v2.dot(unit.pos, this.s2s) > v2.dot(banana.pos, this.s2s)) {
                    order.stop();
                    return;
                } else if(banana.orders[0] && banana.orders[0].dest) {
                    order.move(banana.orders[0].dest);
                    return;
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
                v2.distance(unit.pos, target.pos) < 1000, unit));
                */
            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side) &&
                v2.distance(unit.pos, tgt.pos) < 1000, unit)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            var point = movement.spread(unit, order.findThings(tgt =>
                tgt.commandPoint &&
                (tgt.side !== unit.side || tgt.capping > 0), unit));
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

        var spawns = order.findThings(tgt => tgt.spawn);
        this.s2s = v2.create();
        v2.sub(spawns[1].pos, spawns[0].pos, this.s2s);

        this.run = function() {
            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side) &&
                v2.distance(unit.pos, tgt.pos) < 1120, unit)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            var banana = order.findThings(tgt =>
                tgt.unit && tgt.side === unit.side &&
                tgt.spec.name === "BANANA" && tgt.owner === commander.number,
                unit)[0];
            if(banana) {
                if(v2.distance(unit.pos, banana.pos) > 600) {
                    order.follow(banana);
                    return;
                }

                var offsetted = v2.add(v2.scale(v2.norm(this.s2s), 500, v2.create()), banana.pos);
                if(v2.dot(unit.pos, this.s2s) > v2.dot(offsetted, this.s2s)) {
                    order.stop();
                    return;
                } else if(banana.orders[0] && banana.orders[0].dest) {
                    order.move(banana.orders[0].dest);
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
        if(bananaCount > 0 && commander.money > unit.cost + 1000 ||
            bananaCount <= 0 && commander.money > unit.cost)
            return 1;
    } else if(unit.name === "PEAR") {
        var pearCount = order.findThings(
            tgt => tgt.unit && tgt.spec.name === "PEAR").length;
        var bananaCount = order.findThings(
            tgt => tgt.unit && tgt.spec.name === "BANANA").length;
        if(pearCount < bananaCount * 2 && bananaCount > 0 && commander.money > unit.cost + 500)
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
