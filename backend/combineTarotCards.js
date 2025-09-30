const fs = require('fs');
const path = require('path');

// Read the Major Arcana
const majorArcana = JSON.parse(fs.readFileSync('./tarotCardsExtended.json', 'utf8'));

// Read the Minor Arcana
const minorArcana = JSON.parse(fs.readFileSync('./tarotMinorArcana.json', 'utf8'));

// Create the complete deck
const completeDeck = [...majorArcana, ...minorArcana];

// Add the remaining Minor Arcana suits (Wands, Swords, Pentacles)
const suits = ['Wands', 'Swords', 'Pentacles'];
const elements = ['Fire', 'Air', 'Earth'];

suits.forEach((suit, suitIndex) => {
  const element = elements[suitIndex];
  
  // Create cards 1-10 for each suit
  for (let i = 1; i <= 10; i++) {
    const cardName = i === 1 ? `Ace of ${suit}` : 
                    i === 2 ? `Two of ${suit}` :
                    i === 3 ? `Three of ${suit}` :
                    i === 4 ? `Four of ${suit}` :
                    i === 5 ? `Five of ${suit}` :
                    i === 6 ? `Six of ${suit}` :
                    i === 7 ? `Seven of ${suit}` :
                    i === 8 ? `Eight of ${suit}` :
                    i === 9 ? `Nine of ${suit}` :
                    `Ten of ${suit}`;
    
    completeDeck.push({
      name: cardName,
      number: i,
      suit: suit,
      keywords: ["Energy", "Action", "Movement", "Progress"],
      uprightMeaning: `Positive energy, action, movement, progress in ${suit.toLowerCase()} matters`,
      reversedMeaning: `Blocked energy, lack of action, stagnation in ${suit.toLowerCase()} matters`,
      description: `The ${cardName} represents energy and action in ${suit.toLowerCase()} matters. It's about taking initiative and moving forward.`,
      astrologicalCorrespondence: `${element} signs`,
      element: element,
      imageName: `${cardName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      isMajorArcana: false
    });
  }
  
  // Create Court Cards (Page, Knight, Queen, King) for each suit
  const courtCards = ['Page', 'Knight', 'Queen', 'King'];
  courtCards.forEach((court, courtIndex) => {
    const cardName = `${court} of ${suit}`;
    completeDeck.push({
      name: cardName,
      number: 11 + courtIndex,
      suit: suit,
      keywords: ["Energy", "Action", "Leadership", "Authority"],
      uprightMeaning: `${court} energy in ${suit.toLowerCase()} matters - action, leadership, and authority`,
      reversedMeaning: `Blocked ${court.toLowerCase()} energy, lack of action, poor leadership`,
      description: `The ${cardName} represents ${court.toLowerCase()} energy in ${suit.toLowerCase()} matters. It's about taking action and showing leadership.`,
      astrologicalCorrespondence: `${element} signs`,
      element: element,
      imageName: `${cardName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      isMajorArcana: false
    });
  });
});

// Write the complete deck to a new file
fs.writeFileSync('./tarotCardsComplete.json', JSON.stringify(completeDeck, null, 2));

console.log(`Created complete tarot deck with ${completeDeck.length} cards`);
console.log(`Major Arcana: ${majorArcana.length} cards`);
console.log(`Minor Arcana: ${completeDeck.length - majorArcana.length} cards`);
