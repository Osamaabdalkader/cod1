// نظام الإحالة
class ReferralSystem {
  constructor() {
    this.currentUser = null;
    this.userData = null;
    this.networkData = null;
  }

  // تعيين المستخدم الحالي
  setUser(user, userData) {
    this.currentUser = user;
    this.userData = userData;
  }

  // الحصول على رابط الإحالة
  getReferralLink() {
    if (!this.userData) return '';
    return `${window.location.origin}${window.location.pathname}?ref=${this.userData.referralCode}`;
  }

  // نسخ رابط الإحالة
  copyReferralLink() {
    const link = this.getReferralLink();
    if (!link) return false;

    const tempInput = document.createElement('input');
    tempInput.value = link;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    return true;
  }

  // مشاركة على وسائل التواصل
  shareOnFacebook() {
    const url = encodeURIComponent(this.getReferralLink());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  shareOnTwitter() {
    const text = encodeURIComponent('انضم إلى هذا الموقع الرائع عبر رابط الإحالة الخاص بي!');
    const url = encodeURIComponent(this.getReferralLink());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  shareOnWhatsApp() {
    const text = encodeURIComponent('انضم إلى هذا الموقع الرائع عبر رابط الإحالة الخاص بي: ');
    const url = encodeURIComponent(this.getReferralLink());
    window.open(`https://wa.me/?text=${text}${url}`, '_blank');
  }

  // تحميل شبكة الإحالات
  async loadNetwork() {
    if (!this.currentUser) return null;
    
    try {
      this.networkData = await db.loadNetwork(this.currentUser.uid);
      return this.networkData;
    } catch (error) {
      console.error("Error loading network:", error);
      return null;
    }
  }

  // إنشاء تمثيل مرئي للشبكة
  renderNetwork(networkData, container) {
    if (!networkData || !container) return;
    
    container.innerHTML = '';
    
    // البدء من المستخدم الحالي
    this.renderNetworkNode(this.currentUser.uid, networkData, container, 0);
  }

  // دالة مساعدة لعقدة الشبكة
  renderNetworkNode(userId, networkData, container, level) {
    if (!networkData[userId]) return;
    
    const node = document.createElement('div');
    node.className = `network-node level-${level}`;
    
    // تحميل بيانات المستخدم إذا لزم الأمر
    db.loadUserData(userId).then(userData => {
      if (userData) {
        node.innerHTML = `
          <div class="node-header">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random" alt="صورة المستخدم">
            <div class="node-info">
              <h4>${userData.name}</h4>
              <p>${userData.email}</p>
              <span class="user-level">المستوى: ${level}</span>
            </div>
            <div class="node-stats">
              <span class="points">${userData.points || 0} نقطة</span>
            </div>
          </div>
        `;
        
        // إذا كان هناك إحالات، إضافة زر للتوسيع
        if (networkData[userId].referrals && Object.keys(networkData[userId].referrals).length > 0) {
          const expandBtn = document.createElement('button');
          expandBtn.className = 'expand-btn';
          expandBtn.innerHTML = `<i class="fas fa-chevron-down"></i> ${Object.keys(networkData[userId].referrals).length} إحالة`;
          expandBtn.onclick = () => this.toggleNodeExpansion(node, networkData[userId].referrals, level + 1);
          node.appendChild(expandBtn);
        }
        
        container.appendChild(node);
      }
    });
  }

  // تبديل توسيع/طي عقدة الشبكة
  toggleNodeExpansion(node, referrals, level) {
    const childrenContainer = node.querySelector('.node-children');
    
    if (childrenContainer) {
      // إذا كان هناك حاوية أطفال بالفعل، قم بالتبديل
      childrenContainer.style.display = childrenContainer.style.display === 'none' ? 'block' : 'none';
    } else {
      // إذا لم تكن هناك حاوية أطفال، قم بإنشائها وعرضها
      const newChildrenContainer = document.createElement('div');
      newChildrenContainer.className = 'node-children';
      
      for (const referredUserId in referrals) {
        this.renderNetworkNode(referredUserId, referrals, newChildrenContainer, level);
      }
      
      node.appendChild(newChildrenContainer);
    }
  }
}

const referralSystem = new ReferralSystem();