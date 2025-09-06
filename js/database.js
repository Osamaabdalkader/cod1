// إدارة قاعدة البيانات
class DatabaseManager {
  constructor() {
    this.db = firebase.database();
  }

  // إنشاء مستخدم جديد
  async createUser(userId, email, name, referralCode = null) {
    const userRef = this.db.ref('users/' + userId);
    const userReferralCode = this.generateReferralCode();
    
    const userData = {
      name: name,
      email: email,
      referralCode: userReferralCode,
      points: 0,
      joinDate: new Date().toISOString(),
      referredBy: null
    };

    // إذا كان هناك رمز إحالة، البحث عن المستخدم الذي أحاله
    if (referralCode) {
      const referrerId = await this.getUserIdFromReferralCode(referralCode);
      if (referrerId) {
        userData.referredBy = referrerId;
        
        // إضافة المستخدم الجديد إلى قائمة إحالات المُحيل
        await this.db.ref('userReferrals/' + referrerId + '/' + userId).set({
          name: name,
          email: email,
          joinDate: new Date().toISOString(),
          level: 1
        });

        // منح نقاط للمُحيل
        await this.db.ref('users/' + referrerId + '/points').transaction(points => (points || 0) + 10);
      }
    }

    // حفظ بيانات المستخدم
    await userRef.set(userData);
    
    // حفظ رمز الإحالة للبحث السريع
    await this.db.ref('referralCodes/' + userReferralCode).set(userId);
    
    return userData;
  }

  // تحميل بيانات المستخدم
  async loadUserData(userId) {
    try {
      const snapshot = await this.db.ref('users/' + userId).once('value');
      return snapshot.val();
    } catch (error) {
      console.error("Error loading user data:", error);
      return null;
    }
  }

  // تحميل الإحالات المباشرة
  async loadDirectReferrals(userId) {
    try {
      const snapshot = await this.db.ref('userReferrals/' + userId).once('value');
      return snapshot.val();
    } catch (error) {
      console.error("Error loading referrals:", error);
      return null;
    }
  }

  // تحميل الشبكة الكاملة (الإحالات المباشرة وغير المباشرة)
  async loadNetwork(userId, maxLevel = 10) {
    const network = {};
    await this.loadNetworkRecursive(userId, network, 0, maxLevel);
    return network;
  }

  // دالة مساعدة متكررة لتحميل الشبكة
  async loadNetworkRecursive(userId, network, currentLevel, maxLevel) {
    if (currentLevel > maxLevel) return;

    const referrals = await this.loadDirectReferrals(userId);
    if (!referrals) return;

    network[userId] = {
      level: currentLevel,
      referrals: {}
    };

    for (const referredUserId in referrals) {
      network[userId].referrals[referredUserId] = {
        data: referrals[referredUserId],
        level: currentLevel + 1
      };
      
      // تحميل إحالات المستخدم المُحال (التكرار)
      await this.loadNetworkRecursive(
        referredUserId, 
        network[userId].referrals, 
        currentLevel + 1, 
        maxLevel
      );
    }
  }

  // الحصول على معرف المستخدم من رمز الإحالة
  async getUserIdFromReferralCode(referralCode) {
    try {
      const snapshot = await this.db.ref('referralCodes/' + referralCode).once('value');
      return snapshot.val();
    } catch (error) {
      console.error("Error getting user ID from referral code:", error);
      return null;
    }
  }

  // إنشاء رمز إحالة فريد
  generateReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}

const db = new DatabaseManager();