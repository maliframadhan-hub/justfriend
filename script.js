// =========================================================
// ELEMEN UMUM
// =========================================================
const form = document.getElementById('contactForm');
const toast = document.getElementById('toast');

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const realtimeClock = document.getElementById('realtimeClock');
const realtimeDate = document.getElementById('realtimeDate');
const soundToggle = document.querySelector('.sound-toggle');
const backgroundMusic = document.getElementById('backgroundMusic');

let toastTimer = null;
function showToast(message, duration = 2000) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// =========================================================
// BACKSOUND
// =========================================================
if (soundToggle && backgroundMusic) {
  soundToggle.addEventListener('click', async () => {
    const isPlaying = soundToggle.classList.toggle('is-playing');
    soundToggle.setAttribute('aria-pressed', String(isPlaying));
    soundToggle.setAttribute('aria-label', isPlaying ? 'Matikan backsound' : 'Nyalakan backsound');
    soundToggle.textContent = isPlaying ? '♫' : '♪';
    if (isPlaying) {
      try {
        await backgroundMusic.play();
      } catch (error) {
        soundToggle.classList.remove('is-playing');
        soundToggle.setAttribute('aria-pressed', 'false');
        soundToggle.setAttribute('aria-label', 'Nyalakan backsound');
        soundToggle.textContent = '♪';
      }
    } else {
      backgroundMusic.pause();
    }
  });
}

// =========================================================
// JAM & TANGGAL REALTIME
// =========================================================
function updateRealtimeClock() {
  const now = new Date();
  if (realtimeClock) realtimeClock.textContent = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
  if (realtimeDate) realtimeDate.textContent = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);
}

updateRealtimeClock();
setInterval(updateRealtimeClock, 1000);

// =========================================================
// NAVIGASI MOBILE
// =========================================================
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.querySelectorAll(':scope > a').forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Buka menu navigasi');
    });
  });
}

// =========================================================
// PESAN VIA WHATSAPP DARI MENU PRODUK
// =========================================================
const WA_ADMIN = '6283107066531'; // nomor WhatsApp admin (format internasional tanpa +)

document.querySelectorAll('.btn-pesan').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const product = btn.dataset.product;
    const price = btn.dataset.price;
    
    const message = `Halo JusTFriend, saya ingin pesan ${product} (Rp ${price}).`;
    const whatsappUrl = `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(message)}`;
    
    showToast(`Membuka WhatsApp untuk memesan ${product}...`, 1000);
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 500);
  });
});

// =========================================================
// CONTACT FORM - KIRIM KE WHATSAPP
// =========================================================
if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nama = document.getElementById('nama').value.trim();
    const email = document.getElementById('email').value.trim();
    const topik = document.getElementById('topik').value.trim();
    const pesan = document.getElementById('pesan').value.trim();

    if (!nama || !email || !pesan) {
      showToast('Isi nama, email, dan pesan terlebih dahulu');
      return;
    }

    const message = `Halo JusTFriend,\n\nNama: ${nama}\nEmail: ${email}\nTopik: ${topik || 'Umum'}\n\nPesan:\n${pesan}`;
    const whatsappUrl = `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(message)}`;

    showToast('Membuka WhatsApp untuk mengirim pesanmu...', 1000);
    form.reset();

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 500);
  });
}

// =========================================================
// PEMBAYARAN (QRIS)
// =========================================================
const payModal = document.getElementById('payModal');

if (payModal) {
  const confirmBtn = document.getElementById('payConfirm');

  const openPay = () => {
    payModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const closePay = () => {
    payModal.hidden = true;
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-open-pay]').forEach((btn) => btn.addEventListener('click', openPay));
  payModal.querySelectorAll('[data-close-pay]').forEach((el) => el.addEventListener('click', closePay));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !payModal.hidden) closePay();
  });

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const nama = document.getElementById('payNama').value.trim();
      const nominal = Number(document.getElementById('payNominal').value);

      if (!nama || !nominal) {
        showToast('Isi nama dan nominal dulu ya');
        return;
      }

      const rupiah = new Intl.NumberFormat('id-ID').format(nominal);
      const metode = 'QRIS';
      const text = `Halo JusTFriend, saya sudah bayar.\n\nNama: ${nama}\nMetode: ${metode}\nNominal: Rp ${rupiah}\n\n(Bukti pembayaran saya lampirkan di chat ini)`;

      window.open(`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(text)}`, '_blank');
      closePay();
    });
  }
}