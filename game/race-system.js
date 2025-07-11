// game/race-system.js
// Race-specific systems for flavor text and racial abilities

// ===== RACE SYSTEM CONFIGURATION =====
const RaceSystemConfig = {
  randomFlavorChance: 10,  // 8% chance to show race flavor text during normal gameplay
};

// ===== RACE FLAVOR TEXT SYSTEM =====
let lastFlavorText = null;  // Track the last flavor text shown
let justShowedRaceFlavor = false;  // Flag for immediate killing

// Random race flavor text system
function randomRaceFlavorText() {
  // Only trigger if player has a race with flavor texts
  if (!game.Traits || !game.Traits.Race || !RacesDB[game.Traits.Race]) return false;
  
  // Check chance
  if (Random(100) > RaceSystemConfig.randomFlavorChance) return false;
  
  const raceData = RacesDB[game.Traits.Race];
  if (raceData && raceData.flavorTexts && raceData.flavorTexts.length > 0) {
    let availableTexts = raceData.flavorTexts;
    
    // If we have more than one flavor text and we showed one last time, remove it from options
    if (availableTexts.length > 1 && lastFlavorText) {
      availableTexts = availableTexts.filter(text => text !== lastFlavorText);
    }
    
    const flavorText = Pick(availableTexts);
    console.log("Showing race flavor text:", flavorText);
    
    // Remember this flavor text and set flag
    lastFlavorText = flavorText;
    justShowedRaceFlavor = true;
    
    Task(flavorText, 2 * 1000);
    return true;
  }
  
  return false;
}

// Check if we just showed race flavor text
function checkJustShowedRaceFlavor() {
  return justShowedRaceFlavor;
}

// Clear the race flavor flag
function clearRaceFlavorFlag() {
  justShowedRaceFlavor = false;
}

// Get current player's race data
function getCurrentRaceData() {
  if (!game.Traits || !game.Traits.Race || !RacesDB[game.Traits.Race]) {
    return null;
  }
  return RacesDB[game.Traits.Race];
}

// Check if current race has flavor texts
function hasRaceFlavorTexts() {
  const raceData = getCurrentRaceData();
  return raceData && raceData.flavorTexts && raceData.flavorTexts.length > 0;
}

// Initialize race systems
function initializeRaceSystem() {
  console.log('Race system initialized');
  
  // Log current race info
  if (game.Traits && game.Traits.Race) {
    const raceData = getCurrentRaceData();
    if (raceData) {
      console.log(`Player race: ${game.Traits.Race}`);
      console.log(`Flavor texts available: ${raceData.flavorTexts ? raceData.flavorTexts.length : 0}`);
    }
  }
}

// Initialize when the page loads
$(document).ready(function() {
  // Wait for game to be ready
  if (typeof game !== 'undefined') {
    initializeRaceSystem();
  } else {
    // Wait for game to load
    const checkGame = setInterval(() => {
      if (typeof game !== 'undefined') {
        clearInterval(checkGame);
        initializeRaceSystem();
      }
    }, 100);
  }
});

// Export for external access
window.RaceSystem = {
  init: initializeRaceSystem,
  randomFlavorText: randomRaceFlavorText,
  checkJustShowedFlavor: checkJustShowedRaceFlavor,
  clearFlavorFlag: clearRaceFlavorFlag,
  getCurrentRace: getCurrentRaceData,
  hasFlavorTexts: hasRaceFlavorTexts,
  config: RaceSystemConfig
};