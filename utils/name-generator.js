// utils/name-generator.js
// Consolidated name generation system for characters, monsters, and NPCs

// Original name generation parts (moved from utils.js)
var KParts = [
  "b|ch|d|j|k|l|m|n|r|s|t|v|w".split("|"),
  "a|e|i|o|u|ay|ee".split("|"),
  "n|r|s|t|ch|sh|ck|x".split("|"),
];

// Original simple name generation function
function GenerateNameOriginal() {
  var result = "";
  for (var i = 0; i <= 5; ++i) result += Pick(KParts[i % 3]);
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Main name generation function with Faker.js integration (moved from utils.js)
function GenerateName() {
  // Check if Faker.js is loaded
  if (typeof window.fakerModule !== "undefined") {
    try {
      const faker = window.fakerModule;

      // Choose different name styles for variety
      const nameType = Random(6); // Increased to 6 for new case

      switch (nameType) {
        case 0:
          // First name only
          return faker.person.firstName();

        case 1:
          // Fantasy-style compound names using faker data
          const adjectives = [
            "Swift",
            "Dark",
            "Fire",
            "Iron",
            "Storm",
            "Shadow",
            "Gold",
            "Silver",
            "Wild",
            "Grim",
          ];
          const animals = [
            "wolf",
            "bear",
            "hawk",
            "fox",
            "raven",
            "tiger",
            "eagle",
            "dragon",
            "lion",
            "serpent",
          ];
          return Pick(adjectives) + Pick(animals);

        case 2:
          // Last name only (often sound cool)
          return faker.person.lastName();

        case 3:
          // First name + last name initial (lowercase)
          return (
            faker.person.firstName() +
            faker.person.lastName().charAt(0).toLowerCase()
          );

        case 4:
          // Fantasy name using faker's random word + suffix
          const fantasyPrefixes = [
            "Aero",
            "Astro",
            "Cyber",
            "Hyper",
            "Neo",
            "Pyro",
            "Quantum",
            "Techno",
            "Ultra",
            "Xeno",
          ];
          const fantasySuffixes = [
            "dyne",
            "flux",
            "hex",
            "nyx",
            "qore",
            "rax",
            "syn",
            "trix",
            "vex",
            "zyx",
          ];
          return Pick(fantasyPrefixes) + Pick(fantasySuffixes);

        case 5:
          // Real name + fantasy element hybrid (Cold War to Cyberpunk theme)
          const realName = faker.person.firstName();

          // Cold War to Cyberpunk themed elements
          const cyberpunkElements = [
            // Cold War era
            "steel",
            "red",
            "iron",
            "frost",
            "shadow",
            "ghost",
            "smoke",
            "blade",
            "storm",
            "winter",
            // Transition era
            "neon",
            "chrome",
            "wire",
            "grid",
            "pulse",
            "wave",
            "spark",
            "volt",
            "byte",
            "link",
            // Cyberpunk era
            "cyber",
            "neural",
            "matrix",
            "data",
            "code",
            "hack",
            "net",
            "sync",
            "pixel",
            "nano",
          ];

          const cyberpunkPrefixes = [
            "Red",
            "Cyber",
            "Neo",
            "Dark",
            "Night",
            "Steel",
            "Ghost",
            "Shadow",
            "Zero",
            "Prime",
          ];

          const cyberpunkSuffixes = [
            "tron",
            "ware",
            "hack",
            "byte",
            "core",
            "link",
            "sync",
            "flux",
            "grid",
            "code",
          ];

          const hybridType = Random(3);
          if (hybridType === 0) {
            // Prefix + Name (e.g., "RedLuna", "CyberMarcus", "NeoDavid")
            return Pick(cyberpunkPrefixes) + realName;
          } else if (hybridType === 1) {
            // Name + Element (e.g., "Lunasteel", "Marcusneon", "Davidcode")
            return realName + Pick(cyberpunkElements);
          } else {
            // Name + Suffix (e.g., "Lunatron", "Marcusware", "Davidhack")
            return realName + Pick(cyberpunkSuffixes);
          }

        default:
          return faker.person.firstName();
      }
    } catch (error) {
      console.warn("Error using Faker.js:", error);
      return GenerateNameOriginal();
    }
  } else {
    // Faker not loaded, use original
    console.log("Faker.js not loaded, using original method");
    return GenerateNameOriginal();
  }
}

// Additional utility functions using Faker (moved from utils.js)
function GenerateFantasyName() {
  if (typeof window.fakerModule !== "undefined") {
    const faker = window.fakerModule;
    const adjectives = [
      "Swift",
      "Dark",
      "Fire",
      "Iron",
      "Storm",
      "Shadow",
      "Gold",
      "Silver",
      "Wild",
      "Grim",
    ];
    const animals = [
      "wolf",
      "bear",
      "hawk",
      "fox",
      "raven",
      "tiger",
      "eagle",
      "dragon",
      "lion",
      "serpent",
    ];
    return Pick(adjectives) + Pick(animals);
  }
  return GenerateNameOriginal();
}

function GenerateRealName() {
  if (typeof window.fakerModule !== "undefined") {
    const faker = window.fakerModule;
    return Random(2) === 0 ? faker.person.firstName() : faker.person.lastName();
  }
  return GenerateNameOriginal();
}
