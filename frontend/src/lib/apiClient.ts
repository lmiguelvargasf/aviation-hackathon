// For server-side (Docker internal network) and client-side (public URL)
const getApiBaseUrl = () => {
  // Server-side: use internal Docker network URL or env variable
  if (typeof window === "undefined") {
    return (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://backend:8000"
    );
  }
  // Client-side: use public URL
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface CreateUserRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export type RiskTier = "GO" | "CAUTION" | "NO-GO";

export interface RiskFactor {
  label: string;
  impact: number;
}

export interface RiskResult {
  score: number;
  tier: RiskTier;
  factors: RiskFactor[];
}

export interface AgentExplanation {
  explanation: string;
  recommendations: string[];
  telemetry_findings?: string[] | null;
}

export interface FlightEvaluation {
  risk: RiskResult;
  explanation: AgentExplanation;
}

export interface FlightContext {
  departure_icao: string;
  destination_icao: string;
  departure_time_utc: string;
  pilot_total_hours: number;
  pilot_hours_last_90_days: number;
  pilot_instrument_rating: boolean;
  pilot_night_current: boolean;
  aircraft_type: string;
  aircraft_mtow_kg: number;
  planned_takeoff_weight_kg: number;
  conditions_ifr_expected: boolean;
  conditions_night: boolean;
  terrain_mountainous: boolean;
  departure_visibility_sm: number;
  destination_visibility_sm: number;
  departure_ceiling_ft: number;
  destination_ceiling_ft: number;
  max_crosswind_knots: number;
  gusts_knots: number;
  freezing_level_ft: number | null;
  icing_risk_0_1: number;
  turbulence_risk_0_1: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData: unknown;

    try {
      errorData = await response.json();
      if (errorData && typeof errorData === "object" && "detail" in errorData) {
        errorMessage = String(errorData.detail);
      }
    } catch {
      // If response is not JSON, use the status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response.json();
}

export async function getUserById(userId: number): Promise<User> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/users/${userId}`);
  return handleResponse<User>(response);
}

export async function createUser(userData: CreateUserRequest): Promise<User> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  return handleResponse<User>(response);
}

export async function evaluateFlight(
  context: FlightContext,
): Promise<FlightEvaluation> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/should-you-fly/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(context),
  });
  return handleResponse<FlightEvaluation>(response);
}
