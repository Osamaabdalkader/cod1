// إدارة واجهة المستخدم
class UIManager {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  // الحصول على الصفحة الحالية
  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('login.html')) return 'login';
    if (path.includes('dashboard.html')) return 'dashboard';
    if (path.includes('network.html')) return 'network';
    if (path.includes('management.html')) return 'management';
    return 'index';
  }

  // تهيئة الواجهة
  init() {
    this.setupEventListeners();
    
    // التحقق من حالة المصادقة
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.updateUI(user);
        
        // تحميل بيانات المستخدم
        db.loadUserData(user.uid).then(userData => {
          if (userData) {
            referralSystem.setUser(user, userData);
            this.updateUserData(userData);
            
            // إذا كانت صفحة الشبكة، تحميل الشبكة
            if (this.currentPage === 'network') {
              this.loadNetwork();
            }
          }
        });
      } else {
        this.updateUI(null);
        
        // إذا لم تكن في صفحة تسجيل الدخول، إعادة التوجيه
        if (this.currentPage !== 'login' && this.currentPage !== 'index') {
          window.location.href = 'login.html';
        }
      }
    });
  }

  // إعداد مستمعي الأحداث
  setupEventListeners() {
    // تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // إنشاء حساب
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignup();
      });
    }

    // تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        auth.signOut();
      });
    }

    // نسخ رابط الإحالة
    const copyLinkBtn = document.getElementById('copy-link-btn');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => {
        if (referralSystem.copyReferralLink()) {
          this.showAlert('تم نسخ رابط الإحالة بنجاح', 'success');
        } else {
          this.showAlert('فشل في نسخ الرابط', 'error');
        }
      });
    }

    // مشاركة على وسائل التواصل
    const shareFbBtn = document.getElementById('share-fb');
    const shareTwitterBtn = document.getElementById('share-twitter');
    const shareWhatsappBtn = document.getElementById('share-whatsapp');

    if (shareFbBtn) shareFbBtn.addEventListener('click', () => referralSystem.shareOnFacebook());
    if (shareTwitterBtn) shareTwitterBtn.addEventListener('click', () => referralSystem.shareOnTwitter());
    if (shareWhatsappBtn) shareWhatsappBtn.addEventListener('click', () => referralSystem.shareOnWhatsApp());
  }

  // معالجة تسجيل الدخول
  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
      this.showAlert('يرجى ملء جميع الحقول', 'error');
      return;
    }
    
    const result = await auth.signIn(email, password);
    if (result.success) {
      this.showAlert('تم تسجيل الدخول بنجاح', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      this.showAlert(result.error, 'error');
    }
  }

  // معالجة إنشاء حساب
  async handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const referralCode = document.getElementById('referral-code').value;
    
    if (!name || !email || !password) {
      this.showAlert('يرجى ملء جميع الحقول الإلزامية', 'error');
      return;
    }
    
    const result = await auth.signUp(email, password, name, referralCode || null);
    if (result.success) {
      this.showAlert('تم إنشاء الحساب بنجاح', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      this.showAlert(result.error, 'error');
    }
  }

  // تحديث واجهة المستخدم بناءً على حالة المصادقة
  updateUI(user) {
    const authElements = document.querySelectorAll('.auth-only');
    const unauthElements = document.querySelectorAll('.unauth-only');
    
    if (user) {
      authElements.forEach(el => el.style.display = 'block');
      unauthElements.forEach(el => el.style.display = 'none');
    } else {
      authElements.forEach(el => el.style.display = 'none');
      unauthElements.forEach(el => el.style.display = 'block');
    }
  }

  // تحديث بيانات المستخدم في الواجهة
  updateUserData(userData) {
    // تحديث الاسم
    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.textContent = userData.name;
    
    // تحديث صورة المستخدم
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
      userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`;
    }
    
    // تحديث الإحصائيات
    const referralsCount = document.getElementById('referrals-count');
    const pointsCount = document.getElementById('points-count');
    const joinDate = document.getElementById('join-date');
    
    if (referralsCount) referralsCount.textContent = '0'; // سيتم تحديثها لاحقًا
    if (pointsCount) pointsCount.textContent = userData.points || '0';
    if (joinDate) joinDate.textContent = new Date(userData.joinDate).toLocaleDateString('ar-SA');
    
    // تحديث رابط الإحالة
    const referralLink = document.getElementById('referral-link');
    if (referralLink) {
      referralLink.value = referralSystem.getReferralLink();
    }
    
    // تحميل عدد الإحالات المباشرة
    if (userData && auth.user) {
      db.loadDirectReferrals(auth.user.uid).then(referrals => {
        if (referrals && referralsCount) {
          referralsCount.textContent = Object.keys(referrals).length;
        }
      });
    }
  }

  // تحميل الشبكة وعرضها
  async loadNetwork() {
    const networkContainer = document.getElementById('network-container');
    if (!networkContainer) return;
    
    networkContainer.innerHTML = '<div class="loading">جاري تحميل الشبكة...</div>';
    
    const networkData = await referralSystem.loadNetwork();
    if (networkData) {
      referralSystem.renderNetwork(networkData, networkContainer);
    } else {
      networkContainer.innerHTML = '<div class="error">فشل في تحميل الشبكة</div>';
    }
  }

  // عرض تنبيه
  showAlert(message, type) {
    // إنشاء عنصر التنبيه إذا لم يكن موجودًا
    let alertEl = document.getElementById('global-alert');
    if (!alertEl) {
      alertEl = document.createElement('div');
      alertEl.id = 'global-alert';
      document.body.appendChild(alertEl);
    }
    
    // تعيين المحتوى والنمط
    alertEl.textContent = message;
    alertEl.className = `alert alert-${type}`;
    alertEl.style.display = 'block';
    
    // إخفاء التنبيه بعد 3 ثوان
    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 3000);
  }
}

const ui = new UIManager();