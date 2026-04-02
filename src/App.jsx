import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, CalendarClock, Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, ChevronDown, ChevronUp, Info, Wind, Sunrise, Sunset, Moon, Navigation, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { searchCity, fetchCurrentAndHourly, getHistoricalForDay, getWeatherInfo } from './api';
import './App.css';

const IconMap = { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning };

function WeatherIcon({ iconName, size = 24, color = "white", ...props }) {
  const IconComponent = IconMap[iconName] || Cloud;
  return <IconComponent size={size} color={color} {...props} />;
}

// Translations
const i18n = {
  tr: {
    searchPlaceholder: "Şehir veya havaalanı ara...",
    loading: "Veriler yükleniyor...",
    now: "Şimdi",
    nextDay: "Ertesi Gün",
    hourly: "SAATLİK TAHMİN",
    dailyDesc: "GÜNLÜK TAHMİN",
    wind: "RÜZGAR",
    sunrise: "GÜN DOĞUMU",
    moon: "AY DURUMU",
    windDir: "Yön:",
    sunset: "Gün Batımı:",
    moonPhaseLabel: "Mevcut Ay Evresi",
    historyTitle: "GEÇMİŞ YILLARDA BUGÜN",
    historyDesc: "Tarih boyunca bugün hava nasıldı? 1950'ye kadar ulaşılabilen veriler sergilenir.",
    historyLoading: "Geçmiş analiz ediliyor...",
    historyEmpty: "Geçmiş veri bulunamadı.",
    loadMore: "Daha Fazla Göster",
    clickHint: "geçmiş yıllar...",
    open: "Aç",
    close: "Kapat",
    high: "Y:",
    low: "D:",
    windDirs: ["K", "KKD", "KD", "DKD", "D", "DGD", "GD", "GGD", "G", "GGB", "GB", "BGB", "B", "KKB", "KB", "KKB"],
    moonPhases: ["Yeni Ay", "İlk Hilal", "İlk Dördün", "Şişkin Ay", "Dolunay", "Küçülen Şişkin", "Son Dördün", "Son Hilal"],
    moonIcons: ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"]
  },
  en: {
    searchPlaceholder: "Search city or airport...",
    loading: "Loading data...",
    now: "Now",
    nextDay: "Next Day",
    hourly: "HOURLY FORECAST",
    dailyDesc: "7-DAY FORECAST",
    wind: "WIND",
    sunrise: "SUNRISE",
    moon: "MOON PHASE",
    windDir: "Dir:",
    sunset: "Sunset:",
    moonPhaseLabel: "Current Moon Phase",
    historyTitle: "ON THIS DAY IN HISTORY",
    historyDesc: "Historical weather for this exact date back to 1950.",
    historyLoading: "Analyzing history...",
    historyEmpty: "No historical data found.",
    loadMore: "Show More",
    clickHint: "historical data...",
    open: "Open",
    close: "Close",
    high: "H:",
    low: "L:",
    windDirs: ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"],
    moonPhases: ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"],
    moonIcons: ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"]
  }
};

function getWindDirectionStr(deg, lang) {
  if (deg === null || deg === undefined) return "";
  const val = Math.floor((deg / 22.5) + 0.5);
  return i18n[lang].windDirs[(val % 16)];
}

function getMoonPhaseStr(date, lang) {
  const epoch_2000 = new Date("2000-01-06T18:14:00Z").getTime();
  const current = date.getTime();
  const days = (current - epoch_2000) / 86400000;
  const lunations = days / 29.53058867;
  const phase = lunations - Math.floor(lunations);

  const m = i18n[lang].moonPhases;
  const icons = i18n[lang].moonIcons;
  
  let idx = 0;
  if (phase < 0.03 || phase > 0.97) idx = 0;
  else if (phase < 0.22) idx = 1;
  else if (phase < 0.28) idx = 2;
  else if (phase < 0.47) idx = 3;
  else if (phase < 0.53) idx = 4;
  else if (phase < 0.72) idx = 5;
  else if (phase < 0.78) idx = 6;
  else idx = 7;

  return { text: m[idx], icon: icons[idx] };
}

