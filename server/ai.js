import axios from "axios";

// Helper to check if API keys are available
function getAIConfig() {
  return {
    geminiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    featherlessKey: process.env.FEATHERLESS_API_KEY,
    featherlessModel: process.env.FEATHERLESS_MODEL || "deepseek-ai/DeepSeek-V3",
    featherlessBaseUrl: process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1"
  };
}

// Low-level caller to call configured AI service
async function callAIService(systemPrompt, userPrompt, jsonMode = true) {
  const config = getAIConfig();

  // 1. Try Gemini first if key is present
  if (config.geminiKey && config.geminiKey.trim() !== "") {
    try {
      console.log(`Calling Gemini API (${config.geminiModel})...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiKey}`;
      
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUser Input:\n${userPrompt}`
              }
            ]
          }
        ]
      };

      if (jsonMode) {
        payload.generationConfig = {
          responseMimeType: "application/json"
        };
      }

      const response = await axios.post(url, payload, { timeout: 15000 });
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("Gemini response empty");
      }

      return jsonMode ? JSON.parse(text) : text;
    } catch (err) {
      console.warn("Gemini API call failed, attempting Featherless fallback...", err.message);
    }
  }

  // 2. Try Featherless (OpenAI compatible) if key is present
  if (config.featherlessKey && config.featherlessKey.trim() !== "") {
    try {
      console.log(`Calling Featherless API (${config.featherlessModel})...`);
      const url = `${config.featherlessBaseUrl}/chat/completions`;
      
      const payload = {
        model: config.featherlessModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      };

      if (jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const response = await axios.post(url, payload, {
        headers: {
          "Authorization": `Bearer ${config.featherlessKey}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      });

      const text = response.data?.choices?.[0]?.message?.content;
      
      if (!text) {
        throw new Error("Featherless response empty");
      }

      return jsonMode ? JSON.parse(text) : text;
    } catch (err) {
      console.warn("Featherless API call failed:", err.message);
    }
  }

  // 3. Throw to trigger local fallback if both failed or not configured
  throw new Error("No functional AI API key configured");
}

// 1. INCIDENT CLASSIFIER
export async function classifyIncident(type, description) {
  const systemPrompt = `You are an expert safety routing AI. Analyze the reported incident type and description.
Provide a JSON object containing:
- category: A refined incident category (e.g., Harassment, Theft, Poor Lighting, Isolated Area, Suspicious Activity, Unsafe Transport Stop).
- severity: A severity score from 1 to 5 (1 being low danger like broken bulb, 5 being immediate physical threat like armed theft/assault).
- confidence: Your confidence score (0 to 100).
- aiRecommendation: A short, practical safety tip or recommendation for other travelers in this area (max 2 sentences).
Response MUST be in strict JSON format:
{
  "category": "...",
  "severity": 3,
  "confidence": 90,
  "aiRecommendation": "..."
}`;

  const userPrompt = `Incident Type: ${type}\nDescription: ${description}`;

  try {
    return await callAIService(systemPrompt, userPrompt, true);
  } catch (err) {
    console.log("Using local mock incident classifier.");
    return mockClassifyIncident(type, description);
  }
}

function mockClassifyIncident(type, description) {
  const descLower = description.toLowerCase();
  let severity = 3;
  let category = type;
  let confidence = 85;
  let aiRecommendation = "Be cautious when traveling through this area, especially at night. Keep your emergency contact active.";

  if (descLower.includes("harass") || descLower.includes("stalk") || descLower.includes("follow") || descLower.includes("teas")) {
    severity = 4;
    category = "Harassment";
    aiRecommendation = "Avoid traveling alone in this area after dark. Seek well-populated streets and call emergency services if followed.";
  } else if (descLower.includes("steal") || descLower.includes("theft") || descLower.includes("snatch") || descLower.includes("rob")) {
    severity = 5;
    category = "Theft";
    aiRecommendation = "Keep valuables out of sight and stay alert. If confronted, prioritize your safety and call the police immediately.";
  } else if (descLower.includes("dark") || descLower.includes("light") || descLower.includes("broken") || descLower.includes("lamp")) {
    severity = 2;
    category = "Poor Lighting";
    aiRecommendation = "Carry a flashlight or use your phone light. Travel with a companion and stay on active roads.";
  } else if (descLower.includes("isolated") || descLower.includes("deserted") || descLower.includes("empty") || descLower.includes("quiet")) {
    severity = 3;
    category = "Isolated Area";
    aiRecommendation = "Stick to main roads with active foot traffic. Avoid taking shortcuts through narrow, empty lanes.";
  }

  return { category, severity, confidence, aiRecommendation };
}

