/**
 * SIGARUM (Sistem Informasi Geografis UMKM Olahan Laut dan Garam)
 * Leaflet GIS Engine, Markers, Custom Popups, GeoJSON Layers & Search/Filter
 * Terhubung ke Peta Dunia (OpenStreetMap, Esri Satellite, OpenTopoMap)
 */

// Fallback GeoJSON jika dijalankan via file:// protocol tanpa web server
const FALLBACK_GEOJSON_WILAYAH = {
  "type": "FeatureCollection",
  "name": "Batas_Kecamatan_Pesisir_Pamekasan",
  "features": [
    {
      "type": "Feature",
      "properties": { "id_wilayah": 1, "kecamatan": "Pademawu", "kabupaten": "Pamekasan", "provinsi": "Jawa Timur", "tipe": "Sentra Garam & Olahan Laut Selatan", "warna": "#0284c7" },
      "geometry": { "type": "Polygon", "coordinates": [[[113.515, -7.185], [113.555, -7.182], [113.57, -7.208], [113.565, -7.235], [113.535, -7.245], [113.508, -7.228], [113.51, -7.2], [113.515, -7.185]]] }
    },
    {
      "type": "Feature",
      "properties": { "id_wilayah": 2, "kecamatan": "Tlanakan", "kabupaten": "Pamekasan", "provinsi": "Jawa Timur", "tipe": "Pelabuhan Perikanan & Olahan Hasil Tangkap", "warna": "#0369a1" },
      "geometry": { "type": "Polygon", "coordinates": [[[113.445, -7.18], [113.49, -7.185], [113.508, -7.228], [113.485, -7.24], [113.442, -7.235], [113.435, -7.205], [113.445, -7.18]]] }
    },
    {
      "type": "Feature",
      "properties": { "id_wilayah": 3, "kecamatan": "Galis", "kabupaten": "Pamekasan", "provinsi": "Jawa Timur", "tipe": "Tambak Garam Kristal Pesisir Tenggara", "warna": "#d97706" },
      "geometry": { "type": "Polygon", "coordinates": [[[113.555, -7.182], [113.595, -7.175], [113.612, -7.21], [113.59, -7.238], [113.565, -7.235], [113.57, -7.208], [113.555, -7.182]]] }
    },
    {
      "type": "Feature",
      "properties": { "id_wilayah": 4, "kecamatan": "Larangan", "kabupaten": "Pamekasan", "provinsi": "Jawa Timur", "tipe": "Pesisir Timur & Pengeringan Hasil Laut", "warna": "#059669" },
      "geometry": { "type": "Polygon", "coordinates": [[[113.55, -7.135], [113.605, -7.13], [113.618, -7.17], [113.595, -7.175], [113.555, -7.155], [113.55, -7.135]]] }
    },
    {
      "type": "Feature",
      "properties": { "id_wilayah": 5, "kecamatan": "Pasean", "kabupaten": "Pamekasan", "provinsi": "Jawa Timur", "tipe": "Pelabuhan Nelayan Pantai Utara", "warna": "#2563eb" },
      "geometry": { "type": "Polygon", "coordinates": [[[113.52, -6.915], [113.578, -6.91], [113.585, -6.875], [113.525, -6.878], [113.52, -6.915]]] }
    },
    {
      "type": "Feature",
      "properties": { "id_wilayah": 6, "kecamatan": "Batumarmar", "kabupaten": "Pamekasan", "provinsi": "Jawa Timur", "tipe": "Pesisir Karang & Kerupuk Ikan Pantura", "warna": "#4f46e5" },
      "geometry": { "type": "Polygon", "coordinates": [[[113.45, -6.925], [113.52, -6.915], [113.525, -6.878], [113.455, -6.885], [113.45, -6.925]]] }
    }
  ]
};

class SigarumMapEngine {
  constructor(containerId = 'map', options = {}) {
    this.containerId = containerId;
    this.map = null;
    this.markersLayer = null;
    this.geojsonLayer = null;
    this.baseLayers = {};
    this.overlayLayers = {};
    this.markerMap = new Map(); // id_umkm -> marker
    this.options = {
      // Pusat spasial mencakup seluruh koridor Pamekasan (Utara s/d Selatan)
      center: options.center || [-7.0600, 113.5200],
      zoom: options.zoom || 11,
      minZoom: 2, // Dapat di-zoom out hingga melihat peta dunia penuh
      maxZoom: 19,
      interactive: options.interactive !== false
    };
  }

