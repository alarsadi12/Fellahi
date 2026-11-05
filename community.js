// مجتمع فلاحي 2.0 — Supabase
(() => {
  alert("بداية ملف المجتمع تعمل");
  const SUPABASE_URL = "https://kldxlodykkomkresegyt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_AOy4zEw5LYHklwYOaQGmoA_G01FCILJ";

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  alert("Supabase يعمل");
  const root = document.getElementById("community-app") ||
               document.getElementById("community");
alert(root ? "تم العثور على مساحة المجتمع" : "لم يتم العثور على مساحة المجتمع");
  if (!root) {
    console.error("Community container not found");
    return;
  }

  let currentUser = null;
  let isAdmin = false;
  let phonePending = false;

  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);

  root.innerHTML = `
    <style>
      #community-app, #community {
        direction:rtl;text-align:right;font-family:inherit;color:inherit
      }
      .fc-box{background:var(--card,#fff);border:1px solid #ddd;border-radius:14px;padding:14px;margin:12px 0}
      .fc-input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccc;border-radius:9px;margin:6px 0;font:inherit}
      .fc-btn{border:0;border-radius:9px;padding:10px 15px;margin:4px;background:#176b45;color:white;font:inherit;cursor:pointer}
      .fc-light{background:#eee;color:#222}
      .fc-post img{width:100%;max-height:360px;object-fit:contain;border-radius:10px;margin-top:8px}
      .fc-muted{color:#777;font-size:13px}
      .fc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .fc-hidden{display:none}
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
        <button class="fc-btn fc-light" id="fc-logout">تسجيل الخروج</button>
      </div>
      <p id="fc-message" class="fc-muted" role="status"></p>
    </div>

    <div id="fc-publish" class="fc-box fc-hidden">
      <h3>✍️ أضف منشوراً فلاحياً</h3>
      <textarea id="fc-content" class="fc-input" rows="4" maxlength="5000" placeholder="شارك تجربتك أو نصيحتك الفلاحية..."></textarea>
      <input id="fc-image" class="fc-input" type="file" accept="image/*">
      <button class="fc-btn" id="fc-publish-btn">نشر المنشور</button>
    </div>
    <div id="fc-feed"><p class="fc-muted">جاري تحميل المنشورات...</p></div>
  `;

  const $ = id => document.getElementById(id);
  const msg = text => $("fc-message").textContent = text;

  async function refreshUser() {
  const { data } = await db.auth.getUser();
  currentUser = data.user || null;
  isAdmin = false;

  if (currentUser) {
    const { data: profile } = await db.from("profiles")
      .select("full_name,role,is_banned")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profile?.is_banned) {
      await db.auth.signOut();
      currentUser = null;
      alert("هذا الحساب محظور من طرف الإدارة.");
    } else {
      isAdmin = profile?.role === "admin";

      $("fc-welcome").textContent =
        "مرحباً " + (profile?.full_name || currentUser.email || currentUser.phone || "");

      if (isAdmin) {
        $("fc-welcome").textContent += " — المشرف";
      }
    }
  }

  $("fc-auth").classList.toggle("fc-hidden", !!currentUser);
  $("fc-user").classList.toggle("fc-hidden", !currentUser);
  $("fc-publish").classList.toggle("fc-hidden", !currentUser);
await loadPosts();
  
  }

  $("fc-signup").onclick = async () => {
    const email = $("fc-email").value.trim();
    const password = $("fc-password").value;
    const name = $("fc-name").value.trim();
    if (!email || password.length < 6) return msg("أدخل البريد وكلمة مرور من 6 أحرف على الأقل.");
    const { error } = await db.auth.signUp({
      email, password, options: { data: { full_name: name } }
    });
    msg(error ? error.message : "تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا طُلب منك ذلك.");
  };

  $("fc-login").onclick = async () => {
    const { error } = await db.auth.signInWithPassword({
      email: $("fc-email").value.trim(),
      password: $("fc-password").value
    });
    msg(error ? error.message : "تم تسجيل الدخول.");
    if (!error) await refreshUser();
  };

  $("fc-send-code").onclick = async () => {
    const phone = $("fc-phone").value.trim();
    if (!phone) return msg("أدخل رقم الهاتف مع رمز الدولة، مثال: +2126XXXXXXXX");
    const { error } = await db.auth.signInWithOtp({ phone });
    if (error) return msg(error.message);
    phonePending = true;
    $("fc-phone-verify").classList.remove("fc-hidden");
    msg("تم إرسال الرمز إذا كان مزود الرسائل مفعلاً في Supabase.");
  };

  $("fc-verify-code").onclick = async () => {
    if (!phonePending) return;
    const { error } = await db.auth.verifyOtp({
      phone: $("fc-phone").value.trim(),
      token: $("fc-code").value.trim(),
      type: "sms"
    });
    msg(error ? error.message : "تم التحقق من الهاتف.");
    if (!error) await refreshUser();
  };

  $("fc-logout").onclick = async () => {
    await db.auth.signOut();
    msg("تم تسجيل الخروج.");
    await refreshUser();
  };

  $("fc-publish-btn").onclick = async () => {
    if (!currentUser) return msg("سجل الدخول أولاً.");
    const content = $("fc-content").value.trim();
    const file = $("fc-image").files[0];
    if (!content && !file) return msg("اكتب نص المنشور أو أضف صورة.");

    let image_url = null;
    if (file) {
      if (!file.type.startsWith("image/")) return msg("المرجو اختيار صورة فقط.");
      if (file.size > 5 * 1024 * 1024) return msg("حجم الصورة يجب ألا يتجاوز 5 ميغابايت.");
      const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "");
      const path = `${currentUser.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await db.storage.from("fellahi-images")
        .upload(path, file, { upsert: false });
      if (uploadError) return msg("تعذر رفع الصورة: " + uploadError.message);
      const { data: publicData } = db.storage.from("fellahi-images").getPublicUrl(path);
      image_url = publicData.publicUrl;
    }

    const { error } = await db.from("posts").insert({
      user_id: currentUser.id,
      content: content || "صورة فلاحية",
      image_url
    });
    if (error) return msg("تعذر نشر المنشور: " + error.message);
    $("fc-content").value = "";
    $("fc-image").value = "";
    msg("تم نشر منشورك بنجاح 🌱");
    await loadPosts();
  };

  async function loadPosts() {
    const feed = $("fc-feed");
    const { data: posts, error } = await db.from("posts")
      .select("*").order("created_at", { ascending: false }).limit(100);

    if (error) {
      feed.innerHTML = `<div class="fc-box">تعذر تحميل المنشورات: ${esc(error.message)}</div>`;
      return;
    }
    if (!posts?.length) {
      feed.innerHTML = '<div class="fc-box">لا توجد منشورات بعد. كن أول من يشارك! 🌱</div>';
      return;
    }

    const userIds = [...new Set(posts.map(p => p.user_id))];
    const postIds = posts.map(p => p.id);
    const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
      db.from("profiles").select("id,full_name").in("id", userIds),
      db.from("likes").select("post_id,user_id").in("post_id", postIds),
      db.from("comments").select("*").in("post_id", postIds).order("created_at")
    ]);

    const names = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name || "فلاح"]));
    feed.innerHTML = posts.map(post => {
      const postLikes = (likes || []).filter(l => l.post_id === post.id);
      const liked = postLikes.some(l => l.user_id === currentUser?.id);
      const postComments = (comments || []).filter(c => c.post_id === post.id);
      const owner = post.user_id === currentUser?.id;
      const canDelete = owner || isAdmin;

      return `
        <article class="fc-box fc-post">
          <strong>${esc(names[post.user_id] || "فلاح")}</strong>
          <div class="fc-muted">${new Date(post.created_at).toLocaleString("ar")}</div>
          <p>${esc(post.content)}</p>
          ${post.image_url ? `<img src="${esc(post.image_url)}" alt="صورة فلاحية" loading="lazy">` : ""}
          <div class="fc-actions">
            <button class="fc-btn fc-light" data-like="${post.id}">${liked ? "❤️" : "🤍"} إعجاب (${postLikes.length})</button>
            ${canDelete ? `<button class="fc-btn fc-light" data-delete="${post.id}">🗑️ حذف</button>` : ""}
          </div>
          <div class="fc-box">
            <strong>التعليقات (${postComments.length})</strong>
            ${postComments.map(c => `
              <p><b>${esc(names[c.user_id] || "مستخدم")}:</b> ${esc(c.content)}
              ${(c.user_id === currentUser?.id || isAdmin) ?
                `<button class="fc-btn fc-light" data-delete-comment="${c.id}">حذف</button>` : ""}
              </p>`).join("")}
            ${currentUser ? `
              <input class="fc-input" id="fc-comment-${post.id}" placeholder="اكتب تعليقاً...">
              <button class="fc-btn" data-comment="${post.id}">إرسال التعليق</button>
            ` : '<p class="fc-muted">سجل الدخول لإضافة تعليق.</p>'}
          </div>
        </article>`;
    }).join("");

    feed.querySelectorAll("[data-like]").forEach(btn => btn.onclick = async () => {
      if (!currentUser) return msg("سجل الدخول أولاً.");
      const post_id = btn.dataset.like;
      const { data: existing } = await db.from("likes").select("post_id")
        .eq("post_id", post_id).eq("user_id", currentUser.id).maybeSingle();
      const result = existing
        ? await db.from("likes").delete().eq("post_id", post_id).eq("user_id", currentUser.id)
        : await db.from("likes").insert({ post_id, user_id: currentUser.id });
      if (result.error) msg(result.error.message);
      await loadPosts();
    });

    feed.querySelectorAll("[data-comment]").forEach(btn => btn.onclick = async () => {
      const post_id = btn.dataset.comment;
      const content = $(`fc-comment-${post_id}`).value.trim();
      if (!content) return;
      const { error } = await db.from("comments").insert({
        post_id, user_id: currentUser.id, content
      });
      if (error) msg(error.message);
      await loadPosts();
    });

    feed.querySelectorAll("[data-delete]").forEach(btn => btn.onclick = async () => {
      if (!confirm("واش متأكد من حذف المنشور؟")) return;
      const { error } = await db.from("posts").delete().eq("id", btn.dataset.delete);
      if (error) msg(error.message);
      await loadPosts();
    });

    feed.querySelectorAll("[data-delete-comment]").forEach(btn => btn.onclick = async () => {
      if (!confirm("حذف التعليق؟")) return;
      const { error } = await db.from("comments").delete().eq("id", btn.dataset.deleteComment);
      if (error) msg(error.message);
      await loadPosts();
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
    if (!adminPanel.classList.contains("fc-hidden")) {
      await loadAdminPanel();
    }
  };

  async function loadAdminPanel() {
    if (!isAdmin || !currentUser) return;

    const [users, posts, comments] = await Promise.all([
      db.from("profiles").select("id,full_name,role,created_at,is_banned")
        .order("created_at", { ascending: false }).limit(200),
      db.from("posts").select("id", { count: "exact", head: true }),
      db.from("comments").select("id", { count: "exact", head: true })
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
    <p class="fc-muted">
      الصلاحية: ${user.role === "admin" ? "مدير" : "مستخدم"}
    </p>
    <p class="fc-muted">
      الحالة: ${user.is_banned ? "🚫 محظور" : "✅ نشيط"}
    </p>
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

    const { error } = await db.from("profiles")
      .update({ is_banned: !user.is_banned })
      .eq("id", id);

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

  const originalRefreshUser = refreshUser;
  refreshUser = async function() {
    await originalRefreshUser();
    adminButton.style.display = "inline-block";
  };
  db.auth.onAuthStateChange(() => {
    setTimeout(refreshUser, 0);
  });

 alert("ملف المجتمع يعمل");
  refreshUser();})();
