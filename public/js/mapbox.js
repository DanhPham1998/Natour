export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZGFuaGtpZDAwMCIsImEiOiJjbDk5Y2k0ZHEwMnZoM29yc3o1ZnlhZHJxIn0.Vn_fGYsoB6w1iofT1Zs0_Q';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/danhkid000/cl99dlnbu005k14qj0tzxerm9',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  // Thêm các element vị trí trong tất cả các tour
  locations.forEach((loc) => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add Marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Xuất Marker với tất cả vị trí
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
