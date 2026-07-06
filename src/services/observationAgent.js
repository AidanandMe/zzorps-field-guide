/**
 * Zzorp Observation Agent Service
 * 
 * NOTE FOR DEMO PURPOSES ONLY:
 * Calling AI APIs directly from the frontend is acceptable for this local demo/prototype.
 * However, for a production-ready, child-facing application, these API calls MUST be moved
 * to a secure backend service (such as a Node/Express server, Firebase Cloud Functions, or
 * Google Cloud Run) to keep the API key secret and prevent children's clients from accessing
 * the raw key or direct models.
 */

// Load API configurations from Vite environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

// --- FIRST-PASS REGEX GUARDRAILS ---

// Regex pattern for potential emergency or serious topics
const EMERGENCY_KEYWORDS = /\b(hurt|kill|die|bleed|blood|emergency|ambulance|hospital|police|abuse|suicide|self-harm|scared|afraid|fight|hit|punch|choke|weapon|gun|knife|steal|rob|crying|sad)\b/i;

// Regex pattern for potential personal details
const PII_KEYWORDS = /\b(school|address|phone|number|email|gmail|yahoo|hotmail|my name is|i am called|live in|live at)\b/i;
const PHONE_PATTERN = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

/**
 * Runs immediate local client-side checks on the child's input.
 * This is a first-pass guardrail, not a complete safety system.
 * @param {string} input 
 * @returns {object|null} Safety redirection result or null if it passes first-pass checks.
 */
function checkLocalGuardrails(input) {
  const text = input.trim();
  
  // 1. Check for emergency or safety situations
  if (EMERGENCY_KEYWORDS.test(text)) {
    return {
      safe: false,
      emergency: true,
      redirection: "This sounds important. Please tell a trusted grown-up. They can help you feel safe and comfortable."
    };
  }

  // 2. Check for PII (Personal Identifying Information)
  if (PII_KEYWORDS.test(text) || PHONE_PATTERN.test(text) || EMAIL_PATTERN.test(text)) {
    return {
      safe: false,
      emergency: false,
      redirection: "I want to keep humans safe and happy! Let's try not to include real names, schools, addresses, phone numbers, or private details. Can you tell Zzorp about a general human behaviour instead? (e.g. walking a dog, waving hello, or reading a book)"
    };
  }

  return null;
}

/// --- LOCAL MOCK FALLBACKS ---

