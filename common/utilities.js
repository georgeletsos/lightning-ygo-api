const escapeRegExp = function(str) {
  return str.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

const findLastIndex = function(arr, callback) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (callback(arr[i])) {
      return i;
    }

    continue;
  }
};

// From an array of cards, splice those with "?" values based on sort field
// And place them at the start or end of the array based on sort order
const spliceQuestionMarkCards = function(cards, sortField, sortOrder) {
  const hasQuestionMark = card => card[sortField] === "?";
  const firstIndex = cards.findIndex(hasQuestionMark);
  if (firstIndex === -1) {
    return cards;
  }

  const lastIndex = findLastIndex(cards, hasQuestionMark);
  const questionMarkCards = cards.splice(firstIndex, lastIndex + 1);

  switch (sortOrder) {
    case "asc":
      cards.unshift(...questionMarkCards);
      break;
    case "desc":
      cards.push(...questionMarkCards);
      break;
  }

  return cards;
};

module.exports = {
  escapeRegExp,
  spliceQuestionMarkCards
};
