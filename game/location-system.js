// Function to check if we just showed flavor text (for Dequeue)
function checkJustShowedFlavorText() {
  return justShowedFlavorText;
}

// Function to clear the flavor text flag (for Dequeue)
function clearFlavorTextFlag() {
  justShowedFlavorText = false;
}
// game/location-system.js
// Simplified location system that integrates with main Dequeue

// ===== LOCATION SYSTEM CONFIGURATION =====
const LocationConfig = {
  // Base chances (per task completion when no queue items)
  subLocationChangeChance: 5,        // 2% base chance to change sub-location
  mainLocationChangeChance: 0.5,     // 0.5% base chance to change main location
  flavorTextChance: 15              // 15% chance to show flavor text
};

// Flag to track if we just showed flavor text
let justShowedFlavorText = false;

let LocationData = null;
let CurrentLocation = {
  mainLocation: null,
  subLocation: null,
  timeInLocation: 0,
  timeInCity: 0,
  lastTaskTime: 0,
  cityStartTime: 0
};

// Location change state tracking
let LocationChangeState = {
  inProgress: false,
  type: null, // 'sub' or 'main'
  step: 0,
  newLocation: null,
  currentSub: null,
  currentMain: null
};

// Load location data from JSON
async function loadLocationData() {
  try {
    const response = await fetch('data/locations.json');
    LocationData = await response.json();
    console.log('Location data loaded successfully');
    return LocationData;
  } catch (error) {
    console.error('Failed to load location data:', error);
    // Fallback data if JSON fails to load
    LocationData = {
      main_locations: [],
      global_sub_locations: { mundane: [], bureaucratic: [], specific: [] }
    };
    return LocationData;
  }
}

// Initialize location system
function initializeLocationSystem() {
  if (!game.currentLocation) {
    setDefaultLocation();
  } else {
    CurrentLocation = game.currentLocation;
  }
  updateLocationUI();
}

// Set default starting location: Walmart Parking Lot in a random supporting main location
function setDefaultLocation() {
  if (!LocationData) return;
  
  // Find Walmart Parking Lot
  const walmartLocation = LocationData.global_sub_locations.mundane.find(
    loc => loc.name === "Walmart Parking Lot"
  );
  
  if (!walmartLocation) {
    console.error('Walmart Parking Lot not found in location data');
    return;
  }
  
  // Find main locations that support Walmart (USA, Canada)
  const supportingLocations = LocationData.main_locations.filter(mainLoc => 
    walmartLocation.regions.includes(mainLoc.country) || 
    walmartLocation.regions.includes("global")
  );
  
  if (supportingLocations.length === 0) {
    console.error('No supporting main locations found for Walmart');
    return;
  }
  
  // Pick random supporting main location
  const selectedMain = Pick(supportingLocations);
  
  CurrentLocation = {
    mainLocation: selectedMain,
    subLocation: walmartLocation,
    timeInLocation: 0,
    timeInCity: 0,
    lastTaskTime: game.elapsed || 0,
    cityStartTime: game.elapsed || 0
  };
  
  game.currentLocation = CurrentLocation;
  updateLocationUI();
  
  Log(`Started adventure at ${walmartLocation.name} in ${selectedMain.city}, ${selectedMain.country}`);
}

// Update the location UI element
function updateLocationUI() {
  const locationElement = document.getElementById('current-location');
  if (locationElement && CurrentLocation.mainLocation && CurrentLocation.subLocation) {
    const locationText = `${CurrentLocation.subLocation.name} in ${CurrentLocation.mainLocation.city}, ${CurrentLocation.mainLocation.country}`;
    locationElement.textContent = locationText;
  }
}

