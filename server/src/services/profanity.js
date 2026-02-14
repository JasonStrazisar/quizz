const BLOCKLIST = new Set([
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "motherfucker",
  "connard",
  "salope",
  "pute",
  "merde",
  "encule"
]);

function containsProfanity(input) {
  const tokens = String(input || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  return tokens.some((token) => BLOCKLIST.has(token));
}

export { containsProfanity };
