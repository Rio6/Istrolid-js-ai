r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "drone",
    ai: function(unit) {
        this.run = function() {

            var point = movement.spread(order.findThings(-1, target =>
                target.commandPoint));
            if(point) {
                var dest = movement.inRange(point.pos, 5);
                if(dest)
                    order.move(dest);
            }
        }
    },
    build: function(unit) {
    }
});

r26Ai.enabled = true;
