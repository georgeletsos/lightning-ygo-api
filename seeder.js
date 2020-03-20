const mongoose = require("mongoose");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const Card = require("./models/Card");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/lightning-ygo-api";
const UPLOAD_PATH = "/lightning_ygo_api/card_images";
const nonEffectFusionMonsters = [
  "Amphibious Bugroth",
  "Aqua Dragon",
  "B. Skull Dragon",
  "Barox",
  "Bickuribox",
  "Blue-Eyes Ultimate Dragon",
  "Bracchio-raidus",
  "Charubin the Fire Knight",
  "Crimson Sunbird",
  "Cyber Saurus",
  "Darkfire Dragon",
  "Deepsea Shark",
  "Dragoness the Wicked Knight",
  "Empress Judge",
  "Flame Ghost",
  "Flame Swordsman",
  "Flower Wolf",
  "Fusionist",
  "Gaia the Dragon Champion",
  "Gem-Knight Zirconia",
  "Giltia the D. Knight",
  "Great Mammoth of Goldfine",
  "Humanoid Worm Drake",
  "Invoked Magellanica",
  "Kaiser Dragon",
  "Kaminari Attack",
  "Kamionwizard",
  "Karbonala Warrior",
  "Kwagar Hercules",
  "Labyrinth Tank",
  "Man-eating Black Shark",
  "Marine Beast",
  "Master of Oz",
  "Mavelus",
  "Metal Dragon",
  "Metalfoes Adamante",
  "Metalfoes Crimsonite",
  "Meteor B. Dragon",
  "Musician King",
  "Mystical Sand",
  "Pragtical",
  "Punished Eagle",
  "Rabid Horseman",
  "Rare Fish",
  "Roaring Ocean Snake",
  "Rose Spectre of Dunn",
  "Sanwitch",
  "Sea Monster of Theseus",
  "Skelgon",
  "Skull Knight",
  "Skullbird",
  "Soul Hunter",
  "St. Joan",
  "Steam Gyroid",
  "Thousand Dragon",
  "Twin-Headed Thunder Dragon",
  "Vermillion Sparrow",
  "Warrior of Tradition",
  "Zombie Warrior"
];
const nonEffectSynchroMonsters = [
  "Gaia Knight, the Force of Earth",
  "Naturia Leodrake",
  "Scrap Archfiend"
];

// Set Cloudinary config
cloudinary.config(require("./cloudinary-config"));

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

    let cardType,
      monsterType = null;
    const types = [];
    for (const apiCardType of apiCardTypes) {
      if (apiCardType === "token") {
        cardType = "monster";
        monsterType = apiCard.race.trim().toLowerCase();
        types.push("token");
        break;
      }

      if (["monster", "spell", "trap"].includes(apiCardType)) {
        const apiCardRace = apiCard.race.trim().toLowerCase();
        cardType = apiCardType;
        if (["spell", "trap"].includes(apiCardType)) {
          types.push(apiCardRace);
          break;
        } else if (apiCardType === "monster") {
          monsterType = apiCardRace;
        }

        continue;
      }

      types.push(apiCardType);

      if (
        ["fusion", "synchro"].includes(apiCardType) &&
        !nonEffectFusionMonsters
          .concat(nonEffectSynchroMonsters)
          .includes(apiCard.name)
      ) {
        types.push("effect");
      }
    }

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
      atk: apiCard.atk ? apiCard.atk : null,
      def: apiCard.def ? apiCard.def : null,
      image
    });

    card.save().then(() => console.log(`${apiCard.name} was saved`));
  }
})();
