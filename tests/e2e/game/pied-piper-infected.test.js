const { describe, it, before, after } = require("mocha");
const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../../../app");
const Config = require("../../../config");
const { resetDatabase } = require("../../../src/helpers/functions/Test");

chai.use(chaiHttp);
const { expect } = chai;

const credentials = { email: "test@test.fr", password: "secret" };
let players = [
    { name: "Dag", role: "vile-father-of-wolves" },
    { name: "Dig", role: "pied-piper" },
    { name: "Deg", role: "villager" },
    { name: "Dog", role: "villager" },
    { name: "Døg", role: "villager" },
];
let token, game;

describe("O - Tiny game of 5 players in which the pied piper is infected and so, looses his powers and can't win alone", () => {
    before(done => resetDatabase(done));
    after(done => resetDatabase(done));
    it("👤 Creates new user (POST /users)", done => {
        chai.request(app)
            .post("/users")
            .auth(Config.app.basicAuth.username, Config.app.basicAuth.password)
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });
    it("🔑 Logs in successfully (POST /users/login)", done => {
        chai.request(app)
            .post(`/users/login`)
            .auth(Config.app.basicAuth.username, Config.app.basicAuth.password)
            .send(credentials)
            .end((err, res) => {
                expect(res).to.have.status(200);
                token = res.body.token;
                done();
            });
    });
    it("🎲 Creates game with JWT auth (POST /games)", done => {
        chai.request(app)
            .post("/games")
            .set({ Authorization: `Bearer ${token}` })
            .send({ players })
            .end((err, res) => {
                expect(res).to.have.status(200);
                game = res.body;
                done();
            });
    });
    it("👪 All elect the pied piper as the sheriff (POST /games/:id/play)", done => {
        players = game.players;
        chai.request(app)
            .post(`/games/${game._id}/play`)
            .set({ Authorization: `Bearer ${token}` })
            .send({ source: "all", action: "elect-sheriff", votes: [{ from: players[0]._id, for: players[1]._id }] })
            .end((err, res) => {
                expect(res).to.have.status(200);
                game = res.body;
                done();
            });
    });
    it("🐺 Vile father of wolf eats a villager (POST /games/:id/play)", done => {
        players = game.players;
        chai.request(app)
            .post(`/games/${game._id}/play`)
            .set({ Authorization: `Bearer ${token}` })
            .send({ source: "werewolves", action: "eat", targets: [{ player: players[2]._id }] })
            .end((err, res) => {
                expect(res).to.have.status(200);
                game = res.body;
                done();
            });
    });
    it("📣 Pied piper charms two villagers (POST /games/:id/play)", done => {
        chai.request(app)
            .post(`/games/${game._id}/play`)
            .set({ Authorization: `Bearer ${token}` })
            .send({
                source: "pied-piper", action: "charm", targets: [
                    { player: players[3]._id },
                    { player: players[4]._id },
                ],
            })
            .end((err, res) => {
                expect(res).to.have.status(200);
                game = res.body;
                expect(game.players[3].attributes).to.deep.include({ name: "charmed", source: "pied-piper" });
                expect(game.players[4].attributes).to.deep.include({ name: "charmed", source: "pied-piper" });
                done();
            });
    });
    it("🕺️ Charmed players meet each other (POST /games/:id/play)", done => {
        chai.request(app)
            .post(`/games/${game._id}/play`)
            .set({ Authorization: `Bearer ${token}` })
            .send({ source: "charmed", action: "meet-each-other" })
            .end((err, res) => {
                expect(res).to.have.status(200);
                game = res.body;
                done();
            });
    });
    it("👪 All vote for a villager (POST /games/:id/play)", done => {
        players = game.players;
        chai.request(app)
            .post(`/games/${game._id}/play`)
            .set({ Authorization: `Bearer ${token}` })
            .send({ source: "all", action: "vote", votes: [{ from: players[0]._id, for: players[3]._id }] })
            .end((err, res) => {
                expect(res).to.have.status(200);
                game = res.body;
                expect(game.players[3].isAlive).to.be.false;
                expect(game.players[3].murdered).to.deep.equals({ by: "all", of: "vote" });
                done();
            });
    });
    it("🐺 Vile father of wolf infects the pied piper (POST /games/:id/play)", done => {
        players = game.players;
        chai.request(app)
            .post(`/games/${game._id}/play`)
            .set({ Authorization: `Bearer ${token}` })
            .send({ source: "werewolves", action: "eat", targets: [{ player: players[1]._id, isInfected: true }] })
            .end((err, res) => {
                expect(res).to.have.status(200);
                game = res.body;
                done();
            });
    });
    it("🎲 Game is waiting for 'all' to 'vote' because pied piper lost his powers due to the infection", done => {
        expect(game.waiting[0]).to.deep.equals({ for: "all", to: "vote" });
        done();
    });
    it("👪 All vote for the vile father of wolves (POST /games/:id/play)", done => {
        players = game.players;
        chai.request(app)
            .post(`/games/${game._id}/play`)
            .set({ Authorization: `Bearer ${token}` })
            .send({ source: "all", action: "vote", votes: [{ from: players[1]._id, for: players[0]._id }] })
            .end((err, res) => {
                expect(res).to.have.status(200);
                game = res.body;
                expect(game.players[0].isAlive).to.be.false;
                expect(game.players[0].murdered).to.deep.equals({ by: "all", of: "vote" });
                done();
            });
    });
    it("🎲 Game is not won by pied piper even if all alive players are charmed because he is infected", done => {
        expect(game.waiting[0]).to.deep.equals({ for: "werewolves", to: "eat" });
        expect(game.status).to.equals("playing");
        expect(game.players.every(({ isAlive, role, attributes }) => !isAlive || role.current === "pied-piper" ||
            attributes?.find(({ name }) => name === "charmed"))).to.be.true;
        done();
    });
});