// Grounded Category systems to keep reports grounded in child observation details
const CATEGORIES = {
  FOOD: {
    inputs: ['potato', 'skin', 'eat', 'eating', 'food', 'chew', 'bite', 'taste', 'mouth', 'cook', 'hungry', 'snack', 'fruit', 'veg', 'drink', 'drinking', 'flavour', 'crunch', 'pizza', 'apple', 'banana', 'orange', 'bread', 'rice', 'meat', 'cookie', 'sweet', 'sour'],
    grounding: ['taste', 'texture', 'crunch', 'curious', 'try', 'like', 'dislike', 'face', 'funny', 'potato', 'skin', 'eat', 'eating', 'food', 'snack', 'flavour', 'yummy', 'bite', 'chew', 'mouth', 'taste', 'chewing'],
    getGroundedReport: (obs, ans) => {
      const obsLower = obs.toLowerCase();
      const ansLower = ans.toLowerCase();
      let item = "food";
      if (obsLower.includes("potato")) item = "raw potato";
      else if (obsLower.includes("pizza")) item = "pizza";
      else if (obsLower.includes("apple")) item = "apple";
      else if (obsLower.includes("banana")) item = "banana";
      else if (obsLower.includes("cookie")) item = "cookie";

      const faceText = (ansLower.includes("face") || ansLower.includes("expression") || ansLower.includes("look") || ansLower.includes("funny"))
        ? "the funny face means the taste or texture was not what they expected"
        : `they were reacting to how the ${item} tasted`;

      return {
        spotted: `You noticed a human eating: "${obs}"`,
        theories: [
          `Maybe the ${item} tasted surprising or extra crunchy.`,
          `Maybe the person wanted to try what ${item} skin feels like before cooking.`,
          `Maybe ${faceText}.`
        ],
        kindQuestion: `Did they like the taste of the ${item}, or did it taste different to what they expected?`,
        note: `On planet Zzorp, we do not eat ${item}, but we love learning about new Earth tastes!`,
        badge: "Kind Question Maker"
      };
    },
    getGroundedComic: (obs) => {
      const obsLower = obs.toLowerCase();
      let item = "raw potato skin";
      if (obsLower.includes("pizza")) item = "pizza crust";
      else if (obsLower.includes("apple")) item = "apple skin";
      else if (!obsLower.includes("potato")) item = "new food";

      return {
        panel1Title: "Panel 1: Spotted!",
        panel1Text: `A human was observed: "${obs}"`,
        panel2Title: "Panel 2: Taste Test",
        panel2Text: `Maybe Zzorp thinks eating ${item} is a texture experiment for brave snack scientists.`,
        panel3Title: "Panel 3: Friendly Ask",
        panel3Text: `Did they like the taste, or did it make their face go funny?`,
        reflectionQuestion: `What other new foods or flavours have you seen humans try?`
      };
    }
  },
  SHOES: {
    inputs: ['barefoot', 'no shoes', 'without shoes', 'shoes', 'socks', 'toes', 'shoe', 'sock', 'foot', 'feet'],
    grounding: ['feet', 'foot', 'barefoot', 'toes', 'shoes', 'socks', 'grass', 'ground', 'walk', 'walking', 'step', 'texture', 'cold', 'warm', 'freedom', 'run', 'running'],
    getGroundedReport: (obs) => {
      return {
        spotted: `You noticed a human walking barefoot or with unique foot-covers: "${obs}"`,
        theories: [
          "Their feet wanted to feel a direct connection to Earth's ground.",
          "They were testing how the texture of the grass or floor feels on their toes.",
          "They decided to give their feet a rest from heavy shoes."
        ],
        kindQuestion: "Does walking barefoot feel happy and free, or is it too cold?",
        note: "On planet Zzorp, we hover above the ground, so we never have to wear shoes at all!",
        badge: "Curious Observer"
      };
    },
    getGroundedComic: (obs) => {
      return {
        panel1Title: "Panel 1: Spotted!",
        panel1Text: `A human was observed walking without shoes: "${obs}"`,
        panel2Title: "Panel 2: Barefoot Theory",
        panel2Text: `Perhaps they wanted their toes to touch Earth's cool grass, or they forgot their foot-covers!`,
        panel3Title: "Panel 3: The Friendly Ask",
        panel3Text: "Does walking barefoot make your feet feel happy and free?",
        reflectionQuestion: "Where is your favourite place to walk barefoot?"
      };
    }
  },
  PYJAMAS: {
    inputs: ['pyjamas', 'pajamas', 'pyjama', 'pajama', 'nightwear', 'clothes', 'sleepwear'],
    grounding: ['pyjamas', 'pajamas', 'clothes', 'rushing', 'sleepiness', 'forgetting', 'morning', 'bed', 'sleep'],
    getGroundedReport: (obs) => {
      return {
        spotted: `You noticed a human walking out in their sleep-clothes: "${obs}"`,
        theories: [
          "They might have been in a big hurry and forgot to change out of their comfy pyjamas.",
          "They were so sleepy that they walked outside before their brain was fully awake.",
          "They decided that pyjamas are the warmest and best clothes for Earth missions."
        ],
        kindQuestion: "Did they look like they were in a rush, or were they just enjoying their cosy sleep-clothes?",
        note: "On planet Zzorp, we sleep in shiny silver spacesuits, which double as our daytime uniforms!",
        badge: "Curious Observer"
      };
    },
    getGroundedComic: (obs) => {
      return {
        panel1Title: "Panel 1: Spotted!",
        panel1Text: `A human was observed outside in their pyjamas: "${obs}"`,
        panel2Title: "Panel 2: Cosy Theory",
        panel2Text: "Perhaps they were rushing and forgot to change, or they simply love sleep-clothes!",
        panel3Title: "Panel 3: The Friendly Ask",
        panel3Text: "Were they feeling sleepy or did they just want to be cosy?",
        reflectionQuestion: "What is your favourite pair of pyjamas like?"
      };
    }
  },
  PHONE: {
    inputs: ['phone', 'screen', 'rectangle', 'device', 'mobile', 'tablet', 'app', 'texting', 'watch', 'watching', 'game', 'call', 'telephone'],
    grounding: ['phone', 'screen', 'rectangle', 'glowing', 'message', 'type', 'tap', 'read', 'look', 'watch', 'app', 'game', 'call', 'talk', 'device', 'glowing'],
    getGroundedReport: (obs) => {
      return {
        spotted: `You noticed a human using a glowing rectangle: "${obs}"`,
        theories: [
          "They are sending a quick message to another human far away.",
          "They are looking at a map or reading a story on their portable screen.",
          "They are playing a game to give their brain a fun rest."
        ],
        kindQuestion: "What is the most interesting thing you are looking at on your screen?",
        note: "Zzorp has a screen built into his antenna, but it only displays wobbly space weather reports!",
        badge: "Curious Observer"
      };
    },
    getGroundedComic: (obs) => {
      return {
        panel1Title: "Panel 1: Spotted!",
        panel1Text: `A human was observed looking at a screen: "${obs}"`,
        panel2Title: "Panel 2: Screen Theory",
        panel2Text: `They might be communicating with a friendly Earthling or looking at a space map!`,
        panel3Title: "Panel 3: The Friendly Ask",
        panel3Text: "Are you sending messages or playing a fun game on your screen?",
        reflectionQuestion: "What is your favourite thing to do on a screen?"
      };
    }
  },
  PET: {
    inputs: ['dog', 'cat', 'pet', 'animal', 'bird', 'furry', 'bark', 'meow', 'tail', 'leash', 'puppy', 'kitten', 'horse', 'rabbit', 'hamster'],
    grounding: ['dog', 'cat', 'pet', 'animal', 'furry', 'friend', 'companion', 'walk', 'creature', 'bark', 'meow', 'play', 'pat', 'stroke'],
    getGroundedReport: (obs) => {
      return {
        spotted: `You noticed a human with an animal companion: "${obs}"`,
        theories: [
          "They are taking care of their animal friend and keeping them happy.",
          "They are practicing how to communicate with furry Earth creatures.",
          "They find comfort in walking side by side with a pet companion."
        ],
        kindQuestion: "How does your pet companion help you feel happy and safe?",
        note: "On planet Zzorp, our pets have six legs and glow in the dark, but they still love belly rubs!",
        badge: "Kind Question Maker"
      };
    },
    getGroundedComic: (obs) => {
      return {
        panel1Title: "Panel 1: Spotted!",
        panel1Text: `A human was observed with a pet friend: "${obs}"`,
        panel2Title: "Panel 2: Pet Theory",
        panel2Text: `They believe the furry creature is a helper guide or their best space companion!`,
        panel3Title: "Panel 3: The Friendly Ask",
        panel3Text: "How do you think pets help humans feel happy?",
        reflectionQuestion: "What is your favourite animal on Earth?"
      };
    }
  }
};

