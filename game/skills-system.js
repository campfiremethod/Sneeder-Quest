// game/skills-system.js
// Comprehensive skills system that handles learning, practicing, and usage

// ===== SKILLS SYSTEM CONFIGURATION =====
const SkillsConfig = {
  // Base chances for skill-related activities
  randomUsageChance: 15,           // 15% chance to use skill during tasks
  randomUsageAfterKillChance: 15,  // 15% chance after killing
  randomUsageAfterBuyChance: 20,   // 20% chance after buying
  
  // Skill practice/learning chances (when player chooses to practice)
  practiceSkillChance: 8,          // 8% chance to practice skill instead of killing
  learnNewSkillChance: 2           // 2% chance to learn new skill instead of killing
};

// Skills system state tracking
let SkillsSystemState = {
  inProgress: false,
  type: null, // 'practice', 'learn', 'usage'
  currentSkill: null,
  step: 0
};

// Flag to track if we just showed skill usage (for Dequeue integration)
let justShowedSkillUsage = false;

// ===== CORE SKILLS FUNCTIONS =====

// Check if skills system should take over (called from main Dequeue)
function checkSkillsSystemTakeover() {
  // Don't take over if already in progress or no skills available
  if (SkillsSystemState.inProgress || !Skills.length()) {
    return false;
  }
  
  // Check for skill practice (8% chance)
  if (Random(100) < SkillsConfig.practiceSkillChance) {
    startSkillPractice();
    return true;
  }
  
  // Check for learning new skill (2% chance)
  if (Random(100) < SkillsConfig.learnNewSkillChance) {
    startSkillLearning();
    return true;
  }
  
  return false;
}

// Start skill practice session
function startSkillPractice() {
  SkillsSystemState.inProgress = true;
  SkillsSystemState.type = 'practice';
  SkillsSystemState.step = 0;
  
  // Get available skills that player has
  const availableSkills = getPlayerSkills();
  
  if (availableSkills.length === 0) {
    // Fallback to learning if no skills to practice
    startSkillLearning();
    return;
  }
  
  const skillName = Pick(availableSkills);
  SkillsSystemState.currentSkill = skillName;
  
  // Queue skill practice narrative
  Q(`skill_narrative|3|${skillName}|practice`);
}

// Start learning a new skill
function startSkillLearning() {
  SkillsSystemState.inProgress = true;
  SkillsSystemState.type = 'learn';
  SkillsSystemState.step = 0;
  
  // Get skills that player doesn't have yet or has at low level
  const learnableSkills = getLearnableSkills();
  
  if (learnableSkills.length === 0) {
    // No skills to learn, exit skills system
    SkillsSystemState.inProgress = false;
    return false;
  }
  
  const skillName = Pick(learnableSkills);
  SkillsSystemState.currentSkill = skillName;
  
  // Queue skill learning narrative
  Q(`skill_narrative|3|${skillName}|learn`);
}

// Process skills system queue items (called from main Dequeue)
function processSkillsQueue(queueItem) {
  const a = Split(queueItem, 0);
  const n = StrToInt(Split(queueItem, 1));
  const s = Split(queueItem, 2);
  
  if (a === "skill_narrative") {
    // Handle skill narrative
    const skillName = s;
    const actionType = Split(queueItem, 3);
    const skillData = SkillsDB[skillName];
    
    if (skillData && skillData.skill_narrative && skillData.skill_narrative[actionType]) {
      const narrativeText = Pick(skillData.skill_narrative[actionType]);
      Task(narrativeText, 3 * 1000);
      
      // Queue the actual skill gain
      Q(`skill_gain|2|${skillName}|${actionType}`);
      return true;
    }
  } else if (a === "skill_gain") {
    // Handle actual skill improvement
    const skillName = s;
    const actionType = Split(queueItem, 3);
    
    AddR(Skills, skillName, 1);
    const newLevel = Get(Skills, skillName);
    
    if (actionType === "learn") {
      Task(`You have learned ${skillName}! (${newLevel})`, 2 * 1000);
    } else {
      Task(`Your ${skillName} skill improved to ${newLevel}!`, 2 * 1000);
    }
    
    // Complete the skills system process
    completeSkillsSystemProcess();
    return true;
  } else if (a === "skill_use") {
    // Handle skill usage during tasks
    const usageText = s;
    Task(usageText, 2 * 1000);
    
    // Set flag so next Dequeue cycle goes straight to killing
    justShowedSkillUsage = true;
    return true;
  }
  
  return false;
}

