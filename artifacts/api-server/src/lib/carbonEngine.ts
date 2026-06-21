// Carbon footprint calculation engine using published emission factors
// Sources:
//   - IPCC 2014 AR5 (car emission factors)
//   - IEA World Energy Outlook 2023 (grid intensity by region)
//   - Poore & Nemecek 2018, Science (diet lifecycle values)
//   - ICAO Carbon Emissions Calculator methodology (flights)
//   - UK DEFRA 2023 (spend-based shopping factors)

export interface EnergySourceMix {
  coal: number;
  gas: number;
  renewables: number;
}

export interface CarbonInputData {
  weeklyKmDriven: number;
  carType: "petrol" | "diesel" | "ev" | "none";
  monthlyKwh: number;
  energySourceMix: EnergySourceMix;
  dietType: "vegan" | "vegetarian" | "omnivore" | "heavy_meat";
  flightsPerYear: number;
  flightType: "short" | "long" | "mixed";
  monthlyShoppingSpend: number;
  region: string;
}

export interface EmissionBreakdown {
  transportation: number;
  electricity: number;
  food: number;
  shopping: number;
  total: number;
}

export interface CarbonResultData {
  totalAnnualKgCo2: number;
  breakdown: EmissionBreakdown;
  percentileVsGlobal: number;
  carbonScore: number;
}

// IPCC AR5 WG3 Table A.III.2 — g CO2e per km by fuel type
const CAR_EMISSION_FACTORS: Record<string, number> = {
  petrol: 192, // g CO2e/km (avg petrol car lifecycle)
  diesel: 171, // g CO2e/km (avg diesel car lifecycle)
  ev: 53,      // g CO2e/km (EU avg grid mix, lifecycle incl. battery)
  none: 0,
};

// IEA 2023 grid emission intensity by region (g CO2/kWh)
const GRID_INTENSITY: Record<string, number> = {
  uk: 233,
  eu: 275,
  us: 386,
  china: 555,
  india: 708,
  australia: 510,
  global: 436,
  default: 436,
};

// Poore & Nemecek 2018, Science — kg CO2e per person per year
const DIET_EMISSION_KG_YEAR: Record<string, number> = {
  vegan: 1500,
  vegetarian: 1700,
  omnivore: 2500,
  heavy_meat: 3300,
};

// ICAO methodology — kg CO2e per flight (radiative forcing included)
const FLIGHT_EMISSION_KG: Record<string, number> = {
  short: 255,  // <3hrs, economy class, incl. radiative forcing multiplier 1.9x
  long: 1620,  // >6hrs, economy class, incl. radiative forcing multiplier 1.9x
  mixed: 750,
};

// UK DEFRA 2023 — kg CO2e per GBP spent on non-food retail
const SHOPPING_EMISSION_FACTOR = 0.43; // kg CO2e per £ spent

// Global average annual carbon footprint: ~4,700 kg CO2e (World Bank 2023)
const GLOBAL_AVG_ANNUAL_KG = 4700;

export function calculateCarbonFootprint(inputs: CarbonInputData): CarbonResultData {
  // Transportation: car + flights
  // Car: weekly km * 52 weeks * emission factor (g/km) / 1000 = kg/year
  const carEmissionKg =
    inputs.carType === "none"
      ? 0
      : (inputs.weeklyKmDriven * 52 * (CAR_EMISSION_FACTORS[inputs.carType] ?? 192)) / 1000;

  const flightEmissionKg =
    inputs.flightsPerYear * (FLIGHT_EMISSION_KG[inputs.flightType] ?? 750);

  const transportationKg = carEmissionKg + flightEmissionKg;

  // Electricity: monthly kWh * 12 * effective grid intensity
  // Effective intensity = weighted average based on user's energy mix
  const effectiveGridIntensity =
    (inputs.energySourceMix.coal / 100) * 820 +  // IPCC median coal: 820 g CO2/kWh
    (inputs.energySourceMix.gas / 100) * 490 +   // IPCC median gas: 490 g CO2/kWh
    (inputs.energySourceMix.renewables / 100) * 11; // IPCC median solar/wind: 11 g CO2/kWh

  const electricityKg = (inputs.monthlyKwh * 12 * effectiveGridIntensity) / 1000;

  // Food: Poore & Nemecek 2018 annual lifecycle values by diet type
  const foodKg = DIET_EMISSION_KG_YEAR[inputs.dietType] ?? 2500;

  // Shopping: DEFRA spend-based (monthly spend * 12 months * factor)
  const shoppingKg = inputs.monthlyShoppingSpend * 12 * SHOPPING_EMISSION_FACTOR;

  const total = transportationKg + electricityKg + foodKg + shoppingKg;

  // Percentile vs global average (lower emissions = lower percentile = better)
  // Using a simple linear approximation anchored at the global mean
  // 0% = 0 kg, 50% = global avg (4700 kg), 100% = 2x global avg (9400 kg)
  const percentileVsGlobal = Math.min(100, Math.round((total / (GLOBAL_AVG_ANNUAL_KG * 2)) * 100));

  // Carbon score 0-100: higher is better
  // Score = 100 - percentile clamped to [0, 100]
  const carbonScore = Math.max(0, Math.min(100, 100 - percentileVsGlobal));

  return {
    totalAnnualKgCo2: Math.round(total * 10) / 10,
    breakdown: {
      transportation: Math.round(transportationKg * 10) / 10,
      electricity: Math.round(electricityKg * 10) / 10,
      food: Math.round(foodKg * 10) / 10,
      shopping: Math.round(shoppingKg * 10) / 10,
      total: Math.round(total * 10) / 10,
    },
    percentileVsGlobal,
    carbonScore,
  };
}

