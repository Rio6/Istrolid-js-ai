/*
 * Swarm unit named "BERRY"
 */

r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "BERRY",
    ai: function(unit) {
        this.run = function() {

            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side), 1000)[0];
            if(enemy) {
                order.follow(enemy);
                if(v2.distance(unit.pos, enemy.pos) < 1200)
                    return;
            }

            var avoidDest = movement.avoidShots(20, bullet => !bullet.instant);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            if(enemy) return;

            var point = movement.spread(order.findThings(target =>
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
    },
    build: function() {
        build.buildUnits(100, 1);
    }
});

r26Ai.enabled = true;
