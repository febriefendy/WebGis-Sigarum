/**
 * SIGARUM Geoprocessing & Spatial Utilities Engine
 * Implements GIS operations (Haversine formula, BBox filter, GeoJSON serializers & validators)
 */

/**
 * Calculate Great-Circle distance between two coordinates using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000) / 1000; // 3 decimal places
}

/**
 * Check if a coordinate is within a bounding box
 * @param {number} lat 
 * @param {number} lng 
 * @param {[number, number, number, number]} bbox [minLng, minLat, maxLng, maxLat]
 */
function isCoordInBBox(lat, lng, bbox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Validate geographic coordinates (BR-07, BR-12)
 * @param {number} lat 
 * @param {number} lng 
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCoordinates(lat, lng) {
  if (lat === undefined || lat === null || isNaN(lat)) {
    return { valid: false, error: 'Latitude harus berupa angka valid.' };
  }
  if (lng === undefined || lng === null || isNaN(lng)) {
    return { valid: false, error: 'Longitude harus berupa angka valid.' };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude harus berada dalam rentang -90.0 hingga 90.0 derajat.' };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude harus berada dalam rentang -180.0 hingga 180.0 derajat.' };
  }
  return { valid: true };
}

/**
 * Transform an array of UMKM records into a GeoJSON FeatureCollection
 * @param {Array} umkmList 
 * @returns {object} GeoJSON FeatureCollection (RFC 7946 / EPSG:4326)
 */
function toUmkmGeoJSON(umkmList) {
  return {
    type: "FeatureCollection",
    name: "SIGARUM_UMKM_Point_Features",
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
    },
    features: umkmList.map(u => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [Number(u.longitude), Number(u.latitude)]
      },
      properties: {
        id_umkm: u.id_umkm,
        nama_umkm: u.nama_umkm,
        pemilik: u.pemilik,
        kategori: u.kategori || u.nama_kategori,
        id_kategori: u.id_kategori,
        kecamatan: u.kecamatan,
        desa: u.desa,
        alamat: u.alamat,
        kontak: u.kontak,
        status: u.status,
        tahun_berdiri: u.tahun_berdiri,
        legalitas: u.legalitas,
        foto: u.foto,
        produk_unggulan: typeof u.produk_unggulan === 'string' ? JSON.parse(u.produk_unggulan || '[]') : (u.produk_unggulan || []),
        total_produk: u.total_produk || 0
      }
    }))
  };
}

/**
 * Validate incoming GeoJSON FeatureCollection for spatial import
 * @param {object} geojson 
 * @returns {{ valid: boolean, errors: string[], featuresCount: number }}
 */
function validateGeoJSONImport(geojson) {
  const errors = [];
  if (!geojson || typeof geojson !== 'object') {
    return { valid: false, errors: ['Berkas bukan objek JSON yang valid.'], featuresCount: 0 };
  }
  if (geojson.type !== 'FeatureCollection') {
    errors.push('Tipe GeoJSON root harus berupa "FeatureCollection".');
  }
  if (!Array.isArray(geojson.features)) {
    errors.push('Atribut "features" harus berupa array.');
    return { valid: false, errors, featuresCount: 0 };
  }

  geojson.features.forEach((feat, idx) => {
    if (feat.type !== 'Feature') {
      errors.push(`Feature #${idx + 1}: tipe harus "Feature".`);
    }
    if (!feat.geometry || !feat.geometry.coordinates) {
      errors.push(`Feature #${idx + 1}: geometri atau koordinat tidak ditemukan.`);
    } else if (feat.geometry.type === 'Point') {
      const [lng, lat] = feat.geometry.coordinates;
      const coordVal = validateCoordinates(lat, lng);
      if (!coordVal.valid) {
        errors.push(`Feature #${idx + 1}: ${coordVal.error}`);
      }
    }
    if (!feat.properties || !feat.properties.nama_umkm) {
      errors.push(`Feature #${idx + 1}: atribut "properties.nama_umkm" wajib ada.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    featuresCount: geojson.features.length
  };
}

module.exports = {
  calculateHaversineDistance,
  isCoordInBBox,
  validateCoordinates,
  toUmkmGeoJSON,
  validateGeoJSONImport
};
