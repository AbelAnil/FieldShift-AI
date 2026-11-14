export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  region: string;
  timestamp: string;
  uptime_seconds: number;
  python_version: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface FieldItem {
  id: string;
  farm_id: string;
  field_name: string;
  area_hectares: number;
  area_acres: number;
  current_crop: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  irrigation_available: boolean;
  notes: string | null;
  boundary_geojson: any;
  created_at: string;
}

export interface Farm {
  id: string;
  user_id: string;
  farm_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  total_area_hectares: number;
  total_area_acres: number;
  boundary_geojson: any;
  current_crop: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  irrigation_available: boolean;
  farming_priorities: string;
  created_at: string;
  fields?: FieldItem[];
}

export interface GeoJSONValidationResponse {
  is_valid: boolean;
  error?: string;
  area_hectares?: number;
  area_acres?: number;
  centroid_lat?: number;
  centroid_lon?: number;
  cleaned_geojson?: any;
}

export interface DataSourceItem {
  id?: string;
  dataset_name: string;
  provider: string;
  parameter: string;
  spatial_resolution: string;
  temporal_resolution: string;
  source_url: string;
  license: string;
  scientific_limitations: string;
  is_nasa_dataset: string;
}

export interface RainfallResponse {
  farm_id: string;
  farm_name: string;
  dataset: string;
  spatial_resolution: string;
  cumulative_rainfall_mm: number;
  heavy_rain_events_count: number;
  heavy_rain_events: { date: string; rainfall_mm: number; status: string }[];
  timeseries: {
    date: string;
    daily_rainfall_mm: number;
    rolling_7d_rainfall_mm: number;
    is_heavy_rain: boolean;
  }[];
}

export interface VegetationResponse {
  farm_id: string;
  farm_name: string;
  sources: string;
  latest_ndvi: number;
  latest_ndmi: number;
  latest_acquisition_date: string;
  canopy_status: {
    vigor_status: string;
    moisture_status: string;
    interpretation: string;
  };
  observations: {
    date: string;
    ndvi: number;
    ndmi: number;
    satellite: string;
    resolution: string;
    cloud_cover: number;
  }[];
}

export interface SoilMoistureResponse {
  farm_id: string;
  farm_name: string;
  dataset: string;
  spatial_resolution: string;
  surface_soil_moisture_m3m3: number;
  rootzone_soil_moisture_m3m3: number;
  regional_status: string;
  anomaly_percent: string;
  scientific_limitation: string;
}

export interface EnvironmentSummaryResponse {
  farm_id: string;
  farm_name: string;
  location: string;
  coordinates: { latitude: number; longitude: number };
  period: string;
  summary: {
    avg_temperature_c: number;
    cumulative_rainfall_mm: number;
    avg_solar_radiation_mj_m2: number;
    avg_relative_humidity_pct: number;
    latest_ndvi: number;
    latest_ndmi: number;
    smap_surface_moisture_m3m3: number;
    canopy_vigor: string;
  };
  weather_timeseries: {
    date: string;
    rainfall_mm: number;
    temp_mean: number;
    temp_max: number;
    temp_min: number;
    solar_radiation: number;
    relative_humidity: number;
  }[];
  vegetation_timeseries: {
    date: string;
    ndvi: number;
    ndmi: number;
    satellite: string;
    resolution: string;
  }[];
  smap_regional: SoilMoistureResponse;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch health check: HTTP ${response.status}`);
  }
  return response.json();
}

export async function loginDemoUser(farmerId: number = 1): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/demo-login?farmer_id=${farmerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to login demo user: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchFarms(token: string): Promise<Farm[]> {
  const response = await fetch(`${API_BASE_URL}/api/farms`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch farms: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchFarm(farmId: string, token: string): Promise<Farm> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch farm: HTTP ${response.status}`);
  }
  return response.json();
}

export async function createFarm(farmData: any, token: string): Promise<Farm> {
  const response = await fetch(`${API_BASE_URL}/api/farms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(farmData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to create farm: HTTP ${response.status}`);
  }
  return response.json();
}

