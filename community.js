
// مجتمع فلاحي 2.0 — Supabase + Instagram Style Farmer Profiles
(() => {
  const SUPABASE_URL = "https://kldxlodykkomkresegyt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_AOy4zEw5LYHklwYOaQGmoA_G01FCILJ";

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const root = document.getElementById("community-app") ||
               document.getElementById("community");

  if (!root) return;

  let currentUser = null;
  let isAdmin = false;
  let phonePending = false;
  let profilesCache = {};
  let allPosts = [];

  const $ = id => document.getElementById(id);

  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);

  const avatar = (url, name = "فلاح") => {
    if (url) {
      return `<img class="fc-avatar" src="${esc(url)}" alt="${esc(name)}">`;
    }
    return `<div class="fc-avatar fc-avatar-placeholder">👨‍🌾</div>`;
  };

  const msg = text => {
    $("fc-message").textContent = text;
  };

  root.innerHTML = `
    <style>
      #community-app,#community{
        direction:rtl;text-align:right;font-family:inherit;color:inherit
      }
      .fc-box{
        background:var(--card,#fff);border:1px solid #ddd;
        border-radius:14px;padding:14px;margin:12px 0
      }
      .fc-input{
        width:100%;box-sizing:border-box;padding:12px;
        border:1px solid #ccc;border-radius:9px;
        margin:6px 0;font:inherit
      }
      .fc-btn{
        border:0;border-radius:9px;padding:10px 15px;
        margin:4px;background:#176b45;color:white;
        font:inherit;cursor:pointer
      }
      .fc-light{background:#eee;color:#222}
      .fc-muted{color:#777;font-size:13px}
      .fc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .fc-hidden{display:none!important}
      .fc-post img.post-image{
        width:100%;max-height:360px;object-fit:contain;
        border-radius:10px;margin-top:8px
      }
      .fc-profile-title{color:#176b45}

      .fc-author{
        display:flex;align-items:center;gap:10px;
        cursor:pointer;margin-bottom:10px
      }
      .fc-author strong{color:#176b45}
      .fc-avatar{
        width:48px;height:48px;border-radius:50%;
        object-fit:cover;border:2px solid #176b45;
        flex-shrink:0
      }
      .fc-avatar-placeholder{
        display:flex;align-items:center;justify-content:center;
        background:#e5f2e9;font-size:25px
      }
      .fc-profile-cover{
        background:linear-gradient(135deg,#176b45,#69a77e);
        height:95px;border-radius:14px 14px 0 0
      }
      .fc-profile-head{
        background:var(--card,#fff);border:1px solid #ddd;
        border-radius:14px;overflow:hidden;margin:12px 0
      }
      .fc-profile-info{padding:0 16px 16px}
      .fc-profile-avatar{
        width:100px;height:100px;border-radius:50%;
        border:4px solid var(--card,#fff);
        object-fit:cover;background:#e5f2e9;
        margin-top:-52px;position:relative
      }
      .fc-profile-stats{
        display:flex;justify-content:space-around;
        text-align:center;border-top:1px solid #eee;
        padding:14px 0;margin-top:14px
      }
      .fc-profile-stats strong{display:block;font-size:19px}
      .fc-profile-stats span{font-size:12px;color:#777}
      .fc-profile-tabs{
        display:flex;justify-content:center;gap:25px;
        border-bottom:1px solid #ddd;padding:12px
      }
      .fc-profile-grid{
        display:grid;grid-template-columns:repeat(3,1fr);
        gap:3px;margin:10px 0
      }
      .fc-grid-item{
        aspect-ratio:1/1;background:#eee;overflow:hidden;
        cursor:pointer;position:relative
      }
      .fc-grid-item img{
        width:100%;height:100%;object-fit:cover
      }
      .fc-grid-item .fc-grid-text{
        padding:8px;font-size:12px;overflow:hidden
      }
      .fc-grid-item .fc-grid-count{
        position:absolute;bottom:5px;left:5px;
        color:white;background:#0009;padding:3px 6px;
        border-radius:8px;font-size:11px
      }
      .fc-profile-bio{white-space:pre-wrap;line-height:1.7}
      .fc-photo-preview{
        width:100px;height:100px;border-radius:50%;
        object-fit:cover;display:block;margin:10px auto;
        border:3px solid #176b45
      }
      .fc-section-title{
        display:flex;justify-content:space-between;
        align-items:center;gap:8px
      }
      .fc-detail-image{
        width:100%;max-height:400px;object-fit:contain;
        border-radius:10px
      }
    </style>

    <div class="fc-box">
      <h3>🌱 المجتمع الفلاحي</h3>
      <p class="fc-muted">تبادل الخبرات والنصائح والصور الفلاحية.</p>

      <div id="fc-auth">
        <input id="fc-email" class="fc-input" type="email" placeholder="البريد الإلكتروني">
        <input id="fc-password" class="fc-input" type="password" placeholder="كلمة المرور">
        <input id="fc-name" class="fc-input" placeholder="الاسم (للتسجيل)">

        <div class="fc-actions">
          <button class="fc-btn" id="fc-signup">إنشاء حساب</button>
          <button class="fc-btn fc-light" id="fc-login">دخول</button>
        </div>

        <hr>
        <p>أو الدخول برقم الهاتف:</p>
        <input id="fc-phone" class="fc-input" type="tel" placeholder="+2126XXXXXXXX">
        <button class="fc-btn" id="fc-send-code">إرسال رمز الهاتف</button>

        <div id="fc-phone-verify" class="fc-hidden">
          <input id="fc-code" class="fc-input" placeholder="رمز التحقق">
          <button class="fc-btn" id="fc-verify-code">تأكيد الرمز</button>
        </div>
      </div>

      <div id="fc-user" class="fc-hidden">
        <p id="fc-welcome"></p>
        <button class="fc-btn" id="fc-profile-btn">👤 ملفي الشخصي</button>
        <button class="fc-btn fc-light" id="fc-logout">تسجيل الخروج</button>
      </div>

      <p id="fc-message" class="fc-muted" role="status"></p>
    </div>

    <div id="fc-profile-panel" class="fc-box fc-hidden">
      <h3 class="fc-profile-title">👤 تعديل الملف الشخصي</h3>

      <label>الصورة الشخصية</label>
      <img id="fc-avatar-preview" class="fc-photo-preview" alt="معاينة الصورة">
      <input id="fc-avatar-file" class="fc-input" type="file" accept="image/*">

      <label>الاسم الكامل</label>
      <input id="fc-profile-name" class="fc-input" placeholder="اسمك">

      <label>المدينة أو المنطقة</label>
      <input id="fc-profile-city" class="fc-input" placeholder="مثلاً: القنيطرة">

      <label>نبذة عن نشاطك الفلاحي</label>
      <textarea id="fc-profile-bio" class="fc-input" rows="3"
        maxlength="1000" placeholder="عرفنا على نشاطك الفلاحي..."></textarea>

      <label>المحاصيل والأشجار التي تهتم بها</label>
      <input id="fc-profile-crops" class="fc-input"
        placeholder="الأفوكادو، الزيتون، الحوامض...">

      <button class="fc-btn" id="fc-profile-save">💾 حفظ المعلومات</button>
      <button class="fc-btn fc-light" id="fc-profile-close">إغلاق</button>
    </div>

    <div id="fc-public-profile" class="fc-hidden"></div>
    <div id="fc-post-detail" class="fc-hidden"></div>

    <div id="fc-publish" class="fc-box fc-hidden">
      <h3>✍️ أضف منشوراً فلاحياً</h3>
      <textarea id="fc-content" class="fc-input" rows="4"
        maxlength="5000" placeholder="شارك تجربتك أو نصيحتك الفلاحية..."></textarea>
      <input id="fc-image" class="fc-input" type="file" accept="image/*">
      <button class="fc-btn" id="fc-publish-btn">نشر المنشور</button>
    </div>

    <div id="fc-feed">
      <p class="fc-muted">جاري تحميل المنشورات...</p>
    </div>
  `;

  // معاينة الصورة الشخصية
  $("fc-avatar-file").onchange = () => {
    const file = $("fc-avatar-file").files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      msg("اختار صورة فقط.");
      $("fc-avatar-file").value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      msg("حجم الصورة يجب ألا يتجاوز 5 ميغابايت.");
      $("fc-avatar-file").value = "";
      return;
    }

    $("fc-avatar-preview").src = URL.createObjectURL(file);
  };

  // فتح وإغلاق تعديل الملف
  $("fc-profile-btn").onclick = () => {
    $("fc-profile-panel").classList.toggle("fc-hidden");
    $("fc-public-profile").classList.add("fc-hidden");
    $("fc-post-detail").classList.add("fc-hidden");
    window.scrollTo({top: $("fc-profile-panel").offsetTop, behavior:"smooth"});
  };

  $("fc-profile-close").onclick = () => {
    $("fc-profile-panel").classList.add("fc-hidden");
  };

  // تحميل معلومات المستخدم
  async function refreshUser() {
    const { data, error } = await db.auth.getUser();

    currentUser = error ? null : data.user || null;
    isAdmin = false;

    if (currentUser) {
      const { data: profile } = await db.from("profiles")
        .select("id,full_name,role,is_banned,city,bio,crops,avatar_url")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profile?.is_banned) {
        await db.auth.signOut();
        currentUser = null;
        alert("هذا الحساب محظور من طرف الإدارة.");
      } else {
        isAdmin = profile?.role === "admin";

        profilesCache[currentUser.id] = profile || {};

        $("fc-welcome").textContent =
          "مرحباً " + (profile?.full_name || currentUser.email || currentUser.phone || "");

        if (isAdmin) $("fc-welcome").textContent += " — المشرف";

        $("fc-profile-name").value = profile?.full_name || "";
        $("fc-profile-city").value = profile?.city || "";
        $("fc-profile-bio").value = profile?.bio || "";
        $("fc-profile-crops").value =
          Array.isArray(profile?.crops) ? profile.crops.join("، ") : "";

        $("fc-avatar-preview").src = profile?.avatar_url ||
          "https://placehold.co/200x200/e5f2e9/176b45?text=Farmer";
      }
    }

    $("fc-auth").classList.toggle("fc-hidden", !!currentUser);
    $("fc-user").classList.toggle("fc-hidden", !currentUser);
    $("fc-publish").classList.toggle("fc-hidden", !currentUser);

    if (!currentUser) {
      $("fc-profile-panel").classList.add("fc-hidden");
    }

    await loadPosts();
  }

  // حفظ الملف الشخصي والصورة
  $("fc-profile-save").onclick = async () => {
    if (!currentUser) return msg("سجل الدخول أولاً.");

    const full_name = $("fc-profile-name").value.trim();
    const city = $("fc-profile-city").value.trim();
    const bio = $("fc-profile-bio").value.trim();

    const crops = $("fc-profile-crops").value
      .split(/[،,]/).map(x => x.trim()).filter(Boolean);

    if (!full_name) return msg("المرجو إدخال الاسم الكامل.");

    const button = $("fc-profile-save");
    button.disabled = true;
    button.textContent = "جاري الحفظ...";

    try {
      let avatar_url = profilesCache[currentUser.id]?.avatar_url || null;
      const file = $("fc-avatar-file").files[0];

      if (file) {
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
          throw new Error("الصورة يجب أن تكون من نوع صورة وأقل من 5 ميغابايت.");
        }

        const ext = (file.name.split(".").pop() || "jpg")
          .replace(/[^a-zA-Z0-9]/g, "") || "jpg";

        const path = `${currentUser.id}/avatar-${Date.now()}.${ext}`;

        const { error: uploadError } = await db.storage
          .from("fellahi-images")
          .upload(path, file, {upsert:true});

        if (uploadError) throw uploadError;

        const { data: publicData } = db.storage
          .from("fellahi-images").getPublicUrl(path);

        avatar_url = publicData.publicUrl;
      }

      const { data: saved, error } = await db.from("profiles")
        .update({full_name, city, bio, crops, avatar_url})
        .eq("id", currentUser.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!saved) throw new Error("لم يتم تحديث الحساب. تحقق من صلاحيات تحديث profiles.");

      profilesCache[currentUser.id] = saved;

      await db.auth.updateUser({data:{full_name}});

      $("fc-welcome").textContent =
        "مرحباً " + full_name + (isAdmin ? " — المشرف" : "");

      $("fc-avatar-file").value = "";
      $("fc-avatar-preview").src = avatar_url ||
        "https://placehold.co/200x200/e5f2e9/176b45?text=Farmer";

      msg("تم حفظ معلوماتك وصورتك بنجاح 🌱");
      $("fc-profile-panel").classList.add("fc-hidden");

      await loadPosts();
    } catch (error) {
      msg("تعذر حفظ الملف الشخصي: " + error.message);
    } finally {
      button.disabled = false;
      button.textContent = "💾 حفظ المعلومات";
    }
  };

  // إنشاء حساب
  $("fc-signup").onclick = async () => {
    const email = $("fc-email").value.trim();
    const password = $("fc-password").value;
    const name = $("fc-name").value.trim();

    if (!email || password.length < 6) {
      return msg("أدخل البريد وكلمة مرور من 6 أحرف على الأقل.");
    }

    const { error } = await db.auth.signUp({
      email,
      password,
      options:{data:{full_name:name}}
    });

    msg(error ? error.message :
      "تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا طُلب منك ذلك.");
  };

  // تسجيل الدخول
  $("fc-login").onclick = async () => {
    const { error } = await db.auth.signInWithPassword({
      email:$("fc-email").value.trim(),
      password:$("fc-password").value
    });

    msg(error ? error.message : "تم تسجيل الدخول.");
    if (!error) await refreshUser();
  };

  // الهاتف
  $("fc-send-code").onclick = async () => {
    const phone = $("fc-phone").value.trim();
    if (!phone) return msg("أدخل رقم الهاتف مع رمز الدولة.");

    const { error } = await db.auth.signInWithOtp({phone});
    if (error) return msg(error.message);

    phonePending = true;
    $("fc-phone-verify").classList.remove("fc-hidden");
    msg("تم إرسال الرمز إذا كان مزود الرسائل مفعلاً.");
  };

  $("fc-verify-code").onclick = async () => {
    if (!phonePending) return;

    const { error } = await db.auth.verifyOtp({
      phone:$("fc-phone").value.trim(),
      token:$("fc-code").value.trim(),
      type:"sms"
    });

    msg(error ? error.message : "تم التحقق من الهاتف.");
    if (!error) await refreshUser();
  };

  // تسجيل الخروج
  $("fc-logout").onclick = async () => {
    await db.auth.signOut();
    msg("تم تسجيل الخروج.");
    await refreshUser();
  };

  // نشر منشور
  $("fc-publish-btn").onclick = async () => {
    if (!currentUser) return msg("سجل الدخول أولاً.");

    const content = $("fc-content").value.trim();
    const file = $("fc-image").files[0];

    if (!content && !file) return msg("اكتب نص المنشور أو أضف صورة.");

    let image_url = null;

    if (file) {
      if (!file.type.startsWith("image/")) return msg("اختار صورة فقط.");
      if (file.size > 5 * 1024 * 1024) return msg("حجم الصورة أكبر من 5 ميغابايت.");

      const ext = (file.name.split(".").pop() || "jpg")
        .replace(/[^a-zA-Z0-9]/g, "") || "jpg";

      const path = `${currentUser.id}/${Date.now()}.${ext}`;

      const {error: uploadError} = await db.storage
        .from("fellahi-images").upload(path, file);

      if (uploadError) return msg("تعذر رفع الصورة: " + uploadError.message);

      image_url = db.storage.from("fellahi-images").getPublicUrl(path).data.publicUrl;
    }

    const {error} = await db.from("posts").insert({
      user_id:currentUser.id,
      content:content || "صورة فلاحية",
      image_url
    });

    if (error) return msg("تعذر نشر المنشور: " + error.message);

    $("fc-content").value = "";
    $("fc-image").value = "";
    msg("تم نشر منشورك بنجاح 🌱");
    await loadPosts();
  };

  // جلب معلومات الملفات الشخصية
  async function getProfiles(ids) {
    const missing = ids.filter(id => !profilesCache[id]);

    if (missing.length) {
      const {data} = await db.from("profiles")
        .select("id,full_name,city,bio,crops,avatar_url,role")
        .in("id", missing);

      (data || []).forEach(p => profilesCache[p.id] = p);
    }

    return profilesCache;
  }

  // فتح صفحة فلاح
  async function openProfile(userId) {
    $("fc-profile-panel").classList.add("fc-hidden");
    $("fc-post-detail").classList.add("fc-hidden");

    const panel = $("fc-public-profile");
    panel.classList.remove("fc-hidden");
    panel.innerHTML = '<div class="fc-box">جاري تحميل الملف الشخصي...</div>';

    const {data:profile, error} = await db.from("profiles")
      .select("id,full_name,city,bio,crops,avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      panel.innerHTML = '<div class="fc-box">تعذر العثور على هذا الحساب.</div>';
      return;
    }

    profilesCache[userId] = profile;

    const {data:posts} = await db.from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {ascending:false});

    const userPosts = posts || [];
    const postIds = userPosts.map(p => p.id);

    let likes = [];
    if (postIds.length) {
      const result = await db.from("likes")
        .select("post_id")
        .in("post_id", postIds);
      likes = result.data || [];
    }

    const totalLikes = likes.length;
    const crops = Array.isArray(profile.crops) ? profile.crops : [];

    panel.innerHTML = `
      <div class="fc-profile-head">
        <div class="fc-profile-cover"></div>
        <div class="fc-profile-info">
          ${avatar(profile.avatar_url, profile.full_name)}
          <h3>${esc(profile.full_name || "فلاح")}</h3>
          ${profile.city ? `<p class="fc-muted">📍 ${esc(profile.city)}</p>` : ""}
          ${profile.bio ? `<p class="fc-profile-bio">${esc(profile.bio)}</p>` : ""}
          ${crops.length ? `
            <p class="fc-muted">🌱 يهتم بـ: ${esc(crops.join("، "))}</p>
          ` : ""}

          ${currentUser?.id === userId ? `
            <button class="fc-btn" id="fc-edit-own-profile">✏️ تعديل الملف الشخصي</button>
          ` : ""}

          <div class="fc-profile-stats">
            <div><strong>${userPosts.length}</strong><span>منشور</span></div>
            <div><strong>${totalLikes}</strong><span>إعجاب</span></div>
            <div><strong>${crops.length}</strong><span>اهتمام</span></div>
          </div>
        </div>
      </div>

      <div class="fc-section-title">
        <h3>📷 منشورات ${esc(profile.full_name || "الفلاح")}</h3>
        <button class="fc-btn fc-light" id="fc-close-public-profile">إغلاق</button>
      </div>

      <div class="fc-profile-tabs">
        <strong>▦ المنشورات</strong>
      </div>

      ${userPosts.length ? `
        <div class="fc-profile-grid">
          ${userPosts.map(post => `
            <div class="fc-grid-item" data-open-profile-post="${esc(post.id)}">
              ${post.image_url
                ? `<img src="${esc(post.image_url)}" loading="lazy" alt="منشور">`
                : `<div class="fc-grid-text">${esc(post.content)}</div>`}
              <span class="fc-grid-count">❤️ ${
                likes.filter(l => l.post_id === post.id).length
              }</span>
            </div>
          `).join("")}
        </div>
      ` : '<div class="fc-box fc-muted">لا توجد منشورات بعد.</div>'}
    `;

    $("fc-close-public-profile").onclick = () => {
      panel.classList.add("fc-hidden");
    };

    if ($("fc-edit-own-profile")) {
      $("fc-edit-own-profile").onclick = () => {
        panel.classList.add("fc-hidden");
        $("fc-profile-panel").classList.remove("fc-hidden");
      };
    }

    panel.querySelectorAll("[data-open-profile-post]").forEach(item => {
      item.onclick = () => {
        const post = userPosts.find(p => String(p.id) === item.dataset.openProfilePost);
        if (post) openPostDetail(post, profile);
      };
    });

    window.scrollTo({top:panel.offsetTop,behavior:"smooth"});
  }

  // عرض منشور من صفحة الحساب
  function openPostDetail(post, profile) {
    const detail = $("fc-post-detail");
    detail.classList.remove("fc-hidden");
    detail.innerHTML = `
      <div class="fc-box">
        <div class="fc-author" data-detail-author="${esc(profile.id)}">
          ${avatar(profile.avatar_url, profile.full_name)}
          <div>
            <strong>${esc(profile.full_name || "فلاح")}</strong>
            <div class="fc-muted">${esc(profile.city || "")}</div>
          </div>
        </div>
        <p>${esc(post.content || "")}</p>
        ${post.image_url ? `<img class="fc-detail-image" src="${esc(post.image_url)}">` : ""}
        <p class="fc-muted">${new Date(post.created_at).toLocaleString("ar")}</p>
        <button class="fc-btn fc-light" id="fc-detail-close">إغلاق المنشور</button>
      </div>
    `;

    $("fc-detail-close").onclick = () => detail.classList.add("fc-hidden");
    detail.querySelector("[data-detail-author]").onclick = () => {
      detail.classList.add("fc-hidden");
      openProfile(profile.id);
    };

    window.scrollTo({top:detail.offsetTop,behavior:"smooth"});
  }

  // تحميل المنشورات
  async function loadPosts() {
    const feed = $("fc-feed");

    const {data:posts, error} = await db.from("posts")
      .select("*")
      .order("created_at", {ascending:false})
      .limit(100);

    if (error) {
      feed.innerHTML = `<div class="fc-box">تعذر تحميل المنشورات: ${esc(error.message)}</div>`;
      return;
    }

    allPosts = posts || [];

    if (!allPosts.length) {
      feed.innerHTML = '<div class="fc-box">لا توجد منشورات بعد. كن أول من يشارك! 🌱</div>';
      return;
    }

    const userIds = [...new Set(allPosts.map(p => p.user_id))];
    const postIds = allPosts.map(p => p.id);

    const [{data:profiles}, {data:likes}, {data:comments}] = await Promise.all([
      db.from("profiles")
        .select("id,full_name,city,bio,crops,avatar_url")
        .in("id", userIds),

      db.from("likes")
        .select("post_id,user_id")
        .in("post_id", postIds),

      db.from("comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at")
    ]);

    (profiles || []).forEach(p => profilesCache[p.id] = p);

    const names = profilesCache;

    feed.innerHTML = allPosts.map(post => {
      const postLikes = (likes || []).filter(l => l.post_id === post.id);
      const liked = postLikes.some(l => l.user_id === currentUser?.id);
      const postComments = (comments || []).filter(c => c.post_id === post.id);
      const canDelete = post.user_id === currentUser?.id || isAdmin;

      const author = names[post.user_id] || {};
      const authorName = author.full_name || "فلاح";

      return `
        <article class="fc-box fc-post">
          <div class="fc-author" data-profile="${esc(post.user_id)}">
            ${avatar(author.avatar_url, authorName)}
            <div>
              <strong>${esc(authorName)}</strong>
              ${author.city ? `<div class="fc-muted">📍 ${esc(author.city)}</div>` : ""}
              <div class="fc-muted">${new Date(post.created_at).toLocaleString("ar")}</div>
            </div>
          </div>

          <p>${esc(post.content)}</p>

          ${post.image_url
            ? `<img class="post-image" src="${esc(post.image_url)}" alt="صورة فلاحية" loading="lazy">`
            : ""}

          <div class="fc-actions">
            <button class="fc-btn fc-light" data-like="${esc(post.id)}">
              ${liked ? "❤️" : "🤍"} إعجاب (${postLikes.length})
            </button>

            <button class="fc-btn fc-light" data-toggle-comments="${esc(post.id)}">
              💬 التعليقات (${postComments.length})
            </button>

            ${canDelete
              ? `<button class="fc-btn fc-light" data-delete="${esc(post.id)}">🗑️ حذف</button>`
              : ""}
          </div>

          <div class="fc-box fc-hidden" id="fc-comments-${esc(post.id)}">
            ${postComments.map(c => `
              <p>
                <b>${esc(names[c.user_id]?.full_name || "مستخدم")}:</b>
                ${esc(c.content)}
                ${(c.user_id === currentUser?.id || isAdmin)
                  ? `<button class="fc-btn fc-light" data-delete-comment="${esc(c.id)}">حذف</button>`
                  : ""}
              </p>
            `).join("")}

            ${currentUser ? `
              <input class="fc-input" id="fc-comment-${esc(post.id)}"
                placeholder="اكتب تعليقاً...">
              <button class="fc-btn" data-comment="${esc(post.id)}">إرسال التعليق</button>
            ` : '<p class="fc-muted">سجل الدخول لإضافة تعليق.</p>'}
          </div>
        </article>
      `;
    }).join("");

    // فتح حساب صاحب المنشور
    feed.querySelectorAll("[data-profile]").forEach(el => {
      el.onclick = () => openProfile(el.dataset.profile);
    });

    // إظهار وإخفاء التعليقات
    feed.querySelectorAll("[data-toggle-comments]").forEach(btn => {
      btn.onclick = () => {
        const box = $(`fc-comments-${btn.dataset.toggleComments}`);
        box.classList.toggle("fc-hidden");
      };
    });

    // الإعجاب
    feed.querySelectorAll("[data-like]").forEach(btn => {
      btn.onclick = async () => {
        if (!currentUser) return msg("سجل الدخول أولاً.");

        const post_id = btn.dataset.like;

        const {data:existing} = await db.from("likes")
          .select("post_id")
          .eq("post_id", post_id)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        const result = existing
          ? await db.from("likes").delete()
              .eq("post_id", post_id).eq("user_id", currentUser.id)
          : await db.from("likes").insert({
              post_id,user_id:currentUser.id
            });

        if (result.error) msg(result.error.message);
        await loadPosts();
      };
    });

    // إضافة تعليق
    feed.querySelectorAll("[data-comment]").forEach(btn => {
      btn.onclick = async () => {
        if (!currentUser) return msg("سجل الدخول أولاً.");

        const post_id = btn.dataset.comment;
        const content = $(`fc-comment-${post_id}`).value.trim();
        if (!content) return;

        const {error} = await db.from("comments").insert({
          post_id,user_id:currentUser.id,content
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
          .delete().eq("id", btn.dataset.delete);

        if (error) msg(error.message);
        await loadPosts();
      };
    });

    // حذف تعليق
    feed.querySelectorAll("[data-delete-comment]").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("حذف التعليق؟")) return;

        const {error} = await db.from("comments")
          .delete().eq("id", btn.dataset.deleteComment);

        if (error) msg(error.message);
        await loadPosts();
      };
    });
  }

  // لوحة تحكم المدير
  const adminButton = document.createElement("button");
  adminButton.className = "fc-btn";
  adminButton.textContent = "🛡️ لوحة تحكم المدير";
  adminButton.style.display = "none";

  const adminPanel = document.createElement("div");
  adminPanel.className = "fc-box fc-hidden";
  adminPanel.innerHTML = `
    <h3>🛡️ لوحة تحكم المدير</h3>
    <div id="fc-admin-stats">جاري تحميل الإحصائيات...</div>
    <h4>👥 المستخدمون</h4>
    <div id="fc-admin-users">جاري التحميل...</div>
    <button class="fc-btn" id="fc-admin-refresh">تحديث</button>
  `;

  $("fc-user").parentElement.appendChild(adminButton);
  $("fc-user").parentElement.appendChild(adminPanel);

  adminButton.onclick = async () => {
    if (!isAdmin) return;
    adminPanel.classList.toggle("fc-hidden");
    if (!adminPanel.classList.contains("fc-hidden")) await loadAdminPanel();
  };

  async function loadAdminPanel() {
    if (!isAdmin || !currentUser) return;

    const [users, posts, comments] = await Promise.all([
      db.from("profiles")
        .select("id,full_name,role,created_at,is_banned")
        .order("created_at", {ascending:false}).limit(200),

      db.from("posts").select("id", {count:"exact",head:true}),
      db.from("comments").select("id", {count:"exact",head:true})
    ]);

    if (users.error || posts.error || comments.error) {
      $("fc-admin-stats").textContent =
        "تعذر تحميل البيانات: " +
        (users.error || posts.error || comments.error).message;
      return;
    }

    $("fc-admin-stats").innerHTML = `
      <div class="fc-box">👥 المستخدمون: ${users.data.length}</div>
      <div class="fc-box">📝 المنشورات: ${posts.count || 0}</div>
      <div class="fc-box">💬 التعليقات: ${comments.count || 0}</div>
    `;

    $("fc-admin-users").innerHTML = users.data.map(user => `
      <div class="fc-box">
        <strong>${esc(user.full_name || "مستخدم")}</strong>
        <p class="fc-muted">الصلاحية: ${user.role === "admin" ? "مدير" : "مستخدم"}</p>
        <p class="fc-muted">الحالة: ${user.is_banned ? "🚫 محظور" : "✅ نشيط"}</p>
        ${user.id !== currentUser.id && user.role !== "admin" ? `
          <button class="fc-btn" data-ban="${esc(user.id)}">
            ${user.is_banned ? "إلغاء الحظر" : "🚫 حظر المستخدم"}
          </button>
        ` : ""}
      </div>
    `).join("");

    $("fc-admin-users").querySelectorAll("[data-ban]").forEach(btn => {
      btn.onclick = async () => {
        if (!isAdmin) return;

        const id = btn.dataset.ban;
        const user = users.data.find(u => u.id === id);
        if (!user) return;

        const action = user.is_banned ? "إلغاء الحظر" : "حظر";
        if (!confirm(`هل تريد ${action} هذا المستخدم؟`)) return;

        const {error} = await db.from("profiles")
          .update({is_banned:!user.is_banned}).eq("id", id);

        if (error) {
          alert("تعذر تنفيذ العملية: " + error.message);
          return;
        }

        alert("تمت العملية بنجاح");
        await loadAdminPanel();
      };
    });
  }

  $("fc-admin-refresh").onclick = loadAdminPanel;

  // إظهار لوحة المدير حسب الصلاحية
  const originalRefreshUser = refreshUser;

  refreshUser = async function() {
    await originalRefreshUser();
    adminButton.style.display = isAdmin ? "inline-block" : "none";
  };

  db.auth.onAuthStateChange(() => {
    setTimeout(refreshUser, 0);
  });

  refreshUser();
})();
