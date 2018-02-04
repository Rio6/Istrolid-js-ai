/*
 * Swarm unit named "BERRY"
 */

r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.spec.name === "BERRY",
    ai: function(unit) {
        this.run = function() {

            var avoidDest = movement.avoidShots(1);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            /*
            var enemy = movement.spread(unit, order.findThings(1000, target =>
                target.unit && target.side === otherSide(unit.side)));
                */
            var enemy = order.findThings(1000, target =>
                target.unit && target.side === otherSide(unit.side))[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            var point = movement.spread(order.findThings(-1, target =>
                target.commandPoint &&
                (target.side !== unit.side || target.capping > 0)));
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
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