export async function deleteFarm(farmId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to delete farm: HTTP ${response.status}`);
  }
}

export async function validateGeoJSON(geojson: any): Promise<GeoJSONValidationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/fields/validate-geojson`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ geojson }),
  });
  if (!response.ok) {
    throw new Error(`Validation failed: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchDataSources(): Promise<DataSourceItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/data-sources`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch data sources: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchFarmEnvironment(farmId: string, token: string): Promise<EnvironmentSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/environment`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch farm environment: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchFarmRainfall(farmId: string, token: string, days: number = 30): Promise<RainfallResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/rainfall?days=${days}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch rainfall: HTTP ${response.status}`);
  }
  return response.json();
}

export interface SoilAnalysisResponse {
  farm_id: string;
  has_lab_test: boolean;
  data_source_used: string;
  effective_ph: number;
  ph_category: string;
  ph_recommendation: string;
  effective_texture: string;
  organic_carbon_pct: number;
  npk_status: {
    available_n_kg_ha: number | null;
    available_p_kg_ha: number | null;
    available_k_kg_ha: number | null;
    status: string;
    warning: string | null;
  };
  missing_measurements: string[];
  assessment_completeness_pct: number;
  suggested_actions: string[];
}

export interface TerrainResponse {
  farm_id: string;
  elevation_min_m: number;
  elevation_max_m: number;
  elevation_mean_m: number;
  relief_m: number;
  slope_mean_deg: number;
  slope_class: string;
  aspect_dominant: string;
  flow_accumulation_risk: string;
  topographic_wetness_index: number;
  drainage_assessment: string;
  farmer_marked_waterlogging: boolean;
  source: string;
  scientific_limitation: string;
}

export interface CropItem {
  id: string;
  crop_name: string;
  scientific_name: string;
  crop_family: string;
  duration_days: string;
  planting_windows: string;
  water_requirement_mm: number;
  water_demand_category: string;
  ph_range: string;
  temp_range: string;
  drainage_preference: string;
  nitrogen_fixation: boolean;
  soil_cover_rating: string;
  agronomic_source: string;
}

export interface CropSuitabilityEvaluation {
  crop_id: string;
  crop_name: string;
  scientific_name: string;
  crop_family: string;
  duration_days: string;
  suitability_score: number;
  suitability_class: string;
  assessment_completeness_pct: number;
  nitrogen_fixation: boolean;
  component_scores: {
    soil_score: number;
    climate_score: number;
    water_score: number;
    drainage_score: number;
    seasonal_score: number;
  };
  supporting_factors: string[];
  limitations: string[];
  missing_data: string[];
  planting_window: string;
  agronomic_source: string;
}

export interface CropSuitabilityResponse {
  farm_id: string;
  farm_name: string;
  evaluation_count: number;
  telemetry_used: {
    soil_ph: number;
    soil_source: string;
    ambient_temp_avg_c: number;
    precipitation_30d_mm: number;
    slope_deg: number;
    drainage_flow_risk: string;
    irrigation_active: boolean;
  };
  crops: CropSuitabilityEvaluation[];
}

export async function fetchFarmVegetation(farmId: string, token: string): Promise<VegetationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/vegetation`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch vegetation: HTTP ${response.status}`);
  return response.json();
}

export async function fetchFarmSoilAnalysis(farmId: string, token: string): Promise<SoilAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/soil-analysis`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch soil analysis: HTTP ${response.status}`);
  return response.json();
}

export async function recordFarmerSoilTest(farmId: string, testData: any, token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/soil`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(testData),
  });
  if (!response.ok) throw new Error(`Failed to record soil test: HTTP ${response.status}`);
  return response.json();
}

export async function fetchFarmTerrain(farmId: string, token: string): Promise<TerrainResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/terrain`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch terrain: HTTP ${response.status}`);
  return response.json();
}

export async function toggleWaterlogging(farmId: string, marked: boolean, token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/terrain/waterlogging`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ marked }),
  });
  if (!response.ok) throw new Error(`Failed to toggle waterlogging: HTTP ${response.status}`);
  return response.json();
}

export async function fetchCrops(): Promise<CropItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/crops`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to fetch crops: HTTP ${response.status}`);
  return response.json();
}