// 2. AREA SAFETY SUMMARY
export async function generateAreaSummary(latitude, longitude, nearbyIncidents) {
  const systemPrompt = `You are a regional women's safety analyst. Analyze the list of nearby incidents in the last few days.
Provide a JSON object containing:
- riskLevel: Overall risk level ("Safe", "Moderate", "High Risk").
- recentConcerns: An array of 1-3 string categories summarizing recent reports (e.g., ["Theft", "Poor Lighting"]).
- suggestedTravelTime: Safest time window (e.g., "Daylight hours only", "Safe anytime", "Before 9 PM").
- recommendation: Specific local safety advice based on incident types (max 2 sentences).
Response MUST be in strict JSON format:
{
  "riskLevel": "...",
  "recentConcerns": ["..."],
  "suggestedTravelTime": "...",
  "recommendation": "..."
}`;

  const userPrompt = `Location: ${latitude}, ${longitude}\nNearby Incidents:\n${JSON.stringify(nearbyIncidents, null, 2)}`;

  try {
    return await callAIService(systemPrompt, userPrompt, true);
  } catch (err) {
    console.log("Using local mock area summary generator.");
    return mockAreaSummary(nearbyIncidents);
  }
}

function mockAreaSummary(incidents) {
  if (!incidents || incidents.length === 0) {
    return {
      riskLevel: "Safe",
      recentConcerns: [],
      suggestedTravelTime: "Safe anytime",
      recommendation: "No active incidents reported in this zone. Standard safety practices apply."
    };
  }

  const maxSeverity = Math.max(...incidents.map(i => i.severity || 3));
  const types = [...new Set(incidents.map(i => i.type))].slice(0, 3);

  let riskLevel = "Moderate";
  let suggestedTravelTime = "Before 9 PM";
  let recommendation = "Use well-patrolled routes. Avoid walking alone and stay aware of your surroundings.";

  if (maxSeverity >= 4) {
    riskLevel = "High Risk";
    suggestedTravelTime = "Before 7 PM";
    recommendation = "Highly recommend traveling with a group or using vehicles rather than walking on foot. High density of severe incidents.";
  } else if (maxSeverity < 2) {
    riskLevel = "Safe";
    suggestedTravelTime = "Safe anytime";
    recommendation = "Area shows minor hazards only. Ideal for standard evening commutes.";
  }

  return {
    riskLevel,
    recentConcerns: types,
    suggestedTravelTime,
    recommendation
  };
}

// 3. ROUTE ANALYZER
export async function analyzeRoutes(sourceName, destName, routesInfo) {
  const systemPrompt = `You are a safety-routing AI. Compare the route choices between source and destination.
Provide a JSON object containing:
- riskExplanation: A clear explanation of route risks (e.g., 'Route A has active theft incidents; Route B is longer but has better illumination').
- safetyAssessment: Overall assessment of travel safety between these places.
- suggestedAlternative: A helpful tip or alternative route recommendation.
Response MUST be in strict JSON format:
{
  "riskExplanation": "...",
  "safetyAssessment": "...",
  "suggestedAlternative": "..."
}`;

  const userPrompt = `Source: ${sourceName}\nDestination: ${destName}\nRoutes Info:\n${JSON.stringify(routesInfo, null, 2)}`;

  try {
    const data = await callAIService(systemPrompt, userPrompt, true);
    return {
      riskExplanation: data.riskExplanation,
      safetyAssessment: data.safetyAssessment,
      suggestedAlternative: data.suggestedAlternative
    };
  } catch (err) {
    console.log("Using local mock route analyzer.");
    return mockRouteAnalysis(sourceName, destName, routesInfo);
  }
}

function mockRouteAnalysis(source, destination, routes) {
  const sorted = [...routes].sort((a, b) => a.riskScore - b.riskScore);
  const safest = sorted[0];
  const riskiest = sorted[sorted.length - 1];

  let riskExplanation = `We analyzed routes from ${source} to ${destination}. The recommended route via ${safest.name} has the lowest risk rating (${safest.riskScore}/100) and passes through areas with fewer reported incidents.`;
  if (riskiest !== safest && riskiest.incidents.length > 0) {
    riskExplanation += ` Avoid the route via ${riskiest.name} as it has ${riskiest.incidents.length} recent reports of ${riskiest.incidents.map(i => i.type).join(", ")}.`;
  }

  return {
    riskExplanation,
    safetyAssessment: safest.riskScore <= 30 ? "Safe for travel. Standard safety measures apply." : "Exercise moderate caution. Some safety reports are present along or near the route.",
    suggestedAlternative: safest.riskScore > 50 ? "If traveling late, we strongly recommend using major highways or ride-sharing services instead of foot commuting." : "Use the primary route which features active commercial zones and better public lighting."
  };
}

