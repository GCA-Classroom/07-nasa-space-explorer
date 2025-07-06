// facts.js
// Array of fun space facts for the "Did You Know?" section
const spaceFacts = [
  "Venus is the hottest planet in our solar system.",
  "A day on Mars is just over 24 hours long.",
  "Jupiter has the shortest day of all the planets.",
  "The Sun is over 300,000 times more massive than Earth.",
  "Neutron stars can spin at a rate of 600 rotations per second.",
  "A spoonful of a neutron star would weigh about a billion tons.",
  "There are more trees on Earth than stars in the Milky Way.",
  "The footprints on the Moon will be there for millions of years.",
  "Saturn is the only planet that could float in water.",
  "Space is completely silent."
];

// Function to get a random fact
function getRandomSpaceFact() {
  const index = Math.floor(Math.random() * spaceFacts.length);
  return spaceFacts[index];
}
