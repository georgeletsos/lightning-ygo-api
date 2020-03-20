const Card = require("../models/Card");
const router = require("express").Router();

// Return all cards
router.get("/all", (req, res, next) => {
  Card.find()
    .then(cards => {
      cards = cards.map(card => card.toJSONapi());
      res.json(cards);
    })
    .catch(next);
});

// Search by text only
router.get("/", function(req, res, next) {
  const sortQuery = {};
  const reqQueryClone = Object.assign({}, req.query);

  if (
    typeof reqQueryClone.sortField !== "undefined" &&
    typeof reqQueryClone.sortOrder !== "undefined"
  ) {
    if (["level", "atk", "def"].includes(reqQueryClone.sortField)) {
      sortQuery.cardType = "asc";
    }

    sortQuery[reqQueryClone.sortField] = reqQueryClone.sortOrder;

    delete reqQueryClone.sortField;
    delete reqQueryClone.sortOrder;
  }

  if (
    Object.entries(reqQueryClone).length === 1 &&
    typeof reqQueryClone.text !== "undefined"
  ) {
    const $regex = { $regex: new RegExp(reqQueryClone.text, "i") };

    if (typeof sortQuery.name === "undefined") {
      sortQuery.name = "asc";
    }

    Card.find({ $or: [{ name: $regex }, { text: $regex }] })
      .sort(sortQuery)
      .then(cards => {
        cards = cards.map(card => card.toJSONapi());
        res.json(cards);
      })
      .catch(next);
  } else {
    next();
  }
});

// Search by every filter
router.get("/", function(req, res, next) {
  const dbQuery = {};
  const sortQuery = {};

  if (typeof req.query.cardType !== "undefined") {
    dbQuery.cardType = req.query.cardType;
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
    dbQuery.types = {};

    const nonEffectIndex = req.query.types.indexOf("non-effect");
    if (nonEffectIndex > -1) {
      req.query.types.splice(nonEffectIndex, 1);

      dbQuery.types.$nin = "effect";
    }

    dbQuery.types.$in = req.query.types;
  }

  if (typeof req.query.text !== "undefined") {
    const $regex = { $regex: new RegExp(req.query.text, "i") };
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