export interface DigitalTwinResponse {
  farm_id: string;
  farm_name: string;
  location: string;
  coordinates: { lat: number; lon: number };
  area: {
    hectares: number;
    acres: number;
    boundary_type: string;
  };
  crop_state: {
    current_crop: string;
    planting_date: string;
    expected_harvest_date: string;
    irrigation_active: boolean;
    farming_priority: string;
  };
  soil_state: SoilAnalysisResponse;
  terrain_state: TerrainResponse;
  environmental_state: {
    cumulative_rainfall_30d_mm: number;
    avg_temperature_c: number;
    smap_moisture_m3m3: number;
    smap_regional_status: string;
  };
  vegetation_state: {
    latest_ndvi: number;
    latest_ndmi: number;
    canopy_status: string;
  };
  risk_assessment: {
    overall_risk_score: number;
    risk_level: string;
    risk_factors: { factor: string; severity: string; detail: string }[];
  };
  data_completeness_pct: number;
  last_synced: string;
}

export interface SimulationResponse {
  simulation_id: string;
  farm_id: string;
  farm_name: string;
  scenario_inputs: {
    simulated_crop: string;
    rainfall_variation_pct: string;
    simulated_30d_rain_mm: number;
    irrigation_active: boolean;
    planting_delay_days: number;
  };
  recalculated_suitability: {
    crop: string;
    score: number;
    class: string;
    supporting_factors: string[];
    limitations: string[];
  };
  projected_risk_score: number;
  projected_risk_level: string;
  consequences: string[];
  scientific_disclaimer: string;
}

export async function evaluateCropSuitability(farmId: string, token: string): Promise<CropSuitabilityResponse> {
  const response = await fetch(`${API_BASE_URL}/api/crops/suitability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ farm_id: farmId }),
  });
  if (!response.ok) throw new Error(`Failed to evaluate crop suitability: HTTP ${response.status}`);
  return response.json();
}

export interface RotationStep {
  year: number;
  season: string;
  crop_id: string;
  crop_name: string;
  crop_family: string;
  duration_days: string;
  water_demand: string;
  nitrogen_fixation: boolean;
  role: string;
  notes: string;
}

export interface RotationStrategy {
  strategy_id: string;
  strategy_name: string;
  focus_area: string;
  rationale: string;
  steps: RotationStep[];
  overall_score: number;
  water_efficiency_rating: string;
  soil_health_delta: string;
  pest_disease_risk_mitigation: string;
}

export interface FarmRotationResponse {
  farm_id: string;
  farm_name: string;
  current_crop: string;
  strategies_count: number;
  strategies: RotationStrategy[];
}

export async function fetchFarmRotation(farmId: string, token: string): Promise<FarmRotationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/rotation`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch rotation strategies: HTTP ${response.status}`);
  return response.json();
}

export async function fetchFarmDigitalTwin(farmId: string, token: string): Promise<DigitalTwinResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/digital-twin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch digital twin: HTTP ${response.status}`);
  return response.json();
}

export async function simulateFarmScenario(farmId: string, simulationData: any, token: string): Promise<SimulationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/digital-twin/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(simulationData),
  });
  if (!response.ok) throw new Error(`Failed to simulate scenario: HTTP ${response.status}`);
  return response.json();
}

export interface PromptSuggestion {
  category: string;
  prompt: string;
  description: string;
}

export interface ToolCallItem {
  tool_name: string;
  description: string;
  summary_result: string;
}

export interface ChatMessageItem {
  id: string;
  session_id: string;
  sender: "user" | "assistant" | "system";
  content: string;
  tools_called?: ToolCallItem[];
  citations?: string[];
  created_at: string;
}

export interface ChatSessionItem {
  id: string;
  farm_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatApiResponse {
  session_id: string;
  message_id: string;
  reply: string;
  tools_executed: ToolCallItem[];
  citations: string[];
  suggested_follow_ups: string[];
}

export async function fetchChatSessions(farmId: string, token: string): Promise<ChatSessionItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/sessions/${farmId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Failed to fetch chat sessions: HTTP ${response.status}`);
  return response.json();
}

export async function createChatSession(farmId: string, title: string, token: string): Promise<ChatSessionItem> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/sessions/${farmId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error(`Failed to create chat session: HTTP ${response.status}`);
  return response.json();
}

export async function deleteChatSession(sessionId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Failed to delete chat session: HTTP ${response.status}`);
}

