const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoServer = new MongoMemoryServer();
const database = require("../database");
const Card = require("../models/Card");

beforeAll(async () => {
  const uri = await mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

it("should find any missing cards (API - database), convert and insert them into the database", async () => {
  expect.assertions(12);

  const missingCards = await database.fetchMissingCards();
  expect(missingCards).not.toHaveLength(0);

  const firstMissingCard = missingCards[0];
  const convertedCards = await database.convertMissingCards([firstMissingCard]);
  expect(convertedCards).not.toHaveLength(0);

  const firstConvertedCard = convertedCards[0];
  const savedCard = await Card.create(firstConvertedCard);

  console.log(firstMissingCard);
  console.log(firstConvertedCard);

  expect(savedCard.cardType).not.toEqual(firstConvertedCard.cardType);
  expect(savedCard.name).toEqual(firstConvertedCard.name);
  expect(savedCard.attribute).toEqual(firstConvertedCard.attribute);
  expect(savedCard.level).toEqual(firstConvertedCard.level);
  expect(savedCard.monsterType).toEqual(firstConvertedCard.monsterType);
  expect(savedCard.types).toEqual(firstConvertedCard.types);
  expect(savedCard.text).toEqual(firstConvertedCard.text);
  expect(savedCard.atk).toEqual(firstConvertedCard.atk);
  expect(savedCard.def).toEqual(firstConvertedCard.def);
  expect(savedCard.image).toEqual(firstConvertedCard.image);
}, 60000);
