const mongoose = require("mongoose");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const Card = require("./models/Card");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/lightning-ygo-api";
const UPLOAD_PATH = "/lightning_ygo_api/card_images";
const abilities = ["flip", "gemini", "spirit", "toon", "tuner", "union"];
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
const questionMarkAtkMonsters = [
  "Aegaion the Sea Castrum",
  "Apollousa, Bow of the Goddess",
  "Ascension Sky Dragon",
  "Blackwing - Aurora the Northern Lights",
  "The Calculator",
  "Cell Division Token",
  "Chimeratech Overdragon",
  "Clear Vice Dragon",
  "Clone Dragon",
  "Clone Token",
  "Copy Token",
  "Cyber Eltanin",
  "Dark Soul Token",
  "Destiny HERO - Dreadmaster",
  "Divine Serpent Geh",
  "Doomsday Horror",
  "Doppelganger Token",
  "Drawler",
  "Duel Dragon Token",
  "Dyna Tank",
  "E'Rah Monster",
  "Eater of Millions",
  "Emissary of Darkness Token",
  "Endless Decay",
  "Evil Dragon Ananta",
  "Evil HERO Dark Gaia",
  "Exodia, the Legendary Defender",
  "Exodius the Ultimate Forbidden Lord",
  "Fire Wagon",
  "Fortune Lady Dark",
  "Fortune Lady Earth",
  "Fortune Lady Every",
  "Fortune Lady Fire",
  "Fortune Lady Light",
  "Fortune Lady Past",
  "Fortune Lady Water",
  "Fortune Lady Wind",
  "Gogogo Golem - Golden Form",
  "Gradius' Option",
  "Greed Quasar",
  "Gren Maju Da Eiza",
  "Half Token",
  "Helios - The Primordial Sun",
  "Helios Duo Megistus",
  "Helios Trice Megistus",
  "Holactie the Creator of Light",
  "Jormungandr, Generaider Boss of Eternity",
  "Kagemusha Raccoon Token",
  "Kasha",
  "King of the Skull Servants",
  "Kuribabylon",
  "The Legendary Exodia Incarnate",
  "Ma'at",
  "Maju Garzett",
  "Malus Token",
  "Manipulator Token",
  "Mask Token",
  "Megarock Dragon",
  "Metal Devil",
  "Mirage Token",
  "Montage Dragon",
  "Option Token",
  "Orichalcos Shunoros",
  "Parasitic Ticky",
  "Pilgrim Reaper",
  "Player Token",
  "Primal Being Token",
  "Rai-Jin",
  "Refraction Token",
  "Sample Fossil",
  "Scanner",
  "Selection Token",
  "Slifer the Sky Dragon",
  "Spirit Token",
  "Starduston",
  "Super Anti-Kaiju War Machine Mecha-Dogoran",
  "Ten Thousand Dragon",
  "Tenyi Spirit Token",
  "Timaeus the Knight of Destiny",
  "Tragoedia",
  "Tyranno Infinity",
  "UFOroid Fighter",
  "Umbral Horror Mirage Token",
  "Waltz Token",
  "The Wicked Avatar",
  "The Wicked Eraser",
  "The Winged Dragon of Ra",
  "The Winged Dragon of Ra - Sphere Mode",
  "Winged Kuriboh 9",
  "Winged Kuriboh LV9",
  "Worm Zero"
];
const questionMarkDefMonsters = [
  "Cell Division Token",
  "Chimeratech Overdragon",
  "Clone Dragon",
  "Clone Token",
  "Copy Token",
  "Cyber Eltanin",
  "Destiny HERO - Dreadmaster",
  "Doomsday Horror",
  "Doppelganger Token",
  "Drawler",
  "Duel Dragon Token",
  "E'Rah Monster",
  "Eater of Millions",
  "Emissary of Darkness Token",
  "Evil Dragon Ananta",
  "Exodia, the Legendary Defender",
  "Fortune Lady Dark",
  "Fortune Lady Earth",
  "Fortune Lady Every",
  "Fortune Lady Fire",
  "Fortune Lady Light",
  "Fortune Lady Past",
  "Fortune Lady Water",
  "Fortune Lady Wind",
  "Gradius' Option",
  "Greed Quasar",
  "Gren Maju Da Eiza",
  "Half Token",
  "Helios - The Primordial Sun",
  "Helios Duo Megistus",
  "Helios Trice Megistus",
  "Holactie the Creator of Light",
  "Jormungandr, Generaider Boss of Eternity",
  "Lost Guardian",
  "Ma'at",
  "Malus Token",
  "Manipulator Token",
  "Mask Token",
  "Megarock Dragon",
  "Mirage Token",
  "Option Token",
  "Orichalcos Aristeros",
  "Parasitic Ticky",
  "Pilgrim Reaper",
  "Player Token",
  "Primal Being Token",
  "Refraction Token",
  "Scanner",
  "Selection Token",
  "Slifer the Sky Dragon",
  "Spirit Token",
  "Starduston",
  "Ten Thousand Dragon",
  "Timaeus the Knight of Destiny",
  "Tragoedia",
  "UFOroid Fighter",
  "Waltz Token",
  "The Wicked Avatar",
  "The Wicked Eraser",
  "The Winged Dragon of Ra",
  "The Winged Dragon of Ra - Sphere Mode",
  "Winged Kuriboh 9",
  "Winged Kuriboh LV9"
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

      if (abilities.includes(apiCardType) && !types.includes("effect")) {
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

    // Because ATK might be 0 or ?
    let atk = null;
    // eslint-disable-next-line
    if (apiCard.hasOwnProperty("atk")) {
      atk = apiCard.atk;

      if (questionMarkAtkMonsters.includes(apiCard.name)) {
        apiCard.atk = "?";
      }
    }

    // Because DEF might be 0 or ?
    let def = null;
    // eslint-disable-next-line
    if (apiCard.hasOwnProperty("def")) {
      def = apiCard.def;

      if (questionMarkDefMonsters.includes(apiCard.name)) {
        apiCard.def = "?";
      }
    }

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
