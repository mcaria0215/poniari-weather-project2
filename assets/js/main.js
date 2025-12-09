import { API_KEY, GEO_BASE_URL } from './config.js';

const DOM = {
  searchBox: document.querySelector('.card__search-input'),
  searchBtn: document.querySelector('.card__search-button'),
  temp: document.querySelector('.weather-display__temp'),
  city: document.querySelector('.weather-display__city'),
  humidity: document.querySelector('.weather-display__humidity'),
  wind: document.querySelector('.weather-display__wind'),
  weatherIcon: document.querySelector('.weather-display__icon'),
  weatherDisplay: document.querySelector('.weather-display'), 
  loadingSpinner: document.querySelector('.loading-spinner'),

  forecastContainer: document.querySelector('.forecast__list-container .swiper-wrapper'),
};

const weatherImages = {
  'Clouds': 'assets/image/clouds.png',
  'Clear': 'assets/image/clear.png',
  'Rain': 'assets/image/rain.png',
  'Drizzle': 'assets/image/drizzle.png',
  'Mist': 'assets/image/mist.png',
  'Snow': 'assets/image/snow.png',      
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return { 
    dayName: dayNames[date.getDay()], 
    dateString: `${date.getMonth() + 1}/${date.getDate()}`
  };
};

const getWeatherIconPath = (iconCode) => {    
  if (iconCode.includes('01')) return weatherImages['Clear']; 
  if (iconCode.includes('09') || iconCode.includes('10')) return weatherImages['Rain'];
  if (iconCode.includes('03') || iconCode.includes('04')) return weatherImages['Clouds'];
  if (iconCode.includes('13')) return weatherImages['Snow'];
  if (iconCode.includes('50')) return weatherImages['Mist'];
  
  return weatherImages['Clear']; 
};

const setLoadingState = (isLoading) => {
  if (isLoading) {
    DOM.loadingSpinner.classList.remove('loading-spinner--hidden');
    DOM.weatherDisplay.style.display = 'none';

    if (DOM.forecastContainer) DOM.forecastContainer.innerHTML = '';
  } else {
    DOM.loadingSpinner.classList.add('loading-spinner--hidden');
    DOM.weatherDisplay.style.display = 'block'; 
  }
}

const fetchWeatherByCoords = async (lat, lon, isForecast = false) => {
  const endpoint = isForecast ? 'forecast' : 'weather';
  const url = `https://api.openweathermap.org/data/2.5/${endpoint}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API Error! Status: ${response.status}`);
  }
  return response.json();
}

const processDailyForecast = (forecastData) => {
  const dailyDataMap = new Map();

  forecastData.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    
    if (!dailyDataMap.has(date)) {
      dailyDataMap.set(date, {
        temps: [],
        icon: item.weather[0].icon,
        dt: item.dt
      });
    }
    
    const dayEntry = dailyDataMap.get(date);
    dayEntry.temps.push(item.main.temp_max, item.main.temp_min);
  });

  const dailyForecasts = [];
  let dayCount = 0; 
  
  for (const [date, data] of dailyDataMap.entries()) {
    if (dayCount === 0) {
      dayCount++;
      continue; 
    }

    if (dayCount > 5) break; 
    
    const maxTemp = Math.max(...data.temps);
    const minTemp = Math.min(...data.temps);

    dailyForecasts.push({
      date: data.dt,
      max: Math.round(maxTemp),
      min: Math.round(minTemp),
      icon: data.icon,
    });

    dayCount++;
  }
  return dailyForecasts;
};

const renderForecast = (dailyForecasts) => {
  if (!DOM.forecastContainer) return;    
    
  DOM.forecastContainer.innerHTML = ''; 

  dailyForecasts.forEach(day => {
    const dateInfo = formatTimestamp(day.date);
    const iconPath = getWeatherIconPath(day.icon);

    const forecastCardHTML = `       
      <div class="forecast__item swiper-slide">
        <p class="forecast__day">${dateInfo.dayName}</p>
        <p class="forecast__date">${dateInfo.dateString}</p>
        <img class="forecast__icon" src="${iconPath}" alt="${dateInfo.dayName} 날씨">
        <div class="forecast__temp-group">
          <span class="forecast__temp--max">${day.max}°</span>
          <span class="forecast__temp--min"> / ${day.min}°</span>
        </div>
      </div>
    `;
    
    DOM.forecastContainer.insertAdjacentHTML('beforeend', forecastCardHTML);
  });
};

let forecastSwiper = null;

const initSwiper = () => {
  if (forecastSwiper) {      
    forecastSwiper.update(); 
    return;
  }

  forecastSwiper = new Swiper('.forecast__list-container', {    
    slidesPerView: 3.2,
    spaceBetween: 10,
    freeMode: true,
    observer: true, 
    observeParents: true,
  });
}

const fetchAndRenderAllWeather = async (city)=>{
  if (!city) {
    alert("도시 이름을 입력해주세요.");
    return;
  }
  DOM.searchBox.value = '';
  setLoadingState(true);
    
  try {
    const geoUrl = `${GEO_BASE_URL}&q=${city}&appid=${API_KEY}`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (geoData.length === 0) {        
      alert(`"${city}"에 해당하는 도시를 찾을 수 없습니다.`);
      setLoadingState(false);
      return;
    }

    const { lat, lon, name } = geoData[0];
    const currentData = await fetchWeatherByCoords(lat, lon, false);

    currentData.name = name; 
    updateCurrentWeatherUI(currentData);

    const forecastData = await fetchWeatherByCoords(lat, lon, true);

    const dailyForecasts = processDailyForecast(forecastData);
    renderForecast(dailyForecasts);
    initSwiper();

    setLoadingState(false);
    
  } catch (error) {
    if (error.message.includes('Weather API Error')) {        
        alert("날씨 정보를 가져오는 중 서버 오류가 발생했습니다.");
    } else {
        console.error("날씨 데이터를 가져오는 중 오류가 발생했습니다:", error);
    }
    setLoadingState(false);
  }
}

const updateCurrentWeatherUI = (data) => {      
  DOM.temp.innerHTML = `${Math.round(data.main.temp)}°C`;
  DOM.city.innerHTML = data.name;
  DOM.humidity.innerHTML = `${data.main.humidity}%`;
  DOM.wind.innerHTML = `${data.wind.speed} km/h`;

  const weatherCondition = data.weather[0].main;

  DOM.weatherIcon.src = weatherImages[weatherCondition] || 'assets/image/clear.png';
}

const init = () => {
  DOM.searchBtn.addEventListener('click', () => {
    fetchAndRenderAllWeather(DOM.searchBox.value);
  });

  DOM.searchBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      fetchAndRenderAllWeather(DOM.searchBox.value);          
    }
  });

 fetchAndRenderAllWeather('Seoul');
};

init();