export async function fetchSuggestedPrompts(farmId: string, token: string): Promise<PromptSuggestion[]> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/prompts/${farmId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch suggested prompts: HTTP ${response.status}`);
  return response.json();
}

export async function sendChatMessage(
  farmId: string,
  message: string,
  token: string,
  sessionId?: string,
  language: string = "en",
): Promise<ChatApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      farm_id: farmId,
      message,
      session_id: sessionId,
      language,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to send chat message: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchChatHistory(
  farmId: string,
  token: string,
  sessionId?: string,
): Promise<ChatMessageItem[]> {
  const url = sessionId
    ? `${API_BASE_URL}/api/assistant/history/${farmId}?session_id=${sessionId}`
    : `${API_BASE_URL}/api/assistant/history/${farmId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Failed to fetch chat history: HTTP ${response.status}`);
  return response.json();
}

export interface TaskItem {
  id: string;
  farm_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: "soil" | "weather" | "crop" | "drainage" | "general" | string;
  priority: "high" | "medium" | "low" | string;
  status: "pending" | "completed" | "dismissed" | "postponed" | string;
  due_date: string | null;
  trigger_source: string;
  created_at: string;
  completed_at: string | null;
}

export interface FarmReportResponse {
  farm_id: string;
  farm_name: string;
  generated_at: string;
  markdown_report: string;
  summary_kpis: {
    risk_score: number;
    risk_level: string;
    rainfall_30d_mm: number;
    effective_ph: number;
    ph_category: string;
    slope_deg: number;
    top_crop: string;
    top_crop_score: number;
    pending_tasks_count: number;
  };
  top_crops: CropSuitabilityEvaluation[];
  rotation_strategies: any[];
  pending_tasks: {
    id: string;
    title: string;
    priority: string;
    category: string;
    due_date: string | null;
    description: string | null;
  }[];
}

export async function fetchFarmTasks(
  farmId: string,
  token: string,
  syncTelemetry: boolean = true,
): Promise<TaskItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/farms/${farmId}/tasks?sync_telemetry=${syncTelemetry}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`Failed to fetch tasks: HTTP ${response.status}`);
  return response.json();
}

export async function createFarmTask(
  farmId: string,
  taskData: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    due_date?: string;
    trigger_source?: string;
  },
  token: string,
): Promise<TaskItem> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to create task: HTTP ${response.status}`);
  }
  return response.json();
}

export async function updateTaskStatus(
  taskId: string,
  status: "pending" | "completed" | "dismissed" | "postponed",
  token: string,
): Promise<TaskItem> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`Failed to update task status: HTTP ${response.status}`);
  return response.json();
}

export async function deleteTask(taskId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Failed to delete task: HTTP ${response.status}`);
}

export async function fetchFarmReport(
  farmId: string,
  token: string,
): Promise<FarmReportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/report`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to generate farm report: HTTP ${response.status}`);
  return response.json();
}

export interface CarbonPathway {
  id: string;
  name: string;
  relevance_kerala: string;
  eligible_crops: string[];
  methodology_code: string;
  methodology_name: string;
  registry: string;
  yield_tco2e_per_ha_range: string;
  evidence_required: string[];
  description: string;
}

export interface CarbonPartner {
  id: string;
  name: string;
  partner_type: string;
  location: string;
  typical_commission_pct: number;
  description: string | null;
  contact_email: string | null;
  verified: string;
}

export interface EligibilityResult {
  farm_id: string;
  pathway: string;
  status: "eligible" | "conditionally_eligible" | "ineligible" | string;
  readiness_score: number;
  requirements_met: string[];
  requirements_missing: string[];
  guidance: string;
  methodology_code: string;
  next_steps: string[];
}

export interface CarbonEstimateData {
  farm_id: string;
  farm_name: string;
  area_hectares: number;
  area_acres: number;
  pathway: string;
  methodology: string;
  conservative_tco2e_yr: number;
  expected_tco2e_yr: number;
  high_tco2e_yr: number;
  assumed_carbon_price_usd: number;
  gross_annual_usd_range: { low: number; expected: number; high: number };
  developer_commission_pct: number;
  net_farmer_usd_range: { low: number; expected: number; high: number };
  net_farmer_inr_range: { low: number; expected: number; high: number };
  disclaimer: string;
  economic_reality_note: string;
}

export interface CarbonEvidenceItem {
  id: string;
  farm_id: string;
  pathway: string;
  evidence_type: string;
  title: string;
  description: string | null;
  status: string;
  recorded_at: string;
}

export interface CarbonDossierData {
  farm_id: string;
  farm_name: string;
  generated_at: string;
  eligibility_summary: EligibilityResult[];
  estimates: CarbonEstimateData[];
  evidence_checklist: CarbonEvidenceItem[];
  evidence_gap_count: number;
  recommended_aggregator: string;
  markdown_pack: string;
}

export async function fetchCarbonPathways(): Promise<CarbonPathway[]> {
  const response = await fetch(`${API_BASE_URL}/api/carbon/pathways`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to fetch carbon pathways: HTTP ${response.status}`);
  return response.json();
}

