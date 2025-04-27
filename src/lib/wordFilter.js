import leoProfanity from "leo-profanity";

// Load default dictionary (English)
leoProfanity.clearList(); // Clear default words (optional)
leoProfanity.add(leoProfanity.getDictionary("en")); // Load English bad words

// Add custom words (optional)
leoProfanity.add(["idiot", "stupid", "dumb"]);

export const isOffensive = (message) => {
  return leoProfanity.check(message); // Returns true if the message contains bad words
};


  