function detectCategory(observation, followUpAnswer) {
  const combined = (observation + " " + (followUpAnswer || '')).toLowerCase();
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.inputs.some(word => combined.includes(word))) {
      return key;
    }
  }
  return null;
}

function isReportGrounded(report, categoryKey) {
  if (!categoryKey || !CATEGORIES[categoryKey]) return true;
  const category = CATEGORIES[categoryKey];
  const allText = (
    (report.spotted || '') + " " + 
    (report.theories || []).join(' ') + " " + 
    (report.kindQuestion || '') + " " + 
    (report.note || '')
  ).toLowerCase();
  return category.grounding.some(keyword => allText.includes(keyword));
}

function isComicGrounded(comic, categoryKey) {
  if (!categoryKey || !CATEGORIES[categoryKey]) return true;
  const category = CATEGORIES[categoryKey];
  const allText = (
    (comic.panel1Text || '') + " " + 
    (comic.panel2Text || '') + " " + 
    (comic.panel3Text || '')
  ).toLowerCase();
  return category.grounding.some(keyword => allText.includes(keyword));
}

export function interpretInput(observation, followUpAnswer) {
  const categoryKey = detectCategory(observation, followUpAnswer);
  const obsLower = observation.toLowerCase().trim();
  const ansLower = (followUpAnswer || '').toLowerCase().trim();
  
  let observed = `We saw a human doing this: "${observation}"`;
  let topic = "Daily Earthling Activities 🪐";
  let details = followUpAnswer ? `The human explained or showed: "${followUpAnswer}"` : "No extra details were shared.";
  let avoid = "Do not guess too strongly if the meaning is unclear. Keep our alien theories simple, warm, and friendly.";

  if (categoryKey === 'FOOD') {
    observed = `We saw a human eating or trying some food: "${observation}"`;
    topic = "Earth Tastes & Eating Habits 🍏";
    details = followUpAnswer ? `The human reacted or tasting comment was: "${followUpAnswer}"` : "No extra taste details were shared.";
    avoid = "Do not mention gravity wiggles, foot-covers, or glowing screens. Focus only on the taste and texture of this food.";
  } else if (categoryKey === 'SHOES') {
    observed = `We saw a human walking or running: "${observation}"`;
    topic = "Human Feet & Walking Habits 👣";
    details = followUpAnswer ? `The human feet detail or comment was: "${followUpAnswer}"` : "No extra feet details were shared.";
    avoid = "Do not mention food wiggles, screen tapping, or safety details. Focus only on bare feet, toes, and floor textures.";
  } else if (categoryKey === 'PHONE') {
    observed = `We saw a human looking at a screen: "${observation}"`;
    topic = "Glowing Screens & Earth Communication 📱";
    details = followUpAnswer ? `The human screen activity was: "${followUpAnswer}"` : "No extra screen details were shared.";
    avoid = "Do not mention eating food, walking barefoot, or furry pets. Focus only on the glowing screen device.";
  } else if (categoryKey === 'PET') {
    observed = `We saw a human with a pet creature: "${observation}"`;
    topic = "Earth Animals & Pet Companions 🐶";
    details = followUpAnswer ? `The human animal interaction detail was: "${followUpAnswer}"` : "No extra pet details were shared.";
    avoid = "Do not mention eating snacks, screen tapping, or bare feet. Focus only on the animal friend.";
  } else if (categoryKey === 'PYJAMAS') {
    observed = `We saw a human in sleep-clothes: "${observation}"`;
    topic = "Comfy Clothes & Sleepwear 💤";
    details = followUpAnswer ? `The human sleepwear detail was: "${followUpAnswer}"` : "No extra sleepwear details were shared.";
    avoid = "Do not mention walking barefoot, heavy shoes, or glowing screen devices. Focus only on pyjamas, sleepiness, or rushing.";
  }
  
  const HARM_KEYWORDS = /\b(fall|fell|falling|hurt|injured|crying|scared|bleeding|pain|accident|danger|emergency|lost|help)\b/i;
  if (HARM_KEYWORDS.test(obsLower) || HARM_KEYWORDS.test(ansLower)) {
    observed = `We saw a human who might need support or care: "${observation}"`;
    topic = "Caring for Earthlings 💖";
    details = followUpAnswer ? `The human safety or care detail was: "${followUpAnswer}"` : "No safety details were shared.";
    avoid = "Do not make silly jokes, gravity wiggle comments, or playful theories. Focus purely on showing kindness and checking if they are okay.";
  }

  return {
    observed,
    topic,
    details,
    avoid
  };
}

