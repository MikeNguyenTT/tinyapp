const getUserByEmail = (email, database) => {
  for (const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return undefined;
};

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

const urlsForUser = (userId, urlDatabase) => {
  const permittedURLs = {};
  for (const item in urlDatabase) {
    if (urlDatabase[item].userID === userId) {
      permittedURLs[item] = urlDatabase[item];
    }
  }
  return permittedURLs;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };