
// مجتمع فلاحي 2.0 — واجهة اجتماعية مستقلة
(() => {
  "use strict";

  const SUPABASE_URL = "https://kldxlodykkomkresegyt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_AOy4zEw5LYHklwYOaQGmoA_G01FCILJ";

  if (!window.supabase) {
    alert("تعذر تحميل Supabase. تحقق من اتصال الإنترنت.");
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const communitySection = document.getElementById("community");
  const root = document.getElementById("community-app") || communitySection;

  if (!root) {
    console.error("لم يتم العثور على community-app أو community");
    return;
  }

  const $ = id => document.getElementById(id);
  const hiddenElements = [];
  const oldBack = communitySection?.querySelector('.back[data-go="home"]');

  function hideElement(el) {
    if (!el || ["SCRIPT", "STYLE"].includes(el.tagName)) return;
    if (hiddenElements.some(item => item.el === el)) return;

    hiddenElements.push({
      el,
      display: el.style.display
    });

    el.style.display = "none";
  }

  // إصلاح تعريف الدالة التي كانت تسبب الصفحة البيضاء
  function enterCommunityMode() {
    if (!communitySection) return;

    [...communitySection.children].forEach(el => {
      if (el !== root) hideElement(el);
    });

    let current = communitySection;

    while (current.parentElement) {
      const parent = current.parentElement;

      [...parent.children].forEach(el => {
        if (el !== current) hideElement(el);
      });

      if (parent === document.body) break;
      current = parent;
    }
  }

  function leaveCommunityMode() {
    hiddenElements.forEach(item => {
      item.el.style.display = item.display;
    });

    hiddenElements.length = 0;

    if (oldBack) {
      oldBack.click();
    } else {
      const homeButton = document.querySelector('[data-go="home"]');
      if (homeButton) homeButton.click();
    }
  }

  let currentUser = null;
  let isAdmin = false;
  let phonePending = false;
  let profilesCache = {};
  let allPosts = [];
  let allLikes = [];
  let allComments = [];
  let activeProfileId = null;

  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

  const avatar = (url, name = "فلاح", size = "") => {
    const style = size ? `style="width:${size};height:${size}"` : "";

    return url
      ? `<img class="fc-avatar" ${style} src="${esc(url)}" alt="${esc(name)}">`
      : `<div class="fc-avatar fc-avatar-placeholder" ${style}>👨‍🌾</div>`;
  };

  const msg = text => {
    if ($("fc-message")) $("fc-message").textContent = text || "";
  };

  root.innerHTML = `
    <style>
      #community-app,#community{
        direction:rtl;text-align:right;font-family:inherit;color:#183329;
      }
      #community-app{
        --ig-green:#176b45;--ig-border:#e8eee9;--ig-muted:#87938b;
        padding-bottom:75px;background:#f7faf8;min-height:100vh;
        width:100%;box-sizing:border-box;
      }
      #community-app *{box-sizing:border-box}
      .fc-hidden{display:none!important}
      .fc-topbar{
        position:sticky;top:0;z-index:20;background:#fff;
        border-bottom:1px solid var(--ig-border);
        display:flex;align-items:center;justify-content:space-between;
        padding:12px 14px;
      }
      .fc-brand{font-size:19px;font-weight:900;color:#176b45}
      .fc-top-actions{display:flex;gap:8px;align-items:center}
      .fc-icon-btn{
        border:0;background:#f0f5f1;border-radius:50%;
        width:39px;height:39px;font-size:19px;cursor:pointer;
      }
      .fc-message{
        margin:8px 12px;color:#176b45;font-size:12px;
        min-height:0;line-height:1.7;
      }
      .fc-auth-card,.fc-box{
        background:#fff;border:1px solid var(--ig-border);
        border-radius:15px;padding:14px;margin:12px 0;
      }
      .fc-auth-card h3{margin:4px 0 8px}
      .fc-input{
        width:100%;box-sizing:border-box;padding:12px;
        border:1px solid #dfe8e1;border-radius:10px;
        margin:6px 0;font:inherit;background:#fff;
      }
      .fc-btn{
        border:0;border-radius:10px;padding:10px 15px;
        background:#176b45;color:white;font:inherit;
        cursor:pointer;font-weight:700;
      }
      .fc-btn:disabled{opacity:.6;cursor:wait}
      .fc-light{background:#edf5ef;color:#176b45}
      .fc-muted{color:var(--ig-muted);font-size:12px;line-height:1.7}
      .fc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .fc-auth-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .fc-auth-actions .fc-btn{width:100%}
      .fc-avatar{
        width:43px;height:43px;border-radius:50%;object-fit:cover;
        border:2px solid #d7eadc;flex-shrink:0;
      }
      .fc-avatar-placeholder{
        display:flex;align-items:center;justify-content:center;
        background:#e9f4ec;font-size:23px;
      }
      .fc-stories{
        display:flex;gap:14px;overflow-x:auto;padding:13px 12px;
        background:#fff;border-bottom:1px solid var(--ig-border);
      }
      .fc-story{
        flex:0 0 65px;text-align:center;cursor:pointer;
        font-size:11px;color:#526258;
      }
      .fc-story-ring{
        width:61px;height:61px;border-radius:50%;padding:3px;
        margin:0 auto 5px;
        background:linear-gradient(45deg,#f5a623,#d64b6b,#176b45);
      }
      .fc-story-ring>div{
        width:100%;height:100%;border:2px solid white;
        border-radius:50%;overflow:hidden;background:#eaf5ee;
        display:grid;place-items:center;
      }
      .fc-story-ring span{font-size:25px}
      .fc-compose{
        background:#fff;padding:13px 12px;
        border-bottom:1px solid var(--ig-border);
      }
      .fc-compose-top{display:flex;align-items:center;gap:10px}
      .fc-compose-prompt{
        flex:1;border:1px solid #e5ece7;border-radius:22px;
        padding:11px 14px;color:#849087;font-size:13px;
        background:#f8faf8;cursor:pointer;text-align:right;
      }
      .fc-compose-extra{display:flex;gap:9px;margin-top:11px}
      .fc-compose-extra button{
        flex:1;border:0;background:#f0f6f1;color:#176b45;
        border-radius:9px;padding:9px;font:inherit;font-size:12px;
      }
      .fc-post{
        background:#fff;border-bottom:8px solid #f1f5f2;
        padding:13px 12px;margin:0;
      }
      .fc-post-head{
        display:flex;align-items:center;justify-content:space-between;
        gap:8px;margin-bottom:10px;
      }
      .fc-author{display:flex;align-items:center;gap:9px;cursor:pointer;min-width:0}
      .fc-author-info{min-width:0}
      .fc-author-info strong{display:block;font-size:13px;color:#1c392a}
      .fc-author-info .fc-muted{font-size:10px}
      .fc-post-menu{border:0;background:transparent;font-size:22px;color:#758078}
      .fc-post-text{
        font-size:14px;line-height:1.8;white-space:pre-wrap;
        overflow-wrap:anywhere;margin:8px 0 11px;
      }
      .fc-post-image{
        width:calc(100% + 24px);margin:0 -12px;
        max-height:520px;object-fit:cover;display:block;background:#f0f3f0;
      }
      .fc-post-actions{display:flex;align-items:center;gap:17px;padding:10px 0 3px}
      .fc-action{
        border:0;background:none;padding:3px 0;color:#263c2f;
        font:inherit;font-size:14px;cursor:pointer;
      }
      .fc-action.liked{color:#e34252}
      .fc-likes-count{font-size:12px;font-weight:800;margin-top:5px}
      .fc-comment-preview{font-size:12px;color:#58665d;margin-top:5px}
      .fc-comments{background:#f8faf8;border-radius:11px;padding:10px;margin-top:10px}
      .fc-comment-row{font-size:12px;line-height:1.7;padding:5px 0;overflow-wrap:anywhere}
      .fc-comment-row b{color:#176b45}
      .fc-comment-form{display:flex;gap:6px;margin-top:8px}
      .fc-comment-form input{flex:1;min-width:0;margin:0}
      .fc-comment-form button{white-space:nowrap}
      .fc-bottom-nav{
        position:fixed;bottom:0;left:0;right:0;z-index:30;
        background:#fff;border-top:1px solid var(--ig-border);
        display:grid;grid-template-columns:repeat(4,1fr);
        padding:8px 3px calc(8px + env(safe-area-inset-bottom));
      }
      .fc-bottom-nav button{
        border:0;background:none;color:#68766d;font-size:10px;
        padding:3px;cursor:pointer;
      }
      .fc-bottom-nav button span{display:block;font-size:21px;margin-bottom:2px}
      .fc-bottom-nav button.active{color:#176b45;font-weight:900}
      .fc-profile-head{
        background:#fff;border-bottom:1px solid var(--ig-border);
        padding:15px 13px;
      }
      .fc-profile-top{display:flex;align-items:center;gap:18px}
      .fc-profile-avatar{
        width:88px;height:88px;border-radius:50%;
        object-fit:cover;border:3px solid #e3efe6;
      }
      .fc-profile-stats{
        display:flex;justify-content:space-around;flex:1;text-align:center;
      }
      .fc-profile-stats strong{display:block;font-size:18px}
      .fc-profile-stats span{font-size:11px;color:#7a877e}
      .fc-profile-name{font-size:16px;font-weight:900;margin:12px 0 3px}
      .fc-profile-bio{font-size:13px;line-height:1.8;white-space:pre-wrap}
      .fc-profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:3px}
      .fc-grid-item{aspect-ratio:1/1;background:#edf2ee;overflow:hidden;position:relative;cursor:pointer}
      .fc-grid-item img{width:100%;height:100%;object-fit:cover}
      .fc-grid-text{font-size:10px;padding:7px;line-height:1.5;overflow:hidden;max-height:100%}
      .fc-grid-count{
        position:absolute;bottom:5px;left:5px;color:white;
        background:#0009;padding:3px 6px;border-radius:8px;font-size:10px;
      }
      .fc-profile-tabs{
        display:flex;justify-content:center;padding:13px;
        border-bottom:1px solid var(--ig-border);
        color:#176b45;font-weight:900;font-size:13px;
      }
      .fc-profile-edit{
        width:100%;margin-top:12px;background:#edf5ef;color:#176b45;
        border:0;border-radius:9px;padding:9px;font:inherit;font-weight:800;
      }
      .fc-profile-panel{
        background:#fff;border:1px solid var(--ig-border);
        border-radius:14px;padding:14px;margin:12px 0;
      }
      .fc-photo-preview{
        width:100px;height:100px;border-radius:50%;
        object-fit:cover;display:block;margin:10px auto;
        border:3px solid #176b45;
      }
      .fc-label{display:block;font-size:12px;font-weight:800;margin-top:10px}
      .fc-empty{text-align:center;padding:35px 15px;color:#7b887f;background:#fff;font-size:13px;line-height:2}
      .fc-detail-image{width:100%;max-height:500px;object-fit:contain;background:#f0f3f0;border-radius:10px}
      .fc-admin{padding:12px;background:#fff}
      @media(min-width:620px){
        #community-app{max-width:650px;margin:0 auto;border-left:1px solid #e8eee9;border-right:1px solid #e8eee9}
        .fc-post{border:1px solid var(--ig-border);border-radius:14px;margin:12px 0}
        .fc-post-image{width:100%;margin:0;max-height:520px;border-radius:9px}
        .fc-compose{border:1px solid var(--ig-border);border-radius:14px;margin:12px 0}
        .fc-bottom-nav{left:50%;right:auto;transform:translateX(-50%);width:min(650px,100%)}
      }
    </style>

    <div class="fc-topbar">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="fc-icon-btn" id="fc-back-app" title="العودة إلى فلاحي">←</button>
        <div class="fc-brand">🌱 المجتمع الفلاحي</div>
      </div>
      <div class="fc-top-actions">
        <button class="fc-icon-btn" id="fc-search-toggle" title="بحث">⌕</button>
        <button class="fc-icon-btn" id="fc-profile-shortcut" title="ملفي">👤</button>
      </div>
    </div>

    <div id="fc-message" class="fc-message" role="status"></div>

    <div id="fc-search-box" class="fc-hidden" style="padding:8px 12px;background:#fff">
      <input id="fc-search" class="fc-input" placeholder="ابحث عن منشور أو محصول...">
    </div>

    <div id="fc-auth" class="fc-auth-card">
      <h3>🌱 مرحباً بك في المجتمع الفلاحي</h3>
      <p class="fc-muted">تواصل مع الفلاحين، شارك تجاربك وتعلم من الآخرين.</p>
      <input id="fc-email" class="fc-input" type="email" placeholder="البريد الإلكتروني">
      <input id="fc-password" class="fc-input" type="password" placeholder="كلمة المرور">
      <input id="fc-name" class="fc-input" placeholder="الاسم عند إنشاء الحساب">
      <div class="fc-auth-actions">
        <button class="fc-btn" id="fc-signup">إنشاء حساب</button>
        <button class="fc-btn fc-light" id="fc-login">دخول</button>
      </div>
      <hr style="border:0;border-top:1px solid #e8eee9;margin:15px 0">
      <p class="fc-muted">أو الدخول برقم الهاتف</p>
      <input id="fc-phone" class="fc-input" type="tel" placeholder="+2126XXXXXXXX">
      <button class="fc-btn fc-light" id="fc-send-code">إرسال رمز الهاتف</button>
      <div id="fc-phone-verify" class="fc-hidden">
        <input id="fc-code" class="fc-input" placeholder="رمز التحقق">
        <button class="fc-btn" id="fc-verify-code">تأكيد الرمز</button>
      </div>
    </div>

    <div id="fc-user" class="fc-hidden">
      <div class="fc-stories">
        <div class="fc-story" id="fc-my-story">
          <div class="fc-story-ring"><div><span>＋</span></div></div>
          حسابي
        </div>
        <div class="fc-story"><div class="fc-story-ring"><div><span>🌱</span></div></div>المحاصيل</div>
        <div class="fc-story"><div class="fc-story-ring"><div><span>🚜</span></div></div>المعدات</div>
        <div class="fc-story"><div class="fc-story-ring"><div><span>💧</span></div></div>السقي</div>
      </div>

      <div class="fc-compose">
        <div class="fc-compose-top">
          <div id="fc-compose-avatar"></div>
          <button class="fc-compose-prompt" id="fc-compose-open">شارك شيئاً مع الفلاحين...</button>
        </div>
        <div class="fc-compose-extra">
          <button id="fc-add-photo">📷 إضافة صورة</button>
          <button id="fc-compose-text">✍️ كتابة منشور</button>
        </div>
      </div>

      <div id="fc-publish" class="fc-profile-panel fc-hidden">
        <h3 style="margin-top:0">✍️ منشور جديد</h3>
        <textarea id="fc-content" class="fc-input" rows="4" maxlength="5000" placeholder="شنو بغيتي تشارك مع الفلاحين؟"></textarea>
        <label class="fc-label">إضافة صورة</label>
        <input id="fc-image" class="fc-input" type="file" accept="image/*">
        <div id="fc-image-preview"></div>
        <div class="fc-actions">
          <button class="fc-btn" id="fc-publish-btn">نشر الآن</button>
          <button class="fc-btn fc-light" id="fc-publish-close">إلغاء</button>
        </div>
      </div>

      <div id="fc-feed"></div>
    </div>

    <div id="fc-public-profile" class="fc-hidden"></div>
    <div id="fc-post-detail" class="fc-hidden"></div>

    <div id="fc-profile-panel" class="fc-profile-panel fc-hidden">
      <h3 style="margin-top:0;color:#176b45">تعديل حسابك</h3>
      <label class="fc-label">الصورة الشخصية</label>
      <img id="fc-avatar-preview" class="fc-photo-preview"
        src="https://placehold.co/200x200/e5f2e9/176b45?text=Farmer" alt="الصورة الشخصية">
      <input id="fc-avatar-file" class="fc-input" type="file" accept="image/*">
      <label class="fc-label">الاسم الكامل</label>
      <input id="fc-profile-name" class="fc-input" placeholder="اسمك">
      <label class="fc-label">المدينة أو المنطقة</label>
      <input id="fc-profile-city" class="fc-input" placeholder="مثلاً: القنيطرة">
      <label class="fc-label">نبذة عنك</label>
      <textarea id="fc-profile-bio" class="fc-input" rows="3" maxlength="1000" placeholder="عرفنا على نشاطك الفلاحي..."></textarea>
      <label class="fc-label">المحاصيل والأشجار التي تهتم بها</label>
      <input id="fc-profile-crops" class="fc-input" placeholder="الأفوكادو، الزيتون، الحوامض...">
      <div class="fc-actions">
        <button class="fc-btn" id="fc-profile-save">حفظ التغييرات</button>
        <button class="fc-btn fc-light" id="fc-profile-close">إغلاق</button>
      </div>
    </div>

    <div id="fc-admin-area" class="fc-hidden"></div>

    <div class="fc-bottom-nav" id="fc-bottom-nav">
      <button class="active" data-tab="feed"><span>⌂</span>الرئيسية</button>
      <button data-tab="search"><span>⌕</span>استكشاف</button>
      <button data-tab="create"><span>＋</span>نشر</button>
      <button data-tab="profile"><span>👤</span>حسابي</button>
    </div>
  `;

  // تشغيل وضع المجتمع بعد بناء الواجهة
  enterCommunityMode();

  $("fc-back-app").onclick = leaveCommunityMode;

  function setTab(tab) {
    document.querySelectorAll("#fc-bottom-nav button").forEach(b => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });

    $("fc-profile-panel").classList.add("fc-hidden");
    $("fc-public-profile").classList.add("fc-hidden");
    $("fc-post-detail").classList.add("fc-hidden");

    if (tab === "feed") {
      $("fc-search-box").classList.add("fc-hidden");
      $("fc-user").classList.toggle("fc-hidden", !currentUser);
      $("fc-feed").classList.remove("fc-hidden");
      $("fc-publish").classList.add("fc-hidden");
    }

    if (tab === "search") {
      $("fc-search-box").classList.remove("fc-hidden");
      $("fc-user").classList.toggle("fc-hidden", !currentUser);
      $("fc-feed").classList.remove("fc-hidden");
      $("fc-publish").classList.add("fc-hidden");
      $("fc-search").focus();
    }

    if (tab === "create") {
      if (!currentUser) return msg("سجل الدخول أولاً باش تنشر.");
      $("fc-user").classList.remove("fc-hidden");
      $("fc-publish").classList.remove("fc-hidden");
      $("fc-search-box").classList.add("fc-hidden");
      $("fc-content").focus();
    }

    if (tab === "profile") {
      if (!currentUser) return msg("سجل الدخول أولاً.");
      openProfile(currentUser.id);
    }

    window.scrollTo({top:root.offsetTop,behavior:"smooth"});
  }

  $("fc-bottom-nav").querySelectorAll("button").forEach(btn => {
    btn.onclick = () => setTab(btn.dataset.tab);
  });

  $("fc-search-toggle").onclick = () => setTab("search");
  $("fc-profile-shortcut").onclick = () => setTab("profile");
  $("fc-my-story").onclick = () => setTab("profile");
  $("fc-compose-open").onclick = () => setTab("create");
  $("fc-compose-text").onclick = () => setTab("create");

  $("fc-add-photo").onclick = () => {
    setTab("create");
    $("fc-image").click();
  };

  $("fc-publish-close").onclick = () => {
    $("fc-publish").classList.add("fc-hidden");
    setTab("feed");
  };

  // معاينة الصور
  $("fc-avatar-file").onchange = () => {
    const file = $("fc-avatar-file").files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      msg("اختار صورة أقل من 5 ميغابايت.");
      $("fc-avatar-file").value = "";
      return;
    }

    $("fc-avatar-preview").src = URL.createObjectURL(file);
  };

  $("fc-image").onchange = () => {
    const file = $("fc-image").files[0];
    $("fc-image-preview").innerHTML = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      msg("الصورة يجب أن تكون أقل من 5 ميغابايت.");
      $("fc-image").value = "";
      return;
    }

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.cssText = "width:100%;max-height:230px;object-fit:contain;border-radius:10px;margin-top:8px";
    $("fc-image-preview").append(img);
  };

  // تحميل المستخدم وإنشاء ملفه الشخصي عند الحاجة
  async function refreshUser() {
    const {data,error} = await db.auth.getUser();
    currentUser = error ? null : data.user || null;
    isAdmin = false;

    if (currentUser) {
      let {data:profile,error:profileError} = await db.from("profiles")
        .select("id,full_name,role,is_banned,city,bio,crops,avatar_url")
        .eq("id",currentUser.id)
        .maybeSingle();

      if (!profile && !profileError) {
        const fallbackName =
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          "فلاح";

        const {error:insertError} = await db.from("profiles").upsert({
          id:currentUser.id,
          full_name:fallbackName
        },{onConflict:"id",ignoreDuplicates:true});

        if (!insertError) {
          const result = await db.from("profiles")
            .select("id,full_name,role,is_banned,city,bio,crops,avatar_url")
            .eq("id",currentUser.id)
            .maybeSingle();

          profile = result.data;
          profileError = result.error;
        } else {
          console.warn("تعذر إنشاء الملف الشخصي:",insertError.message);
        }
      }

      if (profileError) {
        msg("تعذر تحميل الملف الشخصي: " + profileError.message);
      }

      if (profile?.is_banned) {
        await db.auth.signOut();
        currentUser = null;
        alert("هذا الحساب محظور من طرف الإدارة.");
      } else {
        isAdmin = profile?.role === "admin";
        profilesCache[currentUser.id] = profile || {};

        $("fc-profile-name").value =
          profile?.full_name || currentUser.user_metadata?.full_name || "";
        $("fc-profile-city").value = profile?.city || "";
        $("fc-profile-bio").value = profile?.bio || "";
        $("fc-profile-crops").value =
          Array.isArray(profile?.crops) ? profile.crops.join("، ") : "";

        $("fc-avatar-preview").src = profile?.avatar_url ||
          "https://placehold.co/200x200/e5f2e9/176b45?text=Farmer";

        $("fc-compose-avatar").innerHTML =
          avatar(profile?.avatar_url,profile?.full_name);
      }
    }

    $("fc-auth").classList.toggle("fc-hidden",!!currentUser);
    $("fc-user").classList.toggle("fc-hidden",!currentUser);

    if (!currentUser) {
      $("fc-profile-panel").classList.add("fc-hidden");
      $("fc-compose-avatar").innerHTML = "";
    }

    await loadPosts();
    updateAdminButton();
  }

  // حفظ الملف الشخصي
  $("fc-profile-save").onclick = async () => {
    if (!currentUser) return msg("سجل الدخول أولاً.");

    const full_name = $("fc-profile-name").value.trim();
    const city = $("fc-profile-city").value.trim();
    const bio = $("fc-profile-bio").value.trim();
    const crops = $("fc-profile-crops").value
      .split(/[،,]/).map(x => x.trim()).filter(Boolean);

    if (!full_name) return msg("المرجو إدخال الاسم.");

    const button = $("fc-profile-save");
    button.disabled = true;
    button.textContent = "جاري الحفظ...";

    try {
      let avatar_url = profilesCache[currentUser.id]?.avatar_url || null;
      const file = $("fc-avatar-file").files[0];

      if (file) {
        const ext = (file.name.split(".").pop() || "jpg")
          .replace(/[^a-zA-Z0-9]/g,"") || "jpg";
        const path = `${currentUser.id}/avatar-${Date.now()}.${ext}`;

        const {error:uploadError} = await db.storage
          .from("fellahi-images")
          .upload(path,file,{upsert:true});

        if (uploadError) throw uploadError;

        avatar_url = db.storage.from("fellahi-images")
          .getPublicUrl(path).data.publicUrl;
      }

      const {data:saved,error} = await db.from("profiles")
        .upsert({
          id:currentUser.id,
          full_name,
          city,
          bio,
          crops,
          avatar_url
        },{onConflict:"id"})
        .select()
        .single();

      if (error) throw error;

      profilesCache[currentUser.id] = saved;
      await db.auth.updateUser({data:{full_name}});

      $("fc-avatar-file").value = "";
      $("fc-avatar-preview").src = avatar_url ||
        "https://placehold.co/200x200/e5f2e9/176b45?text=Farmer";

      $("fc-profile-panel").classList.add("fc-hidden");
      msg("تم تحديث حسابك بنجاح 🌱");

      await refreshUser();

      if (activeProfileId === currentUser.id) {
        await openProfile(currentUser.id);
      }
    } catch (e) {
      msg("تعذر حفظ الحساب: " + e.message);
    } finally {
      button.disabled = false;
      button.textContent = "حفظ التغييرات";
    }
  };

  $("fc-profile-close").onclick = () =>
    $("fc-profile-panel").classList.add("fc-hidden");

  function editOwnProfile() {
    $("fc-public-profile").classList.add("fc-hidden");
    $("fc-profile-panel").classList.remove("fc-hidden");

    window.scrollTo({
      top:$("fc-profile-panel").offsetTop,
      behavior:"smooth"
    });
  }

  // إنشاء حساب
  $("fc-signup").onclick = async () => {
    const email = $("fc-email").value.trim();
    const password = $("fc-password").value;
    const name = $("fc-name").value.trim();

    if (!email || password.length < 6) {
      return msg("أدخل البريد وكلمة مرور من 6 أحرف على الأقل.");
    }

    const button = $("fc-signup");
    button.disabled = true;

    try {
      const {data,error} = await db.auth.signUp({
        email,
        password,
        options:{data:{full_name:name}}
      });

      if (error) throw error;

      if (data.user && data.session) {
        await refreshUser();
        msg("تم إنشاء حسابك بنجاح 🌱");
      } else {
        msg("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتفعيل الحساب إذا طُلب منك ذلك.");
      }
    } catch (e) {
      msg("تعذر إنشاء الحساب: " + e.message);
    } finally {
      button.disabled = false;
    }
  };

  // تسجيل الدخول
  $("fc-login").onclick = async () => {
    const button = $("fc-login");
    button.disabled = true;

    try {
      const {error} = await db.auth.signInWithPassword({
        email:$("fc-email").value.trim(),
        password:$("fc-password").value
      });

      if (error) throw error;

      msg("تم تسجيل الدخول بنجاح.");
      await refreshUser();
    } catch (e) {
      msg("تعذر تسجيل الدخول: " + e.message);
    } finally {
      button.disabled = false;
    }
  };

  // الدخول بالهاتف
  $("fc-send-code").onclick = async () => {
    const phone = $("fc-phone").value.trim();
    if (!phone) return msg("أدخل رقم الهاتف مع رمز الدولة.");

    const {error} = await db.auth.signInWithOtp({phone});
    if (error) return msg(error.message);

    phonePending = true;
    $("fc-phone-verify").classList.remove("fc-hidden");
    msg("تم إرسال الرمز إذا كان مزود الرسائل مفعلاً.");
  };

  $("fc-verify-code").onclick = async () => {
    if (!phonePending) return;

    const {error} = await db.auth.verifyOtp({
      phone:$("fc-phone").value.trim(),
      token:$("fc-code").value.trim(),
      type:"sms"
    });

    if (error) {
      msg(error.message);
    } else {
      msg("");
      await refreshUser();
    }
  };

  // نشر منشور
  $("fc-publish-btn").onclick = async () => {
    if (!currentUser) return msg("سجل الدخول أولاً.");

    const content = $("fc-content").value.trim();
    const file = $("fc-image").files[0];

    if (!content && !file) return msg("اكتب شيئاً أو أضف صورة.");

    const button = $("fc-publish-btn");
    button.disabled = true;
    button.textContent = "جاري النشر...";

    try {
      let image_url = null;

      if (file) {
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
          throw new Error("الصورة يجب أن تكون أقل من 5 ميغابايت.");
        }

        const ext = (file.name.split(".").pop() || "jpg")
          .replace(/[^a-zA-Z0-9]/g,"") || "jpg";
        const path = `${currentUser.id}/${Date.now()}.${ext}`;

        const {error:uploadError} = await db.storage
          .from("fellahi-images").upload(path,file);

        if (uploadError) throw uploadError;

        image_url = db.storage.from("fellahi-images")
          .getPublicUrl(path).data.publicUrl;
      }

      const {error} = await db.from("posts").insert({
        user_id:currentUser.id,
        content:content || "صورة فلاحية",
        image_url
      });

      if (error) throw error;

      $("fc-content").value = "";
      $("fc-image").value = "";
      $("fc-image-preview").innerHTML = "";
      $("fc-publish").classList.add("fc-hidden");

      msg("تم نشر منشورك بنجاح 🌱");
      await loadPosts();
      setTab("feed");
    } catch (e) {
      msg("تعذر النشر: " + e.message);
    } finally {
      button.disabled = false;
      button.textContent = "نشر الآن";
    }
  };

  // تحميل بيانات الحسابات
  async function getProfiles(ids) {
    const missing = ids.filter(id => id && !profilesCache[id]);

    if (missing.length) {
      const {data,error} = await db.from("profiles")
        .select("id,full_name,city,bio,crops,avatar_url,role")
        .in("id",missing);

      if (error) {
        console.warn("تعذر تحميل بعض الحسابات:",error.message);
      }

      (data || []).forEach(p => profilesCache[p.id] = p);
    }

    return profilesCache;
  }

  // فتح الملف الشخصي العام
  async function openProfile(userId) {
    activeProfileId = userId;

    $("fc-profile-panel").classList.add("fc-hidden");
    $("fc-post-detail").classList.add("fc-hidden");
    $("fc-publish").classList.add("fc-hidden");

    const panel = $("fc-public-profile");
    panel.classList.remove("fc-hidden");
    panel.innerHTML = '<div class="fc-empty">جاري تحميل الحساب...</div>';

    const {data:profile,error} = await db.from("profiles")
      .select("id,full_name,city,bio,crops,avatar_url")
      .eq("id",userId).maybeSingle();

    if (error || !profile) {
      panel.innerHTML = '<div class="fc-empty">تعذر العثور على هذا الحساب.</div>';
      return;
    }

    profilesCache[userId] = profile;

    const {data:posts} = await db.from("posts")
      .select("*").eq("user_id",userId)
      .order("created_at",{ascending:false});

    const userPosts = posts || [];
    const postIds = userPosts.map(p => p.id);
    let likes = [];

    if (postIds.length) {
      const result = await db.from("likes")
        .select("post_id,user_id").in("post_id",postIds);
      likes = result.data || [];
    }

    const totalLikes = likes.length;
    const crops = Array.isArray(profile.crops) ? profile.crops : [];
    const own = currentUser?.id === userId;

    panel.innerHTML = `
      <div class="fc-profile-head">
        <div class="fc-profile-top">
          ${profile.avatar_url
            ? `<img class="fc-profile-avatar" src="${esc(profile.avatar_url)}" alt="الصورة الشخصية">`
            : `<div class="fc-avatar fc-avatar-placeholder" style="width:88px;height:88px;font-size:42px">👨‍🌾</div>`}
          <div class="fc-profile-stats">
            <div><strong>${userPosts.length}</strong><span>منشور</span></div>
            <div><strong>${totalLikes}</strong><span>إعجاب</span></div>
            <div><strong>${crops.length}</strong><span>اهتمام</span></div>
          </div>
        </div>
        <div class="fc-profile-name">${esc(profile.full_name || "فلاح")}</div>
        ${profile.city ? `<div class="fc-muted">📍 ${esc(profile.city)}</div>` : ""}
        ${profile.bio ? `<div class="fc-profile-bio">${esc(profile.bio)}</div>` : ""}
        ${crops.length ? `<div class="fc-muted" style="margin-top:7px">🌱 يهتم بـ: ${esc(crops.join("، "))}</div>` : ""}
        ${own ? `<button class="fc-profile-edit" id="fc-edit-own-profile">✏️ تعديل الملف الشخصي</button>` : ""}
        <button class="fc-profile-edit" id="fc-profile-back">← العودة للمنشورات</button>
      </div>
      <div class="fc-profile-tabs">▦ المنشورات</div>
      ${userPosts.length ? `
        <div class="fc-profile-grid">
          ${userPosts.map(post => `
            <div class="fc-grid-item" data-open-profile-post="${esc(post.id)}">
              ${post.image_url
                ? `<img src="${esc(post.image_url)}" loading="lazy" alt="منشور">`
                : `<div class="fc-grid-text">${esc(post.content)}</div>`}
              <span class="fc-grid-count">❤️ ${likes.filter(l => l.post_id === post.id).length}</span>
            </div>
          `).join("")}
        </div>
      ` : '<div class="fc-empty">📷<br>لا توجد منشورات بعد.</div>'}
    `;

    $("fc-profile-back").onclick = () => {
      panel.classList.add("fc-hidden");
      $("fc-user").classList.remove("fc-hidden");
      $("fc-feed").classList.remove("fc-hidden");
    };

    if ($("fc-edit-own-profile")) {
      $("fc-edit-own-profile").onclick = editOwnProfile;
    }

    panel.querySelectorAll("[data-open-profile-post]").forEach(item => {
      item.onclick = () => {
        const post = userPosts.find(
          p => String(p.id) === item.dataset.openProfilePost
        );
        if (post) openPostDetail(post,profile);
      };
    });

    $("fc-user").classList.add("fc-hidden");
    window.scrollTo({top:root.offsetTop,behavior:"smooth"});
  }

  // تفاصيل المنشور
  function openPostDetail(post,profile) {
    const detail = $("fc-post-detail");
    detail.classList.remove("fc-hidden");

    detail.innerHTML = `
      <div class="fc-box">
        <div class="fc-post-head">
          <div class="fc-author" id="fc-detail-author">
            ${avatar(profile.avatar_url,profile.full_name)}
            <div class="fc-author-info">
              <strong>${esc(profile.full_name || "فلاح")}</strong>
              <span class="fc-muted">${esc(profile.city || "")}</span>
            </div>
          </div>
        </div>
        <p class="fc-post-text">${esc(post.content || "")}</p>
        ${post.image_url ? `<img class="fc-detail-image" src="${esc(post.image_url)}" alt="صورة المنشور">` : ""}
        <p class="fc-muted">${new Date(post.created_at).toLocaleString("ar")}</p>
        <button class="fc-btn fc-light" id="fc-detail-close">إغلاق المنشور</button>
      </div>
    `;

    $("fc-detail-close").onclick = () => detail.classList.add("fc-hidden");
    $("fc-detail-author").onclick = () => openProfile(profile.id);
    window.scrollTo({top:detail.offsetTop,behavior:"smooth"});
  }

  // رسم المنشورات
  function renderFeed() {
    const feed = $("fc-feed");
    const query = ($("fc-search")?.value || "").trim().toLowerCase();

    const visiblePosts = allPosts.filter(post => {
      const author = profilesCache[post.user_id] || {};

      return !query ||
        String(post.content || "").toLowerCase().includes(query) ||
        String(author.full_name || "").toLowerCase().includes(query) ||
        String(author.city || "").toLowerCase().includes(query);
    });

    if (!visiblePosts.length) {
      feed.innerHTML = '<div class="fc-empty">لا توجد منشورات مطابقة للبحث.</div>';
      return;
    }

    feed.innerHTML = visiblePosts.map(post => {
      const author = profilesCache[post.user_id] || {};
      const name = author.full_name || "فلاح";
      const postLikes = allLikes.filter(l => l.post_id === post.id);
      const liked = postLikes.some(l => l.user_id === currentUser?.id);
      const postComments = allComments.filter(c => c.post_id === post.id);
      const canDelete = post.user_id === currentUser?.id || isAdmin;

      return `
        <article class="fc-post">
          <div class="fc-post-head">
            <div class="fc-author" data-profile="${esc(post.user_id)}">
              ${avatar(author.avatar_url,name)}
              <div class="fc-author-info">
                <strong>${esc(name)}</strong>
                <span class="fc-muted">
                  ${author.city ? "📍 " + esc(author.city) + " · " : ""}
                  ${new Date(post.created_at).toLocaleDateString("ar")}
                </span>
              </div>
            </div>
            ${canDelete ? `<button class="fc-post-menu" data-delete="${esc(post.id)}" title="حذف">⋯</button>` : ""}
          </div>
          ${post.content ? `<div class="fc-post-text">${esc(post.content)}</div>` : ""}
          ${post.image_url ? `<img class="fc-post-image" src="${esc(post.image_url)}" alt="صورة فلاحية" loading="lazy">` : ""}
          <div class="fc-post-actions">
            <button class="fc-action ${liked ? "liked" : ""}" data-like="${esc(post.id)}">
              ${liked ? "❤️" : "🤍"} إعجاب
            </button>
            <button class="fc-action" data-toggle-comments="${esc(post.id)}">💬 تعليق</button>
            <button class="fc-action" data-share="${esc(post.id)}">↗ مشاركة</button>
          </div>
          <div class="fc-likes-count">${postLikes.length} إعجاب</div>
          ${postComments.length ? `
            <div class="fc-comment-preview">
              ${postComments.slice(-2).map(c =>
                `<div><b>${esc(profilesCache[c.user_id]?.full_name || "فلاح")}</b> ${esc(c.content)}</div>`
              ).join("")}
            </div>
          ` : ""}
          <div class="fc-comments fc-hidden" id="fc-comments-${esc(post.id)}">
            ${postComments.map(c => `
              <div class="fc-comment-row">
                <b>${esc(profilesCache[c.user_id]?.full_name || "فلاح")}</b>
                ${esc(c.content)}
                ${(c.user_id === currentUser?.id || isAdmin)
                  ? `<button class="fc-action" data-delete-comment="${esc(c.id)}">حذف</button>`
                  : ""}
              </div>
            `).join("")}
            ${currentUser ? `
              <div class="fc-comment-form">
                <input class="fc-input" id="fc-comment-${esc(post.id)}" placeholder="اكتب تعليقاً...">
                <button class="fc-btn" data-comment="${esc(post.id)}">إرسال</button>
              </div>
            ` : '<p class="fc-muted">سجل الدخول لإضافة تعليق.</p>'}
          </div>
        </article>
      `;
    }).join("");

    feed.querySelectorAll("[data-profile]").forEach(el => {
      el.onclick = () => openProfile(el.dataset.profile);
    });

    feed.querySelectorAll("[data-toggle-comments]").forEach(btn => {
      btn.onclick = () => {
        $(`fc-comments-${btn.dataset.toggleComments}`).classList.toggle("fc-hidden");
      };
    });

    // الإعجاب
    feed.querySelectorAll("[data-like]").forEach(btn => {
      btn.onclick = async () => {
        if (!currentUser) return msg("سجل الدخول أولاً.");

        const post_id = btn.dataset.like;
        const {data:existing,error:checkError} = await db.from("likes")
          .select("post_id")
          .eq("post_id",post_id)
          .eq("user_id",currentUser.id)
          .maybeSingle();

        if (checkError) return msg(checkError.message);

        const result = existing
          ? await db.from("likes").delete()
              .eq("post_id",post_id).eq("user_id",currentUser.id)
          : await db.from("likes").insert({
              post_id,
              user_id:currentUser.id
            });

        if (result.error) msg(result.error.message);
        await loadPosts();
      };
    });

    // التعليق
    feed.querySelectorAll("[data-comment]").forEach(btn => {
      btn.onclick = async () => {
        if (!currentUser) return msg("سجل الدخول أولاً.");

        const post_id = btn.dataset.comment;
        const content = $(`fc-comment-${post_id}`).value.trim();
        if (!content) return;

        const {error} = await db.from("comments").insert({
          post_id,
          user_id:currentUser.id,
          content
        });

        if (error) msg(error.message);
        await loadPosts();
      };
    });

    // حذف منشور
    feed.querySelectorAll("[data-delete]").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("واش متأكد من حذف المنشور؟")) return;

        const {error} = await db.from("posts")
          .delete().eq("id",btn.dataset.delete);

        if (error) msg(error.message);
        await loadPosts();
      };
    });

    // حذف تعليق
    feed.querySelectorAll("[data-delete-comment]").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("حذف التعليق؟")) return;

        const {error} = await db.from("comments")
          .delete().eq("id",btn.dataset.deleteComment);

        if (error) msg(error.message);
        await loadPosts();
      };
    });

    // مشاركة المنشور
    feed.querySelectorAll("[data-share]").forEach(btn => {
      btn.onclick = async () => {
        const post = allPosts.find(p => String(p.id) === btn.dataset.share);
        if (!post) return;

        const shareText =
          `${profilesCache[post.user_id]?.full_name || "فلاح"}: ${post.content || "منشور فلاحي"}`;

        if (navigator.share) {
          try {
            await navigator.share({
              title:"المجتمع الفلاحي",
              text:shareText
            });
          } catch(e) {}
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          msg("تم نسخ المنشور للمشاركة.");
        } else {
          msg("المشاركة غير متاحة في هذا المتصفح.");
        }
      };
    });
  }

  // تحميل المنشورات والتفاعلات
  async function loadPosts() {
    const feed = $("fc-feed");
    if (!feed) return;

    feed.innerHTML = '<div class="fc-empty">جاري تحميل المنشورات...</div>';

    const {data:posts,error} = await db.from("posts")
      .select("*")
      .order("created_at",{ascending:false})
      .limit(100);

    if (error) {
      feed.innerHTML = `<div class="fc-empty">تعذر تحميل المنشورات: ${esc(error.message)}</div>`;
      return;
    }

    allPosts = posts || [];

    if (!allPosts.length) {
      allLikes = [];
      allComments = [];
      feed.innerHTML = '<div class="fc-empty">🌱<br>مازال ما كاين حتى منشور.<br>كون أول واحد يشارك تجربتو!</div>';
      return;
    }

    const userIds = [...new Set(allPosts.map(p => p.user_id))];
    const postIds = allPosts.map(p => p.id);

    await getProfiles(userIds);

    const [likesResult,commentsResult] = await Promise.all([
      db.from("likes").select("post_id,user_id").in("post_id",postIds),
      db.from("comments").select("*").in("post_id",postIds).order("created_at")
    ]);

    allLikes = likesResult.data || [];
    allComments = commentsResult.data || [];

    const commentUserIds = [...new Set(allComments.map(c => c.user_id))];
    await getProfiles(commentUserIds);

    renderFeed();
  }

  // لوحة المدير
  function updateAdminButton() {
    let btn = $("fc-admin-button");

    if (!btn) {
      btn = document.createElement("button");
      btn.id = "fc-admin-button";
      btn.className = "fc-btn fc-light";
      btn.textContent = "🛡️ الإدارة";
      btn.style.cssText = "display:block;margin:10px 12px;width:calc(100% - 24px)";

      $("fc-user").appendChild(btn);

      const area = $("fc-admin-area");
      area.classList.add("fc-admin");

      btn.onclick = async () => {
        area.classList.toggle("fc-hidden");
        if (!area.classList.contains("fc-hidden")) {
          await loadAdminPanel();
        }
      };
    }

    btn.classList.toggle("fc-hidden",!isAdmin);
  }

  async function loadAdminPanel() {
    if (!isAdmin || !currentUser) return;

    const area = $("fc-admin-area");
    area.innerHTML = '<p>جاري تحميل لوحة الإدارة...</p>';

    const [users,posts,comments] = await Promise.all([
      db.from("profiles")
        .select("id,full_name,role,created_at,is_banned")
        .order("created_at",{ascending:false})
        .limit(200),
      db.from("posts").select("id",{count:"exact",head:true}),
      db.from("comments").select("id",{count:"exact",head:true})
    ]);

    if (users.error || posts.error || comments.error) {
      area.textContent = "تعذر تحميل البيانات: " +
        (users.error || posts.error || comments.error).message;
      return;
    }

    area.innerHTML = `
      <h3>🛡️ لوحة تحكم المدير</h3>
      <div class="fc-box">👥 المستخدمون: ${users.data.length}</div>
      <div class="fc-box">📝 المنشورات: ${posts.count || 0}</div>
      <div class="fc-box">💬 التعليقات: ${comments.count || 0}</div>
      <h4>المستخدمون</h4>
      <div id="fc-admin-users">
        ${users.data.map(user => `
          <div class="fc-box">
            <b>${esc(user.full_name || "مستخدم")}</b>
            <p class="fc-muted">الحالة: ${user.is_banned ? "🚫 محظور" : "✅ نشيط"}</p>
            ${user.id !== currentUser.id && user.role !== "admin" ? `
              <button class="fc-btn fc-light" data-ban="${esc(user.id)}">
                ${user.is_banned ? "إلغاء الحظر" : "حظر المستخدم"}
              </button>
            ` : ""}
          </div>
        `).join("")}
      </div>
      <button class="fc-btn" id="fc-admin-refresh">تحديث البيانات</button>
    `;

    area.querySelectorAll("[data-ban]").forEach(btn => {
      btn.onclick = async () => {
        const user = users.data.find(u => u.id === btn.dataset.ban);
        if (!user) return;

        const action = user.is_banned ? "إلغاء الحظر" : "حظر";
        if (!confirm(`هل تريد ${action} هذا المستخدم؟`)) return;

        const {error} = await db.from("profiles")
          .update({is_banned:!user.is_banned})
          .eq("id",user.id);

        if (error) return msg(error.message);

        msg("تم تحديث حالة المستخدم.");
        await loadAdminPanel();
      };
    });

    $("fc-admin-refresh").onclick = loadAdminPanel;
  }

  // البحث المباشر
  $("fc-search").oninput = renderFeed;

  // مراقبة تسجيل الدخول والخروج
  db.auth.onAuthStateChange(() => {
    setTimeout(() => {
      refreshUser().catch(error => {
        console.error("Auth refresh error:",error);
        msg("تعذر تحديث حالة الحساب.");
      });
    },0);
  });

  // تشغيل المجتمع
  refreshUser().catch(error => {
    console.error("Community startup error:",error);
    msg("وقع مشكل أثناء تشغيل المجتمع: " + (error.message || error));
  });

})();
