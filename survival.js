survivalWave = function() {
    if(sim.state !== "running" || sim.serverType !== "survival")
        return 0;
    for(let i = chat.lines.length-1; i >= 0; i--) {
        let line = chat.lines[i];
        if(line.channel === chat.channel && line.name === "Server") {
            if(/Get ready/.test(line.text))
                return 0;

            let match = /Spawning wave (\d+)/.exec(line.text);
            if(match)
                return +match[1];
        }
    }
    return 0;
}

Math.fmod = function(a,b) { return Number((a - (Math.floor(a / b) * b)).toPrecision(8)); };
function wrapAngle(th) {
    let rst = Math.fmod(th + Math.PI, 2 * Math.PI);
    return rst < 0 ? rst + Math.PI : rst - Math.PI;
}

say = function(msg) {
    if(chat.channel === "local") {
        chat.lines.push({
            text: msg,
            name: commander.name,
            color: commander.color,
            channel: chat.channel,
            time: Date.now()
        });
    } else {
        message = {
            text: msg,
            channel: chat.channel
        };
        rootNet.send("message", message)
    }
}

r26Ai.clearAiRule();

r26Ai.addAiRule({
    filter: unit => unit.name === "BERRY",
    ai: function(unit) {
        this.run = function() {

            let enemy = order.findThings(tgt =>
                tgt.unit && //tgt.weaponDPS * 16 < unit.hp &&
                tgt.side !== unit.side &&
                (!(tgt.cost > 500 || tgt.maxHP > 800) ||
                tgt.maxSpeed * 16 >= 150), 2500)[0];
            if(enemy) {
                let flak = order.findWeapons(enemy, w => w instanceof parts.FlackTurret || w instanceof parts.TeslaTurret)[0];
                if(flak && enemy.energy > 1000) {
                    let des = movement.fleeRange(enemy.pos, flak.range + unit.radius);
                    if(des) {
                        order.move(des);
                        return;
                    }
                }
                let dist = v2.distance(enemy.pos, unit.pos);
                if(dist < 400) {
                    order.follow(enemy);
                    return;
                } else if(dist < 800) {
                    let toSend = Math.floor(enemy.cost / unit.cost);
                    let toFollow = movement.spread([enemy], toSend);
                    if(toFollow) {
                        order.follow(toFollow);
                        return;
                    }
                }
            }

            let avoidDest = movement.avoidShots(15, bullet => !bullet.instant && v2.mag(bullet.vel) * 16 < 750);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            let points = order.findThings(target =>
                target.commandPoint &&
                (target.side !== unit.side || target.capping > 0) &&
                !(condition.inRangeWeapon(target.pos, unit.side,
                    weapon => weapon.range >= 610 &&
                    (weapon.instant || weapon.tracking)) ||
                    condition.inRangeDps(target.pos, unit.side, 100)), -1,
                order.findThings(tgt => tgt.spawn && !tgt.side !== unit.side)[0].pos);

            let point = movement.spread(points);
            if(point) {
                let tgtPos = movement.inRange(point.pos, point.radius);
                if(tgtPos) {
                    order.move(tgtPos);
                }
                return;
            }

            if(enemy) {
                order.follow(enemy);
                return;
            }

            order.move([0, 0]);
        }
    },
    build: function(unit) {
        if(commander.money < unit.cost) return;
        let wave = survivalWave();
        if(commander.buildQ.length == 0)
            build.buildUnits(100, 10);
        build.keepUnits(15, 3);
    }
});

r26Ai.addAiRule({
    filter: unit => unit.name === "LYCHEE",
    ai: function(unit) {

        this.run = function() {

            let avoidDest = movement.avoidShots(150, bullet => bullet.hitPos);
            if(avoidDest) {
                order.move(avoidDest);
                return;
            }

            let enemy = order.findThings(tgt =>
                tgt.unit && tgt.side !== unit.side)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            if(unit.energy / unit.storeEnergy < 0.9) {
                order.stop();
                return;
            }

            let spawn = order.findThings(tgt =>
                tgt.spawn && tgt.side !== unit.side)[0];
            let point = order.findThings(tgt =>
                tgt.commandPoint, -1, spawn.pos)[0];
            if(point) {
                order.move(movement.inRange(point.pos, point.radius));
            }
        }
    },
    build: function(unit) {
        if(commander.money < unit.cost) return;
        let wave = survivalWave();
        if(wave >= 2) {
            build.keepUnits(10, 3);
        }
    }
});