function App() {
  // System Language Detection
  const sysLang = navigator.language.startsWith('tr') ? 'tr' : 'en';
  const t = i18n[sysLang];
  const dateLocale = sysLang === 'tr' ? tr : enUS;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [location, setLocation] = useState({ name: 'İstanbul', lat: 41.0138, lon: 28.9497 });
  const [currentData, setCurrentData] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [dailyDetails, setDailyDetails] = useState(null);
  
  const [loading, setLoading] = useState(false);
  
  // Sticky Header State
  const [scrolled, setScrolled] = useState(false);

  // Weekly Accordion State
  const [openDayHistory, setOpenDayHistory] = useState(null); // stores date string like '2025-04-02'
  const [dayHistoryData, setDayHistoryData] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(15);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadWeatherCore = useCallback(async (lat, lon) => {
    setLoading(true);
    setOpenDayHistory(null);
    try {
      const forecast = await fetchCurrentAndHourly(lat, lon);
      if (forecast) {
        setCurrentData({
          temp: forecast.current.temperature_2m,
          code: forecast.current.weather_code,
          high: forecast.daily.temperature_2m_max[0],
          low: forecast.daily.temperature_2m_min[0]
        });
        
        setDailyDetails({
          windSpeed: forecast.current.wind_speed_10m || forecast.daily.wind_speed_10m_max[0],
          windDir: forecast.current.wind_direction_10m || forecast.daily.wind_direction_10m_dominant[0],
          sunrise: forecast.daily.sunrise[0],
          sunset: forecast.daily.sunset[0],
          moonPhase: getMoonPhaseStr(new Date(), sysLang)
        });
        
        const nowIdx = forecast.hourly.time.findIndex(timeStr => new Date(timeStr) >= new Date());
        const idx = nowIdx === -1 ? 0 : nowIdx;
        const next24 = forecast.hourly.time.slice(idx, idx + 24).map((timeStr, i) => ({
          time: new Date(timeStr),
          temp: forecast.hourly.temperature_2m[idx + i],
          code: forecast.hourly.weather_code[idx + i]
        }));
        setHourlyData(next24);

        // Daily (weekly) forecast compilation
        const next7Days = forecast.daily.time.slice(0, 8).map((timeStr, i) => ({
           dateStr: timeStr,
           dateObj: new Date(timeStr),
           min: forecast.daily.temperature_2m_min[i],
           max: forecast.daily.temperature_2m_max[i],
           code: forecast.daily.weather_code[i]
        }));
        setWeeklyData(next7Days);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sysLang]);

  useEffect(() => {
    loadWeatherCore(location.lat, location.lon);
  }, [location, loadWeatherCore]);

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const res = await searchCity(searchQuery, sysLang);
        setSearchResults(res);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, sysLang]);

  const handleSelectCity = (city) => {
    setLocation({ name: city.name, lat: city.latitude, lon: city.longitude });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleToggleHistory = async (dateStr, dateObj) => {
      if (openDayHistory === dateStr) {
          setOpenDayHistory(null); // close if clicking the same day
          return;
      }
      setOpenDayHistory(dateStr);
      setHistoryLimit(10); // reset limit back to initial 10
      
      if (!dayHistoryData[dateStr]) {
          setHistoryLoading(true);
          const history = await getHistoricalForDay(location.lat, location.lon, dateObj);
          setDayHistoryData(prev => ({ ...prev, [dateStr]: history }));
          setHistoryLoading(false);
      }
  };

  const formatDateLabel = (dateObj, isToday) => {
    if (isToday) return sysLang === 'tr' ? 'Bugün' : 'Today';
    return format(dateObj, 'EEEE', { locale: dateLocale });
  };

  return (
    <>
      {/* Sticky Top Header */}
      {currentData && (
        <div className={`sticky-header ${scrolled ? 'visible' : ''}`}>
          <div className="text-xl font-medium">{location.name}</div>
          <div className="text-sm font-light flex-row items-center gap-2">
             <span>{Math.round(currentData.temp)}°</span>
             <span style={{opacity: 0.6}}>|</span>
             <span>{getWeatherInfo(currentData.code, sysLang).text}</span>
          </div>
        </div>
      )}

      <div className="app-container">
        {/* Search */}
        <div className="flex-col" style={{ position: 'relative', zIndex: 50 }}>
          <div className="flex-row items-center glass-panel" style={{ padding: '8px 16px', borderRadius: '12px', gap: '8px' }}>
            <Search size={20} color="rgba(255,255,255,0.6)" />
            <input 
              type="text" 
              className="w-full" 
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px', outline: 'none' }}
              placeholder={t.searchPlaceholder} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', padding: '8px 0', zIndex: 100 }}>
              {searchResults.map((city, idx) => (
                <div 
                  key={idx} 
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  onClick={() => handleSelectCity(city)}
                >
                  <div className="font-medium text-sm">{city.name}</div>
                  <div className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.7)' }}>{city.admin1}, {city.country}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader2 size={48} className="animate-spin" color="white" />
            <div className="mt-4 font-light">{t.loading}</div>
          </div>
        ) : (
          <>
            {/* Main Current Weather Display - Fades out slightly when scrolled */}
            {currentData && (
              <div className="current-weather" style={{ opacity: scrolled ? 0.2 : 1, transform: `scale(${scrolled ? 0.9 : 1})` }}>
                <div className="location-name">{location.name}</div>
                <div className="current-temp">{Math.round(currentData.temp)}°</div>
                <div className="current-condition">{getWeatherInfo(currentData.code, sysLang).text}</div>
                <div className="high-low">
                  {t.high} {Math.round(currentData.high)}° &nbsp; {t.low} {Math.round(currentData.low)}°
                </div>
              </div>
            )}

            {/* Hourly Forecast */}
            <div className="glass-panel flex-col mt-4 pt-4 relative z-10">
              <div className="section-title">
                <CalendarClock size={16} /> {t.hourly}
              </div>
              <div className="scroll-container flex-row items-center" style={{ gap: '16px', paddingBottom: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                {hourlyData.map((hour, idx) => {
                  const info = getWeatherInfo(hour.code, sysLang);
                  const isMidnight = hour.time.getHours() === 0;
                  
                  return (
                    <div key={idx} className="flex-row items-center">
                      {isMidnight && idx > 0 && (
                         <div className="flex-col items-center justify-center mr-4 ml-2" style={{ borderLeft: '1px dashed rgba(255,255,255,0.3)', paddingLeft: '12px' }}>
                            <span className="text-xs font-semibold mb-1" style={{ color: '#FFD700' }}>{t.nextDay}</span>
                         </div>
                      )}
                      <div className="hourly-item">
                        <div className="hourly-time text-xs">{idx === 0 ? t.now : format(hour.time, 'HH:mm')}</div>
                        <WeatherIcon iconName={info.icon} color={info.color} size={28} />
                        <div className="hourly-temp">{Math.round(hour.temp)}°</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Forecast with Embedded Historical Accordion */}
            {weeklyData.length > 0 && (
               <div className="glass-panel flex-col mt-4 relative z-10">
                 <div className="section-title">
                    <CalendarDays size={16} /> {t.dailyDesc}
                 </div>
                 
                 <div className="flex-col" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                   {weeklyData.map((day, idx) => {
                     const isToday = idx === 0;
                     const info = getWeatherInfo(day.code, sysLang);
                     const isOpen = openDayHistory === day.dateStr;
                     const historyObj = dayHistoryData[day.dateStr] || [];

                     return (
                        <div key={idx} className="flex-col" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                           <div 
                              className="flex-row items-center justify-between cursor-pointer" 
                              style={{ padding: '12px 0' }}
                              onClick={() => handleToggleHistory(day.dateStr, day.dateObj)}
                           >
                              <div className="font-medium" style={{ width: '100px', display: 'flex', flexDirection: 'column' }}>
                                 <span>{formatDateLabel(day.dateObj, isToday)}</span>
                                 <span style={{ fontSize: '10px', opacity: 0.5, marginTop: '2px', fontWeight: 300 }}>{t.clickHint}</span>
                              </div>
                              <div className="flex-row items-center gap-4">
                                 <WeatherIcon iconName={info.icon} color={info.color} size={24} />
                                 <div className="flex-row gap-2 items-center text-sm" style={{ width: '80px', justifyContent: 'flex-end' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(day.min)}°</span>
                                    <div style={{ width: '30px', height: '4px', background: 'linear-gradient(90deg, #A0C4FF 0%, #FFADAD 100%)', borderRadius: '4px' }}></div>
                                    <span>{Math.round(day.max)}°</span>
                                 </div>
                              </div>
                           </div>

                           {/* Historical Expanded View for this specific day */}
                           {isOpen && (
                              <div className="animate-fade-in p-2 mb-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <div className="text-xs font-light mb-3 text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                   {format(day.dateObj, 'd MMMM', { locale: dateLocale })} - {t.historyDesc}
                                </div>
                                {historyLoading && (!historyObj || historyObj.length === 0) ? (
                                  <div className="flex-col items-center py-4">
                                    <Loader2 size={24} className="animate-spin mb-2"/>
                                  </div>
                                ) : (
                                  <div className="flex-col">
                                    {historyObj.length === 0 && (
                                       <div className="text-center text-xs opacity-60 pb-2">{t.historyEmpty}</div>
                                    )}
                                    {historyObj.slice(0, historyLimit).map((yearData, yIdx) => {
                                      if (!yearData.data) return null;
                                      const yInfo = getWeatherInfo(yearData.data.weather_code[0], sysLang);
                                      return (
                                        <div key={yIdx} className="history-card" style={{ padding: '6px 8px' }}>
                                          <div className="flex-row items-center gap-3">
                                            <div className="font-semibold text-xs" style={{ width: '36px' }}>{yearData.year}</div>
                                            <div className="flex-row items-center gap-2" style={{ width: '90px' }}>
                                              <WeatherIcon iconName={yInfo.icon} color={yInfo.color} size={18} />
                                              <span className="text-xs font-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>{yInfo.text}</span>
                                            </div>
                                          </div>
                                          <div className="flex-row items-center gap-2 text-xs font-medium">
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(yearData.data.temperature_2m_min[0])}°</span>
                                            <div style={{ width: '20px', height: '3px', background: 'linear-gradient(90deg, #A0C4FF 0%, #FFADAD 100%)', borderRadius: '4px' }}></div>
                                            <span>{Math.round(yearData.data.temperature_2m_max[0])}°</span>
                                            <div title="Data: Open-Meteo Archive API" style={{ cursor: 'help', marginLeft: '4px', display: 'flex', alignItems: 'center' }}>
                                               <Info size={12} color="#8A9A5B" />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {historyObj.length > historyLimit && (
                                      <div 
                                        className="text-center text-xs font-medium" 
                                        style={{ marginTop: '12px', padding: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}
                                        onClick={(e) => { e.stopPropagation(); setHistoryLimit(prev => prev + 20); }}
                                      >
                                        {t.loadMore}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                           )}
                        </div>
                     );
                   })}
                 </div>
               </div>
            )}
            
            {/* Daily Details Grid */}
            {dailyDetails && (
              <div className="flex-row mt-4 mb-8" style={{ gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
                <div className="glass-panel flex-col" style={{ flex: '1 1 40%' }}>
                  <div className="section-title"><Wind size={14}/> {t.wind}</div>
                  <div className="text-xl font-medium mt-1 flex-row items-center gap-2">
                    {dailyDetails.windSpeed} km/s
                    <Navigation size={18} style={{ transform: `rotate(${dailyDetails.windDir}deg)`, marginLeft: '4px', opacity: 0.8 }} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.windDir} {getWindDirectionStr(dailyDetails.windDir, sysLang)}</div>
                </div>
                
                <div className="glass-panel flex-col" style={{ flex: '1 1 40%' }}>
                  <div className="section-title"><Sunrise size={14}/> {t.sunrise}</div>
                  <div className="text-xl font-medium mt-1">{format(new Date(dailyDetails.sunrise), 'HH:mm')}</div>
                  <div className="text-xs mt-1 flex-row items-center gap-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                     {t.sunset} <Sunset size={12} /> {format(new Date(dailyDetails.sunset), 'HH:mm')}
                  </div>
                </div>

                <div className="glass-panel flex-col" style={{ flex: '1 1 100%' }}>
                  <div className="section-title"><Moon size={14}/> {t.moon}</div>
                  <div className="text-xl font-medium mt-1 flex-row items-center gap-2">
                     <span style={{ fontSize: '28px' }}>{dailyDetails.moonPhase.icon}</span>
                     {dailyDetails.moonPhase.text}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.moonPhaseLabel}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;
