r26Ai.clearAiRule();
r26Ai.setManualBuild(true);

var flockConfig = {
    seperateRange: 80,
    cohesionRange: 1000,
    alignRange: 200,
    alignMinSpeed: 0,

    seekMult: 4,
    fleeMult: 6,
    seperateMult: 0.2,
    cohesionMult: 1,
    alignMult: 1,
    currentMult: 0.02,
};

var Flock = function(agent) {

    this.agent = agent;

    this.seek = (pos) => {
        return v2.norm(v2.sub(pos, this.agent.pos, []));
    };

    this.flee = (pos) => {
        return v2.norm(v2.sub(this.agent.pos, pos, []));
    };

    this.seperate = (agents) => {
        return this.flee(v2.scale(agents
            .filter(({pos}) => v2.distance(pos, this.agent.pos) < flockConfig.seperateRange)
            .reduce((a, {pos}) => v2.add(a, pos), [0, 0]),
            1 / agents.length));
    };

    this.cohesion = (agents) => {
        return this.seek(v2.scale(agents
            .filter(({pos}) => v2.distance(pos, this.agent.pos) < flockConfig.cohesionRange)
            .reduce((a, {pos}) => v2.add(a, pos), [0, 0]),
            1 / agents.length));
    };

    this.align = (agents) => {
        let avgVel = v2.scale(agents
            .filter(({pos}) => v2.distance(pos, this.agent.pos) < flockConfig.alignRange)
            .reduce((a, {vel}) => v2.add(a, vel), [0, 0]), 1 / agents.length);
        if(v2.mag(avgVel) > flockConfig.alignMinSpeed)
            return v2.norm(avgVel);
        else
            return [0, 0];
    };
};

var AgentManager = function() {
    this.lastStep = 0;
    this.agents = [];

    this.update = (filter) => {
        if(r26Ai.step != this.lastStep) {
            this.agents = order.findThings(t => t.unit && condition.isMyUnit(t) && filter(t));
        }
    };
};
var agentMgr = new AgentManager();

var fighterFilter = unit => unit.weapons.length === 0 && unit.cost < 100;

r26Ai.addAiRule({
    filter: fighterFilter,
    build: unit => {
    },

    ai: function(unit) {
        this.flock = new Flock(unit);

        this.run = () => {
            agentMgr.update(fighterFilter);

            let destDir = [0, 0];
            v2.add(destDir, v2.scale(this.flock.seperate(agentMgr.agents), flockConfig.seperateMult));
            v2.add(destDir, v2.scale(this.flock.cohesion(agentMgr.agents), flockConfig.cohesionMult));
            v2.add(destDir, v2.scale(this.flock.align(agentMgr.agents), flockConfig.alignMult));
            v2.add(destDir, v2.scale(unit.vel, flockConfig.currentMult, []));

            let enemy = order.findThings(t =>
                (t.unit && t.weapons.length > 0 || t.bullet) &&
                t.side !== unit.side)[0];
            if(enemy && v2.distance(enemy.pos, unit.pos) < 2000)
                v2.add(destDir, v2.scale(this.flock.flee(enemy.pos), flockConfig.fleeMult));

            let point = order.findThings(tgt => tgt.commandPoint && tgt.side !== unit.side)[0];
            if(point)
                v2.add(destDir, v2.scale(this.flock.seek(point.pos), flockConfig.seekMult));

            v2.norm(destDir);
            v2.scale(destDir, 800);

            order.move(v2.add(destDir, unit.pos));
        };
    }
});

r26Ai.enabled = true;
