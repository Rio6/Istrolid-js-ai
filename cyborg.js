r26Ai.clearAiRule();
r26Ai.setManualBuild(true);

squads = {};

getDivisionPos = div => {
    return v2.scale(div.units.reduce((a, b) => v2.add(a, b.pos), [0, 0]), 1 / div.units.length);
}

removeFromDivision = unit => {
    if(unit.div) {
        let index = unit.div.units.indexOf(unit);
        if(index >= 0) {
            unit.div.units.splice(index, 1);
        }
        unit.div = null;
    }
}

moveToDivision = name => {
    if(squads[name])
        var div = squads[name];
    else
        var div = (squads[name] = {units: []});

    if(order.unit.div === div) return;
    removeFromDivision(order.unit)

    order.unit.div = div;
    div.units.push(order.unit);
}

predictedPos = (obj, time = 16) => {
    return v2.add(v2.scale(obj.vel, time, []), obj.pos);
}

predictedTime = (obj, pos, range) => {
    var sqr = function(x) {
        return x * x;
    };

    var v = {
        x: -obj.vel[0] + 0,
        y: -obj.vel[1] + 0
    };

    var u = {
        x: obj.pos[0] + 0,
        y: obj.pos[1] + 0
    };

    var s = {
        x: pos[0] + 0,
        y: pos[1] + 0
    };

    var a = sqr(v.x) + sqr(v.y);
    var b = 2 * s.x * v.x - 2 * u.x * v.x + 2 * s.y * v.y - 2 * u.y * v.y;
    var c = sqr(s.x) - 2 * s.x * u.x + sqr(u.x) + sqr(s.y) - 2 * s.y * u.y + sqr(u.y) - sqr(range);

    return (-b - Math.sqrt(sqr(b) - 4 * a * c)) / (2 * a);
}

wrapAngle = th => {
    th = (th + Math.PI) % (2 * Math.PI);
    return th + (th < 0 ? Math.PI : -Math.PI);
}

Cmdr = function() {
    this.spawn = sim.findSpawnPoint(commander.side);
    this.range = 5000;
    this.base = commander.rallyPoint;

    for(let i in sim.things) {
        let t = sim.things[i];
        if(t.unit && t.side === commander.side && t.div) {
            removeFromDivision(t);
        }
    }

    squads = {};

    this.run = () => {

        if(v2.mag(commander.rallyPoint) > 0)
            this.base = commander.rallyPoint;
        else
            this.base = [(5000 - this.range) * Math.sign(this.spawn.pos[0]), this.spawn.pos[1] / 3];

        if(squads.swarm) {
            let div = squads.swarm;
            let divPos = getDivisionPos(div);

            div.units = div.units.filter(u => !u.dead);
            div.target = this.base;

            let capping = false;
            sim.unitSpaces[otherSide(commander.side)].findInRange(divPos, types.CommandPoint.prototype.radius, t => {
                if(t.commandPoint && v2.distance(t.pos, divPos) < t.radius) {
                    capping = true;
                    return true;
                }
                return false
            });

            if(!capping) {
                let cps = order.findThings(t => t.commandPoint && Math.abs(t.pos[0] - this.spawn.pos[0]) < this.range, -1, this.spawn.pos);
                for(cp of cps) {
                    let targets = order.findThings(tgt => tgt.unit && tgt.side !== commander.side &&
                        tgt.weapons.length === 1 && tgt.cost < 150 &&
                        (v2.distance(tgt.pos, cp.pos) < 1000 ||
                            predictedTime(tgt, cp.pos, 600) < 80),
                        -1, cp);

                    let need = targets.length;
                    let target = v2.scale(targets.reduce((a, b) => v2.add(a, predictedPos(b)), [0, 0]), 1 / targets.length);

                    if(need === 0 && cp.side !== commander.side)
                        need = 1;

                    if(need > 0) {
                        if(div.units.length >= need) {
                            let range = 600;
                            if(v2.distance(cp.pos, target) < range || v2.distance(divPos, target) < range) {
                                div.mode = "attack";
                                div.target = target;
                            } else {
                                div.mode = "goto";
                                div.target = cp.pos;
                            }
                        } else {
                            div.mode = "goto";
                            div.target = divPos;
                        }
                        break;
                    }
                }
            }
        }
    }
};

r26Ai.addAiRule({
    filter: unit => unit.weapons.length === 1 && unit.cost < 100,
    build: unit => {
    },
    ai: function(unit) {
        this.run = () => {

            if(!cmdr) return;

            if(unit.state === "charging") {
                if(unit.energy / unit.storeEnergy > 0.9)
                    unit.state = "running";
                else {
                    order.move(movement.inRange(cmdr.base, 300));
                    return;
                }
            } else {
                if(unit.energy / unit.storeEnergy < 0.2) {
                    unit.state = "charging";
                    removeFromDivision(unit);
                    return;
                }
            }

            if(!unit.div) {
                moveToDivision("swarm");
            }

            let enemy = order.findThings(tgt => tgt.unit && tgt.side === otherSide(unit.side) && v2.distance(predictedPos(tgt, 32), unit.pos) < 500, 800)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }


            let divPos = getDivisionPos(unit.div);

            let divDist = v2.distance(unit.pos, divPos);
            if(divDist > 500 && unit.div.target && v2.distance(unit.div.target, predictedPos(unit)) > divDist) {
                order.move(divPos);
                return;
            }

            if(unit.div.target) {
                switch(unit.div.mode) {
                    case "goto":
                        order.move(movement.inRange(unit.div.target, 200));
                        break;
                    case "attack":
                        {
                            let range = 300;
                            let dest = movement.inRange(unit.div.target, range);

                            if(!dest) break;

                            let line = v2.rotate(v2.norm(v2.sub(dest, divPos, [])), Math.PI / 2);
                            let span = unit.div.units.length / 2 * 80;
                            let unitDest = v2.add(v2.scale(line, Math.max(-span, Math.min(span, v2.dot(v2.sub(unit.pos, dest, []), line)))), dest);

                            order.move(movement.inRange(unitDest, 20));
                            break;
                        }
                }
            }
        }
    }
});

if(typeof(cyborgIntv) !== "undefined")
    clearInterval(cyborgIntv);

cmdr = null;
cyborgIntv = setInterval(function c() {
    if(c.lastState !== sim.state) {
        c.lastState = sim.state;
        if(sim.state !== "running") {
            cmdr = null;
        }
    }

    if(sim.state === "running") {
        if(!cmdr)
            cmdr = new Cmdr();
        cmdr.run();
    }
}, 1000);


r26Ai.enabled = true;