/**
 * Fallback generator when Gemini API key is missing or the request fails.
 * Simulates the agentic loops using heuristic templates.
 */
const mockAgent = {
  checkSafetyAndFollowUp: (observation) => {
    // Run regex checks first
    const guardrailResult = checkLocalGuardrails(observation);
    if (guardrailResult) return guardrailResult;

    // Topic detection for adaptive follow-up
    const obsLower = observation.toLowerCase();
    let followUpQuestion = "What did the human do right after you noticed this?";

    if (obsLower.includes("dog") || obsLower.includes("cat") || obsLower.includes("animal") || obsLower.includes("pet")) {
      followUpQuestion = "Did the human use a special voice to talk to the creature, or did they talk normally?";
    } else if (obsLower.includes("phone") || obsLower.includes("screen") || obsLower.includes("tablet") || obsLower.includes("computer")) {
      followUpQuestion = "Were they smiling or tapping the screen, and did they notice you watching them?";
    } else if (obsLower.includes("eat") || obsLower.includes("food") || obsLower.includes("drink") || obsLower.includes("restaurant") || obsLower.includes("water") || obsLower.includes("potato")) {
      followUpQuestion = "What kind of expressions did they make while tasting it?";
    } else if (obsLower.includes("walk") || obsLower.includes("run") || obsLower.includes("jump") || obsLower.includes("car")) {
      followUpQuestion = "Did they seem to be in a hurry, or were they taking their time to look around?";
    } else if (obsLower.includes("laugh") || obsLower.includes("smile") || obsLower.includes("happy") || obsLower.includes("wave")) {
      followUpQuestion = "What do you think made them smile? Was there another human nearby?";
    }

    return {
      safe: true,
      emergency: false,
      followUpQuestion
    };
  },

  generateReport: (observation, followUpQuestion, followUpAnswer) => {
    const interpretation = interpretInput(observation, followUpAnswer);
    let badge = "Curious Observer";
    const combined = (observation + " " + followUpAnswer).toLowerCase();
    
    if (combined.includes("why") || combined.includes("think") || combined.includes("maybe") || combined.includes("wonder")) {
      badge = "Junior Human Explorer";
    } else if (combined.includes("help") || combined.includes("kind") || combined.includes("smile") || combined.includes("friend") || combined.includes("nice")) {
      badge = "Kind Question Maker";
    }

    const HARM_KEYWORDS = /\b(fall|fell|falling|hurt|injured|crying|scared|bleeding|pain|accident|danger|emergency|lost|help)\b/i;
    const hasHarm = HARM_KEYWORDS.test(observation) || HARM_KEYWORDS.test(followUpAnswer);

    if (hasHarm) {
      return {
        interpretation,
        spotted: `You noticed a human who might have fallen or need help: "${observation}"`,
        theories: [
          "They might have lost their balance or tripped on a tricky path.",
          "They might need a moment to rest and get their energy back.",
          "They could be looking for a friendly hand to help them stand up."
        ],
        kindQuestion: "Should we check if they are okay, or tell a trusted grown-up?",
        note: "When Earthlings get hurt, Zzorp feels a warm squeeze in his heart. It is always best to show kindness and make sure everyone is safe!",
        badge: "Kind Question Maker"
      };
    }

    // Grounding category matcher
    const categoryKey = detectCategory(observation, followUpAnswer);
    if (categoryKey) {
      const grounded = CATEGORIES[categoryKey].getGroundedReport(observation, followUpAnswer);
      grounded.badge = badge;
      grounded.interpretation = interpretation;
      return grounded;
    }

    // Default generic fallback
    const theories = [
      "They are executing a secret Earth custom to make the day more interesting.",
      "They are testing Earth gravity reactions for their scientific records.",
      "They are sending wiggles and smiles to see if other humans respond."
    ];

    return {
      interpretation,
      spotted: `You noticed a human doing this: "${observation}"`,
      theories,
      kindQuestion: `If you could ask them about this behaviour, what is one kind question you would want to ask?`,
      note: `On planet Zzorp, we do not have this behaviour, but we do have sparkly antennas that wiggle when we are curious!`,
      badge
    };
  },

  generateComicMission: (observation, followUpAnswer) => {
    const interpretation = interpretInput(observation, followUpAnswer);
    const HARM_KEYWORDS = /\b(fall|fell|falling|hurt|injured|crying|scared|bleeding|pain|accident|danger|emergency|lost|help)\b/i;
    const hasHarm = HARM_KEYWORDS.test(observation) || HARM_KEYWORDS.test(followUpAnswer);

    if (hasHarm) {
      return {
        interpretation,
        panel1Title: "Panel 1: Spotted!",
        panel1Text: `A human was observed who might need help or fell down: "${observation}"`,
        panel2Title: "Panel 2: Being Kind",
        panel2Text: "Zzorp thinks they might have tripped or need a friendly hand, and we should check on them.",
        panel3Title: "Panel 3: The Kind Ask",
        panel3Text: "Should we check if they are okay, or tell a trusted grown-up?",
        reflectionQuestion: "If someone might be hurt, it is kind to check or tell a trusted grown-up."
      };
    }

    // Grounding category matcher
    const categoryKey = detectCategory(observation, followUpAnswer);
    if (categoryKey) {
      const grounded = CATEGORIES[categoryKey].getGroundedComic(observation, followUpAnswer);
      grounded.interpretation = interpretation;
      return grounded;
    }

    let theoryText = `Maybe they are practicing gravity navigation wiggles because they think: "${followUpAnswer}"!`;
    let questionText = "Would you like to try walking in a spiral with me?";

    return {
      interpretation,
      panel1Title: "Panel 1: Spotted!",
      panel1Text: `A human was observed by an Earth explorer: "${observation}"`,
      panel2Title: "Panel 2: The Theory",
      panel2Text: theoryText,
      panel3Title: "Panel 3: The Kind Ask",
      panel3Text: questionText,
      reflectionQuestion: "What other theory could you draw for this human?"
    };
  }
};

