import { prisma } from '../config/database';

async function main() {
  console.log('🌱 Starting ImpactLens pristine database seed...');

  // 1. Clean existing records in correct foreign key order
  await prisma.auditEvent.deleteMany({});
  await prisma.milestoneMedia.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.evidenceRequirement.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.comparison.deleteMany({});
  await prisma.story.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.aIMetadata.deleteMany({});
  await prisma.mediaAsset.deleteMany({});
  await prisma.project.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 2. Define Projects
  const projectsData = [
    {
      id: 'proj-001',
      name: 'Green Village Reforestation',
      description: 'Large-scale community reforestation and land rehabilitation across rural corridors. Aims to restore indigenous tree cover, protect agrarian soils from erosion, and sequester carbon through community-managed plantation.',
      type: 'ENVIRONMENTAL',
      location: 'Coimbatore, Tamil Nadu',
      latitude: 11.0168,
      longitude: 76.9558,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      progress: 74,
      category: 'Reforestation',
    },
    {
      id: 'proj-002',
      name: 'Urban Infrastructure Safety Corridor',
      description: 'Continuous vision monitoring of critical transport corridors, overhead transmission lines, and high-risk urban roadway slopes to detect early infrastructure fatigue and hazardous vegetation encroachment.',
      type: 'INFRASTRUCTURE',
      location: 'Bengaluru Outer Ring Road, Karnataka',
      latitude: 12.9249,
      longitude: 77.6749,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2026-11-30'),
      status: 'ACTIVE',
      progress: 82,
      category: 'Safety & Transport',
    },
    {
      id: 'proj-003',
      name: 'Lake Wetland Ecosystem Rehabilitation',
      description: 'Community and municipal partnership restoring urban wetland ecology through waste extraction, mechanical desilting, and perimeter bio-fencing with native riparian plants.',
      type: 'ENVIRONMENTAL',
      location: 'Varthur Lake Basin, Karnataka',
      latitude: 12.9416,
      longitude: 77.7471,
      startDate: new Date('2025-03-10'),
      endDate: new Date('2026-10-15'),
      status: 'ACTIVE',
      progress: 61,
      category: 'Wetlands',
    },
    {
      id: 'proj-004',
      name: 'Flood Emergency Response & Rapid Recovery',
      description: 'Real-time disaster intelligence and rapid damage assessment coordinating emergency relief, road clearing, and bridge foundation inspections across flood-inundated regions.',
      type: 'DISASTER_RESPONSE',
      location: 'Alappuzha & Wayanad, Kerala',
      latitude: 9.4981,
      longitude: 76.3388,
      startDate: new Date('2025-07-01'),
      endDate: new Date('2026-09-30'),
      status: 'MONITORING',
      progress: 88,
      category: 'Disaster Relief',
    },
  ];

  for (const proj of projectsData) {
    await prisma.project.create({ data: proj });
    console.log(`  + Project created: ${proj.name}`);
  }

  // 3. Define Media Assets & AI Metadata
  const mediaData = [
    // Project 1: Green Village
    {
      id: 'm001',
      projectId: 'proj-001',
      cloudinaryPublicId: 'impactlens/proj1_baseline',
      cloudinaryUrl: 'http://localhost:5000/static/images/greenrise-before.png',
      format: 'png',
      fileSize: 1538524,
      width: 1920,
      height: 1080,
      title: 'Baseline Drone Mapping - Zone A',
      description: 'Initial aerial photogrammetry showing degraded land prior to intervention. Visible erosion furrows across 14 hectares.',
      capturedAt: new Date('2025-01-15'),
      latitude: 11.0168,
      longitude: 76.9558,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['soil', 'barren land', 'furrows', 'boundary markers'],
        activities: ['Baseline Survey', 'Drone Photogrammetry'],
        tags: ['baseline', 'degraded-land', 'erosion', 'survey', 'aerial'],
        locationClues: ['arid terrain', 'cleared parcel', 'rural boundary'],
        impactSignals: ['initial state logged', 'ground control points established'],
        riskSignals: ['severe topsoil erosion', 'run-off gullies'],
        description: 'Initial aerial photogrammetry showing degraded land prior to intervention. Visible erosion furrows across 14 hectares.',
        confidence: 0.94,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm002',
      projectId: 'proj-001',
      cloudinaryPublicId: 'impactlens/proj1_plantation',
      cloudinaryUrl: 'https://images.pexels.com/photos/38071557/pexels-photo-38071557.jpeg?auto=compress&cs=tinysrgb&w=1200',
      format: 'jpeg',
      fileSize: 2150000,
      width: 1920,
      height: 1280,
      title: 'Community Tree Plantation Drive',
      description: 'Villagers and school volunteers planting native neem and pongamia saplings in regular grid intervals.',
      capturedAt: new Date('2025-03-20'),
      latitude: 11.0180,
      longitude: 76.9580,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['people', 'saplings', 'soil', 'irrigation lines', 'tools'],
        activities: ['Tree Plantation', 'Community Stewardship'],
        tags: ['plantation', 'community', 'sapling', 'volunteer', 'neem'],
        locationClues: ['rural agricultural buffer', 'prepared planting trenches'],
        impactSignals: ['4,200 saplings planted', 'active community participation', 'mulching verified'],
        riskSignals: [],
        description: 'Villagers and school volunteers planting native neem and pongamia saplings in regular grid intervals.',
        confidence: 0.91,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm003',
      projectId: 'proj-001',
      cloudinaryPublicId: 'impactlens/proj1_after',
      cloudinaryUrl: 'http://localhost:5000/static/images/greenrise-after.png',
      format: 'png',
      fileSize: 1988098,
      width: 1920,
      height: 1080,
      title: 'Verified Canopy Regrowth Audit',
      description: 'Multi-spectral aerial survey confirming 74% vegetative recovery and established juvenile tree canopy across Zone A.',
      capturedAt: new Date('2025-09-25'),
      latitude: 11.0168,
      longitude: 76.9558,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['tree canopy', 'vegetation buffer', 'stabilized soil', 'access track'],
        activities: ['Canopy Monitoring', 'Growth Audit'],
        tags: ['canopy', 'reforestation', 'healthy-vegetation', 'carbon-sink'],
        locationClues: ['restored corridor', 'dense juvenile forest'],
        impactSignals: ['canopy density increased 38%', 'soil erosion halted', '74% survival rate'],
        riskSignals: [],
        description: 'Multi-spectral aerial survey confirming 74% vegetative recovery and established juvenile tree canopy across Zone A.',
        confidence: 0.96,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm004',
      projectId: 'proj-001',
      cloudinaryPublicId: 'impactlens/proj1_encroachment',
      cloudinaryUrl: 'https://images.pexels.com/photos/230518/pexels-photo-230518.jpeg?auto=compress&cs=tinysrgb&w=1200',
      format: 'jpeg',
      fileSize: 1680000,
      width: 1920,
      height: 1080,
      title: 'Vegetation Clearance Audit near 11kV Line',
      description: 'Tree foliage extending within 2.8m of rural power lines. High risk of electrical arcing during monsoon winds.',
      capturedAt: new Date('2025-08-05'),
      latitude: 11.0220,
      longitude: 76.9620,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['power line', 'utility pole', 'tree branches', 'clearance zone'],
        activities: ['Hazard Detection', 'Infrastructure Inspection'],
        tags: ['power-line', 'encroachment', 'hazard', 'vegetation', 'risk'],
        locationClues: ['utility easement', 'sector 4 corridor'],
        impactSignals: [],
        riskSignals: ['branch clearance hazard', 'arcing risk', 'clearance under 3m'],
        description: 'Tree foliage extending within 2.8m of rural power lines. High risk of electrical arcing during monsoon winds.',
        confidence: 0.89,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },

    // Project 2: Urban Infrastructure
    {
      id: 'm005',
      projectId: 'proj-002',
      cloudinaryPublicId: 'impactlens/proj2_highway_baseline',
      cloudinaryUrl: 'http://localhost:5000/static/images/infra.png',
      format: 'png',
      fileSize: 1402595,
      width: 1920,
      height: 1080,
      title: 'Transit Corridor Baseline Photogrammetry',
      description: 'High-definition corridor mapping of elevated transit ring and high-voltage transmission rights-of-way.',
      capturedAt: new Date('2025-02-01'),
      latitude: 12.9249,
      longitude: 77.6749,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['highway', 'flyover', 'utility cables', 'vehicles', 'embankment'],
        activities: ['Infrastructure Photogrammetry', 'LiDAR Mapping'],
        tags: ['highway', 'flyover', 'infrastructure', 'transit', 'baseline'],
        locationClues: ['Bengaluru Outer Ring Road', 'elevated expressway'],
        impactSignals: ['35km transit ring corridor digitized'],
        riskSignals: ['unregulated vegetative growth near pylon bases'],
        description: 'High-definition corridor mapping of elevated transit ring and high-voltage transmission rights-of-way.',
        confidence: 0.93,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm006',
      projectId: 'proj-002',
      cloudinaryPublicId: 'impactlens/proj2_clearance',
      cloudinaryUrl: 'https://images.pexels.com/photos/15751129/pexels-photo-15751129.jpeg?auto=compress&cs=tinysrgb&w=1200',
      format: 'jpeg',
      fileSize: 1780000,
      width: 1920,
      height: 1080,
      title: 'Power Line Right-of-Way Pruning Verification',
      description: 'Corridor cleared to maintain mandatory 5m radial buffer from 66kV transmission cables following municipal intervention.',
      capturedAt: new Date('2025-05-14'),
      latitude: 12.9255,
      longitude: 77.6760,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['transmission cables', 'cleared radial zone', 'trimmed trees'],
        activities: ['Right-of-Way Pruning', 'Vegetation Management'],
        tags: ['power-line', 'corridor-clear', 'safety-compliant', 'maintenance'],
        locationClues: ['Substation 4 approach', 'transmission buffer'],
        impactSignals: ['5m safety clearance verified', '12 high-risk sectors cleared'],
        riskSignals: [],
        description: 'Corridor cleared to maintain mandatory 5m radial buffer from 66kV transmission cables following municipal intervention.',
        confidence: 0.95,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm007',
      projectId: 'proj-002',
      cloudinaryPublicId: 'impactlens/proj2_pier_audit',
      cloudinaryUrl: 'https://images.pexels.com/photos/230518/pexels-photo-230518.jpeg?auto=compress&cs=tinysrgb&w=1200',
      format: 'jpeg',
      fileSize: 1650000,
      width: 1920,
      height: 1080,
      title: 'Flyover Pier 4 Structural Deflection Audit',
      description: 'Non-destructive thermal and photogrammetric stress analysis of flyover pier 4. Deflection within safety tolerance.',
      capturedAt: new Date('2025-08-20'),
      latitude: 12.9262,
      longitude: 77.6775,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['concrete pier', 'bearing pad', 'superstructure', 'sensor marks'],
        activities: ['Structural Inspection', 'Deflection Analysis'],
        tags: ['concrete', 'bridge-pier', 'structural-health', 'inspection'],
        locationClues: ['Pier 4 ramp', 'interchange foundation'],
        impactSignals: ['structural stability confirmed', 'no progressive micro-cracks'],
        riskSignals: ['minor surface efflorescence'],
        description: 'Non-destructive thermal and photogrammetric stress analysis of flyover pier 4. Deflection within safety tolerance.',
        confidence: 0.90,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },

    // Project 3: Lake Wetland
    {
      id: 'm008',
      projectId: 'proj-003',
      cloudinaryPublicId: 'impactlens/proj3_water_before',
      cloudinaryUrl: 'http://localhost:5000/static/images/water-before.png',
      format: 'png',
      fileSize: 1694458,
      width: 1920,
      height: 1080,
      title: 'Eutrophic Weed Inundation Baseline',
      description: 'Thermal drone imagery recording 78% surface weed coverage and dense invasive water hyacinth mats choking central basin.',
      capturedAt: new Date('2025-03-10'),
      latitude: 12.9416,
      longitude: 77.7471,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['water hyacinth', 'stagnant water', 'silt buildup', 'lake boundary'],
        activities: ['Wetland Baseline Survey', 'Weed Density Mapping'],
        tags: ['wetland', 'water-hyacinth', 'eutrophication', 'baseline', 'silt'],
        locationClues: ['Varthur central basin', 'inlet channel'],
        impactSignals: ['surface weed mapped across 42 hectares'],
        riskSignals: ['severe oxygen depletion', 'eutrophic stagnation'],
        description: 'Thermal drone imagery recording 78% surface weed coverage and dense invasive water hyacinth mats choking central basin.',
        confidence: 0.92,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm009',
      projectId: 'proj-003',
      cloudinaryPublicId: 'impactlens/proj3_harvesting',
      cloudinaryUrl: 'https://images.pexels.com/photos/13402522/pexels-photo-13402522.jpeg?auto=compress&cs=tinysrgb&w=1200',
      format: 'jpeg',
      fileSize: 1840000,
      width: 1920,
      height: 1080,
      title: 'Mechanical Weed Harvesting & Desilting Operations',
      description: 'Amphibious harvesters removing over 120 metric tonnes of organic weed and floating debris from designated lake sectors.',
      capturedAt: new Date('2025-06-02'),
      latitude: 12.9425,
      longitude: 77.7485,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['amphibious harvester', 'extracted weed', 'silt barge', 'workers'],
        activities: ['Mechanical Harvesting', 'Desilting'],
        tags: ['cleanup', 'weed-removal', 'desilting', 'environmental-action'],
        locationClues: ['sector 2 inlet', 'spoil handling site'],
        impactSignals: ['120 metric tonnes weed removed', 'channel flow restored'],
        riskSignals: [],
        description: 'Amphibious harvesters removing over 120 metric tonnes of organic weed and floating debris from designated lake sectors.',
        confidence: 0.88,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm010',
      projectId: 'proj-003',
      cloudinaryPublicId: 'impactlens/proj3_water_after',
      cloudinaryUrl: 'http://localhost:5000/static/images/water.png',
      format: 'png',
      fileSize: 1711467,
      width: 1920,
      height: 1080,
      title: 'Restored Open Water Basin & Riparian Buffer',
      description: 'Aerial verification of cleared central water body with native reed perimeter bio-fencing and revitalized aquatic habitat.',
      capturedAt: new Date('2025-09-12'),
      latitude: 12.9416,
      longitude: 77.7471,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['open water', 'reed beds', 'waterfowl', 'lake perimeter buffer'],
        activities: ['Habitat Verification', 'Clarity Monitoring'],
        tags: ['restored-water', 'wetland', 'open-water', 'ecological-recovery'],
        locationClues: ['central lake basin', 'bio-fenced perimeter'],
        impactSignals: ['weed coverage reduced from 78% to 19%', 'dissolved oxygen increased to 5.2 mg/L', 'water clarity improved 2.4x'],
        riskSignals: [],
        description: 'Aerial verification of cleared central water body with native reed perimeter bio-fencing and revitalized aquatic habitat.',
        confidence: 0.97,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },

    // Project 4: Flood Response
    {
      id: 'm011',
      projectId: 'proj-004',
      cloudinaryPublicId: 'impactlens/proj4_coastal_before',
      cloudinaryUrl: 'http://localhost:5000/static/images/coastal-before.png',
      format: 'png',
      fileSize: 1687817,
      width: 1920,
      height: 1080,
      title: 'Monsoon Flood Crest Inundation Mapping',
      description: 'Emergency aerial reconnaissance capturing river breach and flood inundation over arterial supply routes and residential sectors.',
      capturedAt: new Date('2025-07-01'),
      latitude: 9.4981,
      longitude: 76.3388,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['floodwaters', 'submerged highway', 'damaged bund', 'stranded vehicles'],
        activities: ['Disaster Reconnaissance', 'Damage Assessment'],
        tags: ['flood', 'inundation', 'breach', 'emergency', 'disaster-response'],
        locationClues: ['Alappuzha river basin', 'NH-66 approach'],
        impactSignals: ['14 critical washouts mapped for priority bridge laying'],
        riskSignals: ['severe road submergence', 'bund collapse', 'hazardous current velocity'],
        description: 'Emergency aerial reconnaissance capturing river breach and flood inundation over arterial supply routes and residential sectors.',
        confidence: 0.94,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm012',
      projectId: 'proj-004',
      cloudinaryPublicId: 'impactlens/proj4_bridge_scour',
      cloudinaryUrl: 'https://images.pexels.com/photos/26202086/pexels-photo-26202086.jpeg?auto=compress&cs=tinysrgb&w=1200',
      format: 'jpeg',
      fileSize: 1950000,
      width: 1920,
      height: 1080,
      title: 'Alappuzha Bridge Foundation Scour Inspection',
      description: 'Severe underwater sediment washout around southern bridge pier following torrential flood currents.',
      capturedAt: new Date('2025-07-05'),
      latitude: 9.4981,
      longitude: 76.3388,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['bridge pier', 'floodwater', 'eroded sediment', 'debris'],
        activities: ['Infrastructure Inspection', 'Scour Sonar Audit'],
        tags: ['scour', 'bridge', 'flood', 'infrastructure-damage', 'hazard'],
        locationClues: ['Alappuzha crossing', 'pier 3 southern foundation'],
        impactSignals: [],
        riskSignals: ['foundation scour depth exceeding 1.2m', 'structural stability risk', 'load rating reduction'],
        description: 'Severe underwater sediment washout around southern bridge pier following torrential flood currents.',
        confidence: 0.92,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm013',
      projectId: 'proj-004',
      cloudinaryPublicId: 'impactlens/proj4_sandbagging',
      cloudinaryUrl: 'https://images.pexels.com/photos/31560723/pexels-photo-31560723.jpeg?auto=compress&cs=tinysrgb&w=1200',
      format: 'jpeg',
      fileSize: 2050000,
      width: 1920,
      height: 1080,
      title: 'Breached Bund Sandbagging & Diversion Channel',
      description: 'NDRF teams and community volunteers reinforcing breached embankment with geotextile sandbags and auxiliary diversion cut.',
      capturedAt: new Date('2025-07-15'),
      latitude: 9.5010,
      longitude: 76.3410,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['sandbags', 'geotextile revetment', 'diversion channel', 'NDRF team'],
        activities: ['Emergency Sandbagging', 'Bund Reinforcement'],
        tags: ['emergency-reinforcement', 'sandbags', 'diversion', 'flood-control'],
        locationClues: ['canal breach point', 'Sector 1 bund'],
        impactSignals: ['breach sealed with 12,000 sandbags', 'flood crest diverted from 3 villages'],
        riskSignals: [],
        description: 'NDRF teams and community volunteers reinforcing breached embankment with geotextile sandbags and auxiliary diversion cut.',
        confidence: 0.91,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
    {
      id: 'm014',
      projectId: 'proj-004',
      cloudinaryPublicId: 'impactlens/proj4_coastal_after',
      cloudinaryUrl: 'http://localhost:5000/static/images/coastal-after.png',
      format: 'png',
      fileSize: 935921,
      width: 1920,
      height: 1080,
      title: 'Restored Arterial Corridor Reopened',
      description: 'Drained, cleared, and repaired transport corridor fully reopened for emergency supply convoys and civilian movement.',
      capturedAt: new Date('2025-09-20'),
      latitude: 9.4981,
      longitude: 76.3388,
      status: 'ACTIVE',
      analysisStatus: 'COMPLETED',
      aiMetadata: {
        objects: ['cleared roadway', 'stabilized embankment', 'vehicles', 'repaired bridge approach'],
        activities: ['Route Verification', 'Clearance Audit'],
        tags: ['reopened', 'restored-route', 'flood-recovery', 'logistics-safe'],
        locationClues: ['NH-66 restored segment', 'Alappuzha corridor'],
        impactSignals: ['main arterial reopened for emergency convoys', 'embankment stabilization verified'],
        riskSignals: [],
        description: 'Drained, cleared, and repaired transport corridor fully reopened for emergency supply convoys and civilian movement.',
        confidence: 0.96,
        analysisStatus: 'COMPLETED',
        analysisMode: 'live_ai',
        provider: 'NVIDIA Nemotron / Gemini Vision',
        model: 'meta/llama-3.2-11b-vision-instruct',
        evidenceQuality: 'high',
      },
    },
  ];

  for (const m of mediaData) {
    const { aiMetadata, ...assetFields } = m;
    await prisma.mediaAsset.create({
      data: {
        ...assetFields,
        aiMetadata: {
          create: aiMetadata,
        },
      },
    });
    console.log(`  + Media asset created: ${m.title}`);
  }

  // 4. Define Comparisons (Before vs After)
  const comparisonsData = [
    {
      id: 'cmp-001',
      projectId: 'proj-001',
      beforeMediaId: 'm001',
      afterMediaId: 'm003',
      label: 'Zone A: Degraded Land to Living Canopy',
      analysis: {
        summary: 'Visible canopy regrowth in Zone A over 8 months. Vegetative density increased 38% with verified 74% sapling survival and cessation of active topsoil erosion.',
        keyChanges: [
          '38% increase in vegetation canopy index',
          'Stabilization of erosion furrows with root systems',
          '4,200 native saplings successfully established',
        ],
        confidence: 0.95,
      },
      createdAt: new Date('2025-09-26'),
    },
    {
      id: 'cmp-002',
      projectId: 'proj-002',
      beforeMediaId: 'm005',
      afterMediaId: 'm006',
      label: 'Transmission Corridor Vegetation Clearance',
      analysis: {
        summary: 'Transmission line right-of-way cleared to maintain full 5m radial buffer, eliminating high-voltage arcing hazards prior to monsoon season.',
        keyChanges: [
          '5m mandatory radial buffer achieved',
          '12 hazardous tree branch clusters pruned',
          'Zero transmission trip events recorded',
        ],
        confidence: 0.93,
      },
      createdAt: new Date('2025-05-15'),
    },
    {
      id: 'cmp-003',
      projectId: 'proj-003',
      beforeMediaId: 'm008',
      afterMediaId: 'm010',
      label: 'Varthur Basin Eutrophication Recovery',
      analysis: {
        summary: 'Dramatic restoration of open water area following removal of 120 tonnes of water hyacinth and installation of riparian reed bio-fencing.',
        keyChanges: [
          'Weed coverage reduced from 78% to 19%',
          'Dissolved oxygen elevated to healthy 5.2 mg/L',
          'Native waterfowl nesting activity resumed',
        ],
        confidence: 0.94,
      },
      createdAt: new Date('2025-09-15'),
    },
    {
      id: 'cmp-004',
      projectId: 'proj-004',
      beforeMediaId: 'm011',
      afterMediaId: 'm014',
      label: 'Emergency Arterial Clearance & Reopening',
      analysis: {
        summary: 'Floodwaters drained, highway debris removed, and bridge scour remediated allowing uninterrupted emergency logistics access.',
        keyChanges: [
          'Roadway fully drained and debris cleared',
          'Bridge pier 3 rip-rap armor placed and verified',
          'Essential supply convoys moving safely',
        ],
        confidence: 0.96,
      },
      createdAt: new Date('2025-09-22'),
    },
  ];

  for (const cmp of comparisonsData) {
    await prisma.comparison.create({ data: cmp });
    console.log(`  + Comparison created: ${cmp.label}`);
  }

  // 5. Define Verifications
  const verificationsData = [
    {
      id: 'v001',
      mediaId: 'm004',
      status: 'NEEDS_INSPECTION',
      comment: 'Potential tree encroachment near power line — branches within 2.8m safety clearance corridor.',
      verifiedBy: 'Inspector Rajesh Kumar (Field Division)',
      category: 'Vegetation Risk',
      createdAt: new Date('2025-08-05T14:30:00Z'),
    },
    {
      id: 'v002',
      mediaId: 'm012',
      status: 'CONFIRMED',
      comment: 'Bridge foundation scour confirmed — 1.2m sediment washout below pier 3 base.',
      verifiedBy: 'Structural Engineer Priya Nair (PWD)',
      category: 'Infrastructure',
      createdAt: new Date('2025-07-05T08:45:00Z'),
    },
    {
      id: 'v003',
      mediaId: 'm001',
      status: 'CONFIRMED',
      comment: 'Degraded land baseline survey verified with GIS ground truth control points.',
      verifiedBy: 'GIS Lead Dr. M. Sundaram',
      category: 'Baseline Survey',
      createdAt: new Date('2025-01-15T10:00:00Z'),
    },
    {
      id: 'v004',
      mediaId: 'm003',
      status: 'CONFIRMED',
      comment: 'Canopy density expansion audit verified by multi-spectral drone photogrammetry.',
      verifiedBy: 'Forestry Officer K. Raman',
      category: 'Reforestation Audit',
      createdAt: new Date('2025-09-26T11:00:00Z'),
    },
    {
      id: 'v005',
      mediaId: 'm010',
      status: 'CONFIRMED',
      comment: 'Water basin open surface verified with water quality sensor telemetry (DO 5.2 mg/L).',
      verifiedBy: 'Environmental Biologist Anita Deshmukh',
      category: 'Water Quality',
      createdAt: new Date('2025-09-13T09:30:00Z'),
    },
  ];

  for (const v of verificationsData) {
    await prisma.verification.create({ data: v });
    console.log(`  + Verification created: ${v.id}`);
  }

  // 6. Define Evidence Requirements
  const evidenceReqs = [
    {
      id: 'er-001',
      projectId: 'proj-001',
      title: 'Baseline Photogrammetric Survey',
      description: 'High-resolution aerial imagery capturing ground contours and erosion gullies.',
      evidenceCategory: 'baseline',
      required: true,
      status: 'FULFILLED',
      targetDate: new Date('2025-01-20'),
    },
    {
      id: 'er-002',
      projectId: 'proj-001',
      title: 'Sapling Survival Rate Census',
      description: 'Quarterly sample plots tracking sapling survival and canopy expansion.',
      evidenceCategory: 'canopy',
      required: true,
      status: 'FULFILLED',
      targetDate: new Date('2025-09-30'),
    },
    {
      id: 'er-003',
      projectId: 'proj-002',
      title: 'Radial Safety Clearance Verification',
      description: 'Visual evidence confirming min 5m clearance between transmission lines and foliage.',
      evidenceCategory: 'power-line',
      required: true,
      status: 'FULFILLED',
      targetDate: new Date('2025-05-30'),
    },
    {
      id: 'er-004',
      projectId: 'proj-003',
      title: 'Post-Harvest Water Clarity & DO Telemetry',
      description: 'Water sample lab report and optical drone pass verifying cleared surface area.',
      evidenceCategory: 'restored-water',
      required: true,
      status: 'FULFILLED',
      targetDate: new Date('2025-09-20'),
    },
  ];

  for (const er of evidenceReqs) {
    await prisma.evidenceRequirement.create({ data: er });
  }

  // 7. Define Milestones
  const milestones = [
    {
      id: 'ms-001',
      projectId: 'proj-001',
      title: 'Phase 1 Plantation Complete',
      description: '4,200 indigenous saplings planted with community participation.',
      targetDate: new Date('2025-03-31'),
      completedAt: new Date('2025-03-20'),
      status: 'COMPLETED',
    },
    {
      id: 'ms-002',
      projectId: 'proj-001',
      title: 'Canopy Density Audit Milestone',
      description: 'Achieve >35% vegetation index gain verified via drone analysis.',
      targetDate: new Date('2025-09-30'),
      completedAt: new Date('2025-09-25'),
      status: 'COMPLETED',
    },
    {
      id: 'ms-003',
      projectId: 'proj-002',
      title: 'Transmission Buffer Pruning',
      description: 'Clear 35km transit ring right-of-way of overgrown vegetation.',
      targetDate: new Date('2025-05-31'),
      completedAt: new Date('2025-05-14'),
      status: 'COMPLETED',
    },
    {
      id: 'ms-004',
      projectId: 'proj-003',
      title: 'Basin Weed Extraction',
      description: 'Remove 100+ metric tonnes of invasive hyacinth biomass.',
      targetDate: new Date('2025-06-30'),
      completedAt: new Date('2025-06-02'),
      status: 'COMPLETED',
    },
  ];

  for (const ms of milestones) {
    await prisma.milestone.create({ data: ms });
  }

  // 8. Define Reports
  const reportsData = [
    {
      id: 'rep-001',
      projectId: 'proj-001',
      title: 'Green Village Restoration — Comprehensive Impact Report',
      type: 'impact',
      status: 'published',
      summary: 'The Green Village Restoration initiative has achieved 74% milestone progress with a 38% increase in vegetative canopy density across 8 monitoring zones. 4,200 indigenous saplings planted with 74% survival rate confirmed by multi-spectral aerial audits.',
      content: {
        statistics: [
          { label: 'Saplings Planted', value: '4,200', change: '+1,200' },
          { label: 'Survival Rate', value: '74%', change: '+8%' },
          { label: 'Canopy Density Gain', value: '+38%', change: '+12%' },
          { label: 'Carbon Offset (Est.)', value: '148t CO₂', change: '+44t' },
        ],
        selectedEvidence: ['m001', 'm002', 'm003'],
        beforeAfter: { before: { url: 'http://localhost:5000/static/images/greenrise-before.png' }, after: { url: 'http://localhost:5000/static/images/greenrise-after.png' } },
        aiObservations: [
          'Vegetation density increased 38% over 8 months',
          'Zero progressive gully erosion detected along eastern boundary',
          'Canopy cover verified by multi-spectral drone photogrammetry',
        ],
        sourceAssets: ['m001', 'm002', 'm003', 'm004'],
      },
      createdAt: new Date('2025-09-26'),
    },
    {
      id: 'rep-002',
      projectId: 'proj-002',
      title: 'Urban Infrastructure Safety — Safety & Hazard Audit',
      type: 'risk',
      status: 'published',
      summary: 'Comprehensive safety survey along 35km transit corridor. High-voltage transmission lines pruned to required radial clearances. Pier 4 deflection audit confirms structural integrity under peak traffic loads.',
      content: {
        statistics: [
          { label: 'Corridors Audited', value: '35 km', change: '' },
          { label: 'Hazards Cleared', value: '12', change: '+5' },
          { label: 'Inspection Frequency', value: '7 days', change: '' },
          { label: 'Active Critical Risks', value: '0', change: '-2' },
        ],
        selectedEvidence: ['m005', 'm006', 'm007'],
        beforeAfter: { before: { url: 'http://localhost:5000/static/images/infra.png' }, after: { url: 'https://images.pexels.com/photos/15751129/pexels-photo-15751129.jpeg' } },
        aiObservations: [
          '5m radial safety clearance confirmed across Substation 4 feeder corridors',
          'Bridge pier 4 structural deflection measured within nominal tolerance (0.04g)',
        ],
        sourceAssets: ['m005', 'm006', 'm007'],
      },
      createdAt: new Date('2025-09-15'),
    },
  ];

  for (const rep of reportsData) {
    await prisma.report.create({ data: rep });
    console.log(`  + Report created: ${rep.title}`);
  }

  // 9. Define Stories
  const storiesData = [
    {
      id: 's001',
      projectId: 'proj-001',
      title: 'From Barren Dust to Living Canopy: The Coimbatore Turnaround',
      type: 'impact_story',
      content: 'In January 2025, the land in Coimbatore was deeply furrowed and vulnerable to seasonal wind erosion. Eight months later, 4,200 native saplings have transformed the landscape into a resilient juvenile forest. With a 74% survival rate verified by AI aerial imagery, this project demonstrates how transparent, evidence-backed environmental action creates real resilience.',
      assetIds: ['m001', 'm002', 'm003'],
      status: 'published',
      createdAt: new Date('2025-09-27'),
    },
    {
      id: 's002',
      projectId: 'proj-004',
      title: 'Rapid Recovery: Reopening the Alappuzha Lifeline Corridor',
      type: 'impact_story',
      content: 'When torrential floods submerged the Alappuzha crossing, rapid drone reconnaissance mapped 14 critical washouts within hours. Coordinated sandbagging sealed the bund breach, bridge scour was stabilized, and essential logistics convoys were moving within three weeks.',
      assetIds: ['m011', 'm012', 'm013', 'm014'],
      status: 'published',
      createdAt: new Date('2025-09-22'),
    },
  ];

  for (const s of storiesData) {
    await prisma.story.create({ data: s });
    console.log(`  + Story created: ${s.title}`);
  }

  // 10. Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        projectId: 'proj-001',
        mediaId: 'm001',
        eventType: 'AI_ANALYSIS_COMPLETED',
        actorType: 'AI_AGENT',
        description: 'Baseline aerial photogrammetry analyzed for land degradation and erosion gullies.',
        createdAt: new Date('2025-01-15T10:05:00Z'),
      },
      {
        projectId: 'proj-001',
        mediaId: 'm003',
        eventType: 'COMPARISON_CREATED',
        actorType: 'USER',
        description: 'Before/after comparison created between baseline and current canopy survey.',
        createdAt: new Date('2025-09-26T11:30:00Z'),
      },
      {
        projectId: 'proj-001',
        mediaId: 'm004',
        eventType: 'HUMAN_REVIEW_UPDATED',
        actorType: 'USER',
        description: 'Power line vegetation clearance flagged for inspection.',
        createdAt: new Date('2025-08-05T14:35:00Z'),
      },
      {
        projectId: 'proj-004',
        mediaId: 'm012',
        eventType: 'HUMAN_REVIEW_UPDATED',
        actorType: 'USER',
        description: 'Bridge scour detected and confirmed by engineering team.',
        createdAt: new Date('2025-07-05T09:00:00Z'),
      },
    ],
  });

  console.log('✅ Pristine ImpactLens Database Seed successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
