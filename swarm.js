/*
 * Swarm unit named "BERRY"
 */

r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.spec.name === "BERRY",
    ai: function(unit) {
        this.run = function() {
            /*
            var enemy = movement.spread(unit, order.findThings(target =>
                target.unit && target.side === otherSide(unit.side) &&
                v2.distance(unit.pos, target.pos) < 1000));
                */
            var enemy = order.findThings(target =>
                target.unit && target.side === otherSide(unit.side) &&
                v2.distance(unit.pos, target.pos) < 1000)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            var point = movement.spread(unit, order.findThings(target =>
                target.commandPoint &&
                (target.side !== unit.side || target.capping > 0)));
            if(point && point.commandPoint) {
                var tgtPos = movement.inRange(unit, point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    }
});

r26Ai.setFieldRule(unit => {
    if(unit.name === "BERRY") {
        return 100 - commander.buildQ.length;
    }
    return 0;
});

r26Ai.enabled = true;