// Main function called from Dequeue - returns true if location change was initiated
function checkLocationChange() {
  if (!LocationData || !CurrentLocation.mainLocation) return false;
  
  // If we're in the middle of a location change sequence, continue it
  if (LocationChangeState.inProgress) {
    const result = continueLocationChangeSequence();
    // Always return true when we're in a sequence, even if this step ends it
    return true;
  }
  
  const currentTime = game.elapsed || 0;
  CurrentLocation.timeInLocation = currentTime - CurrentLocation.lastTaskTime;
  CurrentLocation.timeInCity = currentTime - (CurrentLocation.cityStartTime || CurrentLocation.lastTaskTime);
  
  // Base chances for location changes
  const subLocationChangeChance = calculateSubLocationChangeChance();
  const mainLocationChangeChance = calculateMainLocationChangeChance();
  
  
  // Generate random numbers for each check
  const mainRoll = Random(100);
  const subRoll = Random(100);
  const flavorRoll = Random(100);
  
  console.log(`Random rolls - Main: ${mainRoll}, Sub: ${subRoll}, Flavor: ${flavorRoll}`);
  
  // Check for main location change first (rarest)
  if (mainRoll < mainLocationChangeChance) {
    console.log("Main location change triggered!");
    return startMainLocationChangeSequence();
  }
  
  // Check for sub location change
  if (subRoll < subLocationChangeChance) {
    console.log("Sub location change triggered!");
    return startSubLocationChangeSequence();
  }
  
  // Sometimes show flavor text while in location
  if (flavorRoll < LocationConfig.flavorTextChance) {
    console.log("Flavor text triggered!");
    showLocationFlavor();
    return true; // Break out - flavor text task should run without being overridden
  }
  
  console.log("No location events triggered");
  return false;
}

// Calculate chance to change sub location based on time spent
function calculateSubLocationChangeChance() {
  const timeInLocation = CurrentLocation.timeInLocation;
  const baseChance = LocationConfig.subLocationChangeChance;
  
  // Increase chance the longer you've been in the same sub location
  let timeBonus = 0;
  if (timeInLocation > 300) timeBonus = 3; // 5+ minutes
  if (timeInLocation > 600) timeBonus = 5; // 10+ minutes
  if (timeInLocation > 1200) timeBonus = 8; // 20+ minutes
  
  // Character level affects wanderlust
  const levelBonus = Math.floor((GetI(Traits, "Level") || 1) / 5);
  
  return baseChance + timeBonus + levelBonus;
}

// Calculate chance to change main location (much rarer)
function calculateMainLocationChangeChance() {
  const timeInCity = CurrentLocation.timeInCity;
  const baseChance = LocationConfig.mainLocationChangeChance;
  
  // Only increase chance after significant time in city
  let timeBonus = 0;
  if (timeInCity > 1800) timeBonus = 1; // 30+ minutes
  if (timeInCity > 3600) timeBonus = 2; // 60+ minutes
  
  // Higher level characters travel more
  const levelBonus = Math.floor((GetI(Traits, "Level") || 1) / 10);
  
  return baseChance + timeBonus + levelBonus;
}

// Start sub location change sequence
function startSubLocationChangeSequence() {
  const newSubLocation = selectNewSubLocation();
  if (!newSubLocation) return false;
  
  // Set up the sequence
  LocationChangeState = {
    inProgress: true,
    type: 'sub',
    step: 1,
    newLocation: newSubLocation,
    currentSub: CurrentLocation.subLocation,
    currentMain: null
  };
  
  // Step 1: "You've grown bored of this place"
  Task("You've grown bored of this place", 3 * 1000);
  return true;
}

// Start main location change sequence
function startMainLocationChangeSequence() {
  const newMainLocation = selectNewMainLocation();
  if (!newMainLocation) return false;
  
  const newSubLocation = selectSubLocationForMain(newMainLocation);
  if (!newSubLocation) return false;
  
  // Set up the sequence
  LocationChangeState = {
    inProgress: true,
    type: 'main',
    step: 1,
    newLocation: { main: newMainLocation, sub: newSubLocation },
    currentSub: CurrentLocation.subLocation,
    currentMain: CurrentLocation.mainLocation
  };
  
  // Step 1: "You've decided this place completely sucks..."
  Task("You've decided this place completely sucks. You decide to go far, far away", 4 * 1000);
  return true;
}

// Continue the location change sequence
function continueLocationChangeSequence() {
  if (!LocationChangeState.inProgress) return false;
  
  console.log(`Continuing location sequence: ${LocationChangeState.type}, step ${LocationChangeState.step + 1}`);
  
  if (LocationChangeState.type === 'sub') {
    return continueSubLocationSequence();
  } else if (LocationChangeState.type === 'main') {
    return continueMainLocationSequence();
  }
  
  return false;
}