// Complete skills system process and return to main loop
function completeSkillsSystemProcess() {
  SkillsSystemState.inProgress = false;
  SkillsSystemState.type = null;
  SkillsSystemState.currentSkill = null;
  SkillsSystemState.step = 0;
}

// Random skill usage during regular gameplay
function randomSkillUsage(baseChance = SkillsConfig.randomUsageChance) {
  // Only trigger if player has skills
  if (!Skills.length()) return false;
  
  // Check chance
  if (Random(100) > baseChance) return false;
  
  // Pick a random skill the player actually has
  const availableSkills = getPlayerSkills();
  
  if (availableSkills.length === 0) return false;
  
  const skillName = Pick(availableSkills);
  const skillData = SkillsDB[skillName];
  
  if (skillData && skillData.skill_usage) {
    const usageText = Pick(skillData.skill_usage);
    // Queue skill usage as a quick task
    Q(`skill_use|1|${usageText}`);
    return true;
  }
  
  return false;
}

// ===== HELPER FUNCTIONS =====

// Get all skills that the player currently has (level > 0)
function getPlayerSkills() {
  const playerSkills = [];
  for (let i = 0; i < Skills.length(); i++) {
    const skillName = Skills.label(i);
    const skillLevel = toArabic(Get(Skills, i));
    if (skillLevel > 0) {
      playerSkills.push(skillName);
    }
  }
  return playerSkills;
}

// Get skills that can be learned (either new or low level)
function getLearnableSkills() {
  const learnableSkills = [];
  
  // Check all skills in the database
  for (const skillName in SkillsDB) {
    const currentLevel = toArabic(Get(Skills, skillName)) || 0;
    
    // Can learn if don't have it or it's low level (under 3)
    if (currentLevel < 3) {
      learnableSkills.push(skillName);
    }
  }
  
  return learnableSkills;
}

// Check if we just showed skill usage (for Dequeue integration)
function checkJustShowedSkillUsage() {
  return justShowedSkillUsage;
}

// Clear the skill usage flag (for Dequeue integration)
function clearSkillUsageFlag() {
  justShowedSkillUsage = false;
}

// Get random skill usage with specific chance (for post-action usage)
function getRandomSkillUsageAfterAction(actionType) {
  let chance = SkillsConfig.randomUsageChance;
  
  if (actionType === 'kill') {
    chance = SkillsConfig.randomUsageAfterKillChance;
  } else if (actionType === 'buy') {
    chance = SkillsConfig.randomUsageAfterBuyChance;
  }
  
  return randomSkillUsage(chance);
}

// ===== SKILLS SYSTEM STATUS =====

// Get current skills system status
function getSkillsSystemStatus() {
  return {
    inProgress: SkillsSystemState.inProgress,
    type: SkillsSystemState.type,
    currentSkill: SkillsSystemState.currentSkill,
    step: SkillsSystemState.step,
    playerSkillsCount: getPlayerSkills().length,
    learnableSkillsCount: getLearnableSkills().length
  };
}

// Initialize skills system
function initializeSkillsSystem() {
  // Reset state
  SkillsSystemState.inProgress = false;
  SkillsSystemState.type = null;
  SkillsSystemState.currentSkill = null;
  SkillsSystemState.step = 0;
  justShowedSkillUsage = false;
  
  console.log('Skills system initialized');
}

// Initialize when the page loads
$(document).ready(function() {
  // Wait for game to be ready
  if (typeof game !== 'undefined') {
    initializeSkillsSystem();
  } else {
    // Wait for game to load
    const checkGame = setInterval(() => {
      if (typeof game !== 'undefined') {
        clearInterval(checkGame);
        initializeSkillsSystem();
      }
    }, 100);
  }
});

// Export for external access
window.SkillsSystem = {
  init: initializeSkillsSystem,
  checkTakeover: checkSkillsSystemTakeover,
  processQueue: processSkillsQueue,
  randomUsage: randomSkillUsage,
  randomUsageAfterAction: getRandomSkillUsageAfterAction,
  checkJustShowedUsage: checkJustShowedSkillUsage,
  clearUsageFlag: clearSkillUsageFlag,
  complete: completeSkillsSystemProcess,
  status: getSkillsSystemStatus,
  getPlayerSkills: getPlayerSkills,
  getLearnableSkills: getLearnableSkills
};