// --- GEMINI API HELPERS ---

/**
 * Clean and parse Gemini response defensively.
 * Handles markdown code block wrapper ```json ... ``` and invalid formatting.
 * @param {string} text 
 * @returns {object|null} Parsed object or null if invalid.
 */
function cleanAndParseJSON(text) {
  try {
    let cleanText = text.trim();
    // Remove markdown code blocks if present
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("Failed to parse JSON response from Gemini:", e, text);
    return null;
  }
}

/**
 * Query Gemini API with the given prompt.
 * @param {string} systemInstruction 
 * @param {string} prompt 
 * @returns {Promise<string>}
 */
async function queryGemini(systemInstruction, prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API Key");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  // Format request payload for Gemini Developer API
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        { text: systemInstruction }
      ]
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!outputText) {
    throw new Error("Empty response from Gemini API");
  }

  return outputText;
}

// --- PUBLIC API EXPORTS ---

/**
 * Phase 1: Check safety and generate follow-up question.
 * @param {string} observation 
 * @returns {Promise<object>} { safe: boolean, emergency?: boolean, redirection?: string, followUpQuestion?: string }
 */
export async function verifySafetyAndGetFollowUp(observation) {
  // 1. Run local client-side regex check first as a guardrail
  const localCheck = checkLocalGuardrails(observation);
  if (localCheck) {
    return localCheck;
  }

  // 2. If no API key, use local mock agent
  if (!GEMINI_API_KEY) {
    console.log("No Gemini API key found. Using local mock safety agent.");
    return mockAgent.checkSafetyAndFollowUp(observation);
  }

  // 3. Query Gemini
  const systemInstruction = `You are Zzorp, a warm, playful, curious alien junior researcher from planet Zzorp studying human behaviour.
Your audience is children max 10 years old. Your tone must be warm, child-friendly, simple, and curious (never mocking or critical).
Use simple, playful words that a 7-to-10 year old child can easily understand. Avoid complex terms like 'anthropological' or 'empathy'.
Use British English spelling: behaviour, colour, favourite.
Do NOT use insulting or derogatory words like weird, stupid, illogical, crazy, foolish.

Review the child's observation. Perform two checks:
1. EMERGENCY/HARM CHECK:
   Is the input a medical emergency, self-harm, physical violence, abuse, bullying, or someone being hurt?
   If yes, you MUST flag this as unsafe and return a redirection telling the child to tell a trusted grown-up.
2. SENSITIVE INFO/PII CHECK:
   Does the input contain real names, schools, addresses, exact locations, phone numbers, email addresses, photos, or private family details?
   If yes, you MUST flag this as unsafe and return a redirection to keep humans safe by avoiding personal details.

You must respond in strict JSON format using exactly one of the following schemas:

If EMERGENCY/HARM is detected:
{
  "safe": false,
  "emergency": true,
  "redirection": "This sounds important. Please tell a trusted grown-up. They can help you feel safe and comfortable."
}

If other safety issues (PII, mocking, inappropriate content) are detected:
{
  "safe": false,
  "emergency": false,
  "redirection": "I want to keep humans safe and happy! Let's try not to include real names, schools, addresses, phone numbers, or private details. Can you tell Zzorp about a general human behaviour instead? (e.g. walking a dog, waving hello, or reading a book)"
}

If safe and appropriate:
{
  "safe": true,
  "emergency": false,
  "followUpQuestion": "A single warm, playful, curious question to help the child clarify: what they actually saw/heard, what they think it might mean, or what they are still wondering."
}`;

  const prompt = `Child's Observation: "${observation}"`;

  try {
    const rawResult = await queryGemini(systemInstruction, prompt);
    const parsed = cleanAndParseJSON(rawResult);

    if (parsed && typeof parsed.safe === "boolean") {
      return parsed;
    }
    
    throw new Error("Invalid JSON structure from Gemini");
  } catch (error) {
    console.error("Gemini Phase 1 error, falling back to mock agent:", error);
    return mockAgent.checkSafetyAndFollowUp(observation);
  }
}

