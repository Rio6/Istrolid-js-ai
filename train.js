r26Ai.clearAiRule();
r26Ai.setManualBuild(true);

var units = [];
var trainFilter = unit => unit.cost < 100 && unit.maxSpeed*16 > 300;

r26Ai.addAiRule({
    filter: trainFilter,
    ai: function(unit) {
        this.run = () => {
            let currentOrder = order.getUnitOrders(unit)[0];
            if(currentOrder && currentOrder.type === "Move")
                return;

            let index = -1;
            units.some((u, i) => {
                if(u.id === unit.id) {
                    index = i;
                    return true;
                }
                return false;
            });

            if(index >= 0) {
                order.follow(units[(index+1) % units.length]);
            }
        };
    }
});

if(r26Ai.trainIntv)
    clearInterval(r26Ai.trainIntv);
r26Ai.trainIntv = setInterval(() => {
    if(sim.state === "running" && r26Ai.enabled) {
        units = order.findThings(u => u.owner === commander.number && trainFilter(u));
        units.sort((a, b) => a.id - b.id);
        } else {
            units = [];
        }
}, 1000);

r26Ai.enabled = true;
