const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema(
  {
    cardType: { type: String, required: true },
    name: { type: String, required: true },
    attribute: String,
    level: mongoose.Schema.Types.Mixed,
    monsterType: String,
    types: { type: [String], required: true },
    text: { type: String, required: true },
    atk: mongoose.Schema.Types.Mixed,
    def: mongoose.Schema.Types.Mixed,
    image: { type: Map, of: String }
  },
  { timestamps: true }
);

CardSchema.methods.toJSONapi = function() {
  return {
    cardType: this.cardType,
    name: this.name,
    attribute: this.attribute,
    level: this.level,
    monsterType: this.monsterType,
    types: this.types,
    text: this.text,
    atk: this.atk,
    def: this.def,
    image: this.image
  };
};

module.exports = mongoose.model('Card', CardSchema);