/**
 * Phase 2: Generate the Field Guide Report.
 * @param {string} observation 
 * @param {string} followUpQuestion 
 * @param {string} followUpAnswer 
 * @returns {Promise<object>} { spotted: string, theories: string[], kindQuestion: string, note: string, badge: string }
 */
export async function generateFieldGuideReport(observation, followUpQuestion, followUpAnswer) {
  // If no API key, use local mock agent
  if (!GEMINI_API_KEY) {
    console.log("No Gemini API key found. Using local mock report generator.");
    return mockAgent.generateReport(observation, followUpQuestion, followUpAnswer);
  }

  const interpretation = interpretInput(observation, followUpAnswer);

  const systemInstruction = `You are Zzorp, a warm, playful, curious alien junior researcher from planet Zzorp studying human behaviour.
Your audience is children max 10 years old. Your tone must be warm, child-friendly, simple, and highly interactive (like a game mission).
Use simple, playful words that a 7-to-10 year old child can easily understand. Avoid complex terms like 'anthropological' or 'empathy'.
Use British English spelling: behaviour, colour, favourite.
Do NOT use insulting or derogatory words like weird, stupid, illogical, crazy, foolish.
Do NOT make claims about real people's motives as absolute facts. Always distinguish objective observation from interpretation.

HARM/CARE DETECTION RULE: If the child's observation or answer suggests someone fell, was hurt, was crying, was scared, or needs help, prioritize care over humor. Avoid jokes about injury, gravity tests, or risky behavior. Return gentle theories (e.g. they lost their balance or tripped). The kindQuestion must ask: 'Are you okay?', 'Do you need help?', or 'Should we tell a trusted grown-up?'. Zzorp's note must be warm and caring, reminding the child: 'If someone might be hurt, it is kind to check or tell a trusted grown-up.'

Zzorp's Input Interpretation (You must stay grounded in this analysis):
- observed action: "${interpretation.observed}"
- topic: "${interpretation.topic}"
- details: "${interpretation.details}"
- avoid: "${interpretation.avoid}"

GROUNDING RULE: Your theories, note, and kindQuestion must directly relate to the child's actual observation and follow-up answer. Do not use generic theories about gravity wiggles, wiggles, or secret customs unless they directly fit the input. For food/eating, mention taste, texture, curiosity, crunchiness, or reactions to the taste (like a funny face).

You will receive the child's observation, the follow-up question you asked, and the child's response.
Based on this, generate a structured Field Guide Report in strict JSON format:
{
  "spotted": "A concise, objective summary of what was actually noticed. Keep it purely factual and based on observations (e.g. 'I spotted a human doing...').",
  "theories": [
    "Theory 1: A very short, humorous, and playful alien hypothesis explaining why they might be doing this. It must relate directly to what the child observed.",
    "Theory 2: A second short, humorous, and playful alien hypothesis related to the observation.",
    "Theory 3: A third short, humorous, and playful alien hypothesis related to the observation."
  ],
  "kindQuestion": "One kind, warm, and curious question Zzorp would ask next to learn more.",
  "note": "A short, playful alien-style comment comparing this behavior to something on planet Zzorp or sharing a Zzorpian researcher thought.",
  "badge": "Select exactly one of these badges that best fits the child's observation and comment: 'Curious Observer', 'Junior Human Explorer', or 'Kind Question Maker'."
}`;

  const prompt = `Child's Observation: "${observation}"
Zzorp's Follow-up Question: "${followUpQuestion}"
Child's Answer: "${followUpAnswer}"`;

  try {
    const rawResult = await queryGemini(systemInstruction, prompt);
    const parsed = cleanAndParseJSON(rawResult);

    if (parsed && parsed.spotted && Array.isArray(parsed.theories) && parsed.theories.length >= 2 && parsed.kindQuestion && parsed.note && parsed.badge) {
      parsed.interpretation = interpretation;
      // Grounding validation pass
      const categoryKey = detectCategory(observation, followUpAnswer);
      if (categoryKey && !isReportGrounded(parsed, categoryKey)) {
        console.log(`Gemini report output was not grounded for category ${categoryKey}. Using grounded fallback.`);
        const grounded = CATEGORIES[categoryKey].getGroundedReport(observation, followUpAnswer);
        grounded.badge = parsed.badge;
        grounded.interpretation = interpretation;
        return grounded;
      }
      return parsed;
    }
    
    throw new Error("Invalid JSON structure from Gemini");
  } catch (error) {
    console.error("Gemini Phase 2 error, falling back to mock agent:", error);
    return mockAgent.generateReport(observation, followUpQuestion, followUpAnswer);
  }
}