export async function fetchCarbonPartners(): Promise<CarbonPartner[]> {
  const response = await fetch(`${API_BASE_URL}/api/carbon/partners`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to fetch carbon partners: HTTP ${response.status}`);
  return response.json();
}

export async function screenCarbonEligibility(
  payload: {
    farm_id: string;
    pathway: string;
    tree_density_per_acre?: number;
    has_water_regime_control?: boolean;
    practices_mulching_or_cover_crops?: boolean;
  },
  token: string,
): Promise<EligibilityResult> {
  const response = await fetch(`${API_BASE_URL}/api/carbon/eligibility`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Failed to screen carbon eligibility: HTTP ${response.status}`);
  return response.json();
}

export async function fetchCarbonEstimate(
  farmId: string,
  token: string,
  pathway: string = "agroforestry",
  priceUsd: number = 15.0,
  commissionPct: number = 30.0,
): Promise<CarbonEstimateData> {
  const response = await fetch(
    `${API_BASE_URL}/api/farms/${farmId}/carbon/estimate?pathway=${pathway}&carbon_price_usd=${priceUsd}&developer_commission_pct=${commissionPct}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`Failed to fetch carbon estimate: HTTP ${response.status}`);
  return response.json();
}

export async function fetchCarbonEvidence(farmId: string, token: string): Promise<CarbonEvidenceItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/carbon/evidence`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch carbon evidence: HTTP ${response.status}`);
  return response.json();
}

export async function recordCarbonEvidence(
  farmId: string,
  data: {
    pathway: string;
    evidence_type: string;
    title: string;
    description?: string;
    metadata_json?: any;
  },
  token: string,
): Promise<CarbonEvidenceItem> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/carbon/evidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to record carbon evidence: HTTP ${response.status}`);
  return response.json();
}

