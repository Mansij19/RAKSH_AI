import mongoose from "mongoose";

const SEED_INCIDENTS = [
  {
    _id: "mem_1",
    type: "Harassment",
    description: "Group of males passing inappropriate comments near the bus stop.",
    latitude: 12.9784,
    longitude: 77.6408, // Indiranagar Metro
    severity: 4,
    risk: "High",
    aiRecommendation: "Avoid waiting at this bus stop alone after 8 PM. Use well-lit pathways and ride-hailing services if possible.",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    _id: "mem_2",
    type: "Poor Lighting",
    description: "Streetlights are completely broken for a 200m stretch, making it pitch black.",
    latitude: 12.9610,
    longitude: 77.6387, // Domlur
    severity: 2,
    risk: "Moderate",
    aiRecommendation: "Ensure you travel with a companion or carry a flashlight. Avoid walking on this stretch after sunset.",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    _id: "mem_3",
    type: "Isolated Area",
    description: "Very low foot traffic and no police patrolling present, especially around the park corner.",
    latitude: 12.9340,
    longitude: 77.6200, // Koramangala 4th Block
    severity: 3,
    risk: "Moderate",
    aiRecommendation: "Stay on the main road and avoid taking shortcuts through the park lanes during late hours.",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    _id: "mem_4",
    type: "Theft",
    description: "Mobile phone snatching incident reported by a pedestrian on a motorcycle.",
    latitude: 12.9380,
    longitude: 77.6228, // Koramangala Sony World Junction
    severity: 5,
    risk: "High",
    aiRecommendation: "Keep electronic devices secure and avoid using phones close to the roadside. Walk facing oncoming traffic.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    _id: "mem_5",
    type: "Suspicious Activity",
    description: "A vehicle has been parked here for hours with occupants watching passersby.",
    latitude: 12.9450,
    longitude: 77.6275, // Ejipura
    severity: 3,
    risk: "Moderate",
    aiRecommendation: "Maintain high situational awareness. If you feel watched, walk towards the nearest public shop immediately.",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    _id: "mem_6",
    type: "Unsafe Transport Stop",
    description: "Isolated auto stand with drivers demanding inflated fares and exhibiting aggressive behavior.",
    latitude: 12.9665,
    longitude: 77.5980, // Richmond Road
    severity: 4,
    risk: "High",
    aiRecommendation: "Prefer booking rides via standard mobile apps (Uber/Ola/Namma Yatri) rather than using this isolated stand at night.",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

let isInMemory = false;
let memoryIncidents = [...SEED_INCIDENTS];

const incidentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  severity: { type: Number, default: 3 },
  risk: { type: String, enum: ["High", "Moderate", "Safe"], default: "Moderate" },
  aiRecommendation: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Incident = mongoose.model("Incident", incidentSchema);

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/raksh-ai";
  const fallback = process.env.ENABLE_MEMORY_FALLBACK === "true";

  if (fallback) {
    console.log("Memory fallback is enabled. Starting in in-memory mode.");
    isInMemory = true;
    return;
  }

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.log("Falling back to in-memory database mode.");
    isInMemory = true;
  }
}

export async function getIncidents(filters = {}) {
  if (isInMemory) {
    let result = [...memoryIncidents];
    if (filters.type) {
      result = result.filter(inc => inc.type.toLowerCase() === filters.type.toLowerCase());
    }
    if (filters.risk) {
      result = result.filter(inc => inc.risk.toLowerCase() === filters.risk.toLowerCase());
    }
    // sort desc by createdAt
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.risk) query.risk = filters.risk;
    return await Incident.find(query).sort({ createdAt: -1 });
  }
}

export async function createIncident(data) {
  const severity = data.severity || 3;
  let risk = "Moderate";
  if (severity >= 4) risk = "High";
  else if (severity < 2) risk = "Safe";

  const newIncidentData = {
    ...data,
    severity,
    risk,
    createdAt: new Date().toISOString()
  };

  if (isInMemory) {
    const newInc = {
      _id: "mem_" + Date.now() + Math.random().toString(36).substr(2, 5),
      ...newIncidentData
    };
    memoryIncidents.push(newInc);
    return newInc;
  } else {
    const newInc = new Incident(newIncidentData);
    return await newInc.save();
  }
}

export async function getDashboardStats(userLocation = null) {
  const incidents = await getIncidents();
  const totalReports = incidents.length;
  const highRiskZones = incidents.filter(i => i.severity >= 4).length;
  const moderateZones = incidents.filter(i => i.severity >= 2 && i.severity < 4).length;
  const safeZones = incidents.filter(i => i.severity < 2).length;

  // Recent 5 reports
  const recentReports = incidents.slice(0, 5);

  // Category distribution
  const categories = {};
  incidents.forEach(inc => {
    categories[inc.type] = (categories[inc.type] || 0) + 1;
  });
  const categoryDistribution = Object.keys(categories).map(name => ({
    name,
    value: categories[name]
  }));

  // Risk distribution
  const riskCounts = { High: 0, Moderate: 0, Safe: 0 };
  incidents.forEach(inc => {
    riskCounts[inc.risk] = (riskCounts[inc.risk] || 0) + 1;
  });
  const riskDistribution = Object.keys(riskCounts).map(name => ({
    name,
    value: riskCounts[name]
  }));

  return {
    totals: {
      totalReports,
      highRiskZones,
      moderateZones,
      safeZones
    },
    categoryDistribution,
    riskDistribution,
    recentReports
  };
}

export function getInMemoryStatus() {
  return isInMemory;
}
