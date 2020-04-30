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

  if (typeof req.query.cardTypes !== "undefined") {
    dbQuery.cardType = { $in: req.query.cardTypes };
  } else {
    const err = new Error("cardType is missing");
    err.status = 400;
    next(err);
  }

  if (typeof req.query.attributes !== "undefined") {
    dbQuery.attribute = { $in: req.query.attributes };
  }

  if (typeof req.query.levels !== "undefined") {
    dbQuery.level = { $in: req.query.levels };
  }

  if (typeof req.query.monsterTypes !== "undefined") {
    dbQuery.monsterType = { $in: req.query.monsterTypes };
  }

  if (typeof req.query.types !== "undefined") {
    const possibleEffectMonsterCardTypes = ["ritual", "fusion", "synchro"];
    dbQuery.types = { $in: [], $nin: [] };

    // Effect Monsters
    const effectIndex = req.query.types.indexOf("effect");
    if (effectIndex > -1) {
      req.query.types.splice(effectIndex, 1);

      dbQuery.types.$in.push("effect");
      dbQuery.types.$nin.push(...possibleEffectMonsterCardTypes);
    }

    // Ritual, Fusion, Synchro Monsters
    for (const possibleEffectMonsterCardType of possibleEffectMonsterCardTypes) {
      const possibleEffectMonsterCardTypeIndex = req.query.types.indexOf(
        possibleEffectMonsterCardType
      );
      if (possibleEffectMonsterCardTypeIndex > -1) {
        req.query.types.splice(possibleEffectMonsterCardTypeIndex, 1);

        dbQuery.types.$in.push(possibleEffectMonsterCardType);
        dbQuery.types.$nin = dbQuery.types.$nin.filter(
          type => type !== possibleEffectMonsterCardType
        );
      }
    }

    // Non-Effect Monsters
    const nonEffectIndex = req.query.types.indexOf("non-effect");
    if (nonEffectIndex > -1) {
      req.query.types.splice(nonEffectIndex, 1);

      dbQuery.types.$nin.push("effect");
    }

    // Include the rest of the remaining types
    dbQuery.types.$in.push(...req.query.types);

    if (dbQuery.types.$in.length === 0) {
      delete dbQuery.types.$in;
    }
  }

  if (typeof req.query.text !== "undefined") {
    const $regex = {
      $regex: new RegExp(utilities.escapeRegExp(req.query.text), "i")
    };
    dbQuery.$or = [{ name: $regex }, { text: $regex }];
  }

  if (
    typeof req.query.sortField !== "undefined" &&
    typeof req.query.sortOrder !== "undefined"
  ) {
    sortQuery[req.query.sortField] = req.query.sortOrder;
  }

  if (typeof sortQuery.name === "undefined") {
    sortQuery.name = "asc";
  }

  Card.find(dbQuery)
    .sort(sortQuery)
    .then(cards => {
      cards = cards.map(card => card.toJSONapi());
      res.json(cards);
    })
    .catch(next);
});

module.exports = router;
