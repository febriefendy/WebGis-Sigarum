/**
 * SIGARUM (Sistem Informasi Geografis UMKM Olahan Laut dan Garam)
 * Chart.js Visualizations & Spatial Statistics Engine
 */

const SigarumCharts = {
  // Chart 1: UMKM per Kategori
  renderKategoriChart(canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return null;

    const stats = SigarumStore.getStats();
    return new Chart(el.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Olahan Laut', 'Garam'],
        datasets: [{
          data: [stats.totalLaut, stats.totalGaram],
          backgroundColor: ['#0284c7', '#d97706'],
          hoverBackgroundColor: ['#0369a1', '#b45309'],
          borderWidth: 3,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 14,
              font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
              padding: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = stats.totalLaut + stats.totalGaram;
                const val = context.raw;
                const pct = ((val / total) * 100).toFixed(1);
                return ` ${context.label}: ${val} UMKM (${pct}%)`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  },

  // Chart 2: UMKM per Kecamatan
  renderKecamatanChart(canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return null;

    const stats = SigarumStore.getStats();
    const labels = stats.byKecamatan.map(k => k.kecamatan);
    const dataLaut = stats.byKecamatan.map(k => k.laut);
    const dataGaram = stats.byKecamatan.map(k => k.garam);

    return new Chart(el.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Olahan Laut',
            data: dataLaut,
            backgroundColor: '#0284c7',
            borderRadius: 6,
            barThickness: 18
          },
          {
            label: 'Garam',
            data: dataGaram,
            backgroundColor: '#d97706',
            borderRadius: 6,
            barThickness: 18
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { stepSize: 1, font: { family: 'Plus Jakarta Sans', size: 11 } },
            grid: { color: '#f1f5f9' }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' } }
          }
        }
      }
    });
  },

  // Chart 3: Produk per Kategori
  renderProdukChart(canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return null;

    const allProduk = SigarumStore.getProduk();
    const laut = allProduk.filter(p => p.kategori === 'Olahan Laut').length;
    const garam = allProduk.filter(p => p.kategori === 'Garam').length;

    return new Chart(el.getContext('2d'), {
      type: 'pie',
      data: {
        labels: ['Produk Olahan Laut', 'Produk Garam'],
        datasets: [{
          data: [laut, garam],
          backgroundColor: ['#38bdf8', '#f59e0b'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' } }
          }
        }
      }
    });
  },

  // Chart 4: Status Keaktifan UMKM
  renderStatusChart(canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return null;

    const stats = SigarumStore.getStats();

    return new Chart(el.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['UMKM Aktif', 'UMKM Nonaktif'],
        datasets: [{
          data: [stats.totalAktif, stats.totalNonaktif],
          backgroundColor: ['#10b981', '#94a3b8'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' } }
          }
        },
        cutout: '70%'
      }
    });
  }
};