// Continue sub location change sequence
function continueSubLocationSequence() {
  LocationChangeState.step++;
  console.log(`Sub location sequence step ${LocationChangeState.step}`);
  
  switch (LocationChangeState.step) {
    case 2:
      // Step 2: Exit text from current location
      if (LocationChangeState.currentSub && 
          LocationChangeState.currentSub.exiting_text && 
          LocationChangeState.currentSub.exiting_text.length > 0) {
        const exitText = Pick(LocationChangeState.currentSub.exiting_text);
        Task(exitText, 3 * 1000);
        return true;
      } else {
        // No exit text, skip to step 3
        return continueSubLocationSequence();
      }
      
    case 3:
      // Step 3: Transition message + location change
      CurrentLocation.subLocation = LocationChangeState.newLocation;
      CurrentLocation.timeInLocation = 0;
      CurrentLocation.lastTaskTime = game.elapsed || 0;
      game.currentLocation = CurrentLocation;
      updateLocationUI();
      
      Task("Perhaps this new change of scenery will be good for you", 4 * 1000);
      Log(`Moved to ${LocationChangeState.newLocation.name}`);
      return true;
      
    case 4:
      // Step 4: Entering text from new location
      if (LocationChangeState.newLocation.entering_text && 
          LocationChangeState.newLocation.entering_text.length > 0) {
        const enterText = Pick(LocationChangeState.newLocation.entering_text);
        Task(enterText, 3 * 1000);
      } else {
        Task("You settle into your new surroundings", 2 * 1000);
      }
      
      // End sequence
      console.log("Sub location sequence complete");
      LocationChangeState.inProgress = false;
      return true;
      
    default:
      // Sequence complete
      console.log("Sub location sequence ended (default case)");
      LocationChangeState.inProgress = false;
      return false;
  }
}

// Continue main location change sequence
function continueMainLocationSequence() {
  LocationChangeState.step++;
  
  switch (LocationChangeState.step) {
    case 2:
      // Step 2: Exit text from current main location
      if (LocationChangeState.currentMain && 
          LocationChangeState.currentMain.exiting_text && 
          LocationChangeState.currentMain.exiting_text.length > 0) {
        const exitText = Pick(LocationChangeState.currentMain.exiting_text);
        Task(exitText, 4 * 1000);
        return true;
      } else {
        // No exit text, skip to step 3
        return continueMainLocationSequence();
      }
      
    case 3:
      // Step 3: "Perhaps life will be better in {city}"
      const cityName = LocationChangeState.newLocation.main.city;
      Task(`Perhaps life will be better here in ${cityName}`, 3 * 1000);
      return true;
      
    case 4:
      // Step 4: Main location entering text
      if (LocationChangeState.newLocation.main.entering_text && 
          LocationChangeState.newLocation.main.entering_text.length > 0) {
        const mainEnterText = Pick(LocationChangeState.newLocation.main.entering_text);
        Task(mainEnterText, 4 * 1000);
        return true;
      } else {
        // No main entering text, skip to step 5
        return continueMainLocationSequence();
      }
      
    case 5:
      // Step 5: Sub location entering text + location change
      CurrentLocation.mainLocation = LocationChangeState.newLocation.main;
      CurrentLocation.subLocation = LocationChangeState.newLocation.sub;
      CurrentLocation.timeInLocation = 0;
      CurrentLocation.timeInCity = 0;
      CurrentLocation.lastTaskTime = game.elapsed || 0;
      CurrentLocation.cityStartTime = game.elapsed || 0;
      game.currentLocation = CurrentLocation;
      updateLocationUI();
      
      if (LocationChangeState.newLocation.sub.entering_text && 
          LocationChangeState.newLocation.sub.entering_text.length > 0) {
        const subEnterText = Pick(LocationChangeState.newLocation.sub.entering_text);
        Task(subEnterText, 4 * 1000);
      } else {
        Task("You arrive at your new destination", 3 * 1000);
      }
      
      Log(`Traveled to ${LocationChangeState.newLocation.main.city}, ${LocationChangeState.newLocation.main.country}`);
      
      // End sequence
      LocationChangeState.inProgress = false;
      return true;
      
    default:
      // Sequence complete
      LocationChangeState.inProgress = false;
      return false;
  }
}

// Select a new sub location (avoiding current one)
function selectNewSubLocation() {
  if (!LocationData || !CurrentLocation.mainLocation) return null;
  
  const currentMain = CurrentLocation.mainLocation;
  const currentSub = CurrentLocation.subLocation;
  const availableLocations = [];
  
  // Add main location specific sub locations
  if (currentMain.sub_locations) {
    currentMain.sub_locations.forEach(subLoc => {
      if (subLoc.name !== currentSub?.name) {
        // Apply rarity weighting (lower rarity = higher weight)
        const weight = 21 - (subLoc.rarity || 10);
        for (let i = 0; i < weight; i++) {
          availableLocations.push({...subLoc, source: 'main'});
        }
      }
    });
  }
  
  // Add global sub locations that are appropriate for this region
  Object.values(LocationData.global_sub_locations).forEach(category => {
    category.forEach(subLoc => {
      if (subLoc.name !== currentSub?.name && 
          (subLoc.regions.includes(currentMain.country) || 
           subLoc.regions.includes("global"))) {
        // Apply rarity weighting
        const weight = 21 - (subLoc.rarity || 10);
        for (let i = 0; i < weight; i++) {
          availableLocations.push({...subLoc, source: 'global'});
        }
      }
    });
  });
  
  return availableLocations.length > 0 ? Pick(availableLocations) : null;
}

