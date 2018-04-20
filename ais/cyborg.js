r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "BERRY",
    ai: function(unit) {
        this.run = function() {
            if(condition.unitSelected(unit)) return;
            if(condition.hasPlayerOrder(unit)) console.log("DEBUG");

            var avoidDest = movement.avoidShots(20, bullet => !bullet.instant);
            if(avoidDest) {
                if(condition.hasPlayerOrder(unit))
                    this.orders = order.getUnitOrders(unit);

                order.move(avoidDest);
                return;
            }

            if(this.orders) {
                order.runOrders(this.orders);
                this.orders = null;
                return;
            }
        }
    }
});

r26Ai.addAiRule({
    filter: unit => JSON.stringify(unit.spec) === "{\"parts\":[{\"pos\":[-30,0],\"type\":\"Engine04\",\"dir\":0},{\"pos\":[10,30],\"type\":\"Solar1x1\",\"dir\":0},{\"pos\":[-10,30],\"type\":\"Wing1x1Notch\",\"dir\":0},{\"pos\":[30,10],\"type\":\"Solar1x1\",\"dir\":0},{\"pos\":[-30,30],\"type\":\"Wing1x1Notch\",\"dir\":0},{\"pos\":[30,-10],\"type\":\"Solar1x1\",\"dir\":0},{\"pos\":[30,30],\"type\":\"Battery1x1\",\"dir\":0},{\"pos\":[0,0],\"type\":\"CloakGenerator\",\"dir\":0}],\"name\":\"\",\"aiRules\":[[\"Finish player orders\"],[\"@attackTypes enemy that is @absoluteTypes then # within #m\",\"Flee\",\"more DPS\",1,900],[\"When #% of energy, @chargeTypes\",5,\"flee enemies\"],[\"@capTypes command points within #m\",\"Spread to\",10000]]}",
    ai: function(unit) {
        this.run = function() {

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
    }
});

r26Ai.addAiRule({
    filter: unit => JSON.stringify(unit.spec) === "{\"parts\":[{\"pos\":[30,30],\"type\":\"Solar1x1\",\"dir\":0},{\"pos\":[50,30],\"type\":\"Wing1x1Notch\",\"dir\":0},{\"pos\":[-10,80],\"type\":\"VArmor1x1Hook\",\"dir\":0},{\"pos\":[0,20],\"type\":\"CloakGenerator\",\"dir\":0},{\"pos\":[10,-20],\"type\":\"Engine03\",\"dir\":0},{\"pos\":[-10,50],\"type\":\"Battery1x1\",\"dir\":0},{\"pos\":[-40,10],\"type\":\"JumpEngine\",\"dir\":0},{\"pos\":[-40,40],\"type\":\"ShapedWarhead\",\"dir\":0},{\"pos\":[20,60],\"type\":\"ShapedWarhead\",\"dir\":0},{\"pos\":[40,0],\"type\":\"ShapedWarhead\",\"dir\":0},{\"pos\":[-20,-20],\"type\":\"ShapedWarhead\",\"dir\":0}],\"name\":\"\",\"aiRules\":[]}",
    ai: function(unit) {
        this.run = function() {

            if(condition.hasPlayerOrder(unit)) return;

            var enemy = order.findThings(tgt =>
                tgt.unit && tgt.side === otherSide(unit.side) &&
                tgt.maxHP >= 100 && tgt.maxHP <= 200,
                1500)[0];
            if(enemy) {
                order.follow(enemy);
                if(v2.distance(enemy.pos, unit.pos) > 200 + unit.radius + enemy.radius)
                    order.hold();
                else
                    order.unhold();
                return;
            } else {
                order.stop();
            }
        }
    }
});

r26Ai.enabled = false;
