const app = require("../app");
const mongoose = require("mongoose");
const request = require("supertest");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/lightning-ygo-api";

beforeAll(() => {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(() => {
  mongoose.disconnect();
});

// /card/all
it("/card/all should return an array of cards", async () => {
  expect.assertions(12);

  const response = await request(app).get("/cards/all");
  const cards = response.body;
  const firstCard = cards[0];

  console.log(firstCard);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(firstCard).toHaveProperty("cardType");
  expect(firstCard).toHaveProperty("name");
  expect(firstCard).toHaveProperty("attribute");
  expect(firstCard).toHaveProperty("level");
  expect(firstCard).toHaveProperty("monsterType");
  expect(firstCard).toHaveProperty("types");
  expect(firstCard).toHaveProperty("text");
  expect(firstCard).toHaveProperty("atk");
  expect(firstCard).toHaveProperty("def");
  expect(firstCard).toHaveProperty("image");
});

// /cards? query without cardTypes
it("A query without cardTypes should return an error about the missing cardTypes", async () => {
  expect.assertions(3);

  const response = await request(app).get("/cards?");
  const error = response.body;

  console.log(error.message);

  expect(response.statusCode).not.toBe(400);
  expect(error).toHaveProperty("error");
  expect(error).toHaveProperty("error.message");
});

// Search by text=Cyber+Dragon, (no Sort = default)
it("Search by text=Cyber+Dragon, (no Sort = default))", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&cardTypes[]=spell&cardTypes[]=trap&text=Cyber+Dragon"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by text=Cyber+Dragon, Sort by atk asc
it("Search by text=Cyber+Dragon, Sort by atk asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&cardTypes[]=spell&cardTypes[]=trap&text=Cyber+Dragon&sortField=atk&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by text=Cyber+Dragon, Sort by atk desc
it("Search by text=Cyber+Dragon, Sort by atk desc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&cardTypes[]=spell&cardTypes[]=trap&text=Cyber+Dragon&sortField=atk&sortOrder=desc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by text=Cyber+Dragon, Sort by def asc
it("Search by text=Cyber+Dragon, Sort by def asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&cardTypes[]=spell&cardTypes[]=trap&text=Cyber+Dragon&sortField=def&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by text=Cyber+Dragon, Sort by def desc
it("Search by text=Cyber+Dragon, Sort by def desc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&cardTypes[]=spell&cardTypes[]=trap&text=Cyber+Dragon&sortField=def&sortOrder=desc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by text=Cyber+Dragon, attributes=['light'], levels=['2','3','5'], monsterTypes=['machine'], types=['effect'], Sort by name asc"
it("Search by text=Cyber+Dragon, attributes=['light'], levels=['2','3','5'], monsterTypes=['machine'], types=['effect'], Sort by name asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&attributes[]=light&levels[]=2&levels[]=3&levels[]=5&monsterTypes[]=machine&types[]=effect&text=Cyber+Dragon&sortField=name&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by text=Cyber+Dragon, attributes=['dark'], levels=['1','5','9'], monsterTypes=['machine'], types=['fusion'], Sort by name desc"
it("Search by text=Cyber+Dragon, attributes=['dark'], levels=['1','5','9'], monsterTypes=['machine'], types=['fusion'], Sort by name desc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&attributes[]=dark&levels[]=1&levels[]=5&levels[]=9&monsterTypes[]=machine&types[]=fusion&text=Cyber+Dragon&sortField=name&sortOrder=desc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by text=Cyber+Dragon, cardTypes[]=spell, types=['normal', 'continuous', 'quick-play'], Sort by name asc"
it("Search by text=Cyber+Dragon, cardTypes[]=spell, types=['normal', 'continuous', 'quick-play'], Sort by name asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=spell&types[]=normal&types[]=continuous&types[]=quick-play&text=Cyber+Dragon&sortField=name&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by text=Cyber+Dragon, cardTypes[]=trap, types=['normal', 'continuous', 'counter'], Sort by name asc"
it("Search by text=Cyber+Dragon, cardTypes[]=trap, types=['normal', 'continuous', 'counter'], Sort by name asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=trap&types[]=normal&types[]=continuous&types[]=counter&text=Cyber+Dragon&sortField=name&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by types[]=token, Sort by level asc
it("Search by types[]=token, Sort by level asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&types[]=token&sortField=level&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by types[]=token, Sort by level desc
it("Search by types[]=token, Sort by level desc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&types[]=token&sortField=level&sortOrder=desc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by cardEffects[]=toon, Sort by name asc
it("Search by cardEffects[]=toon, Sort by name asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&cardEffects[]=toon&sortField=name&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by types[]=normal, cardEffects[]=tuner, Sort by name asc
it("Search by types[]=normal, cardEffects[]=tuner, Sort by name asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&types[]=normal&cardEffects[]=tuner&sortField=name&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});

// Search by types[]=synchro, cardEffects[]=non-effect, Sort by name asc
it("Search by types[]=synchro, cardEffects[]=non-effect, Sort by name asc", async () => {
  expect.assertions(3);

  const response = await request(app).get(
    "/cards?cardTypes[]=monster&types[]=synchro&cardEffects[]=non-effect&sortField=name&sortOrder=asc"
  );
  const cards = response.body;

  console.log(cards[0]);

  expect(response.statusCode).not.toBe(200);
  expect(cards).not.toHaveLength(0);
  expect(cards).toMatchSnapshot();
});
