"""
US EPA Air Quality Index (AQI) Calculation Standards & Breakpoints
"""

# US EPA Standard Breakpoints: (Conc_low, Conc_high, I_low, I_high)
# Units: PM2.5 (ug/m3), PM10 (ug/m3), NO2 (ppb converted to ug/m3), O3 (ug/m3), SO2 (ug/m3), CO (mg/m3)

PM25_BREAKPOINTS = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 500.4, 301, 500)
]

PM10_BREAKPOINTS = [
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 604, 301, 500)
]

O3_BREAKPOINTS = [
    (0, 105, 0, 50),
    (106, 140, 51, 100),
    (141, 170, 101, 150),
    (171, 210, 151, 200),
    (211, 400, 201, 300),
    (401, 800, 301, 500)
]

NO2_BREAKPOINTS = [
    (0, 53, 0, 50),
    (54, 100, 51, 100),
    (101, 360, 101, 150),
    (361, 649, 151, 200),
    (650, 1249, 201, 300),
    (1250, 2049, 301, 500)
]

AQI_CATEGORIES = [
    (0, 50, "Good", "#10B981", "Air quality is satisfactory, and air pollution poses little or no risk."),
    (51, 100, "Moderate", "#FBBF24", "Air quality is acceptable; however, some pollutants may be a moderate health concern for a very small number of unusually sensitive people."),
    (101, 150, "Unhealthy for Sensitive Groups", "#F97316", "Members of sensitive groups may experience health effects. The general public is not likely to be affected."),
    (151, 200, "Unhealthy", "#EF4444", "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects."),
    (201, 300, "Very Unhealthy", "#8B5CF6", "Health alert: The risk of health effects is increased for everyone."),
    (301, 500, "Hazardous", "#7E22CE", "Health warning of emergency conditions: The entire population is more likely to be affected.")
]

def calculate_linear_sub_index(conc: float, breakpoints: list) -> int:
    if conc is None or conc < 0:
        return 0
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= conc <= c_high:
            return round(((i_high - i_low) / (c_high - c_low)) * (conc - c_low) + i_low)
    if conc > breakpoints[-1][1]:
        c_low, c_high, i_low, i_high = breakpoints[-1]
        return min(500, round(((i_high - i_low) / (c_high - c_low)) * (conc - c_low) + i_low))
    return 0

def get_aqi_details(aqi_value: float):
    val = max(0, min(500, round(aqi_value)))
    for low, high, cat, color, desc in AQI_CATEGORIES:
        if low <= val <= high:
            return {
                "aqi": val,
                "category": cat,
                "color": color,
                "description": desc
            }
    return {
        "aqi": val,
        "category": "Hazardous",
        "color": "#7E22CE",
        "description": "Health warning of emergency conditions."
    }
