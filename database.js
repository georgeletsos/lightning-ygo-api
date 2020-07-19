const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const Card = require("./models/Card");
const ygoLists = require("./common/ygo-lists");

const UPLOAD_PATH = "/lightning_ygo_api/card_images";
const CARD_BACK_WARNING_URL =
  "https://res.cloudinary.com/georgeletsos/image/upload/v1588871867/lightning_ygo_api/card_images/card_back_warning.jpg";

// Set Cloudinary config
if (typeof process.env.CLOUDINARY_URL === "undefined") {
  cloudinary.config(require("./config/cloudinary"));
}

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
    unique_filename: false,
    overwrite: false
  });

  return uploadResponse.secure_url;
};

/**
 * Fetch cards that are missing from the database by comparing ygopro and DLM APIs.
 * @returns {Array} An array of missing cards.
 */
const fetchMissingCards = async () => {
  // ygopro Duel Links Cards
  const ygoproDuelLinksCardsResponse = await axios.get(
    "https://db.ygoprodeck.com/api/v6/cardinfo.php?format=Duel Links"
  );
  const ygoproDuelLinksCards = ygoproDuelLinksCardsResponse.data;

  // ygopro All Cards
  const ygoproAllCardsResponse = await axios.get(
    "https://db.ygoprodeck.com/api/v6/cardinfo.php"
  );
  const ygoproAllCards = ygoproAllCardsResponse.data;

  // DLM Exclusive Cards, populate them with the CARD BACK image because they don't exist in ygopro api
  const dlmExclusiveCardsResponse = await axios
    .get(
      "https://www.duellinksmeta.com/data-hashed/exclusiveCards-7555762466.json"
    )
    .catch(error => {
      throw new Error(`DLM Exclusive Cards ${error}`);
    });
  const dlmExclusiveCards = dlmExclusiveCardsResponse.data.map(
    dlmExclusiveCard => {
      dlmExclusiveCard.image = {
        id: 0,
        big: CARD_BACK_WARNING_URL,
        small: CARD_BACK_WARNING_URL,
        art: CARD_BACK_WARNING_URL
      };
      return dlmExclusiveCard;
    }
  );

  // DLM All Cards
  const dlmAllCardsResponse = await axios
    .get("https://www.duellinksmeta.com/data-hashed/cardObtain-b8c3a726c1.json")
    .catch(error => {
      throw new Error(`DLM All Cards ${error}`);
    });
  const dlmAllCards = dlmAllCardsResponse.data
    // Populate with data the Cards that were also found in the previous list of DLM Exclusive Cards
    .map(dlmAllCard => {
      const foundInDlmExclusiveCard = dlmExclusiveCards.find(
        dlmExclusiveCard => dlmExclusiveCard.name === dlmAllCard.name
      );
      return foundInDlmExclusiveCard ? foundInDlmExclusiveCard : dlmAllCard;
    });

  // Cards that exist in DLM All Cards, but don't exist in ygopro Duel Links Cards
  const dlmAndYgoproDuelLinksDiffCards = dlmAllCards
    .filter(
      dlmAllCard =>
        !ygoproDuelLinksCards.some(
          ygoproDuelLinksCard => ygoproDuelLinksCard.name === dlmAllCard.name
        )
    )
    // Populate with data the diff Cards that were also found in the ygopro All Cards
    .map(dlmAndYgoproDuelLinksDiffCard => {
      const foundInYgoproCard = ygoproAllCards.find(
        ygoproAllCard =>
          ygoproAllCard.name === dlmAndYgoproDuelLinksDiffCard.name
      );
      return foundInYgoproCard
        ? foundInYgoproCard
        : dlmAndYgoproDuelLinksDiffCard;
    })
    // Remove any Cards without data, i.e. any DLM Cards that still have a "rarity" property
    .filter(
      dlmAndYgoproDuelLinksDiffCard =>
        // eslint-disable-next-line
        !dlmAndYgoproDuelLinksDiffCard.hasOwnProperty("rarity")
    );

  // Combine previous lists into API Cards
  const apiCards = ygoproDuelLinksCards.concat(dlmAndYgoproDuelLinksDiffCards);

  // Database Cards
  const dbCards = await Card.find();

  // API Cards that are missing from the database
  const missingCards = apiCards.filter(
    apiCard => !dbCards.some(dbCard => dbCard.name === apiCard.name)
  );

  return missingCards;
};

/**
 * Convert any missing cards' data and upload their images to Cloudinary.
 * @param {Array} missingCards An array of missing cards.
 * @returns {Array} An array of converted cards.
 */
const convertMissingCards = async missingCards => {
  let convertedCards = [];

  for (const apiCard of missingCards) {
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

      // Describe API Card Race as type or monster type
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
    let image = {};
    // eslint-disable-next-line
    if (apiCard.hasOwnProperty("card_images")) {
      const apiCardImage = apiCard.card_images[0];
      image = {
        id: apiCardImage.id,
        big: await uploadImage(apiCardImage.image_url, "big"),
        small: await uploadImage(apiCardImage.image_url_small, "small"),
        art: await uploadImage(
          apiCardImage.image_url.replace(/pics/gi, "pics_artgame"),
          "art"
        )
      };
      // eslint-disable-next-line
    } else if (apiCard.hasOwnProperty("image")) {
      image = apiCard.image;
    }

    let atk = null;
    // eslint-disable-next-line
    if (apiCard.hasOwnProperty("atk")) {
      atk = apiCard.atk;

      // In case of 0 or ? ATK
      if (ygoLists.questionMarkAtkMonsters.includes(apiCard.name)) {
        atk = "?";
      }
    }

    let def = null;
    // eslint-disable-next-line
    if (apiCard.hasOwnProperty("def")) {
      def = apiCard.def;

      // In case of 0 or ? DEF
      if (ygoLists.questionMarkDefMonsters.includes(apiCard.name)) {
        def = "?";
      }
    }

    // Final Card
    const convertedCard = new Card({
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

    convertedCards.push(convertedCard);
  }

  return convertedCards;
};

/**
 * Call the previous functions in order.
 * Consume the APIs > Convert data and Upload the images > Insert everything into the database
 */
const updateDb = async () => {
  const missingCards = await fetchMissingCards();
  if (missingCards.length === 0) {
    console.log("There are no cards missing from the database");
    return;
  }

  const convertedCards = await convertMissingCards(missingCards);

  Card.insertMany(convertedCards)
    .then(convertedCards => {
      console.log(
        `${convertedCards.length} missing cards were added to the database successfully`
      );
    })
    .catch(error => {
      throw new Error(`Insert Many Converted Cards ${error}`);
    });
};

module.exports = { fetchMissingCards, convertMissingCards, updateDb };
