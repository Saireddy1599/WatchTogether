import React, { useState } from 'react';

export const StreamingServices = ({ onServiceSelect, onVideoSelect }) => {
  const [selectedService, setSelectedService] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

  const services = [
    { name: 'Netflix', url: 'https://www.netflix.com' },
    { name: 'Prime Video', url: 'https://www.primevideo.com' },
    { name: 'Hotstar', url: 'https://www.hotstar.com' }
  ];

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    onServiceSelect(service);
  };

  const handleVideoUrlSubmit = (e) => {
    e.preventDefault();
    if (videoUrl) {
      onVideoSelect(videoUrl);
    }
  };

  const generateShareLink = (url) => {
    const roomLink = `${window.location.origin}/room/${Date.now()}?video=${encodeURIComponent(url)}`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`Join me to watch together! ${roomLink}`)}`;
    window.open(whatsappLink, '_blank');
  };

  return (
    <div className="streaming-services">
      <h3>Choose Streaming Service</h3>
      <div className="service-buttons">
        {services.map(service => (
          <button
            key={service.name}
            onClick={() => handleServiceSelect(service)}
            className={`service-button ${selectedService?.name === service.name ? 'selected' : ''}`}
          >
            {service.name}
          </button>
        ))}
      </div>

      {selectedService && (
        <div className="video-input">
          <p>Copy video URL from {selectedService.name}</p>
          <form onSubmit={handleVideoUrlSubmit}>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={`Paste ${selectedService.name} video URL`}
              required
            />
            <div className="button-group">
              <button type="submit">Set Video</button>
              <button 
                type="button" 
                onClick={() => generateShareLink(videoUrl)}
                disabled={!videoUrl}
              >
                Share on WhatsApp
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