export function simulateScenario(
  currentInputs: CarbonInputData,
  scenario: {
    publicTransportAdoptionPct: number;
    renewableEnergyPct: number;
    dietShift: "none" | "vegetarian" | "vegan";
    flightReductionPct: number;
  }
): {
  currentResult: CarbonResultData;
  projectedResult: CarbonResultData;
} {
  const currentResult = calculateCarbonFootprint(currentInputs);

  // Build modified inputs for simulation
  const modifiedInputs: CarbonInputData = { ...currentInputs };

  // Public transport adoption: reduce car km proportionally
  if (scenario.publicTransportAdoptionPct > 0) {
    modifiedInputs.weeklyKmDriven =
      currentInputs.weeklyKmDriven * (1 - scenario.publicTransportAdoptionPct / 100);
  }

  // Renewable energy: increase renewables share, reduce coal/gas proportionally
  if (scenario.renewableEnergyPct > 0) {
    const currentNonRenewable = currentInputs.energySourceMix.coal + currentInputs.energySourceMix.gas;
    const newRenewables = Math.min(100, scenario.renewableEnergyPct);
    const remainingNonRenewable = Math.max(0, 100 - newRenewables);
    const coalRatio = currentNonRenewable > 0
      ? currentInputs.energySourceMix.coal / currentNonRenewable
      : 0.5;
    modifiedInputs.energySourceMix = {
      coal: Math.round(remainingNonRenewable * coalRatio),
      gas: Math.round(remainingNonRenewable * (1 - coalRatio)),
      renewables: newRenewables,
    };
  }

  // Diet shift
  if (scenario.dietShift !== "none") {
    const dietOrder = ["heavy_meat", "omnivore", "vegetarian", "vegan"];
    const currentIdx = dietOrder.indexOf(currentInputs.dietType);
    const targetIdx = dietOrder.indexOf(scenario.dietShift);
    if (targetIdx > currentIdx) {
      modifiedInputs.dietType = scenario.dietShift;
    }
  }

  // Flight reduction
  if (scenario.flightReductionPct > 0) {
    modifiedInputs.flightsPerYear = Math.round(
      currentInputs.flightsPerYear * (1 - scenario.flightReductionPct / 100)
    );
  }

  const projectedResult = calculateCarbonFootprint(modifiedInputs);

  return { currentResult, projectedResult };
}

