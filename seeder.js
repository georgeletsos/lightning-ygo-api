const mongoose = require("mongoose");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const Card = require("./models/Card");
const ygoLists = require("./common/ygo-lists");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/lightning-ygo-api";
const UPLOAD_PATH = "/lightning_ygo_api/card_images";

// Set Cloudinary config
cloudinary.config(require("./config/cloudinary"));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("debug", true);

/**
 * Upload Image to Cloudinary.
 * @param {String} imageUrl Remote image url.
 * @param {String} folder End folder name (art, small or big).
 * @returns {String} Cloudinary image secure url.
 */
const uploadImage = async (imageUrl, folder) => {
  const uploadPath = `${UPLOAD_PATH}/${folder}/`;

  const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
    folder: uploadPath,
    use_filename: true,
    unique_filename: false
  });

  return uploadResponse.secure_url;
};

/**
 * Consume the api > upload images > seed the db
 */
(async () => {
  const apiResponse = await axios.get(
    "https://db.ygoprodeck.com/api/v6/cardinfo.php?format=Duel Links"
  );

  const apiCards = apiResponse.data;
  const dbCards = await Card.find();

  const diffCards = apiCards.filter(
    apiCard =>
      dbCards.filter(dbCard => dbCard.name === apiCard.name).length === 0
  );

  if (diffCards.length === 0) {
    console.log("There are no differences between the api and the db");
    return;
  }

  for (const apiCard of diffCards) {
    const apiCardTypes = apiCard.type
      .split(" ")
      .map(type => type.trim().toLowerCase())
      .filter(type => type !== "card");

    // Types
    let cardType = null;
    let monsterType = null;
    const types = [];
    for (const apiCardType of apiCardTypes) {
      // Token
      if (apiCardType === "token") {
        cardType = "monster";
        monsterType = apiCard.race.trim().toLowerCase();
        types.push("token");
        break;
      }

      // Describe Api Card Race as type or monster type
      if (["monster", "spell", "trap"].includes(apiCardType)) {
        cardType = apiCardType;

        const apiCardRace = apiCard.race.trim().toLowerCase();
        if (["spell", "trap"].includes(apiCardType)) {
          types.push(apiCardRace);
          break;
        } else if (apiCardType === "monster") {
          monsterType = apiCardRace;
        }

        continue;
      }

      types.push(apiCardType);
    }

    // In case of a possible Effect Monster Card Types, add the Effect type to the end
    const possibleEffectMonsterCardTypes = ["fusion", "synchro"];
    if (
      possibleEffectMonsterCardTypes.some(possibleEffectMonsterCardType =>
        types.includes(possibleEffectMonsterCardType)
      ) &&
      !ygoLists.nonEffectFusionMonsters
        .concat(ygoLists.nonEffectSynchroMonsters)
        .includes(apiCard.name) &&
      !types.includes("effect")
    ) {
      types.push("effect");
    }

    // In case of Effect Monsters with an Ability, add the Effect type to the end
    const abilities = ["flip", "gemini", "spirit", "toon", "union"];
    if (
      abilities.some(ability => types.includes(ability)) &&
      !types.includes("effect")
    ) {
      types.push("effect");
    }

    // Tuner
    if (types.includes("tuner")) {
      // In case of Normal Tuner Monsters, move the Normal type to the end
      if (types.includes("normal")) {
        const normalIndex = types.indexOf("normal");
        if (normalIndex < types.length - 1) {
          types.splice(normalIndex, 1);
          types.push("normal");
        }
      } else if (!types.includes("effect")) {
        // In case of Effect Tuner Monsters where the Effect type doesn't exist, add it to the end
        types.push("effect");
      }
    }

    // Images
    const apiCardImage = apiCard.card_images[0];
    const image = {
      id: apiCardImage.id,
      big: await uploadImage(apiCardImage.image_url, "big"),
      small: await uploadImage(apiCardImage.image_url_small, "small"),
      art: await uploadImage(
        apiCardImage.image_url.replace(/pics/gi, "pics_artgame"),
        "art"
      )
    };

    let atk = null;
    // eslint-disable-next-line
    if (apiCard.hasOwnProperty("atk")) {
      atk = apiCard.atk;

      // In case of 0 or ? ATK
      if (ygoLists.questionMarkAtkMonsters.includes(apiCard.name)) {
        apiCard.atk = "?";
      }
    }

    let def = null;
    // eslint-disable-next-line
    if (apiCard.hasOwnProperty("def")) {
      def = apiCard.def;

      // In case of 0 or ? DEF
      if (ygoLists.questionMarkDefMonsters.includes(apiCard.name)) {
        apiCard.def = "?";
      }
    }

    // Final Card
    const card = new Card({
      cardType,
      name: apiCard.name,
      attribute: apiCard.attribute
        ? apiCard.attribute.trim().toLowerCase()
        : null,
      level: apiCard.level ? apiCard.level : null,
      monsterType,
      types,
      text: apiCard.desc,
      atk,
      def,
      image
    });

    card.save().then(() => console.log(`${apiCard.name} was saved`));
  }
})();
