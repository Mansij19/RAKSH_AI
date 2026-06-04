import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { 
  connectDB, 
  getIncidents, 
  createIncident, 
  getDashboardStats, 
  getInMemoryStatus 
} from "./db.js";
import { 
  classifyIncident, 
  generateAreaSummary, 
  analyzeRoutes, 
  chatAssistant, 
  generateDashboardInsights 
} from "./ai.js";
import { 
  haversineDistance, 
  geocodeAddress, 
  getOSRMPaths 
} from "./utils.js";
import { calculateSafetyScore, classifySafetyScore } from "./safetyScore.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middlewares
app.use(cors({
  origin: [CLIENT_URL, "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Connect to Database (or start memory fallback)
await connectDB();

// 1. Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    memoryFallback: getInMemoryStatus(),
    timestamp: new Date().toISOString()
  });
});

// 2. GET Incidents
app.get("/api/incidents", async (req, res) => {
  try {
    const { type, risk } = req.query;
    const filters = {};
    if (type && type !== "All") filters.type = type;
    if (risk && risk !== "All") filters.risk = risk;

    const incidents = await getIncidents(filters);
    res.json({ incidents });
  } catch (error) {
    console.error("GET /api/incidents failed:", error);
    res.status(500).json({ error: "Failed to retrieve incidents." });
  }
});

// 3. POST Incident
app.post("/api/incidents", async (req, res) => {
  try {
    const { type, description, latitude, longitude } = req.body;

    if (!type || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    console.log(`Analyzing new incident report: [${type}] "${description}"`);
    
    // Analyze with AI
    const classification = await classifyIncident(type, description);

    // Save to Database
    const newIncident = await createIncident({
      type: classification.category || type,
      description,
      latitude: Number(latitude),
      longitude: Number(longitude),
      severity: classification.severity || 3,
      aiRecommendation: classification.aiRecommendation
    });

    res.status(201).json({
      message: "Incident logged & analyzed successfully.",
      incident: newIncident,
      classification: {
        category: classification.category || type,
        severity: classification.severity || 3,
        confidence: classification.confidence || 85
      }
    });
  } catch (error) {
    console.error("POST /api/incidents failed:", error);
    res.status(500).json({ error: "Failed to log and analyze incident." });
  }
});

// 4. GET Risk Score at Coordinates
app.get("/api/risk/:lat/:lng", async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Invalid coordinates format." });
    }

    const incidents = await getIncidents();
    const nearby = incidents.filter(incident => 
      haversineDistance(lat, lng, incident.latitude, incident.longitude) <= 1.0
    );

    if (nearby.length === 0) {
      const safety = classifySafetyScore(100);
      return res.json({
        score: safety.score,
        category: safety.category,
        level: "Safe",
        reasons: ["No incidents reported within 1 km"]
      });
    }

    const avgSeverity = nearby.reduce((acc, curr) => acc + curr.severity, 0) / nearby.length;
    const countFactor = Math.min(50, nearby.length * 12);
    const severityFactor = (avgSeverity / 5) * 50;
    const riskScore = Math.round(Math.min(100, countFactor + severityFactor));
    const safety = classifySafetyScore(100 - riskScore);

    let level = "Safe";
    if (safety.category === "danger") level = "High Risk";
    else if (safety.category === "moderate") level = "Moderate Risk";

    const reasons = [
      `${nearby.length} report${nearby.length === 1 ? "" : "s"} within 1 km`,
      `Average severity of local concerns is ${avgSeverity.toFixed(1)}/5`
    ];

    if (nearby.some(n => n.severity === 5)) {
      reasons.push("Includes high-severity incident report (level 5)");
    }

    res.json({ score: safety.score, category: safety.category, level, reasons });
  } catch (error) {
    console.error("GET /api/risk failed:", error);
    res.status(500).json({ error: "Failed to calculate location risk." });
  }
});