export async function fetchCarbonDossier(farmId: string, token: string): Promise<CarbonDossierData> {
  const response = await fetch(`${API_BASE_URL}/api/farms/${farmId}/carbon/dossier`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to fetch carbon dossier: HTTP ${response.status}`);
  return response.json();
}

// ==========================================
// Module 11: Integrated Farming System (IFS)
// ==========================================

export interface LivestockItem {
  id: string;
  farm_id: string;
  animal_type: string;
  breed_name: string;
  unit_count: number;
  daily_yield_metric: string | null;
  daily_manure_kg_total: number;
  biogas_linked: boolean;
  notes: string | null;
  created_at: string;
}

export interface FarmPondItem {
  id: string;
  farm_id: string;
  pond_name: string;
  surface_area_sqm: number;
  mean_depth_m: number;
  capacity_litres: number;
  primary_fish_species: string;
  stocking_density_count: number;
  harvestable_catchment_m3: number;
  irrigation_drawdown_days: number;
  water_source: string;
  created_at: string;
}

export interface ApicultureItem {
  id: string;
  farm_id: string;
  bee_species: string;
  hive_count: number;
  target_pollination_crops: string[];
  annual_honey_yield_kg: number;
  estimated_pollination_value_inr: number;
  medicinal_honey_market: boolean;
  created_at: string;
}

export interface CattleTHIStatus {
  farm_id: string;
  farm_name: string;
  temperature_c: number;
  relative_humidity_pct: number;
  thi_value: number;
  stress_level: string;
  respiration_impact: string;
  milk_yield_risk_pct: number;
  alert_triggered: boolean;
  recommended_interventions: string[];
  nasa_telemetry_source: string;
}

export interface RainwaterPondTelemetry {
  farm_id: string;
  farm_name: string;
  farm_area_acres: number;
  cumulative_30d_rain_mm: number;
  harvestable_runoff_m3: number;
  harvestable_runoff_litres: number;
  pond_capacity_m3: number;
  pond_fill_percentage: number;
  fish_carrying_capacity_kg: number;
  emergency_dry_irrigation_days: number;
  species_mix: {
    species: string;
    stocking_ratio_pct: number;
    feed: string;
  }[];
  management_advisory: string;
}

export interface PollinationImpactTelemetry {
  farm_id: string;
  active_crop: string;
  hive_count: number;
  bee_species: string;
  projected_yield_increase_pct: number;
  estimated_additional_harvest_value_inr: number;
  annual_honey_production_kg: number;
  annual_honey_gross_revenue_inr: number;
  forage_calendar_status: string;
  synergy_summary: string;
}

export interface NutrientBioResourceBalance {
  farm_id: string;
  total_fym_produced_tons_year: number;
  total_poultry_manure_kg_year: number;
  biogas_slurry_litres_year: number;
  nitrogen_n_displaced_kg: number;
  phosphorus_p_displaced_kg: number;
  potassium_k_displaced_kg: number;
  synthetic_fertilizer_cost_saved_inr: number;
  soil_organic_carbon_gain_rate: string;
  circular_loops: {
    source: string;
    destination: string;
    benefit: string;
  }[];
}

export interface IntegratedFarmingOverview {
  farm_id: string;
  farm_name: string;
  livestock: LivestockItem[];
  ponds: FarmPondItem[];
  apiculture: ApicultureItem[];
  thi_status: CattleTHIStatus;
  rainwater_telemetry: RainwaterPondTelemetry;
  pollination_telemetry: PollinationImpactTelemetry;
  nutrient_balance: NutrientBioResourceBalance;
}

export async function fetchIntegratedFarmingOverview(
  farmId: string,
  token: string
): Promise<IntegratedFarmingOverview> {
  const response = await fetch(`${API_BASE_URL}/api/integrated-farming/${farmId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch IFS overview: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchCattleTHITelemetry(
  farmId: string,
  token: string
): Promise<CattleTHIStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/integrated-farming/${farmId}/thi-telemetry`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch cattle THI: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchRainwaterPondTelemetry(
  farmId: string,
  token: string
): Promise<RainwaterPondTelemetry> {
  const response = await fetch(
    `${API_BASE_URL}/api/integrated-farming/${farmId}/rainwater-pond`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch pond telemetry: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchPollinationImpactTelemetry(
  farmId: string,
  token: string
): Promise<PollinationImpactTelemetry> {
  const response = await fetch(
    `${API_BASE_URL}/api/integrated-farming/${farmId}/pollination-impact`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch pollination impact: HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchNutrientBioResourceBalance(
  farmId: string,
  token: string
): Promise<NutrientBioResourceBalance> {
  const response = await fetch(
    `${API_BASE_URL}/api/integrated-farming/${farmId}/nutrient-balance`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch nutrient balance: HTTP ${response.status}`);
  }
  return response.json();
}

export async function addLivestockProfile(
  farmId: string,
  data: {
    animal_type: string;
    breed_name: string;
    unit_count: number;
    daily_yield_metric?: string;
    daily_manure_kg_total?: number;
    biogas_linked?: boolean;
    notes?: string;
  },
  token: string
): Promise<LivestockItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/integrated-farming/${farmId}/livestock`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to add livestock: HTTP ${response.status}`);
  }
  return response.json();
}

export async function addFarmPondProfile(
  farmId: string,
  data: {
    pond_name?: string;
    surface_area_sqm: number;
    mean_depth_m?: number;
    primary_fish_species?: string;
    stocking_density_count?: number;
    water_source?: string;
  },
  token: string
): Promise<FarmPondItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/integrated-farming/${farmId}/pond`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to add farm pond: HTTP ${response.status}`);
  }
  return response.json();
}

export async function addApicultureProfile(
  farmId: string,
  data: {
    bee_species: string;
    hive_count: number;
    target_pollination_crops?: string[];
    medicinal_honey_market?: boolean;
  },
  token: string
): Promise<ApicultureItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/integrated-farming/${farmId}/apiculture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to add apiculture profile: HTTP ${response.status}`);
  }
  return response.json();
}
