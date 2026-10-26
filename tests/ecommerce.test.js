const request = require('supertest');
const { app } = require('../server/server');
const { initDatabase, query } = require('../server/config/db');

describe('7. MULTI-VENDOR E-COMMERCE END-TO-END FLOW', () => {
  let buyerToken = '';
  let buyerId = null;
  let sellerToken = '';
  let adminToken = '';
  let createdOrderId = null;
  let createdSubOrderId = null;
  let createdPaymentId = null;

  beforeAll(async () => {
    await initDatabase();

    // 1. Admin login
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = resAdmin.body.token;

    // 2. Seller login
    const resSeller = await request(app)
      .post('/api/auth/login')
      .send({ username: 'penjual_demo', password: 'password123' });
    sellerToken = resSeller.body.token;

    // 3. Register a fresh Buyer
    const uniqueUser = `buyer_${Date.now()}`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        nama: 'Budi Pembeli Madura',
        username: uniqueUser,
        email: `${uniqueUser}@gmail.com`,
        password: 'Password123!',
        nomor_telepon: '+6281234567890',
        role: 'pelanggan'
      });
    expect(regRes.status).toBe(201);
    buyerId = regRes.body.user.id_user;

    // 4. Buyer login
    const resBuyer = await request(app)
      .post('/api/auth/login')
      .send({ username: uniqueUser, password: 'Password123!' });
    expect(resBuyer.status).toBe(200);
    buyerToken = resBuyer.body.token;
  });

  test('Pembeli dapat menambahkan alamat pengiriman baru', async () => {
    const res = await request(app)
      .post('/api/auth/addresses')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        nama_penerima: 'Budi Pembeli',
        nomor_telepon: '08123456789',
        label_alamat: 'Rumah',
        kecamatan: 'Pademawu',
        alamat_lengkap: 'Jl. Raya Bunder No. 10, RT 01/RW 02',
        is_utama: 1
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id_alamat).toBeTruthy();
  });

  test('Pembeli dapat menambahkan produk ke keranjang belanja', async () => {
    // Add product 1
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ id_produk: 1, jumlah: 2 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Get Cart
    const cartRes = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(cartRes.status).toBe(200);
    expect(cartRes.body.data.total_items).toBe(2);
    expect(cartRes.body.data.groups.length).toBeGreaterThan(0);
  });

  test('Pembeli dapat melakukan checkout dan pesanan terpecah menjadi sub-orders per toko', async () => {
    const addresses = await request(app)
      .get('/api/auth/addresses')
      .set('Authorization', `Bearer ${buyerToken}`);
    const id_alamat = addresses.body.data[0].id_alamat;

    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        id_alamat: id_alamat,
        metode_pembayaran: 'Transfer_Bank',
        catatan_pembeli: 'Mohon dibungkus aman'
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.success).toBe(true);
    expect(checkoutRes.body.data.id_order).toBeTruthy();
    expect(checkoutRes.body.data.sub_orders.length).toBeGreaterThan(0);

    createdOrderId = checkoutRes.body.data.id_order;
    createdSubOrderId = checkoutRes.body.data.sub_orders[0].id_sub_order;
  });

  test('Detail pembayaran dan instruksi dapat diakses pembeli', async () => {
    const res = await request(app)
      .get(`/api/payments/order/${createdOrderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.order.total_tagihan).toBeGreaterThan(0);
    expect(res.body.data.payment.status).toBe('Menunggu_Verifikasi');
    createdPaymentId = res.body.data.payment.id_payment;
  });

  test('Admin dapat memverifikasi pembayaran transaksi menjadi Dibayar', async () => {
    const res = await request(app)
      .post(`/api/payments/verify/${createdPaymentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'setujui',
        catatan: 'Pembayaran mutasi bank sesuai'
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify order status updated to Diproses
    const orderRes = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(orderRes.body.data.order.status_pembayaran).toBe('Dibayar');
  });

  test('Penjual dapat memproses sub-order dan menginputkan nomor resi', async () => {
    // 1. Process
    const procRes = await request(app)
      .put(`/api/orders/sub-order/${createdSubOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`) // Admin or owner can update
      .send({ status: 'Diproses' });
    expect(procRes.status).toBe(200);

    // 2. Shipping with Tracking Resi
    const shipRes = await request(app)
      .put(`/api/orders/sub-order/${createdSubOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Dalam_Pengiriman',
        nomor_resi: 'JNT9988776655',
        catatan: 'Paket diserahkan ke kurir'
      });
    expect(shipRes.status).toBe(200);
    expect(shipRes.body.data.nomor_resi).toBe('JNT9988776655');
  });

  test('Pembeli dapat mengonfirmasi penerimaan barang dan status sub-order menjadi Selesai', async () => {
    const res = await request(app)
      .post(`/api/orders/sub-order/${createdSubOrderId}/confirm-received`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Pembeli dapat memberikan rating bintang dan ulasan produk', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        id_produk: 1,
        id_order: createdOrderId,
        rating: 5,
        komentar: 'Garam sangat bersih kristal geomembran putih, kemasan sangat rapi!'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id_review).toBeTruthy();
  });

  test('Ulasan produk dapat dilihat secara publik tanpa login', async () => {
    const res = await request(app).get('/api/reviews/product/1');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].rating).toBe(5);
  });
});
