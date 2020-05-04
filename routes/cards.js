const Card = require("../models/Card");
const router = require("express").Router();
const utilities = require("../common/utilities");

// Return all cards
router.get("/all", (req, res, next) => {
  Card.find()
    .then(cards => {
      cards = cards.map(card => card.toJSONapi());
      res.json(cards);
    })
    .catch(next);
});

// Search by every filter
router.get("/", function(req, res, next) {
  const dbQuery = {};
  const sortQuery = {};

  // Card Types
  if (typeof req.query.cardTypes !== "undefined") {
    dbQuery.cardType = { $in: req.query.cardTypes };
  } else {
    const err = new Error("cardType is missing");
    err.status = 400;
    next(err);
  }

  // Attributes
  if (typeof req.query.attributes !== "undefined") {
    dbQuery.attribute = { $in: req.query.attributes };
  }

  // Levels
  if (typeof req.query.levels !== "undefined") {
    dbQuery.level = { $in: req.query.levels.map(level => Number(level)) };
  }

  // Monster Types
  if (typeof req.query.monsterTypes !== "undefined") {
    dbQuery.monsterType = { $in: req.query.monsterTypes };
  }

  // Types
  if (typeof req.query.types !== "undefined") {
    const types = { $in: [], $nin: [] };
    const possibleEffectMonsterCardTypes = ["ritual", "fusion", "synchro"];

    // Effect Monsters
    const effectIndex = req.query.types.indexOf("effect");
    if (effectIndex > -1) {
      req.query.types.splice(effectIndex, 1);

      types.$in.push("effect");
      types.$nin.push(...possibleEffectMonsterCardTypes);
    }

    // Ritual, Fusion, Synchro Monsters
    for (const possibleEffectMonsterCardType of possibleEffectMonsterCardTypes) {
      const possibleEffectMonsterCardTypeIndex = req.query.types.indexOf(
        possibleEffectMonsterCardType
      );
      if (possibleEffectMonsterCardTypeIndex > -1) {
        req.query.types.splice(possibleEffectMonsterCardTypeIndex, 1);

        types.$in.push(possibleEffectMonsterCardType);
        types.$nin = types.$nin.filter(
          type => type !== possibleEffectMonsterCardType
        );
      }
    }

    // Include the rest of the remaining types
    types.$in.push(...req.query.types);

    if (types.$in.length === 0) {
      delete types.$in;
    }

    if (types.$nin.length === 0) {
      delete types.$nin;
    }

    // Add types to $and query
    dbQuery.$and = [{ types }];
  }

  // Card Effects
  if (typeof req.query.cardEffects !== "undefined") {
    const cardEffects = {};

    // Non-Effect Monsters
    const nonEffectIndex = req.query.cardEffects.indexOf("non-effect");
    if (nonEffectIndex > -1) {
      req.query.cardEffects.splice(nonEffectIndex, 1);

      cardEffects.$nin = ["effect"];
    }

    // Monster Abilities & Tuner Monsters (The rest of the remaining Card Effects)
    if (req.query.cardEffects.length > 0) {
      cardEffects.$in = [...req.query.cardEffects];
    }

    // eslint-disable-next-line
    if (!dbQuery.hasOwnProperty("$and")) {
      dbQuery.$and = [];
    }

    dbQuery.$and.push({ types: cardEffects });
  }

  // Text
  if (typeof req.query.text !== "undefined") {
    const $regex = {
      $regex: new RegExp(utilities.escapeRegExp(req.query.text), "i")
    };
    dbQuery.$or = [{ name: $regex }, { text: $regex }];
  }

  // PRIMARY Sort field & Sort order
  if (
    typeof req.query.sortField !== "undefined" &&
    typeof req.query.sortOrder !== "undefined"
  ) {
    sortQuery[req.query.sortField] = req.query.sortOrder;
  } else {
    // DEFAULT Sort field & Sort order = name & asc
    sortQuery.name = "asc";
  }

  // SECONDARY Sort field & Sort order
  if (typeof sortQuery.name === "undefined") {
    if (req.query.cardTypes.length > 1) {
      sortQuery.cardType = "asc";
    }
    sortQuery.name = "asc";
  }

  // In case of sorting possible null values, 2 queries are needed to ensure that null values are always at the end
  if (
    ["level", "atk", "def"].includes(req.query.sortField) &&
    req.query.cardTypes.length > 1 &&
    req.query.cardTypes.includes("monster")
  ) {
    const noNullCardsQuery = Card.find(dbQuery)
      .where(req.query.sortField)
      .ne(null)
      .sort(sortQuery);

    const nullCardsQuery = Card.find(dbQuery)
      .where(req.query.sortField)
      .eq(null)
      .sort(sortQuery);

    Promise.all([noNullCardsQuery, nullCardsQuery])
      .then(([noNullCards, nullCards]) => {
        // In case of sorting possible "?" values, place them correctly at the start or end
        noNullCards = utilities.spliceQuestionMarkCards(
          noNullCards,
          req.query.sortField,
          req.query.sortOrder
        );

        const cards = noNullCards
          .concat(nullCards)
          .map(card => card.toJSONapi());
        res.json(cards);
      })
      .catch(next);

    return;
  }

  Card.find(dbQuery)
    .sort(sortQuery)
    .then(cards => {
      if (
        ["level", "atk", "def"].includes(req.query.sortField) &&
        req.query.cardTypes.length === 1 &&
        req.query.cardTypes.includes("monster")
      ) {
        // In case of sorting possible "?" values, place them correctly at the start or end
        cards = utilities.spliceQuestionMarkCards(
          cards,
          req.query.sortField,
          req.query.sortOrder
        );
      }

      cards = cards.map(card => card.toJSONapi());
      res.json(cards);
    })
    .catch(next);
});

module.exports = router;
