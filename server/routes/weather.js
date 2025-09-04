const express = require('express');
const router = express.Router();
const axios = require('axios');

// @route   GET /api/weather/current
// @desc    Lấy nhiệt độ hiện tại của Đông Hà, Quảng Trị
// @access  Public
router.get('/current', async (req, res) => {
  try {
    // Sử dụng OpenWeatherMap API để lấy thông tin thời tiết
    // Đông Hà, Quảng Trị coordinates: 16.8167, 107.1000
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: 16.8167,
        lon: 107.1000,
        appid: process.env.OPENWEATHER_API_KEY || 'demo_key', // Cần thêm API key vào .env
        units: 'metric', // Nhiệt độ theo Celsius
        lang: 'vi' // Ngôn ngữ tiếng Việt
      },
      timeout: 5000
    });

    const weatherData = response.data;
    
    res.json({
      success: true,
      data: {
        temperature: weatherData.main.temp,
        feels_like: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        description: weatherData.weather[0].description,
        city: weatherData.name,
        country: weatherData.sys.country,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin thời tiết:', error);
    
    // Fallback: Trả về nhiệt độ mặc định nếu không thể lấy được từ API
    res.json({
      success: true,
      data: {
        temperature: 25.0, // Nhiệt độ mặc định
        feels_like: 25.0,
        humidity: 70,
        description: 'Nhiệt độ mặc định',
        city: 'Đông Hà',
        country: 'VN',
        timestamp: new Date().toISOString(),
        note: 'Không thể kết nối API thời tiết, sử dụng nhiệt độ mặc định'
      }
    });
  }
});

// @route   GET /api/weather/forecast
// @desc    Lấy dự báo thời tiết 5 ngày của Đông Hà, Quảng Trị
// @access  Public
router.get('/forecast', async (req, res) => {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat: 16.8167,
        lon: 107.1000,
        appid: process.env.OPENWEATHER_API_KEY || 'demo_key',
        units: 'metric',
        lang: 'vi'
      },
      timeout: 5000
    });

    const forecastData = response.data;
    
    // Nhóm dữ liệu theo ngày
    const dailyForecast = {};
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date: date,
          min_temp: item.main.temp_min,
          max_temp: item.main.temp_max,
          avg_temp: item.main.temp,
          humidity: item.main.humidity,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        };
      } else {
        // Cập nhật nhiệt độ min/max
        dailyForecast[date].min_temp = Math.min(dailyForecast[date].min_temp, item.main.temp_min);
        dailyForecast[date].max_temp = Math.max(dailyForecast[date].max_temp, item.main.temp_max);
        dailyForecast[date].avg_temp = (dailyForecast[date].avg_temp + item.main.temp) / 2;
      }
    });

    res.json({
      success: true,
      data: {
        city: forecastData.city.name,
        country: forecastData.city.country,
        forecast: Object.values(dailyForecast).slice(0, 5) // Chỉ lấy 5 ngày
      }
    });
  } catch (error) {
    console.error('Lỗi lấy dự báo thời tiết:', error);
    
    // Fallback: Trả về dự báo mặc định
    const defaultForecast = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      defaultForecast.push({
        date: date.toDateString(),
        min_temp: 22.0 + i,
        max_temp: 28.0 + i,
        avg_temp: 25.0 + i,
        humidity: 70,
        description: 'Nhiệt độ mặc định',
        icon: '01d'
      });
    }

    res.json({
      success: true,
      data: {
        city: 'Đông Hà',
        country: 'VN',
        forecast: defaultForecast,
        note: 'Không thể kết nối API thời tiết, sử dụng dự báo mặc định'
      }
    });
  }
});

module.exports = router;
