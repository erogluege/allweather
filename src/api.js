let cachedArchiveData = null;

export const fetchCurrentAndHourly = async (lat, lon) => {
  try {
    // forecast_days=8 to get today + 7 days
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,wind_speed_10m_max,wind_direction_10m_dominant,weather_code&timezone=auto&forecast_days=8`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Forecast Error:", error);
    return null;
  }
};

export const fetchAndCacheArchive = async (lat, lon) => {
  if (cachedArchiveData) return cachedArchiveData;
  try {
    const currentYear = new Date().getFullYear();
    const startYear = 1950;
    const endYear = currentYear - 1;
    
    // We fetch one big block of history
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startYear}-01-01&end_date=${endYear}-12-31&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    cachedArchiveData = await res.json();
    return cachedArchiveData;
  } catch (err) {
    console.error("Archive Cache Error:", err);
    return null;
  }
}

export const getHistoricalForDay = async (lat, lon, dateObj) => {
  try {
    const data = await fetchAndCacheArchive(lat, lon);
    if (!data || !data.daily || !data.daily.time) return [];
    
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const results = [];
    const targetSubstring = `-${month}-${day}`;
    
    for (let i = 0; i < data.daily.time.length; i++) {
        const t = data.daily.time[i];
        if (t.endsWith(targetSubstring)) {
            const yearStr = t.split('-')[0];
            results.push({
                year: parseInt(yearStr, 10),
                targetDate: t,
                data: {
                    weather_code: [data.daily.weather_code[i]],
                    temperature_2m_max: [data.daily.temperature_2m_max[i]],
                    temperature_2m_min: [data.daily.temperature_2m_min[i]]
                }
            });
        }
    }
    
    return results.sort((a, b) => b.year - a.year);
  } catch (error) {
    console.error("Historical Parse Error:", error);
    return [];
  }
};

export const searchCity = async (query, lang = "en") => {
  if (!query) return [];
  try {
    const language = lang === 'tr' ? 'tr' : 'en';
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${language}&format=json`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Geocoding Error:", error);
    return [];
  }
};

export const getWeatherInfo = (code, lang = 'en') => {
  const isTr = lang === 'tr';
  const weatherMap = {
    0: { text: isTr ? "Açık" : "Clear", icon: "Sun", color: "#FFD700" },
    1: { text: isTr ? "Çoğunlukla Açık" : "Mostly Clear", icon: "Sun", color: "#FFD700" },
    2: { text: isTr ? "Parçalı Bulutlu" : "Partly Cloudy", icon: "CloudSun", color: "#F0E68C" },
    3: { text: isTr ? "Kapalı" : "Overcast", icon: "Cloud", color: "#B0C4DE" },
    45: { text: isTr ? "Sisli" : "Foggy", icon: "CloudFog", color: "#778899" },
    48: { text: isTr ? "Kırağılı Sis" : "Depositing Rime Fog", icon: "CloudFog", color: "#778899" },
    51: { text: isTr ? "Hafif Çisenti" : "Light Drizzle", icon: "CloudDrizzle", color: "#87CEFA" },
    53: { text: isTr ? "Orta Çisenti" : "Moderate Drizzle", icon: "CloudDrizzle", color: "#87CEFA" },
    55: { text: isTr ? "Yoğun Çisenti" : "Dense Drizzle", icon: "CloudDrizzle", color: "#87CEFA" },
    56: { text: isTr ? "Hafif Dondurucu Çisenti" : "Light Freezing Drizzle", icon: "CloudDrizzle", color: "#00BFFF" },
    57: { text: isTr ? "Yoğun Dondurucu Çisenti" : "Dense Freezing Drizzle", icon: "CloudDrizzle", color: "#00BFFF" },
    61: { text: isTr ? "Hafif Yağmur" : "Light Rain", icon: "CloudRain", color: "#4682B4" },
    63: { text: isTr ? "Orta Yağmur" : "Moderate Rain", icon: "CloudRain", color: "#4682B4" },
    65: { text: isTr ? "Şiddetli Yağmur" : "Heavy Rain", icon: "CloudRain", color: "#0000CD" },
    66: { text: isTr ? "Hafif Dondurucu Yağmur" : "Light Freezing Rain", icon: "CloudRain", color: "#00BFFF" },
    67: { text: isTr ? "Şiddetli Dondurucu Yağmur" : "Heavy Freezing Rain", icon: "CloudRain", color: "#00BFFF" },
    71: { text: isTr ? "Hafif Kar" : "Light Snow", icon: "CloudSnow", color: "#E0FFFF" },
    73: { text: isTr ? "Orta Kar" : "Moderate Snow", icon: "CloudSnow", color: "#E0FFFF" },
    75: { text: isTr ? "Yoğun Kar" : "Heavy Snow", icon: "CloudSnow", color: "#E0FFFF" },
    77: { text: isTr ? "Kar Taneleri" : "Snow Grains", icon: "CloudSnow", color: "#E0FFFF" },
    80: { text: isTr ? "Hafif Sağanak Yağmur" : "Light Rain Showers", icon: "CloudLightning", color: "#4682B4" },
    81: { text: isTr ? "Orta Sağanak Yağmur" : "Moderate Rain Showers", icon: "CloudLightning", color: "#4682B4" },
    82: { text: isTr ? "Şiddetli Sağanak Yağmur" : "Heavy Rain Showers", icon: "CloudLightning", color: "#0000CD" },
    85: { text: isTr ? "Hafif Kar Sağanağı" : "Light Snow Showers", icon: "CloudSnow", color: "#E0FFFF" },
    86: { text: isTr ? "Yoğun Kar Sağanağı" : "Heavy Snow Showers", icon: "CloudSnow", color: "#E0FFFF" },
    95: { text: isTr ? "Gökgürültülü Fırtına" : "Thunderstorm", icon: "CloudLightning", color: "#4B0082" },
    96: { text: isTr ? "Hafif Dolulu Fırtına" : "Thunderstorm w/ Hail", icon: "CloudLightning", color: "#4B0082" },
    99: { text: isTr ? "Şiddetli Dolulu Fırtına" : "Heavy Thunderstorm w/ Hail", icon: "CloudLightning", color: "#4B0082" }
  };

  return weatherMap[code] || { text: isTr ? "Bilinmiyor" : "Unknown", icon: "Cloud", color: "#B0C4DE" };
};
