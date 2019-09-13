r26Ai.clearAiRule();
r26Ai.setManualBuild(true);

var flockConfig = {
    seperateRange: 120,
    cohesionRange: 100,
    alignRange: 100,
    wanderTh: 1,

    seekMult: 1,
    fleeMult: 2,
    seperateMult: 0.6,
    cohesionMult: 1.2,
    alignMult: 2.2,
    wanderMult: 0.1,
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
        let count = 0;
        let avgPos = agents
            .filter(agent => agent !== this.agent)
            .filter(({pos}) => v2.distance(pos, this.agent.pos) < flockConfig.seperateRange)
            .filter(a => ++count)
            .reduce((a, {pos}) => v2.add(a, pos), [0, 0]);

        if(count > 0)
            return this.flee(v2.scale(avgPos, 1 / count));
        else
            return [0, 0];
    };

    this.cohesion = (agents) => {
        let count = 0;
        let avgPos = agents
            .filter(agent => agent !== this.agent)
            .filter(({pos}) => v2.distance(pos, this.agent.pos) < flockConfig.cohesionRange)
            .filter(a => ++count)
            .reduce((a, {pos}) => v2.add(a, pos), [0, 0]);

        if(count > 0)
            return this.seek(v2.scale(avgPos, 1 / count));
        else
            return [0, 0];
    };

    this.align = (agents) => {
        let avgVel = v2.scale(agents
            .filter(agent => agent !== this.agent)
            .filter(({pos}) => v2.distance(pos, this.agent.pos) < flockConfig.alignRange)
            .reduce((a, {vel}) => v2.add(a, vel), [0, 0]), 1 / agents.length);
        return v2.norm(avgVel);
    };

    this.wander = () => {
        return v2.pointTo([], (Math.random() * 2 - 1) * flockConfig.wanderTh + this.agent.rot);
    }
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

            let destDir = v2.scale(unit.vel, flockConfig.currentMult, []);

            v2.add(destDir, v2.scale(this.flock.seperate(agentMgr.agents), flockConfig.seperateMult));
            v2.add(destDir, v2.scale(this.flock.cohesion(agentMgr.agents), flockConfig.cohesionMult));
            v2.add(destDir, v2.scale(this.flock.align(agentMgr.agents), flockConfig.alignMult));
            v2.add(destDir, v2.scale(this.flock.wander(), flockConfig.wanderMult));

            //let enemy = order.findThings(t =>
            //    (t.unit && t.weapons.length > 0 || t.bullet) &&
            //    t.side !== unit.side)[0];
            //if(enemy && v2.distance(enemy.pos, unit.pos) < 2000)
            //    v2.add(destDir, v2.scale(this.flock.flee(enemy.pos), flockConfig.fleeMult));

            let point = order.findThings(tgt => tgt.commandPoint, types.CommandPoint.prototype.radius)[0];
            if(point)
                v2.add(destDir, v2.scale(this.flock.flee(point.pos), flockConfig.fleeMult));

            if(v2.mag(unit.pos) > 3000)
                //v2.add(destDir, v2.scale(this.flock.seek([0, 0]), flockConfig.seekMult));
                v2.add(destDir, v2.scale(this.flock.flee(v2.scale(unit.pos, 1.1, [])), flockConfig.seekMult));

            v2.norm(destDir);
            v2.scale(destDir, 800);

            order.move(v2.add(destDir, unit.pos));
        };
    }
});

r26Ai.enabled = true;