r26Ai.addAiRule({
    filter: unit => unit.name === "GUAVA",
    ai: function(unit) {
        this.run = function() {
            let bullets = order.findThings(tgt =>
                tgt.missile && tgt.side !== unit.side,
                unit.weaponRange);

            if(bullets.length > 0) {
                var target = v2.scale(bullets.reduce((a, b) => v2.add(a, b.pos), [0, 0]), 1 / bullets.length);
            } else {
                let enemy = order.findThings(tgt =>
                    tgt.unit && tgt.side !== unit.side && tgt.hp <= 180)[0];
                if(enemy)
                    var target = enemy.pos;
            }

            if(target) {
                let angle = wrapAngle(v2.angle(v2.sub(target, unit.pos, [])) - unit.rot);
                if(angle < 1) {
                    order.move(movement.inRange(target, unit.weaponRange));
                    return;
                }
            }

            let spawn = order.findThings(tgt =>
                tgt.spawn && tgt.side !== unit.side)[0];
            if(spawn) {
                order.move(movement.inRange(spawn.pos, spawn.radius));
            } else {
                order.move([0, 0]);
            }
        };
    },
    build: function(unit) {
        if(commander.money < unit.cost) return;
        let wave = survivalWave();
        if(wave % 4 == 3)
            build.keepUnits(Math.min(wave, 5), 2);
    }
});

r26Ai.addAiRule({
    filter: unit => unit.name === "DRAGON",
    ai: function(unit) {
        this.run = function() {
            let bullets = order.findThings(tgt =>
                tgt.missile && tgt.side !== unit.side,
                unit.weaponRange);

            let enemy = order.findThings(tgt =>
                tgt.unit && tgt.side !== unit.side &&
                (tgt.maxHP > 400 || tgt.maxSpeed < 80), 1000)
                    .sort((a, b) => b.cost - a.cost)[0];
            if(enemy) {
                order.follow(enemy);
                return;
            }

            let spawn = order.findThings(tgt =>
                tgt.spawn && tgt.side !== unit.side)[0];
            if(spawn) {
                order.move(movement.inRange(spawn.pos, spawn.radius));
            } else {
                order.move([0, 0]);
            }
        };
    },
    build: function(unit) {
        if(commander.money < unit.cost) return;
        let wave = survivalWave();
        if(wave > 1 && wave % 4 == 0)
            build.keepUnits(Math.max(commander.money / 3 / unit.cost, 10), 1);
    }
});

r26Ai.addAiRule({
    filter: unit => unit.name === "LIME",
    ai: function(unit) {
        this.run = function() {
            let enemy = order.findThings(tgt =>
                tgt.unit && tgt.side !== unit.side && tgt.cost > 100)[0];

            if(enemy) {
                let angle = wrapAngle(v2.angle(v2.sub(enemy.pos, unit.pos, [])) - unit.rot);
                if(angle < 1) {
                    order.move(movement.inRange(enemy.pos, unit.weaponRange * 0.8));
                    return;
                }
            }

            let spawn = order.findThings(tgt =>
                tgt.spawn && tgt.side !== unit.side)[0];
            if(spawn) {
                order.move(movement.inRange(spawn, spawn.radius));
            } else {
                order.move([0, 0]);
            }
        };
    },
    build: function(unit) {
        if(commander.money < unit.cost) return;
        let wave = survivalWave();
        if(wave > 4 && (wave % 4 == 1 || wave % 4 == 2))
            build.keepUnits(Math.max(commander.money / 2 / unit.cost, 5), 0);
    }
});

r26Ai.addAiRule({
    filter: unit => unit.parts.filter(p => p instanceof parts.AOEWarhead).length == 16,
    ai: function(unit) {
        this.run = function() {
            if(unit.id % 5 == r26Ai.step % 5) order.destruct();
        };
    },
    build: function b(unit) {
        let wave = survivalWave();
        if(wave > 10) {
            if(!b.said) {
                say("You won!");
                setTimeout(() => network.send("surrender"), 5000);
                b.said = true;
            }
            build.keepUnits(100, -1);
        } else {
            b.said = false;
        }
    }
});


r26Ai.enabled = true;
