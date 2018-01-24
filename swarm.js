/*
 * Swarm unit named "AI"
 */

ai.addAiRule({
    filter: unit => unit.spec.name === "AI",
    ai: function(unit) {
        this.run = function() {
            /*
            var enemy = movement.spread(unit, order.findThing(unit, target => 
                target.unit && target.side === otherSide(unit.side) &&
                v2.distance(unit.pos, target.pos) < 1000));
                */
            var enemy = order.findThing(unit, target => 
                target.unit && target.side === otherSide(unit.side) &&
                v2.distance(unit.pos, target.pos) < 1000)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            if(unit.orders.length > 0)
                return;
            var point = movement.spread(unit, order.findThing(unit, target =>
                target.commandPoint &&
                (target.side !== unit.side || target.capping > 0)));
            if(point && point.commandPoint) {
                var tgtPos = movement.inRange(unit, unit.tgt.pos, unit.tgt.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    }
});

ai.setFieldRule(i => {
    if(buildBar.specToUnit(commander.buildBar[i]).name === "AI") {
        return 100 - commander.buildQ.length;
    }
    return 0;
});

ai.enabled = true;
