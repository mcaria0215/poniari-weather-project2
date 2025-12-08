import { API_KEY, BASE_URL } from './config.js';

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
    };

    const weatherImages = {
      'Clouds': 'assets/image/clouds.png',
      'Clear': 'assets/image/clear.png',
      'Rain': 'assets/image/rain.png',
      'Drizzle': 'assets/image/drizzle.png',
      'Mist': 'assets/image/mist.png',
      'Snow': 'assets/image/snow.png',      
    };

    const setLoadingState = (isLoading) => {
      if (isLoading) {
        DOM.loadingSpinner.classList.remove('loading-spinner--hidden');
        DOM.weatherDisplay.style.display = 'none';
      } else {
        DOM.loadingSpinner.classList.add('loading-spinner--hidden');
        DOM.weatherDisplay.style.display = 'block'; 
      }
    }

    const checkWeather = async (city)=>{
      if (!city) {
        alert("도시 이름을 입력해주세요.");
        return;
      }

      DOM.searchBox.value = '';
      setLoadingState(true);

      try {
        const url = `${BASE_URL}${city}&appid=${API_KEY}`;
        const response = await fetch(url);        

        if (!response.ok) {
          if (response.status === 404) {
            alert("유효하지 않은 도시 이름입니다.");
          } else {
            throw new Error(`HTTP Error! Status: ${response.status}`);
          }

          setLoadingState(false);
          return;
        }

        const data = await response.json();
        updateUI(data);       
        setLoadingState(false);
        
      } catch (error) {
        console.error("날씨 데이터를 가져오는 중 오류가 발생했습니다:", error);
        setLoadingState(false);
      }
    }

    const updateUI = (data) => {      
      DOM.temp.innerHTML = `${Math.round(data.main.temp)}°C`;
      DOM.city.innerHTML = data.name;
      DOM.humidity.innerHTML = `${data.main.humidity}%`;
      DOM.wind.innerHTML = `${data.wind.speed} km/h`;

      const weatherCondition = data.weather[0].main;

      DOM.weatherIcon.src = weatherImages[weatherCondition] || 'assets/image/clear.png';
    }

    

    const init = () => {
      DOM.searchBtn.addEventListener('click', () => {
        checkWeather(DOM.searchBox.value);
        
      });
    
      DOM.searchBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          checkWeather(DOM.searchBox.value);          
        }
      });
    
      checkWeather('Seoul');
    };
    
    init();