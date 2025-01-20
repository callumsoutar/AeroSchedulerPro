import React from 'react';

interface WeatherData {
  icaoId: string;
  obsTime: string;
  temp: number;
  dewp: number;
  wdir: number;
  wspd: number;
  visib: number;
  altim: number;
  wxString: string;
  clouds: {
    cover: string;
    base: number;
  }[];
}

const WeatherCard: React.FC<{ weatherData: WeatherData }> = ({ weatherData }) => {
  const {
    icaoId,
    obsTime,
    temp,
    dewp,
    wdir,
    wspd,
    altim,
    wxString,
    clouds,
  } = weatherData;

  const formatWind = (direction: number, speed: number) => `${direction}° ${speed} kt`;
  const formatClouds = (cloudLayers: { cover: string; base: number }[]) =>
    cloudLayers.map((cloud, index) => `${cloud.cover} ${cloud.base} ft`).join(', ') || 'Clear skies';

  return (
    <div className="weather-card">
      <div className="header">
        <h2>{icaoId} Weather</h2>
        <p>Updated {new Date(obsTime).toLocaleTimeString()}</p>
      </div>
      <div className="grid">
        <div className="item">
          <p className="label">Conditions</p>
          <p className="value">{wxString || 'N/A'}</p>
        </div>
        <div className="item">
          <p className="label">Temperature</p>
          <p className="value">{temp}°C</p>
        </div>
        <div className="item">
          <p className="label">Dew Point</p>
          <p className="value">{dewp}°C</p>
        </div>
        <div className="item">
          <p className="label">Wind</p>
          <p className="value">{formatWind(wdir, wspd)}</p>
        </div>
        <div className="item">
          <p className="label">Visibility</p>
          <p className="value">{weatherData.visib || 'N/A'} m</p>
        </div>
        <div className="item">
          <p className="label">QNH</p>
          <p className="value">{altim} hPa</p>
        </div>
        <div className="item full-width">
          <p className="label">Clouds</p>
          <p className="value">{formatClouds(clouds)}</p>
        </div>
      </div>
      <style jsx>{`
        .weather-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 16px;
          max-width: 400px;
          margin: auto;
          font-family: Arial, sans-serif;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        h2 {
          font-size: 1.25rem;
          color: #333;
          margin: 0;
        }
        p {
          margin: 0;
          color: #555;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .item {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }
        .item.full-width {
          grid-column: span 2;
        }
        .label {
          font-size: 0.875rem;
          color: #777;
        }
        .value {
          font-size: 1.125rem;
          font-weight: bold;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default WeatherCard;
