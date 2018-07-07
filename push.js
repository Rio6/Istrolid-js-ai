r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "a",
    ai: function(unit) {
        this.run = function() {

            var point = order.findThings(-1, target =>
                target.commandPoint && condition.isEnemySide(target))[0];
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    },
    build: function(unit) {
        var count = order.findThings(-1, tgt =>
            tgt.name === unit.name && condition.isMyUnit(tgt)).length;
        build.buildUnit(5, 1);
    }
});
r26Ai.addAiRule({
    filter: unit => unit.name === "b",
    ai: function(unit) {
        this.run = function() {

            var point = order.findThings(-1, target =>
                target.commandPoint && condition.isEnemySide(target))[0];
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    },
    build: function(unit) {
        var count = order.findThings(-1, tgt =>
            tgt.name === unit.name && condition.isMyUnit(tgt)).length;
        build.buildUnit(5, 1);
    }
});
r26Ai.addAiRule({
    filter: unit => unit.name === "c",
    ai: function(unit) {
        this.run = function() {

            var point = movement.spread(order.findThings(-1, target =>
                target.commandPoint));
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    },
    build: function(unit) {
        var count = order.findThings(-1, tgt =>
            tgt.name === unit.name && condition.isMyUnit(tgt)).length;
        build.buildUnit(5, 1);
    }
});
r26Ai.addAiRule({
    filter: unit => unit.name === "d",
    ai: function(unit) {
        this.run = function() {

            var point = movement.spread(order.findThings(-1, target =>
                target.commandPoint));
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    },
    build: function(unit) {
        var count = order.findThings(-1, tgt =>
            tgt.name === unit.name && condition.isMyUnit(tgt)).length;
        build.buildUnit(5, 1);
    }
});
r26Ai.addAiRule({
    filter: unit => unit.name === "e",
    ai: function(unit) {
        this.run = function() {

            var point = order.findThings(-1, target =>
                target.commandPoint && condition.isEnemySide(target))[0];
            if(point) {
                var tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                    return;
                }
            }
        }
    },
    build: function(unit) {
        var count = order.findThings(-1, tgt =>
            tgt.name === unit.name && condition.isMyUnit(tgt)).length;
        build.buildUnit(5, 1);
    }
});

r26Ai.enabled = true;
