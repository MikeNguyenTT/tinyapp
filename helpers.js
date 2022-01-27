function getUserByEmail(email, database) {
  for (const user_id in database) {
    if (database[user_id].email === email) {
      return database[user_id];
    }
  }
  return undefined;
}

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

function urlsForUser(user_id, urlDatabase) {
  const permittedURLs = {};
  for (const item in urlDatabase) {
    if (urlDatabase[item].userID === user_id) {
      permittedURLs[item] = urlDatabase[item];
    }
  }
  return permittedURLs;
}

module.exports = { getUserByEmail, generateRandomString, urlsForUser };