// 4. AI CHAT ASSISTANT
export async function chatAssistant(message, context = {}) {
  const systemPrompt = `You are RakshAI, a community-driven AI Safety Assistant.
Provide safety tips, route suggestions, and emergency guidance.
Keep responses concise, informative, supportive, and action-oriented.
Response MUST be a JSON object containing:
- answer: Your response text. Supports standard markdown formatting.
Response format:
{
  "answer": "..."
}`;

  const userPrompt = `User message: ${message}\nContext: ${JSON.stringify(context, null, 2)}`;

  try {
    return await callAIService(systemPrompt, userPrompt, true);
  } catch (err) {
    console.log("Using local mock chat assistant.");
    return {
      answer: mockChatResponse(message, context)
    };
  }
}

function mockChatResponse(message, context) {
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes("safe") || msgLower.includes("walk") || msgLower.includes("night")) {
    if (context.location) {
      return "Based on safety reports, walking near your current location after 9 PM has moderate risks due to poor street lighting. I recommend traveling along main avenues, taking a cab, or asking a trusted friend to accompany you.";
    }
    return "Walking alone at night is generally safer along well-lit, active avenues. Avoid isolated streets, parks, and underpasses. Always share your live location with close family or friends.";
  }

  if (msgLower.includes("sos") || msgLower.includes("emergency") || msgLower.includes("help")) {
    return "If you are in immediate danger, please click the red **SOS button** at the bottom-right of your screen to get your exact GPS coordinates and a map link, and contact local emergency services immediately.";
  }

  if (msgLower.includes("tip") || msgLower.includes("advice")) {
    return "Here are 3 key safety tips:\n1. Keep your phone in your pocket, not in your hand, to maintain situational awareness.\n2. Prefer booking app-based rides (Uber, Ola) when commuting late.\n3. Stick to busy, well-lit routes, even if they take a bit longer.";
  }

  return "I'm RakshAI, your AI Safety Assistant. You can ask me about regional risks, night travel safety, safety tips, or how to react in emergency situations. How can I help you stay safe today?";
}

// 5. DASHBOARD SUMMARY INSIGHTS
export async function generateDashboardInsights(stats) {
  const systemPrompt = `You are a public safety intelligence AI. Analyze safety statistics and recent reports.
Provide a JSON object containing:
- mostCommonIncidentType: Name of the category with the highest reports.
- emergingRiskZones: An array of 1-3 strings identifying places/zones with recurring issues.
- communityObservations: An array of 1-2 strings of safety insights.
- recommendations: An array of 2-3 actionable safety recommendations.
Response MUST be in strict JSON format:
{
  "mostCommonIncidentType": "...",
  "emergingRiskZones": ["..."],
  "communityObservations": ["..."],
  "recommendations": ["..."]
}`;

  const userPrompt = `Stats Summary:\n${JSON.stringify(stats, null, 2)}`;

  try {
    return await callAIService(systemPrompt, userPrompt, true);
  } catch (err) {
    console.log("Using local mock dashboard insights.");
    return mockDashboardInsights(stats);
  }
}

function mockDashboardInsights(stats) {
  const commonType = stats.categoryDistribution.length > 0
    ? [...stats.categoryDistribution].sort((a, b) => b.value - a.value)[0].name
    : "None";

  return {
    mostCommonIncidentType: commonType,
    emergingRiskZones: [
      "Indiranagar near metro corridors (increased harassment reports)",
      "Koramangala Commercial Hub (theft and phone-snatching reports)"
    ],
    communityObservations: [
      "A 20% increase in reports regarding poor illumination in side lanes.",
      "Most incidents occur between 8 PM and 11 PM near transport stops."
    ],
    recommendations: [
      "Avoid isolated corridors around Koramangala 4th block after sunset.",
      "Use well-lit Namma Metro routes and pre-booked ride-hailing services.",
      "Join local community safety groups to receive real-time neighborhood updates."
    ]
  };
}

