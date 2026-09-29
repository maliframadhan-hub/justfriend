(function () {
  'use strict';

  var WA_NUMBER = '6283107066531';
  var MAX_QTY = 99;
  var STORE_KEY = 'jtf_cart_v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Toast ---------- */
  var toast = $('#toast');
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    if (msg) toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  function openWhatsApp(text) {
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  // Semua uang dalam Rupiah bulat (integer) agar tidak ada selisih desimal.
  function rupiah(n) {
    return 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
  }

  /* ---------- Menu navigasi (mobile) ---------- */
  var navLinks = $('#navLinks');
  var navToggle = $('.nav-toggle');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Link aktif saat scroll ---------- */
  var links = $$('.nav-links a');
  var sections = links.map(function (a) {
    var id = a.getAttribute('href').slice(1);
    return id === 'top' ? $('.hero') : document.getElementById(id);
  });
  function updateActive() {
    var y = window.scrollY + 140;
    var current = 0;
    sections.forEach(function (s, i) {
      if (s && s.offsetTop <= y) current = i;
    });
    links.forEach(function (a, i) { a.classList.toggle('active', i === current); });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();

  /* ---------- Backsound ---------- */
  var music = $('#backgroundMusic');
  var soundBtn = $('.sound-toggle');
  if (music && soundBtn) {
    music.volume = 0.35;
    soundBtn.addEventListener('click', function () {
      if (music.paused) {
        music.play().then(function () {
          soundBtn.classList.add('is-playing');
          soundBtn.setAttribute('aria-pressed', 'true');
          soundBtn.setAttribute('aria-label', 'Matikan backsound');
        }).catch(function () {
          showToast('Browser memblokir audio. Coba klik sekali lagi.');
        });
      } else {
        music.pause();
        soundBtn.classList.remove('is-playing');
        soundBtn.setAttribute('aria-pressed', 'false');
        soundBtn.setAttribute('aria-label', 'Nyalakan backsound');
      }
    });
  }

  /* ---------- Form kontak -> WhatsApp ---------- */
  var form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nama = $('#nama').value.trim();
      var email = $('#email').value.trim();
      var topik = $('#topik').value.trim() || '-';
      var pesan = $('#pesan').value.trim();
      var text = 'Halo JusTFriend!\n\n' +
        'Nama: ' + nama + '\n' +
        'Email: ' + email + '\n' +
        'Topik: ' + topik + '\n' +
        'Pesan: ' + pesan;
      showToast('Membuka WhatsApp untuk mengirim pesanmu...');
      setTimeout(function () { openWhatsApp(text); form.reset(); }, 600);
    });
  }

  /* =====================================================
     KERANJANG
     - Katalog harga diambil dari atribut data-price tombol produk.
     - Keranjang hanya menyimpan { namaProduk: qty }.
     - Harga TIDAK pernah dibaca dari localStorage / input user,
       selalu dari katalog, jadi total tidak bisa dimanipulasi.
     ===================================================== */
  var catalog = {};
  $$('.btn-pesan').forEach(function (btn) {
    var name = btn.dataset.product;
    var price = parseInt(btn.dataset.price, 10);
    if (name && isFinite(price) && price > 0) catalog[name] = price;
  });

  var cart = {};

  function clampQty(q) {
    q = parseInt(q, 10);
    if (!isFinite(q) || q < 1) return 0;
    return Math.min(q, MAX_QTY);
  }

  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      Object.keys(raw).forEach(function (name) {
        var q = clampQty(raw[name]);
        if (catalog.hasOwnProperty(name) && q > 0) cart[name] = q;
      });
    } catch (e) { cart = {}; }
  }
  function saveCart() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) { /* abaikan */ }
  }

  function cartNames() { return Object.keys(cart); }
  function cartCount() {
    return cartNames().reduce(function (s, n) { return s + cart[n]; }, 0);
  }
  function lineTotal(name) { return catalog[name] * cart[name]; }
  function cartTotal() {
    return cartNames().reduce(function (s, n) { return s + lineTotal(n); }, 0);
  }

  function addToCart(name) {
    if (!catalog.hasOwnProperty(name)) return;
    var next = (cart[name] || 0) + 1;
    if (next > MAX_QTY) { showToast('Maksimal ' + MAX_QTY + ' per menu.'); return; }
    cart[name] = next;
    saveCart();
    renderCart();
    showToast(name + ' masuk keranjang. Total ' + rupiah(cartTotal()));
  }
  function changeQty(name, delta) {
    if (!cart[name]) return;
    var next = cart[name] + delta;
    if (next > MAX_QTY) { showToast('Maksimal ' + MAX_QTY + ' per menu.'); return; }
    if (next < 1) delete cart[name]; else cart[name] = next;
    saveCart();
    renderCart();
  }
  function removeItem(name) {
    delete cart[name];
    saveCart();
    renderCart();
  }
  function clearCart() {
    cart = {};
    saveCart();
    renderCart();
  }

  /* ---------- Render keranjang ---------- */
  var cartBtn = $('#cartBtn');
  var cartBadge = $('#cartBadge');
  var drawer = $('#cartDrawer');
  var cartBody = $('#cartBody');
  var cartFoot = $('#cartFoot');
  var cartTotalEl = $('#cartTotal');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function qtyButton(label, aria, handler) {
    var b = el('button', 'qty-btn', label);
    b.type = 'button';
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', handler);
    return b;
  }

  function renderCart() {
    var count = cartCount();
    if (cartBadge) {
      cartBadge.textContent = count > 99 ? '99+' : String(count);
      cartBadge.hidden = count === 0;
    }
    if (cartBtn) cartBtn.setAttribute('aria-label', 'Buka keranjang, ' + count + ' item');

    if (cartBody) {
      cartBody.textContent = '';
      var names = cartNames();
      if (!names.length) {
        var empty = el('div', 'cart-empty');
        empty.appendChild(el('strong', '', 'Keranjang masih kosong'));
        empty.appendChild(el('p', '', 'Pilih menu jus favoritmu dulu, lalu tekan tombol Pesan.'));
        cartBody.appendChild(empty);
      } else {
        names.forEach(function (name) {
          var row = el('div', 'cart-item');
          var info = el('div', 'cart-item-info');
          info.appendChild(el('h4', '', name));
          info.appendChild(el('span', 'cart-item-price', rupiah(catalog[name]) + ' / botol'));
          row.appendChild(info);

          var ctrl = el('div', 'cart-item-ctrl');
          var qty = el('div', 'qty');
          qty.appendChild(qtyButton('−', 'Kurangi ' + name, function () { changeQty(name, -1); }));
          qty.appendChild(el('span', 'qty-val', String(cart[name])));
          qty.appendChild(qtyButton('+', 'Tambah ' + name, function () { changeQty(name, 1); }));
          ctrl.appendChild(qty);
          ctrl.appendChild(el('b', 'cart-item-sub', rupiah(lineTotal(name))));
          row.appendChild(ctrl);

          var del = el('button', 'cart-del', '✕');
          del.type = 'button';
          del.setAttribute('aria-label', 'Hapus ' + name);
          del.addEventListener('click', function () { removeItem(name); });
          row.appendChild(del);

          cartBody.appendChild(row);
        });
      }
    }
    if (cartFoot) cartFoot.hidden = count === 0;
    if (cartTotalEl) cartTotalEl.textContent = rupiah(cartTotal());

    // Jika modal checkout sedang terbuka, sinkronkan ringkasannya.
    if (modal && !modal.hidden) renderPaySummary();
  }

  /* ---------- Buka/tutup panel (dengan kunci scroll) ---------- */
  var lastFocus = null;
  function syncScrollLock() {
    var anyOpen = (drawer && !drawer.hidden) || (modal && !modal.hidden);
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  }

  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    renderCart();
    drawer.hidden = false;
    syncScrollLock();
    var close = $('.pay-close', drawer);
    if (close) setTimeout(function () { close.focus(); }, 50);
  }
  function closeCart(restoreFocus) {
    if (!drawer) return;
    drawer.hidden = true;
    syncScrollLock();
    if (restoreFocus !== false && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Checkout & pembayaran ---------- */
  var modal = $('#payModal');
  var payNama = $('#payNama');
  var payCatatan = $('#payCatatan');
  var paySummary = $('#paySummary');
  var payTotalEl = $('#payTotal');

  function renderPaySummary() {
    if (!paySummary) return;
    paySummary.textContent = '';
    cartNames().forEach(function (name) {
      var row = el('div', 'sum-row');
      row.appendChild(el('span', '', cart[name] + '× ' + name));
      row.appendChild(el('b', '', rupiah(lineTotal(name))));
      paySummary.appendChild(row);
    });
    if (payTotalEl) payTotalEl.textContent = rupiah(cartTotal());
  }

  function openCheckout() {
    if (!modal) return;
    if (!cartNames().length) { showToast('Keranjang masih kosong.'); return; }
    closeCart(false);
    renderPaySummary();
    modal.hidden = false;
    syncScrollLock();
    setTimeout(function () { if (payNama) payNama.focus(); }, 50);
  }
  function closeCheckout(restoreFocus) {
    if (!modal) return;
    modal.hidden = true;
    syncScrollLock();
    if (restoreFocus !== false && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Semua tombol "Bayar" / "Bayar Pesanan" membuka keranjang dulu,
  // supaya nominal selalu berasal dari isi keranjang.
  $$('[data-open-pay]').forEach(function (b) {
    b.addEventListener('click', openCart);
  });
  if (cartBtn) cartBtn.addEventListener('click', openCart);
  $$('[data-close-cart]').forEach(function (b) {
    b.addEventListener('click', function () { closeCart(); });
  });
  $$('[data-close-pay]').forEach(function (b) {
    b.addEventListener('click', function () { closeCheckout(); });
  });
  var payBack = $('#payBack');
  if (payBack) payBack.addEventListener('click', function () { closeCheckout(false); openCart(); });

  var cartCheckout = $('#cartCheckout');
  if (cartCheckout) cartCheckout.addEventListener('click', openCheckout);
  var cartClearBtn = $('#cartClear');
  if (cartClearBtn) {
    cartClearBtn.addEventListener('click', function () {
      if (window.confirm('Kosongkan semua isi keranjang?')) clearCart();
    });
  }

  $$('.btn-pesan').forEach(function (btn) {
    btn.addEventListener('click', function () { addToCart(btn.dataset.product); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal && !modal.hidden) closeCheckout();
    else if (drawer && !drawer.hidden) closeCart();
  });

  var payConfirm = $('#payConfirm');
  if (payConfirm) {
    payConfirm.addEventListener('click', function () {
      var names = cartNames();
      if (!names.length) { showToast('Keranjang masih kosong.'); return; }
      var nama = payNama.value.trim();
      if (!nama) { showToast('Isi nama kamu dulu ya.'); payNama.focus(); return; }

      // Total dihitung ulang saat konfirmasi, langsung dari keranjang + katalog.
      var total = cartTotal();
      var lines = names.map(function (n, i) {
        return (i + 1) + '. ' + cart[n] + 'x ' + n + ' @ ' + rupiah(catalog[n]) + ' = ' + rupiah(lineTotal(n));
      }).join('\n');
      var catatan = payCatatan ? payCatatan.value.trim() : '';

      var text = 'Halo JusTFriend, saya sudah melakukan pembayaran via QRIS.\n\n' +
        'Nama: ' + nama + '\n\n' +
        'Pesanan:\n' + lines + '\n\n' +
        'Total item: ' + cartCount() + '\n' +
        'TOTAL BAYAR: ' + rupiah(total) +
        (catatan ? '\n\nCatatan: ' + catatan : '') +
        '\n\nBukti pembayaran saya lampirkan di chat ini.';

      showToast('Membuka WhatsApp untuk mengirim pesanmu...');
      setTimeout(function () {
        openWhatsApp(text);
        closeCheckout(false);
        clearCart();
        payNama.value = '';
        if (payCatatan) payCatatan.value = '';
      }, 600);
    });
  }

  loadCart();
  renderCart();

  /* ---------- Tanggal & jam real-time ---------- */
  var dateEl = $('#realtimeDate');
  var clockEl = $('#realtimeClock');
  function tick() {
    var now = new Date();
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).replace(/\./g, ':');
    }
  }
  tick();
  setInterval(tick, 1000);
})();