export function generateRecommendations(inputs: CarbonInputData, result: CarbonResultData) {
  const recs: Array<{
    id: string;
    action: string;
    description: string;
    estimatedKgCo2Reduction: number;
    costImpact: number;
    costDirection: "save" | "cost";
    difficulty: "easy" | "medium" | "hard";
    category: "transportation" | "electricity" | "food" | "shopping" | "other";
    priority: number;
  }> = [];

  // Transportation recommendations
  if (inputs.carType === "petrol" || inputs.carType === "diesel") {
    const evSaving = (inputs.weeklyKmDriven * 52 * (CAR_EMISSION_FACTORS[inputs.carType]! - CAR_EMISSION_FACTORS.ev)) / 1000;
    recs.push({
      id: "switch-to-ev",
      action: "Switch to an electric vehicle",
      description: `Replacing your ${inputs.carType} car with an EV would save approximately ${Math.round(evSaving)} kg CO₂ annually based on your driving habits.`,
      estimatedKgCo2Reduction: Math.round(evSaving),
      costImpact: 800,
      costDirection: "save",
      difficulty: "hard",
      category: "transportation",
      priority: 1,
    });

    const ptSaving = (inputs.weeklyKmDriven * 0.4 * 52 * CAR_EMISSION_FACTORS[inputs.carType]!) / 1000;
    recs.push({
      id: "use-public-transport",
      action: "Use public transport 40% of the time",
      description: "Shifting 40% of your car journeys to bus or rail cuts emissions significantly while saving on fuel and parking.",
      estimatedKgCo2Reduction: Math.round(ptSaving),
      costImpact: 1200,
      costDirection: "save",
      difficulty: "medium",
      category: "transportation",
      priority: 2,
    });
  }

  if (inputs.flightsPerYear > 2) {
    const flightSaving = Math.round(inputs.flightsPerYear * 0.5 * FLIGHT_EMISSION_KG[inputs.flightType]!);
    recs.push({
      id: "reduce-flights",
      action: "Reduce flights by 50%",
      description: "Aviation is one of the most carbon-intensive activities. Halving your flights would save significant emissions, equivalent to several months of other activity.",
      estimatedKgCo2Reduction: flightSaving,
      costImpact: 600,
      costDirection: "save",
      difficulty: "medium",
      category: "transportation",
      priority: 3,
    });
  }

  // Electricity recommendations
  if (inputs.energySourceMix.renewables < 50) {
    const renewableSaving = Math.round(
      (inputs.monthlyKwh * 12 * (effectiveIntensity(inputs.energySourceMix) - 50)) / 1000
    );
    recs.push({
      id: "switch-green-tariff",
      action: "Switch to a 100% renewable energy tariff",
      description: "Switching to a green energy supplier is one of the easiest high-impact changes. Many tariffs cost the same or less than standard plans.",
      estimatedKgCo2Reduction: Math.max(0, renewableSaving),
      costImpact: 50,
      costDirection: "save",
      difficulty: "easy",
      category: "electricity",
      priority: 4,
    });
  }

  // Food recommendations
  if (inputs.dietType === "heavy_meat" || inputs.dietType === "omnivore") {
    const vegSaving = DIET_EMISSION_KG_YEAR[inputs.dietType]! - DIET_EMISSION_KG_YEAR.vegetarian!;
    recs.push({
      id: "reduce-meat",
      action: "Adopt a vegetarian diet",
      description: "Animal products — especially beef and lamb — are among the highest-emission foods. A vegetarian diet reduces food emissions by up to 50%.",
      estimatedKgCo2Reduction: Math.round(vegSaving),
      costImpact: 800,
      costDirection: "save",
      difficulty: "medium",
      category: "food",
      priority: 5,
    });
  }

  // Shopping recommendations
  if (inputs.monthlyShoppingSpend > 200) {
    const shoppingSaving = Math.round(inputs.monthlyShoppingSpend * 0.3 * 12 * SHOPPING_EMISSION_FACTOR);
    recs.push({
      id: "reduce-shopping",
      action: "Buy 30% less new clothing and electronics",
      description: "Choosing second-hand items, repairing goods, and buying less overall significantly reduces manufacturing emissions.",
      estimatedKgCo2Reduction: shoppingSaving,
      costImpact: Math.round(inputs.monthlyShoppingSpend * 0.3 * 12),
      costDirection: "save",
      difficulty: "easy",
      category: "shopping",
      priority: 6,
    });
  }

  // Always include an easy win
  recs.push({
    id: "home-energy-audit",
    action: "Conduct a home energy audit and improve insulation",
    description: "Improving home insulation and draught-proofing can cut heating energy by 25%, reducing both bills and emissions year-round.",
    estimatedKgCo2Reduction: Math.round(inputs.monthlyKwh * 0.25 * 12 * effectiveIntensity(inputs.energySourceMix) / 1000),
    costImpact: 300,
    costDirection: "save",
    difficulty: "medium",
    category: "electricity",
    priority: 7,
  });

  return recs
    .sort((a, b) => b.estimatedKgCo2Reduction - a.estimatedKgCo2Reduction)
    .slice(0, 5)
    .map((r, i) => ({ ...r, priority: i + 1 }));
}

function effectiveIntensity(mix: EnergySourceMix): number {
  return (mix.coal / 100) * 820 + (mix.gas / 100) * 490 + (mix.renewables / 100) * 11;
}