// Select a new main location (avoiding current one)
function selectNewMainLocation() {
  if (!LocationData || !CurrentLocation.mainLocation) return null;
  
  const currentMain = CurrentLocation.mainLocation;
  const availableLocations = [];
  
  LocationData.main_locations.forEach(mainLoc => {
    if (mainLoc.city !== currentMain.city || mainLoc.country !== currentMain.country) {
      // Apply rarity weighting (lower rarity = higher weight)
      const weight = 21 - (mainLoc.rarity || 10);
      for (let i = 0; i < weight; i++) {
        availableLocations.push(mainLoc);
      }
    }
  });
  
  return availableLocations.length > 0 ? Pick(availableLocations) : null;
}

// Select appropriate sub location for a main location
function selectSubLocationForMain(mainLocation) {
  const availableLocations = [];
  
  // Add main location specific sub locations
  if (mainLocation.sub_locations) {
    mainLocation.sub_locations.forEach(subLoc => {
      const weight = 21 - (subLoc.rarity || 10);
      for (let i = 0; i < weight; i++) {
        availableLocations.push({...subLoc, source: 'main'});
      }
    });
  }
  
  // Add appropriate global sub locations
  Object.values(LocationData.global_sub_locations).forEach(category => {
    category.forEach(subLoc => {
      if (subLoc.regions.includes(mainLocation.country) || 
          subLoc.regions.includes("global")) {
        const weight = 21 - (subLoc.rarity || 10);
        for (let i = 0; i < weight; i++) {
          availableLocations.push({...subLoc, source: 'global'});
        }
      }
    });
  });
  
  return availableLocations.length > 0 ? Pick(availableLocations) : null;
}

// Show random flavor text for current location
function showLocationFlavor() {
  console.log("showLocationFlavor called");
  console.log("Current sub-location:", CurrentLocation.subLocation?.name);
  console.log("Flavor text available:", CurrentLocation.subLocation?.flavor_text?.length || 0);
  
  if (!CurrentLocation.subLocation) {
    console.log("No sub-location found!");
    return;
  }
  
  if (!CurrentLocation.subLocation.flavor_text) {
    console.log("No flavor_text array found!");
    return;
  }
  
  if (CurrentLocation.subLocation.flavor_text.length === 0) {
    console.log("Flavor text array is empty!");
    return;
  }
  
  const flavorText = Pick(CurrentLocation.subLocation.flavor_text);
  console.log("Selected flavor text:", flavorText);
  
  // Set a flag so Dequeue knows to go straight to killing after this
  justShowedFlavorText = true;
  console.log("Set justShowedFlavorText flag to:", justShowedFlavorText);
  
  Task(flavorText, 2 * 1000);
  console.log("Task called with flavor text, flag is now:", justShowedFlavorText);
}

// Hook into InterplotCinematic to set default location
function hookIntoInterplot() {
  const originalInterplot = window.InterplotCinematic;
  if (originalInterplot) {
    window.InterplotCinematic = function() {
      originalInterplot();
      
      // Set default location if this is the start of the game
      if (!CurrentLocation.mainLocation) {
        setDefaultLocation();
      }
    };
  }
}

// Initialize when the page loads
$(document).ready(async function() {
  await loadLocationData();
  
  // Wait for game to be ready
  if (typeof game !== 'undefined') {
    initializeLocationSystem();
    hookIntoInterplot();
  } else {
    // Wait for game to load
    const checkGame = setInterval(() => {
      if (typeof game !== 'undefined') {
        clearInterval(checkGame);
        initializeLocationSystem();
        hookIntoInterplot();
      }
    }, 100);
  }
});

// Export for external access
window.LocationSystem = {
  init: initializeLocationSystem,
  checkChange: checkLocationChange,
  updateUI: updateLocationUI,
  current: () => CurrentLocation,
  data: () => LocationData,
  state: () => LocationChangeState
};