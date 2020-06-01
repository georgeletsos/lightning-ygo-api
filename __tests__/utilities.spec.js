const utilities = require("../common/utilities");

it("`escapeRegExp(str)` - should escape regex special charaters of a given string", () => {
  const escapedRegExp = utilities.escapeRegExp(".*+-?^${}()|[]\\");

  expect(escapedRegExp).toEqual(
    "\\.\\*\\+\\-\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\"
  );
});

it("`spliceQuestionMarkCards(cards, sortField, sortOrder)` - should splice cards of an array with '?' values based on sort field, and place them at the start or end of the array based on sort order (cards are assumed to be already sorted by MongoDB)", () => {
  const sortField = "level";

  const cardsAsc = utilities.spliceQuestionMarkCards(
    [
      { id: 1, level: 3 },
      { id: 2, level: 6 },
      { id: 3, level: "?" },
      { id: 4, level: "?" }
    ],
    sortField,
    "asc"
  );
  expect(cardsAsc).toEqual([
    { id: 3, level: "?" },
    { id: 4, level: "?" },
    { id: 1, level: 3 },
    { id: 2, level: 6 }
  ]);

  const cardsDesc = utilities.spliceQuestionMarkCards(
    [
      { id: 3, level: "?" },
      { id: 4, level: "?" },
      { id: 2, level: 6 },
      { id: 1, level: 3 }
    ],
    sortField,
    "desc"
  );

  expect(cardsDesc).toEqual([
    { id: 2, level: 6 },
    { id: 1, level: 3 },
    { id: 3, level: "?" },
    { id: 4, level: "?" }
  ]);
});
