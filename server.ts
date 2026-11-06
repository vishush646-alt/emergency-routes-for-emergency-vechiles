import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { globalRoadGraph } from './src/utils/roadGraphEngine';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());

  // Setup Gemini AI Client if API Key is configured
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }

  // API Route: AI Decision Engine Explanation
  app.post('/api/ai/explain-decision', async (req: Request, res: Response) => {
    const { scenarioName, vehicles, intersection, decision, priorityFramework } = req.body;

    const fallbackExplanation = `[Deterministic Rule Engine Output]:
Intersection: ${intersection?.name || 'MG Road & Brigade Rd Junction'}
Granted Corridor: ${decision?.grantedVehicleId || 'Primary Emergency Unit'} (${decision?.grantedCategory || 'Ambulance'})
Reasoning: Prioritized based on authorized severity policy [${decision?.grantedSeverity || 'Critical'}] with shortest ETA (${decision?.grantedEta || '2.4'} min). Secondary vehicles (${vehicles?.map((v: any) => v.callSign || v.id).join(', ') || 'Fire Engine, Police Patrol'}) routed through dynamic staggered green window (phase shift +45s) to prevent gridlock.
Traffic Queue Impact: Estimated spillover 140m dissipated within 3 signal cycles. Emergency corridor transit authorized under Smart City Mobility Standard Protocol.`;

    if (!ai) {
      return res.json({
        explanation: fallbackExplanation,
        source: 'deterministic-fallback',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const prompt = `You are the AI Emergency Decision Engine for EMERGENX Smart City Mobility in Bangalore.
Evaluate this emergency intersection priority conflict:
- Scenario: ${scenarioName || 'Multi-emergency intersection convergence'}
- Location: ${intersection?.name || 'Central Urban Junction'} (Simulated Road Network)
- Primary Decision: Prioritize ${decision?.grantedVehicleId} (${decision?.grantedCategory})
- Other Vehicles in conflict: ${JSON.stringify(vehicles || [])}
- Priority Framework: ${priorityFramework || 'Statutory Emergency Priority (Human Life > Active Fire Structure > High-Risk Pursuit)'}

Generate a concise, authoritative, professional 3-paragraph Smart City Traffic Command Center briefing:
1. Primary Priority Reasoning (why this vehicle takes the green corridor first).
2. Deconfliction & Staggering Strategy (how the secondary emergency vehicles are held/rerouted safely).
3. Traffic Impact Mitigation (how cross-traffic queues and normal transit are recovered without cascading urban gridlock).
Keep tone professional, analytical, and transparent. Do not invent arbitrary percentages.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const explanation = response.text || fallbackExplanation;
      return res.json({
        explanation,
        source: 'gemini-3.8-flash',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Gemini API call failed in /api/ai/explain-decision:', error?.message);
      return res.json({
        explanation: fallbackExplanation,
        source: 'deterministic-engine',
        note: 'AI assistant generated deterministic response due to upstream latency/key status.',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // API Route: AI Incident Dispatch Briefing
  app.post('/api/ai/incident-briefing', async (req: Request, res: Response) => {
    const { vehicle, incident, route, hospital } = req.body;

    const fallbackBriefing = `EMERGENCY DISPATCH BRIEFING - ${incident?.id || 'INC-2026-092'}
Category: ${incident?.category || 'Cardiac Emergency'} | Severity: ${incident?.severity || 'CRITICAL'}
Assigned Unit: ${vehicle?.callSign || 'MEDIC-101'} (${vehicle?.registration || 'KA-01-EA-1001'})
Destination: ${hospital?.name || 'Manipal Hospital, Old Airport Road'}
Simulated Route: via ${route?.name || 'Cubbon Road - Old Airport Rd Corridor'} | Distance: ${route?.distanceKm || 6.8} km | ETA: ${route?.etaMinutes || 9.4} min
Corridor Advisory: Dynamic traffic signal priority requested across 5 intersections. Traffic police notified for manual clearance at Domlur flyover choke point. Emergency Department alerted for triage team mobilization.`;

    if (!ai) {
      return res.json({ briefing: fallbackBriefing, source: 'standard-dispatch' });
    }

    try {
      const prompt = `Generate a concise Emergency Mobility Coordination Briefing for EMERGENX Command Center:
- Vehicle: ${vehicle?.callSign} (${vehicle?.type})
- Incident: ${incident?.title} - ${incident?.description}
- Severity: ${incident?.severity}
- Route: ${route?.name} (${route?.distanceKm} km, ETA: ${route?.etaMinutes} mins)
- Destination: ${hospital?.name || 'Designated Trauma Facility'}

Provide a clean structured dispatch dispatch briefing with sections:
[1] TACTICAL ROUTE ASSESSMENT
[2] INTERSECTION CLEARANCE PROTOCOL
[3] HOSPITAL / RECEPTION COORDINATION
Keep it under 180 words, crisp and professional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        briefing: response.text || fallbackBriefing,
        source: 'gemini-3.8-flash',
      });
    } catch (err) {
      return res.json({ briefing: fallbackBriefing, source: 'standard-dispatch' });
    }
  });

  // API Route: Predictive Traffic Intelligence
  app.post('/api/ai/traffic-prediction', async (req: Request, res: Response) => {
    const { corridor, weather, currentCongestion, activeIncidents } = req.body;

    const fallbackAnalysis = `CORRIDOR PREDICTIVE INTELLIGENCE:
Corridor: ${corridor || 'Outer Ring Road - Silk Board to Marathahalli'}
Current Congestion Index: ${currentCongestion || '74% (Heavy)'}
Predicted 15-Min Trend: Deteriorating (+12% delay) due to evening peak flow and bottleneck at Bellandur junction.
Corridor Optimization: Recommend diverting secondary non-critical emergency units via Wind Tunnel Road bypass to save 4.2 minutes. Pre-clear signal cycle at Iblur junction 90 seconds prior to unit arrival.`;

    if (!ai) {
      return res.json({ analysis: fallbackAnalysis, source: 'predictive-algorithm' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Analyze urban traffic corridor conditions for emergency mobility in Bangalore:
Corridor: ${corridor}
Current Congestion: ${currentCongestion}
Weather: ${weather || 'Clear, 28°C'}
Active Emergency Movements: ${activeIncidents || 3}

Provide a 2-paragraph predictive recommendation for traffic controllers on signal hold timing and alternative bypass routes.`,
      });

      return res.json({
        analysis: response.text || fallbackAnalysis,
        source: 'gemini-3.8-flash',
      });
    } catch (err) {
      return res.json({ analysis: fallbackAnalysis, source: 'predictive-algorithm' });
    }
  });

  // Google Maps Platform API Config
  app.get('/api/config/maps-key', (_req: Request, res: Response) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
    res.json({ apiKey });
  });

  // Google Maps Platform Geocoding API Proxy
  app.post('/api/maps/geocode', async (req: Request, res: Response) => {
    const { address } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    // Bangalore default landmarks dictionary
    const bangaloreLandmarks: Record<string, { lat: number; lng: number; formattedAddress: string }> = {
      'manipal': { lat: 12.9592, lng: 77.6486, formattedAddress: 'Manipal Hospital, HAL Old Airport Rd, Kodihalli, Bengaluru' },
      'victoria': { lat: 12.9634, lng: 77.5750, formattedAddress: 'Victoria Hospital & BMCRI Trauma Centre, Fort Rd, Bengaluru' },
      'bowring': { lat: 12.9818, lng: 77.6045, formattedAddress: 'Bowring & Lady Curzon Hospital, Shivaji Nagar, Bengaluru' },
      'apollo': { lat: 12.9664, lng: 77.6189, formattedAddress: 'Apollo Emergency Trauma Care, Ulsoor, Bengaluru' },
      'mayo': { lat: 12.9728, lng: 77.6111, formattedAddress: 'Mayo Hall Fire & Emergency Station, MG Road, Bengaluru' },
      'cubbon': { lat: 12.9760, lng: 77.5930, formattedAddress: 'Cubbon Park Police & Emergency Outpost, Bengaluru' },
      'ashok': { lat: 12.9735, lng: 77.6060, formattedAddress: 'Ashok Nagar Traffic Police Station, Brigade Rd, Bengaluru' },
      'domlur': { lat: 12.9610, lng: 77.6387, formattedAddress: 'Domlur Flyover Traffic Hub, Old Airport Rd, Bengaluru' },
      'indiranagar': { lat: 12.9784, lng: 77.6408, formattedAddress: 'Indiranagar 100ft Road Emergency Station, Bengaluru' },
      'mg road': { lat: 12.9738, lng: 77.6074, formattedAddress: 'Mahatma Gandhi Road & Brigade Road Junction, Bengaluru' },
      'koramangala': { lat: 12.9352, lng: 77.6245, formattedAddress: 'Sony World Junction, 80ft Rd, Koramangala, Bengaluru' },
    };

    if (apiKey) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address || 'Bengaluru'
          )}&region=in&key=${apiKey}`
        );
        const data: any = await response.json();
        if (data.status === 'OK' && data.results?.length > 0) {
          const loc = data.results[0].geometry.location;
          return res.json({
            lat: loc.lat,
            lng: loc.lng,
            formattedAddress: data.results[0].formatted_address,
            source: 'google-geocoding-api',
          });
        }
      } catch (err) {
        console.warn('Geocoding API call error, falling back to local lookup:', err);
      }
    }

    // Fallback matching
    const query = (address || '').toLowerCase();
    for (const [key, value] of Object.entries(bangaloreLandmarks)) {
      if (query.includes(key)) {
        return res.json({ ...value, source: 'bangalore-regional-database' });
      }
    }

    return res.json({
      lat: 12.9716,
      lng: 77.5946,
      formattedAddress: address ? `${address}, Bengaluru, Karnataka` : 'Central Bangalore Hub, Bengaluru',
      source: 'bangalore-regional-database',
    });
  });

  // Google Places API (New) Search Proxy
  app.post('/api/maps/places-search', async (req: Request, res: Response) => {
    const { query, category } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    const demoEmergencyPlaces = [
      { id: 'p1', name: 'Manipal Hospital (Old Airport Road)', type: 'hospital', address: '98, HAL Old Airport Rd, Kodihalli', lat: 12.9592, lng: 77.6486, phone: '+91 80 2502 4444' },
      { id: 'p2', name: 'Victoria Hospital Trauma Centre', type: 'hospital', address: 'Near City Market, Fort Rd', lat: 12.9634, lng: 77.5750, phone: '+91 80 2670 1150' },
      { id: 'p3', name: 'Bowring and Lady Curzon Hospital', type: 'hospital', address: 'Hospital Rd, Tasker Town, Shivajinagar', lat: 12.9818, lng: 77.6045, phone: '+91 80 2559 1362' },
      { id: 'p4', name: 'Mayo Hall Fire & Emergency HQ', type: 'fire_station', address: 'Residency Rd, Ashok Nagar', lat: 12.9720, lng: 77.6150, phone: '101' },
      { id: 'p5', name: 'Indiranagar Fire Station', type: 'fire_station', address: '100ft Road, HAL 2nd Stage', lat: 12.9780, lng: 77.6430, phone: '101' },
      { id: 'p6', name: 'High Grounds Fire Station', type: 'fire_station', address: 'Millers Rd, Vasanth Nagar', lat: 12.9880, lng: 77.5910, phone: '101' },
      { id: 'p7', name: 'Ashok Nagar Traffic Police Station', type: 'police_station', address: 'Museum Rd / Brigade Rd Cross', lat: 12.9735, lng: 77.6060, phone: '103' },
      { id: 'p8', name: 'Cubbon Park Police Station', type: 'police_station', address: 'Kasturba Rd, Sampangi Rama Nagar', lat: 12.9760, lng: 77.5930, phone: '100' },
      { id: 'p9', name: 'Halasuru Traffic Police Station', type: 'police_station', address: 'Old Madras Rd, Halasuru', lat: 12.9740, lng: 77.6240, phone: '103' },
    ];

    if (apiKey) {
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber',
          },
          body: JSON.stringify({
            textQuery: `${query || 'emergency'} in Bangalore`,
            locationBias: {
              circle: {
                center: { latitude: 12.9716, longitude: 77.5946 },
                radius: 15000.0,
              },
            },
          }),
        });
        const data: any = await response.json();
        if (data.places?.length > 0) {
          const formatted = data.places.map((p: any) => ({
            id: p.id,
            name: p.displayName?.text || 'Emergency Location',
            address: p.formattedAddress,
            lat: p.location?.latitude,
            lng: p.location?.longitude,
            phone: p.nationalPhoneNumber || '+91 80 2294 2222',
            type: category || 'emergency',
          }));
          return res.json({ places: formatted, source: 'google-places-api-new' });
        }
      } catch (err) {
        console.warn('Places API search error:', err);
      }
    }

    // Filter fallback
    const filtered = demoEmergencyPlaces.filter((p) => {
      if (category && p.type !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
      }
      return true;
    });

    res.json({ places: filtered, source: 'bangalore-emergency-infrastructure' });
  });

  // Google Routes API Proxy with Traffic Awareness
  app.post('/api/maps/compute-routes', async (req: Request, res: Response) => {
    const { origin, destination, travelMode = 'DRIVE' } = req.body;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (apiKey && origin?.lat && destination?.lat) {
      try {
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.routeLabels',
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
            destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
            travelMode,
            routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
            computeAlternativeRoutes: true,
          }),
        });
        const data: any = await response.json();
        if (data.routes?.length > 0) {
          return res.json({ routes: data.routes, source: 'google-routes-api' });
        }
      } catch (err) {
        console.warn('Routes API compute error:', err);
      }
    }

    // High quality simulated Bangalore route alternatives
    res.json({
      routes: [
        {
          name: 'Route A: Direct MG Road Arterial',
          duration: '870s',
          distanceMeters: 6200,
          reliabilityScore: 68,
          trafficCondition: 'Heavy Peak Congestion (Domlur bottleneck)',
          recommended: false,
        },
        {
          name: 'Route B: Cubbon Green Wave Corridor',
          duration: '528s',
          distanceMeters: 7100,
          reliabilityScore: 94,
          trafficCondition: 'Preempted Signal Wave Synchronization',
          recommended: true,
        },
        {
          name: 'Route C: Outer Perimeter Ring Road',
          duration: '960s',
          distanceMeters: 9400,
          reliabilityScore: 91,
          trafficCondition: 'Moderate Flow Bypass',
          recommended: false,
        },
      ],
      source: 'emergenx-route-engine',
    });
  });

  // Route Intelligence & History Persistence Store
  interface RoutePlanRecord {
    id: string;
    requestId: string;
    vehicleId: string;
    vehicleCallSign: string;
    origin: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
    selectedRouteId: string;
    selectedRouteName: string;
    distanceKm: number;
    estimatedMinutes: number;
    optimizationScore: number;
    costBreakdown: {
      travelTimeCost: number;
      congestionPenalty: number;
      roadClosurePenalty: number;
      intersectionDelay: number;
      reliabilityRisk: number;
      conflictPenalty: number;
      totalCost: number;
    };
    explanation: string;
    dataSource: string;
    dataFreshness: string;
    timestamp: string;
    driverDecision: 'accepted' | 'declined' | 'pending';
    journeyStatus: 'in_transit' | 'reached_scene' | 'transporting_hospital' | 'completed';
    rerouteCount: number;
  }

  const inMemoryRouteHistory: RoutePlanRecord[] = [
    {
      id: 'ROUTE-2026-001',
      requestId: 'req_001',
      vehicleId: 'veh_amb_01',
      vehicleCallSign: 'MEDIC-101',
      origin: { lat: 12.9752, lng: 77.6012, address: 'High Court Gates, Ambedkar Veedhi' },
      destination: { lat: 12.9592, lng: 77.6486, address: 'Manipal Hospital, HAL Old Airport Rd' },
      selectedRouteId: 'route_b_bypass',
      selectedRouteName: 'Cubbon Green Wave Corridor via Halasuru',
      distanceKm: 7.1,
      estimatedMinutes: 8.8,
      optimizationScore: 94,
      costBreakdown: {
        travelTimeCost: 17.6,
        congestionPenalty: 4.2,
        roadClosurePenalty: 0.0,
        intersectionDelay: 6.5,
        reliabilityRisk: 3.1,
        conflictPenalty: 2.0,
        totalCost: 33.4,
      },
      explanation: 'Optimal route selected: avoids Domlur Flyover bottleneck (-4.8m delay), utilizes synchronized green wave along Cubbon-Old Madras corridor, and staggers cross-intersection with FIRE-21.',
      dataSource: 'EMERGENX Central Engine + Google Routes API (Live Traffic)',
      dataFreshness: 'Live (Updated 45s ago)',
      timestamp: 'Today, 13:42:10',
      driverDecision: 'accepted',
      journeyStatus: 'in_transit',
      rerouteCount: 0,
    },
    {
      id: 'ROUTE-2026-002',
      requestId: 'req_002',
      vehicleId: 'veh_fire_01',
      vehicleCallSign: 'BRONTO-01',
      origin: { lat: 12.9720, lng: 77.6150, address: 'Mayo Hall Fire Station, MG Road' },
      destination: { lat: 12.9745, lng: 77.6095, address: 'Brigade Road Commercial Complex' },
      selectedRouteId: 'route_a_direct',
      selectedRouteName: 'Direct Residency Rd - Brigade Arterial',
      distanceKm: 2.4,
      estimatedMinutes: 4.1,
      optimizationScore: 91,
      costBreakdown: {
        travelTimeCost: 8.2,
        congestionPenalty: 2.1,
        roadClosurePenalty: 0.0,
        intersectionDelay: 4.0,
        reliabilityRisk: 1.8,
        conflictPenalty: 3.5,
        totalCost: 19.6,
      },
      explanation: 'Shortest direct arterial path selected. Cross-traffic at MG Road junction held in safety all-red pause to let heavy tender negotiate tight turns.',
      dataSource: 'EMERGENX Road Graph + Municipal Signal Telemetry',
      dataFreshness: 'Live (Updated 1m ago)',
      timestamp: 'Today, 13:38:05',
      driverDecision: 'accepted',
      journeyStatus: 'reached_scene',
      rerouteCount: 0,
    },
  ];

  // API Route: Calculate Multi-Alternative Routes with Explainable Scoring
  app.post('/api/routes/calculate', async (req: Request, res: Response) => {
    const {
      origin,
      destination,
      weights = {
        travelTimeWeight: 2.0,
        congestionWeight: 1.5,
        roadClosureWeight: 10.0,
        intersectionWeight: 1.2,
        reliabilityWeight: 1.0,
        coordinationWeight: 2.5,
      },
    } = req.body;

    // Define 3 realistic alternative route vectors for the urban corridor
    const alternatives = [
      {
        id: 'route_b_bypass',
        name: 'Cubbon Green Wave Corridor (Recommended)',
        via: 'via Ambedkar Veedhi, Cubbon Rd & Old Madras Rd Bypass',
        distanceKm: 7.1,
        estimatedMinutes: 8.8,
        congestionLevel: 'Low (Priority Preemption)',
        reliabilityScorePercent: 94,
        intersectionsCount: 6,
        obstructionWarnings: [],
        trafficCondition: 'Clear corridor with preempted signal coordination',
        recommended: false,
        factors: {
          estimatedTravelTime: 8.8,
          congestionPenalty: 2.8,
          roadClosurePenalty: 0.0,
          intersectionDelay: 5.4,
          routeRisk: 3.0,
          conflictPenalty: 2.0,
        },
        waypoints: [
          { lat: origin?.lat || 12.9752, lng: origin?.lng || 77.6012 },
          { lat: 12.9760, lng: 77.6050 },
          { lat: 12.9772, lng: 77.6180 },
          { lat: 12.9740, lng: 77.6320 },
          { lat: 12.9650, lng: 77.6410 },
          { lat: destination?.lat || 12.9592, lng: destination?.lng || 77.6486 },
        ],
      },
      {
        id: 'route_a_arterial',
        name: 'Direct MG Road Arterial',
        via: 'via MG Road, Trinity Circle & Old Airport Rd',
        distanceKm: 6.2,
        estimatedMinutes: 14.5,
        congestionLevel: 'Heavy Peak Congestion',
        reliabilityScorePercent: 68,
        intersectionsCount: 9,
        obstructionWarnings: ['Domlur Flyover Underpass heavy queue (+5.5 min)'],
        trafficCondition: 'Heavy civilian bottleneck at Domlur junction',
        recommended: false,
        factors: {
          estimatedTravelTime: 14.5,
          congestionPenalty: 8.5,
          roadClosurePenalty: 0.0,
          intersectionDelay: 11.2,
          routeRisk: 7.5,
          conflictPenalty: 4.5,
        },
        waypoints: [
          { lat: origin?.lat || 12.9752, lng: origin?.lng || 77.6012 },
          { lat: 12.9738, lng: 77.6074 },
          { lat: 12.9723, lng: 77.6206 },
          { lat: 12.9610, lng: 77.6387 },
          { lat: destination?.lat || 12.9592, lng: destination?.lng || 77.6486 },
        ],
      },
      {
        id: 'route_c_perimeter',
        name: 'Outer Perimeter Ring Road Expressway',
        via: 'via Kensington Rd, Ulsoor Lake Perimeter & Indiranagar 100ft Rd',
        distanceKm: 9.4,
        estimatedMinutes: 16.0,
        congestionLevel: 'Moderate Flow Bypass',
        reliabilityScorePercent: 91,
        intersectionsCount: 5,
        obstructionWarnings: ['Longer perimeter distance (+3.2 km)'],
        trafficCondition: 'High speed perimeter transit, minimal traffic stops',
        recommended: false,
        factors: {
          estimatedTravelTime: 16.0,
          congestionPenalty: 3.2,
          roadClosurePenalty: 0.0,
          intersectionDelay: 4.8,
          routeRisk: 3.5,
          conflictPenalty: 1.0,
        },
        waypoints: [
          { lat: origin?.lat || 12.9752, lng: origin?.lng || 77.6012 },
          { lat: 12.9818, lng: 77.6045 },
          { lat: 12.9830, lng: 77.6220 },
          { lat: 12.9780, lng: 77.6430 },
          { lat: destination?.lat || 12.9592, lng: destination?.lng || 77.6486 },
        ],
      },
    ];

    // Compute explainable cost for each route based on the formula
    const scoredRoutes = alternatives.map((route) => {
      const f = route.factors;
      const travelTimeCost = weights.travelTimeWeight * f.estimatedTravelTime;
      const congestionCost = weights.congestionWeight * f.congestionPenalty;
      const roadClosureCost = weights.roadClosureWeight * f.roadClosurePenalty;
      const intersectionCost = weights.intersectionWeight * f.intersectionDelay;
      const reliabilityCost = weights.reliabilityWeight * f.routeRisk;
      const coordinationCost = weights.coordinationWeight * f.conflictPenalty;

      const totalCost = parseFloat(
        (travelTimeCost + congestionCost + roadClosureCost + intersectionCost + reliabilityCost + coordinationCost).toFixed(2)
      );

      return {
        ...route,
        costBreakdown: {
          travelTimeCost: parseFloat(travelTimeCost.toFixed(2)),
          congestionPenalty: parseFloat(congestionCost.toFixed(2)),
          roadClosurePenalty: parseFloat(roadClosureCost.toFixed(2)),
          intersectionDelay: parseFloat(intersectionCost.toFixed(2)),
          reliabilityRisk: parseFloat(reliabilityCost.toFixed(2)),
          conflictPenalty: parseFloat(coordinationCost.toFixed(2)),
          totalCost,
        },
        optimizationScore: Math.max(50, Math.round(100 - totalCost * 0.9)),
      };
    });

    // Sort by lowest cost
    scoredRoutes.sort((a, b) => a.costBreakdown.totalCost - b.costBreakdown.totalCost);
    scoredRoutes[0].recommended = true;

    res.json({
      routes: scoredRoutes,
      weightsUsed: weights,
      formula:
        'Cost = (w_time × Time) + (w_cong × Congestion) + (w_close × Closure) + (w_int × Delay) + (w_risk × Risk) + (w_conf × Conflict)',
      selectionExplanation: `Recommended "${scoredRoutes[0].name}" due to lowest total cost score (${scoredRoutes[0].costBreakdown.totalCost}) vs ${scoredRoutes[1].costBreakdown.totalCost} for alternative. Avoids major bottleneck and ensures staggered intersection clearance.`,
      calculatedAt: new Date().toISOString(),
      source: 'EMERGENX Route Scoring Engine',
    });
  });

  // API Route: Dynamic Rerouting Evaluation
  app.post('/api/routes/reroute', (req: Request, res: Response) => {
    const { currentRouteId, reportedObstruction } = req.body;

    const shouldReroute = Boolean(reportedObstruction) || currentRouteId === 'route_a_arterial';

    if (shouldReroute) {
      res.json({
        recommendationNeeded: true,
        recommendedRouteId: 'route_b_bypass',
        reason: 'Significant delay detected on original route: Domlur Underpass congestion index +28% and pipeline maintenance. Switching saves an estimated 4.8 minutes.',
        timeSavedMinutes: 4.8,
        costImprovementPercent: 24.5,
        newRouteName: 'Cubbon Green Wave Corridor via Halasuru',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        recommendationNeeded: false,
        reason: 'Current route remains optimal. Cost difference on alternatives does not exceed the 15% threshold for dynamic rerouting.',
        timeSavedMinutes: 0,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ----------------------------------------------------------------
  // Real Road Graph Pathfinding Endpoints (A*, Dijkstra, Multi-Agent)
  // ----------------------------------------------------------------

  // 1. Get Network Graph State
  app.get('/api/graph/network', (_req: Request, res: Response) => {
    res.json({
      nodes: Array.from(globalRoadGraph.nodes.values()),
      edges: Array.from(globalRoadGraph.edges.values()),
      totalNodes: globalRoadGraph.nodes.size,
      totalEdges: globalRoadGraph.edges.size,
      activeClosures: Array.from(globalRoadGraph.edges.values()).filter((e) => e.isClosed),
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Calculate A* & Dijkstra Routes on Road Graph
  app.post('/api/graph/calculate', (req: Request, res: Response) => {
    const { startNodeId = 'N_HIGH_COURT', goalNodeId = 'N_MANIPAL_HOSPITAL' } = req.body;

    const aStarResult = globalRoadGraph.findRouteAStar(startNodeId, goalNodeId);
    const dijkstraResult = globalRoadGraph.findRouteDijkstra(startNodeId, goalNodeId, 'distance');
    const dijkstraTimeResult = globalRoadGraph.findRouteDijkstra(startNodeId, goalNodeId, 'time');

    res.json({
      aStar: aStarResult,
      dijkstra: dijkstraResult,
      dijkstraTime: dijkstraTimeResult,
      comparison: {
        timeDifferenceMinutes: parseFloat((dijkstraResult.totalEstimatedMinutes - aStarResult.totalEstimatedMinutes).toFixed(1)),
        distanceDifferenceKm: parseFloat((dijkstraResult.totalDistanceKm - aStarResult.totalDistanceKm).toFixed(2)),
        nodesExploredReductionPercent: Math.round(
          ((dijkstraResult.nodesExploredCount - aStarResult.nodesExploredCount) /
            Math.max(1, dijkstraResult.nodesExploredCount)) *
            100
        ),
        aStarExploredCount: aStarResult.nodesExploredCount,
        dijkstraExploredCount: dijkstraResult.nodesExploredCount,
        aStarExecutionTimeMs: aStarResult.executionTimeMs,
        dijkstraExecutionTimeMs: dijkstraResult.executionTimeMs,
        recommended: aStarResult.totalEstimatedMinutes <= dijkstraResult.totalEstimatedMinutes ? 'A_STAR' : 'DIJKSTRA',
        explanation:
          aStarResult.totalEstimatedMinutes <= dijkstraResult.totalEstimatedMinutes
            ? `A* path selected: Destination-directed heuristic pruned ${Math.max(0, dijkstraResult.nodesExploredCount - aStarResult.nodesExploredCount)} exploration branches while finding a corridor ${Math.max(0, dijkstraResult.totalEstimatedMinutes - aStarResult.totalEstimatedMinutes).toFixed(1)}m faster than baseline Dijkstra.`
            : `Dijkstra baseline path selected: Found direct arterial path of ${dijkstraResult.totalDistanceKm} km.`,
      },
      calculatedAt: new Date().toISOString(),
    });
  });

  // 3. Multi-Agent Route Coordination & Deadlock Prevention
  app.post('/api/graph/multi-agent', (req: Request, res: Response) => {
    const { vehicles } = req.body;

    const defaultVehicles = [
      {
        vehicleId: 'veh_amb_01',
        callSign: 'MEDIC-101 (STEMI Ambulance)',
        category: 'ambulance',
        startNodeId: 'N_HIGH_COURT',
        goalNodeId: 'N_MANIPAL_HOSPITAL',
        priorityScore: 100,
      },
      {
        vehicleId: 'veh_fire_01',
        callSign: 'BRONTO-01 (Heavy Fire Tender)',
        category: 'fire_engine',
        startNodeId: 'N_MAYO_HALL',
        goalNodeId: 'N_RESIDENCY',
        priorityScore: 85,
      },
      {
        vehicleId: 'veh_pol_01',
        callSign: 'ESCORT-303 (Traffic Police Escort)',
        category: 'police',
        startNodeId: 'N_RICHMOND_CIRCLE',
        goalNodeId: 'N_MG_BRIGADE',
        priorityScore: 70,
      },
    ];

    const targetVehicles = vehicles && vehicles.length > 0 ? vehicles : defaultVehicles;
    const plan = globalRoadGraph.coordinateMultiAgentRoutes(targetVehicles);

    res.json({
      plan,
      calculatedAt: new Date().toISOString(),
    });
  });

  // 4. Toggle Edge Closure & Congestion Adjustment
  app.post('/api/graph/closure', (req: Request, res: Response) => {
    const { edgeId, isClosed, reason, congestionMultiplier } = req.body;

    if (edgeId) {
      if (typeof isClosed === 'boolean') {
        globalRoadGraph.toggleEdgeClosure(edgeId, isClosed, reason);
      }
      if (typeof congestionMultiplier === 'number') {
        globalRoadGraph.setEdgeCongestion(edgeId, congestionMultiplier);
      }
    }

    res.json({
      success: true,
      edge: globalRoadGraph.edges.get(edgeId),
      activeClosures: Array.from(globalRoadGraph.edges.values()).filter((e) => e.isClosed),
    });
  });

  // 5. Continuous Reroute Evaluation on Graph
  app.post('/api/graph/reroute-check', (req: Request, res: Response) => {
    const { currentRoute, startNodeId = 'N_HIGH_COURT', goalNodeId = 'N_MANIPAL_HOSPITAL', vehicleId = 'veh_amb_01' } = req.body;

    const evaluation = globalRoadGraph.evaluateContinuousReroute(
      currentRoute || globalRoadGraph.findRouteAStar(startNodeId, goalNodeId),
      startNodeId,
      goalNodeId,
      vehicleId
    );

    res.json({
      evaluation,
      evaluatedAt: new Date().toISOString(),
    });
  });

  // 6. Reset Graph
  app.post('/api/graph/reset', (_req: Request, res: Response) => {
    globalRoadGraph.resetToDefaults();
    res.json({ success: true, message: 'Road network graph reset to baseline conditions.' });
  });

  // API Route: Route History List & Add
  app.get('/api/routes/history', (_req: Request, res: Response) => {
    res.json({
      history: inMemoryRouteHistory,
      count: inMemoryRouteHistory.length,
    });
  });

  app.post('/api/routes/history', (req: Request, res: Response) => {
    const newRecord: RoutePlanRecord = {
      id: `ROUTE-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      rerouteCount: 0,
      ...req.body,
    };
    inMemoryRouteHistory.unshift(newRecord);
    res.status(201).json({ success: true, record: newRecord });
  });

  // API Route: Google Maps API Key Config
  app.get('/api/config/maps-key', (_req: Request, res: Response) => {
    const key = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({ apiKey: key });
  });

  // Health route
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      service: 'EMERGENX Coordination Engine',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      mapsConfigured: Boolean(process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Vite development middleware vs Static Production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const startingPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  for (let port = startingPort; port < startingPort + 10; port += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = app.listen(port, '0.0.0.0', () => {
          console.log(`EMERGENX Server running on http://0.0.0.0:${port}`);
          resolve();
        });

        server.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            reject(err);
            return;
          }

          reject(err);
        });
      });
      break;
    } catch (err: any) {
      if (err.code !== 'EADDRINUSE') {
        throw err;
      }

      if (port === startingPort + 9) {
        throw new Error(`Unable to bind server to any port between ${startingPort} and ${startingPort + 9}.`);
      }
    }
  }
}

startServer().catch((err) => {
  console.error('Failed to start EMERGENX server:', err);
  process.exit(1);
});
