const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoServer = new MongoMemoryServer();
const database = require("../database");
const Card = require("../models/Card");
const mocks = require("./mocks");

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

it("`fetchMissingCards()` - should find any missing cards between the API and the database)", async () => {
  expect.assertions(1);

  const missingCards = await database.fetchMissingCards();
  expect(missingCards).not.toHaveLength(0);
}, 30000);

it("`convertMissingCards(missingCards)` - should convert any given missing cards based on the database schema", async () => {
  expect.assertions(1);

  const convertedMissingCards = await database.convertMissingCards(
    mocks.mockMissingCards
  );

  const convertedMissingCardsWithout_id = JSON.parse(
    JSON.stringify(convertedMissingCards)
  );
  convertedMissingCardsWithout_id.forEach(convertedMissingCard => {
    delete convertedMissingCard._id;
  });

  expect(convertedMissingCardsWithout_id).toMatchSnapshot();
}, 30000);

it("should save a card to the database", async () => {
  expect.assertions(10);

  const convertedMissingCards = await database.convertMissingCards(
    mocks.mockMissingCards
  );
  const convertedCard = convertedMissingCards[2];

  const savedCard = await Card.create(convertedCard);
  expect(savedCard.cardType).toEqual(convertedCard.cardType);
  expect(savedCard.name).toEqual(convertedCard.name);
  expect(savedCard.attribute).toEqual(convertedCard.attribute);
  expect(savedCard.level).toEqual(convertedCard.level);
  expect(savedCard.monsterType).toEqual(convertedCard.monsterType);
  expect(savedCard.types).toEqual(convertedCard.types);
  expect(savedCard.text).toEqual(convertedCard.text);
  expect(savedCard.atk).toEqual(convertedCard.atk);
  expect(savedCard.def).toEqual(convertedCard.def);
  expect(savedCard.image).toEqual(convertedCard.image);
}, 30000);