// 5. POST Route Analysis
app.post("/api/routes/analyze", async (req, res) => {
  try {
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ error: "Source and destination are required." });
    }

    // Step 1: Geocode Source and Destination
    const sourceGeocoded = await geocodeAddress(source);
    const destGeocoded = await geocodeAddress(destination);

    console.log(`Source geocoded: ${sourceGeocoded.name} (${sourceGeocoded.latitude}, ${sourceGeocoded.longitude})`);
    console.log(`Destination geocoded: ${destGeocoded.name} (${destGeocoded.latitude}, ${destGeocoded.longitude})`);

    // Step 2: Get Route Options
    const routes = await getOSRMPaths(
      sourceGeocoded.latitude,
      sourceGeocoded.longitude,
      destGeocoded.latitude,
      destGeocoded.longitude
    );

    // Step 3: Proximity Incident & Risk Scoring
    const allIncidents = await getIncidents();
    
    const ratedRoutes = routes.map(route => {
      // Find incidents within 1km of any point in the path
      const routeIncidents = allIncidents.filter(incident => {
        let minDistance = Infinity;
        for (const point of route.path) {
          const d = haversineDistance(
            incident.latitude,
            incident.longitude,
            point.latitude,
            point.longitude
          );
          if (d < minDistance) minDistance = d;
        }
        incident.minDistanceToRoute = minDistance;
        return minDistance <= 1.0;
      });

      const safety = calculateSafetyScore(routeIncidents);
      const riskScore = 100 - safety.score;

      let riskLevel = "Safe";
      if (safety.category === "danger") riskLevel = "High Risk";
      else if (safety.category === "moderate") riskLevel = "Moderate";

      const segments = route.path.slice(0, -1).map((point, index) => {
        const nextPoint = route.path[index + 1];
        const midpoint = {
          latitude: (point.latitude + nextPoint.latitude) / 2,
          longitude: (point.longitude + nextPoint.longitude) / 2
        };
        const nearbySegmentIncidents = allIncidents
          .map(incident => ({
            ...incident,
            distanceKm: haversineDistance(midpoint.latitude, midpoint.longitude, incident.latitude, incident.longitude)
          }))
          .filter(incident => incident.distanceKm <= 0.75);
        const segmentSafety = calculateSafetyScore(nearbySegmentIncidents);

        return {
          path: [point, nextPoint],
          safetyScore: segmentSafety.score,
          safetyCategory: segmentSafety.category
        };
      });

      return {
        ...route,
        incidents: routeIncidents,
        riskScore,
        riskLevel,
        safetyScore: safety.score,
        safetyCategory: safety.category,
        segments
      };
    });

    // Step 4: Choose Recommended (Safest, then shortest)
    const fastestRoute = [...ratedRoutes].sort((a, b) => a.timeMinutes - b.timeMinutes)[0];
    const safestRoute = [...ratedRoutes].sort((a, b) => {
      if (a.safetyScore !== b.safetyScore) return b.safetyScore - a.safetyScore;
      return a.distanceKm - b.distanceKm;
    })[0];
    const recommended = safestRoute;

    // Step 5: AI Explanation
    const routesSummaryInfo = ratedRoutes.map(r => ({
      name: r.name,
      distanceKm: r.distanceKm,
      timeMinutes: r.timeMinutes,
      riskScore: r.riskScore,
      riskLevel: r.riskLevel,
      safetyScore: r.safetyScore,
      safetyCategory: r.safetyCategory,
      incidentsCount: r.incidents.length,
      incidentsSummary: r.incidents.map(i => `${i.type} (severity ${i.severity})`).slice(0, 3)
    }));

    const aiAnalysis = await analyzeRoutes(sourceGeocoded.name, destGeocoded.name, routesSummaryInfo);

    res.json({
      source: sourceGeocoded,
      destination: destGeocoded,
      routes: ratedRoutes,
      fastestRoute,
      safestRoute,
      recommended,
      aiAnalysis: aiAnalysis
    });
  } catch (error) {
    console.error("POST /api/routes/analyze failed:", error);
    res.status(500).json({ error: "Failed to analyze routing options." });
  }
});

// 6. POST AI Chat
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    console.log(`AI Chat Message: "${message}"`);

    // Augment context with nearby incidents if location coordinates are provided
    let augmentedContext = { ...context };
    if (context?.location?.latitude && context?.location?.longitude) {
      const lat = context.location.latitude;
      const lng = context.location.longitude;
      
      const incidents = await getIncidents();
      const nearby = incidents.filter(incident => 
        haversineDistance(lat, lng, incident.latitude, incident.longitude) <= 3.0
      ).map(i => ({
        type: i.type,
        severity: i.severity,
        distanceKm: parseFloat(haversineDistance(lat, lng, i.latitude, i.longitude).toFixed(2))
      })).slice(0, 5);

      augmentedContext.nearbyIncidents = nearby;
    }

    const aiResponse = await chatAssistant(message, augmentedContext);
    res.json({ answer: aiResponse.answer });
  } catch (error) {
    console.error("POST /api/ai/chat failed:", error);
    res.status(500).json({ error: "Chat service unavailable." });
  }
});

// 7. GET Dashboard Summary
app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng) : null;

    // Get database stats
    const stats = await getDashboardStats();

    // Generate areaRisk if coords present
    let areaRisk = null;
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const incidents = await getIncidents();
      const nearby = incidents.filter(i => 
        haversineDistance(lat, lng, i.latitude, i.longitude) <= 1.5
      );

      if (nearby.length === 0) {
        areaRisk = { score: 10, level: "Safe" };
      } else {
        const avgSeverity = nearby.reduce((acc, curr) => acc + curr.severity, 0) / nearby.length;
        const score = Math.round(Math.min(100, Math.max(10, (nearby.length * 10) + (avgSeverity * 10))));
        let level = "Safe";
        if (score >= 60) level = "High Risk";
        else if (score >= 30) level = "Moderate Risk";
        
        areaRisk = { score, level };
      }
    }

    // Generate AI Insights from stats
    console.log("Generating Dashboard AI Insights...");
    const aiInsights = await generateDashboardInsights({
      totals: stats.totals,
      categoryDistribution: stats.categoryDistribution,
      recentReports: stats.recentReports.map(r => ({ type: r.type, severity: r.severity }))
    });

    res.json({
      areaRisk,
      aiInsights,
      totals: stats.totals,
      categoryDistribution: stats.categoryDistribution,
      riskDistribution: stats.riskDistribution,
      recentReports: stats.recentReports
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary failed:", error);
    res.status(500).json({ error: "Failed to generate dashboard summary." });
  }
});

// 8. POST Area Safety Summary (Marker click details)
app.post("/api/ai/area-summary", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Coordinates are required." });
    }

    const incidents = await getIncidents();
    const nearby = incidents.filter(incident => 
      haversineDistance(Number(latitude), Number(longitude), incident.latitude, incident.longitude) <= 1.0
    ).map(i => ({
      type: i.type,
      description: i.description,
      severity: i.severity
    }));

    console.log(`Generating area summary for coordinates: ${latitude}, ${longitude}`);
    const summaryResult = await generateAreaSummary(latitude, longitude, nearby);

    res.json({ summary: summaryResult });
  } catch (error) {
    console.error("POST /api/ai/area-summary failed:", error);
    res.status(500).json({ error: "Failed to generate area safety summary." });
  }
});
app.get("/", (req, res) => {
  res.send("RakshAI Backend is running");
});

// Start server
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[RakshAI Server] running on http://localhost:${PORT}`);
  });
}

export default app;