  init() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    // 1. Base Tile Layers (Terhubung ke Layanan Google Maps & Citra Satelit Nyata)
    this.layerGoogleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps (Citra Satelit & Label Nyata)'
    });

    this.layerGoogleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps (Peta Jalan Standar)'
    });

    this.layerGoogleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps (Topografi & Kontur)'
    });

    this.layerEsri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri World Imagery &mdash; Source: Esri, Maxar, Earthstar Geographics'
    });

    this.layerOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    });

    // 2. Initialize Leaflet Map (Default ke Citra Satelit Nyata Google Maps)
    this.map = L.map(this.containerId, {
      center: this.options.center,
      zoom: this.options.zoom,
      minZoom: this.options.minZoom,
      maxZoom: this.options.maxZoom,
      zoomControl: false,
      layers: [this.layerGoogleHybrid]
    });
    this.currentBaseLayerName = 'satelit';

    // 3. Add Custom Zoom Controls on Top Right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // 4. Layer Groups
    this.markersLayer = L.layerGroup().addTo(this.map);
    this.geojsonLayer = L.layerGroup().addTo(this.map);

    // 5. Add Base Layers and Overlays to Layer Control
    this.baseLayers = {
      "Google Maps Satelit (Citra Nyata)": this.layerGoogleHybrid,
      "Google Maps Jalan (Roadmap)": this.layerGoogleRoadmap,
      "Google Maps Topografi (Terrain)": this.layerGoogleTerrain,
      "Citra Satelit Esri (High-Res)": this.layerEsri,
      "OpenStreetMap Standar": this.layerOSM
    };

    this.overlayLayers = {
      "Titik Sebaran UMKM": this.markersLayer,
      "Batas Kecamatan Pesisir (GeoJSON)": this.geojsonLayer
    };

    this.layerControl = L.control.layers(this.baseLayers, this.overlayLayers, { position: 'topright' }).addTo(this.map);

    // 6. Scale Control (Skala Jarak Dunia km / meter)
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(this.map);

    // 7. Load Layers
    this.loadGeoJSONWilayah();
    this.renderMarkers({ preventPan: false });
  }

  // Load GeoJSON Polygons for Coastal Pamekasan (dengan Fallback Aman)
  async loadGeoJSONWilayah() {
    let geoData = null;
    if (window.location && window.location.protocol === 'file:') {
      // Protokol file:// memblokir fetch lokal karena batasan CORS peramban, gunakan data GeoJSON internal
      geoData = FALLBACK_GEOJSON_WILAYAH;
    } else {
      try {
        const response = await fetch('data/wilayah.geojson');
        if (response.ok) {
          geoData = await response.json();
        }
      } catch (e) {
        geoData = FALLBACK_GEOJSON_WILAYAH;
      }
    }

    if (!geoData) {
      geoData = FALLBACK_GEOJSON_WILAYAH;
    }

    this.geojsonLayer.clearLayers();

    const layer = L.geoJSON(geoData, {
      style: (feature) => {
        return {
          color: feature.properties.warna || '#0284c7',
          weight: 2,
          opacity: 0.85,
          fillColor: feature.properties.warna || '#0284c7',
          fillOpacity: 0.15,
          dashArray: '4, 4'
        };
      },
      onEachFeature: (feature, l) => {
        const p = feature.properties;
        l.bindTooltip(`<strong>Kecamatan ${p.kecamatan}</strong><br><span class="text-xs text-slate-600">${p.tipe || 'Kawasan Pesisir'}</span>`, {
          sticky: true,
          className: 'text-xs'
        });

        l.on('mouseover', (e) => {
          e.target.setStyle({
            fillOpacity: 0.35,
            weight: 3,
            dashArray: ''
          });
        });

        l.on('mouseout', (e) => {
          layer.resetStyle(e.target);
        });

        l.on('click', (e) => {
          this.map.fitBounds(e.target.getBounds(), { padding: [30, 30] });
        });
      }
    });

    this.geojsonLayer.addLayer(layer);
  }

  // Create Marker Icon based on category
  createCustomIcon(umkm) {
    const isGaram = umkm.kategori === 'Garam';
    const pinClass = isGaram ? 'marker-garam' : 'marker-laut';
    
    const iconSvg = isGaram 
      ? `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>`
      : `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>`;

    return L.divIcon({
      className: 'sigarum-marker',
      html: `
        <div class="relative">
          <div class="marker-pulse"></div>
          <div class="marker-pin ${pinClass}">
            <div class="marker-pin-inner">
              ${iconSvg}
            </div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  // Create rich Leaflet popup with Google Maps World Navigation Link & Coordinates
  createPopupContent(umkm) {
    const isGaram = umkm.kategori === 'Garam';
    const badgeColor = isGaram ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800';
    const sampleProducts = (umkm.produk_unggulan || []).slice(0, 2).map(p => `
      <span class="inline-block bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md mr-1 mb-1 font-medium">
        • ${p}
      </span>
    `).join('');

    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${umkm.latitude},${umkm.longitude}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${(umkm.kontak || '').replace(/[^0-9]/g, '')}&text=Halo%20${encodeURIComponent(umkm.nama_umkm)},%20saya%20tertarik%20dengan%20produk%20Anda%20dari%20SIGARUM.`;

    return `
      <div class="text-left font-sans">
        <div class="relative h-28 w-full bg-slate-100 overflow-hidden">
          <img src="${umkm.foto}" alt="${umkm.nama_umkm}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'">
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeColor} shadow-sm">
            ${umkm.kategori}
          </span>
          <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${umkm.status === 'Aktif' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'} shadow-sm">
            ${umkm.status}
          </span>
        </div>
        <div class="p-3.5">
          <h4 class="font-bold text-slate-900 text-sm leading-snug hover:text-sky-600 transition-colors">
            ${umkm.nama_umkm}
          </h4>
          <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
            Desa ${umkm.desa}, Kec. ${umkm.kecamatan}
          </p>
          <div class="mt-1.5 flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200/60 font-mono">
            <span>Lat: ${umkm.latitude}</span>
            <span>Long: ${umkm.longitude}</span>
          </div>
          <div class="mt-2 pt-2 border-t border-slate-100">
            <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Produk Unggulan:</div>
            <div class="flex flex-wrap">
              ${sampleProducts}
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between gap-1.5">
            <a href="detail-umkm.html?id=${umkm.id_umkm}" class="flex-1 text-center bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors shadow-sm">
              Lihat Detail
            </a>
            <a href="${gmapsUrl}" target="_blank" class="px-2.5 py-1.5 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors flex items-center gap-1 text-xs font-medium" title="Buka di Google Maps (Peta Dunia)">
              <svg class="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              <span>Peta Dunia</span>
            </a>
            <a href="${waUrl}" target="_blank" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors" title="Hubungi WhatsApp">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.275-.1-.476-.15-.676.15-.2.301-.777.979-.953 1.179-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.3-.501.101-.2.05-.376-.025-.527-.075-.15-.676-1.631-.927-2.233-.245-.587-.494-.508-.676-.517-.175-.009-.376-.009-.577-.009-.201 0-.527.075-.802.376-.276.301-1.054 1.03-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.723.23 1.38.197 1.9.12.58-.087 1.78-.727 2.03-1.43.25-.703.25-1.305.176-1.43-.076-.126-.276-.201-.577-.351z"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Render markers with current filters and adjust bounds
  renderMarkers(filters = {}) {
    this.markersLayer.clearLayers();
    this.markerMap.clear();

    const onlyActive = filters.includeInactive ? false : true;
    let items = SigarumStore.getUMKM({ ...filters, onlyActive });

    // Spatial Radius / Buffer Analysis Filter
    if (filters.radius && filters.radius !== 'Semua') {
      const maxR = parseFloat(filters.radius);
      const refCoord = this.userLatLng || (this.map ? [this.map.getCenter().lat, this.map.getCenter().lng] : [-7.2185, 113.5420]);
      
      const toRad = deg => (deg * Math.PI) / 180;
      const getDist = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      items = items.filter(item => {
        const d = getDist(refCoord[0], refCoord[1], parseFloat(item.latitude), parseFloat(item.longitude));
        item.calculated_dist_km = Math.round(d * 10) / 10;
        return d <= maxR;
      }).sort((a, b) => a.calculated_dist_km - b.calculated_dist_km);
    }

    const bounds = [];

    items.forEach(item => {
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: this.createCustomIcon(item)
      });

      marker.bindPopup(this.createPopupContent(item), {
        className: 'custom-map-popup',
        maxWidth: 320,
        minWidth: 260
      });

      this.markersLayer.addLayer(marker);
      this.markerMap.set(item.id_umkm, marker);
      bounds.push([lat, lng]);
    });

    // Update result count if element exists
    const counterEl = document.getElementById('map-result-count');
    if (counterEl) {
      counterEl.textContent = `${items.length} UMKM Ditemukan`;
    }

    // Toggle empty state if zero
    const emptyState = document.getElementById('map-empty-state');
    if (emptyState) {
      emptyState.classList.toggle('hidden', items.length > 0);
    }

    // Adjust bounds jika ada markers dan tidak dilarang
    if (bounds.length > 0 && !filters.preventPan) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    return items;
  }

  // Focus specific UMKM by ID with animation
  focusUMKM(id) {
    const marker = this.markerMap.get(parseInt(id));
    if (marker) {
      const latLng = marker.getLatLng();
      this.map.flyTo(latLng, 15, { duration: 1.2 });
      
      // Remove active pulse from other markers
      document.querySelectorAll('.sigarum-marker.is-active-pin').forEach(el => {
        el.classList.remove('is-active-pin');
      });

      const iconEl = marker.getElement();
      if (iconEl) {
        iconEl.classList.add('is-active-pin');
      }

      marker.openPopup();
    }
  }

  // Focus specific Kecamatan polygon or center
  focusKecamatan(kecamatanName) {
    if (!kecamatanName || kecamatanName === 'Semua') {
      this.fitAllMarkers();
      return;
    }

    let foundBounds = null;
    if (this.geojsonLayer) {
      this.geojsonLayer.eachLayer(layerGroup => {
        if (layerGroup.eachLayer) {
          layerGroup.eachLayer(l => {
            if (l.feature && l.feature.properties && l.feature.properties.kecamatan.toLowerCase() === kecamatanName.toLowerCase()) {
              foundBounds = l.getBounds();
            }
          });
        }
      });
    }

    if (foundBounds) {
      this.map.fitBounds(foundBounds, { padding: [40, 40] });
    } else {
      // Fallback ke filter markers
      const matchingMarkers = [];
      this.markerMap.forEach((marker, id) => {
        const item = SigarumStore.getUMKMById(id);
        if (item && item.kecamatan.toLowerCase() === kecamatanName.toLowerCase()) {
          matchingMarkers.push(marker.getLatLng());
        }
      });
      if (matchingMarkers.length > 0) {
        this.map.fitBounds(matchingMarkers, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }

  // Dynamic Base Layer Switcher (Google Satellite, Google Roadmap, Google Terrain, Esri, OSM)
  switchBaseLayer(type) {
    if (!this.map) return;

    if (this.layerGoogleHybrid) this.map.removeLayer(this.layerGoogleHybrid);
    if (this.layerGoogleRoadmap) this.map.removeLayer(this.layerGoogleRoadmap);
    if (this.layerGoogleTerrain) this.map.removeLayer(this.layerGoogleTerrain);
    if (this.layerEsri) this.map.removeLayer(this.layerEsri);
    if (this.layerOSM) this.map.removeLayer(this.layerOSM);

    let activeLayerName = '';
    if (type === 'satelit') {
      this.layerGoogleHybrid.addTo(this.map);
      this.currentBaseLayerName = 'satelit';
      activeLayerName = 'Google Maps Satelit (Citra Nyata)';
    } else if (type === 'jalan') {
      this.layerGoogleRoadmap.addTo(this.map);
      this.currentBaseLayerName = 'jalan';
      activeLayerName = 'Google Maps Jalan (Roadmap)';
    } else if (type === 'terrain') {
      this.layerGoogleTerrain.addTo(this.map);
      this.currentBaseLayerName = 'terrain';
      activeLayerName = 'Google Maps Medan (Topografi)';
    } else if (type === 'esri') {
      this.layerEsri.addTo(this.map);
      this.currentBaseLayerName = 'esri';
      activeLayerName = 'Citra Satelit Esri (High-Res)';
    } else {
      this.layerOSM.addTo(this.map);
      this.currentBaseLayerName = 'osm';
      activeLayerName = 'OpenStreetMap Standar';
    }

    // Update active style on UI buttons if present
    document.querySelectorAll('[data-basemap-btn]').forEach(btn => {
      const bType = btn.getAttribute('data-basemap-btn');
      if (bType === type) {
        btn.classList.add('is-active', 'bg-ocean-600', 'text-white', 'shadow-sm');
        btn.classList.remove('is-inactive', 'text-slate-300', 'hover:bg-white/10', 'text-slate-600', 'hover:bg-slate-100', 'bg-white', 'text-slate-900');
        if (window.SigarumAnimations) {
          SigarumAnimations.createRipple(btn);
        }
      } else {
        btn.classList.remove('is-active', 'bg-ocean-600', 'text-white', 'shadow-sm', 'bg-white', 'text-slate-900');
        btn.classList.add('is-inactive', 'text-slate-300', 'hover:bg-white/10');
      }
    });

    SigarumUtils.showToast(`Peta diubah ke ${activeLayerName}`, 'info');
  }

  // Preset Views: Peta Dunia, Indonesia, Jawa Timur, dan Pamekasan
  zoomToWorld() {
    this.map.flyTo([10, 105], 2, { duration: 1.4 });
    SigarumUtils.showToast("Menampilkan Tampilan Peta Dunia Global", "info");
  }

  zoomToIndonesia() {
    this.map.flyTo([-2.5, 118], 5, { duration: 1.2 });
    SigarumUtils.showToast("Menampilkan Peta Kepulauan Indonesia", "info");
  }

  zoomToEastJava() {
    this.map.flyTo([-7.5, 112.8], 8, { duration: 1.1 });
    SigarumUtils.showToast("Menampilkan Wilayah Jawa Timur & Madura", "info");
  }

  fitAllMarkers() {
    const allCoords = [];
    this.markerMap.forEach(marker => {
      allCoords.push(marker.getLatLng());
    });
    if (allCoords.length > 0) {
      this.map.fitBounds(allCoords, { padding: [45, 45], maxZoom: 14 });
    } else {
      this.resetView();
    }
  }

  // Reset view to Pamekasan extent
  resetView() {
    this.fitAllMarkers();
  }

  // Geolocation (Lokasi Pengguna)
  locateUser() {
    if (!navigator.geolocation) {
      SigarumUtils.showToast("Browser Anda tidak mendukung geolokasi.", "error");
      return;
    }
    SigarumUtils.showToast("Mendeteksi lokasi Anda...", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        this.userLatLng = [userLat, userLng];

        const userIcon = L.divIcon({
          className: 'user-loc-beacon',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8">
              <span class="absolute w-8 h-8 rounded-full bg-sky-500/30 animate-ping"></span>
              <span class="absolute w-5 h-5 rounded-full bg-sky-500/50"></span>
              <span class="relative w-3.5 h-3.5 rounded-full bg-sky-600 border-2 border-white shadow-md"></span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        if (this.userLocationMarker) {
          this.map.removeLayer(this.userLocationMarker);
        }

        this.userLocationMarker = L.marker([userLat, userLng], { icon: userIcon })
          .addTo(this.map)
          .bindPopup(`
            <div class="p-2 text-center font-sans">
              <div class="text-xs font-bold text-slate-800">📍 Lokasi Anda Saat Ini</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Koordinat: ${userLat.toFixed(5)}, ${userLng.toFixed(5)}</div>
              <div class="text-[10px] text-sky-600 font-medium mt-1">Gunakan opsi filter radius untuk mencari UMKM terdekat</div>
            </div>
          `, { className: 'custom-map-popup' })
          .openPopup();

        this.map.flyTo([userLat, userLng], 14, { duration: 1.2 });
        SigarumUtils.showToast("Lokasi Anda berhasil ditemukan! Filter radius aktif berdasarkan lokasi ini.", "success");
      },
      (err) => {
        SigarumUtils.showToast("Gagal mendeteksi lokasi: " + err.message, "warning");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }
}