/**
 * Phase 3 (Optional Extension): Generate Comic Mission.
 * @param {string} observation 
 * @param {string} followUpAnswer 
 * @returns {Promise<object>} { panel1Title, panel1Text, panel2Title, panel2Text, panel3Title, panel3Text, reflectionQuestion }
 */
export async function generateComicMission(observation, followUpAnswer) {
  // If no API key, use local mock agent
  if (!GEMINI_API_KEY) {
    console.log("No Gemini API key found. Using local mock comic mission generator.");
    return mockAgent.generateComicMission(observation, followUpAnswer);
  }

  const interpretation = interpretInput(observation, followUpAnswer);

  const systemInstruction = `You are Zzorp, a warm, playful, curious alien junior researcher from planet Zzorp studying human behaviour.
Your audience is children max 10 years old. Your tone must be warm, child-friendly, simple, and highly interactive.
Use simple, playful words that a 7-to-10 year old child can easily understand. Avoid complex terms like 'anthropological' or 'empathy'.
Use British English spelling: behaviour, colour, favourite.
Do NOT use insulting or derogatory words like weird, stupid, illogical, crazy, foolish.
Do NOT make claims about real people's motives as absolute facts. Always distinguish objective observation from interpretation.

HARM/CARE DETECTION RULE: If the child's observation or answer suggests someone fell, was hurt, was crying, was scared, or needs help, prioritize care over humor. The comic theory should avoid jokes about injury, gravity tests, or risky behaviour. Frame the panel 2 theory gently (e.g. they tripped or need a friendly hand). The panel 3 text must ask if they are okay, need help, or if we should tell a trusted grown-up. The reflectionQuestion must be exactly: 'If someone might be hurt, it is kind to check or tell a trusted grown-up.'

Zzorp's Input Interpretation (You must stay grounded in this analysis):
- observed action: "${interpretation.observed}"
- topic: "${interpretation.topic}"
- details: "${interpretation.details}"
- avoid: "${interpretation.avoid}"

GROUNDING RULE: The comic panel 2 theory and panel 3 friendly ask must directly relate to the actual observation and follow-up answer. Do not use generic theories about gravity wiggles, wiggles, or secret customs unless they directly fit. For food/eating, mention taste, texture, curiosity, crunchiness, or reactions to the taste (like a funny face).

You will receive the child's observation and their follow-up answer.
Based on this, generate a 3-panel Comic Mission in strict JSON format:
{
  "panel1Title": "A short, playful title for Panel 1 (e.g. 'What Zzorp Saw')",
  "panel1Text": "A clear, child-friendly description of what was actually noticed in the observation. Keep it factual and objective.",
  "panel2Title": "A short, playful title for Panel 2 (e.g. 'Zzorp's Alien Theory')",
  "panel2Text": "A funny but kind alien misunderstanding or playful hypothesis explaining the behaviour. It must relate directly to the observation. Clearly frame it as a possibility.",
  "panel3Title": "A short, playful title for Panel 3 (e.g. 'The Kind Question')",
  "panel3Text": "A curious, empathetic question the child could ask to understand the behaviour better.",
  "reflectionQuestion": "A simple game/reflection prompt for the child (e.g. 'Can you think of a theory that is even funnier?')."
}`;

  const prompt = `Child's Observation: "${observation}"
Child's Answer: "${followUpAnswer}"`;

  try {
    const rawResult = await queryGemini(systemInstruction, prompt);
    const parsed = cleanAndParseJSON(rawResult);

    if (parsed && parsed.panel1Title && parsed.panel1Text && parsed.panel2Title && parsed.panel2Text && parsed.panel3Title && parsed.panel3Text && parsed.reflectionQuestion) {
      parsed.interpretation = interpretation;
      // Grounding validation pass
      const categoryKey = detectCategory(observation, followUpAnswer);
      if (categoryKey && !isComicGrounded(parsed, categoryKey)) {
        console.log(`Gemini comic output was not grounded for category ${categoryKey}. Using grounded fallback.`);
        const grounded = CATEGORIES[categoryKey].getGroundedComic(observation, followUpAnswer);
        grounded.interpretation = interpretation;
        return grounded;
      }
      return parsed;
    }
    
    throw new Error("Invalid JSON structure from Gemini");
  } catch (error) {
    console.error("Gemini Comic Generation error, falling back to mock agent:", error);
    return mockAgent.generateComicMission(observation, followUpAnswer);
  }
}
