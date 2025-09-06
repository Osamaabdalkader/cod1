// إدارة المصادقة
class AuthManager {
  constructor() {
    this.user = null;
    this.init();
  }

  init() {
    firebase.auth().onAuthStateChanged((user) => {
      this.user = user;
      if (user) {
        this.onUserSignedIn(user);
      } else {
        this.onUserSignedOut();
      }
    });
  }

  async signUp(email, password, name, referralCode = null) {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const userId = userCredential.user.uid;
      
      // حفظ بيانات المستخدم في قاعدة البيانات
      await db.createUser(userId, email, name, referralCode);
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      await firebase.auth().signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  onUserSignedIn(user) {
    // تحديث الواجهة عند تسجيل الدخول
    if (typeof ui.updateUI === 'function') {
      ui.updateUI(user);
    }
    
    // تحميل بيانات المستخدم
    db.loadUserData(user.uid);
  }

  onUserSignedOut() {
    // تحديث الواجهة عند تسجيل الخروج
    if (typeof ui.updateUI === 'function') {
      ui.updateUI(null);
    }
    
    // إعادة التوجيه إلى صفحة تسجيل الدخول
    if (window.location.pathname !== '/login.html') {
      window.location.href = 'login.html';
    }
  }
}

const auth = new AuthManager();
