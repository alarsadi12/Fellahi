
// فلاحي 2.0 — نظام تسجيل الدخول الموحد
(() => {
  "use strict";

  const SUPABASE_URL = "https://kldxlodykkomkresegyt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_AOy4zEw5LYHklwYOaQGmoA_G01FCILJ";

  const STYLE = `
    #fellahi-auth-gate {
      position:fixed;
      inset:0;
      z-index:999999;
      background:linear-gradient(145deg,#e8f3e9,#f7faf6 55%,#e5f0e7);
      overflow-y:auto;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
      font-family:Arial,Tahoma,sans-serif;
      direction:rtl;
      color:#183329;
    }

    #fellahi-auth-gate * { box-sizing:border-box; }

    #fellahi-auth-gate .auth-card {
      width:100%;
      max-width:450px;
      background:#fff;
      border-radius:27px;
      overflow:hidden;
      box-shadow:0 20px 65px rgba(20,70,45,.16);
      text-align:center;
      border:1px solid rgba(255,255,255,.8);
    }

    #fellahi-auth-gate .auth-hero {
      position:relative;
      height:190px;
      overflow:hidden;
      background:linear-gradient(140deg,#176b45,#0b422d);
      display:flex;
      align-items:center;
      justify-content:center;
    }

    #fellahi-auth-gate .auth-hero svg {
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
    }

    #fellahi-auth-gate .hero-content {
      position:relative;
      z-index:2;
      color:white;
      padding-top:12px;
      text-shadow:0 2px 8px #073d2c55;
    }

    #fellahi-auth-gate .hero-content h1 {
      color:white;
      font-size:32px;
      margin:7px 0;
      letter-spacing:.3px;
    }

    #fellahi-auth-gate .hero-content p {
      margin:0;
      font-size:13px;
      color:#e4f5e8;
    }

    #fellahi-auth-gate .auth-logo {
      width:76px;
      height:76px;
      margin:0 auto;
      border-radius:23px;
      background:linear-gradient(145deg,#ffffff,#e4f5e7);
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 7px 22px #063d2c55;
      border:3px solid #ffffff55;
    }

    #fellahi-auth-gate .auth-logo svg {
      width:59px;
      height:59px;
    }

    #fellahi-auth-gate .auth-body {
      padding:23px 24px 25px;
    }

    #fellahi-auth-gate .auth-intro {
      color:#718078;
      font-size:13px;
      line-height:1.8;
      margin:0 0 19px;
    }

    #fellahi-auth-gate .auth-tabs {
      display:flex;
      background:#edf4ef;
      border-radius:14px;
      padding:5px;
      margin-bottom:19px;
      gap:5px;
    }

    #fellahi-auth-gate .auth-tabs button {
      flex:1;
      border:0;
      border-radius:11px;
      padding:13px 5px;
      background:transparent;
      color:#567064;
      font-weight:bold;
      cursor:pointer;
      font-size:14px;
      transition:.2s;
    }

    #fellahi-auth-gate .auth-tabs button.active {
      background:#176b45;
      color:white;
      box-shadow:0 4px 12px #176b4530;
    }

    #fellahi-auth-gate .auth-field {
      text-align:right;
      margin:13px 0;
    }

    #fellahi-auth-gate .auth-field label {
      display:block;
      font-size:13px;
      font-weight:bold;
      margin:0 3px 8px;
      color:#294b3b;
    }

    #fellahi-auth-gate input {
      width:100%;
      border:1px solid #dce8df;
      background:#f9fcf9;
      border-radius:13px;
      padding:15px;
      font-size:15px;
      outline:none;
      direction:rtl;
      transition:.2s;
      color:#183329;
    }

    #fellahi-auth-gate input:focus {
      border-color:#176b45;
      background:#fff;
      box-shadow:0 0 0 3px #176b4515;
    }

    #fellahi-auth-gate .auth-submit {
      width:100%;
      border:0;
      border-radius:14px;
      padding:16px;
      margin-top:13px;
      background:linear-gradient(135deg,#218452,#125536);
      color:white;
      font-size:16px;
      font-weight:bold;
      cursor:pointer;
      box-shadow:0 7px 17px #176b4530;
      transition:transform .2s,opacity .2s;
    }

    #fellahi-auth-gate .auth-submit:active {
      transform:scale(.98);
    }

    #fellahi-auth-gate .auth-submit:disabled {
      opacity:.6;
      cursor:wait;
    }

    #fellahi-auth-gate .auth-message {
      display:none;
      padding:12px;
      border-radius:11px;
      margin-top:14px;
      font-size:13px;
      line-height:1.8;
      overflow-wrap:anywhere;
    }

    #fellahi-auth-gate .auth-footer {
      margin-top:20px;
      padding-top:15px;
      border-top:1px solid #edf2ee;
      color:#89978e;
      font-size:12px;
    }

    #fellahi-auth-gate .auth-loading {
      color:#176b45;
      font-weight:bold;
      padding:25px;
    }

    /* إصلاح القائمة الجانبية في Android وTWA */
    #drawer {
      position:fixed !important;
      top:0 !important;
      bottom:0 !important;
      box-sizing:border-box !important;
      overflow-y:auto !important;
      overflow-x:hidden !important;
      padding-bottom:100px !important;
      -webkit-overflow-scrolling:touch;
    }

    /* زر تسجيل الخروج */
    #drawer #fellahi-logout-button {
      position:absolute !important;
      right:17px !important;
      left:17px !important;
      bottom:calc(15px + env(safe-area-inset-bottom, 0px)) !important;
      z-index:9999 !important;
      display:flex !important;
      align-items:center !important;
      justify-content:flex-start !important;
      gap:11px !important;
      width:calc(100% - 34px) !important;
      min-height:49px !important;
      box-sizing:border-box !important;
      padding:13px 12px !important;
      margin:0 !important;
      border:1px solid #f3d9d6 !important;
      border-radius:12px !important;
      background:#fff5f4 !important;
      color:#b52d20 !important;
      text-align:right !important;
      font-family:Arial,Tahoma,sans-serif !important;
      font-size:14px !important;
      font-weight:700 !important;
      visibility:visible !important;
      opacity:1 !important;
      cursor:pointer !important;
      box-shadow:0 4px 14px rgba(0,0,0,.10) !important;
    }

    #drawer #fellahi-logout-button span {
      width:28px;
      text-align:center;
      font-size:19px;
    }

    #drawer #fellahi-logout-button:disabled {
      opacity:.6 !important;
      cursor:wait !important;
    }

    body.fellahi-auth-locked {
      overflow:hidden !important;
    }

    @media(max-width:380px) {
      #fellahi-auth-gate { padding:10px; }
      #fellahi-auth-gate .auth-hero { height:170px; }
      #fellahi-auth-gate .auth-body { padding:19px 17px 22px; }
    }
  `;

  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.appendChild(style);

  const gate = document.createElement("div");
  gate.id = "fellahi-auth-gate";

  gate.innerHTML = `
    <div class="auth-card">
      <div class="auth-loading">جاري التحقق من الحساب...</div>
    </div>
  `;

  function createGate() {
    if (!gate.isConnected) {
      document.body.appendChild(gate);
    }
    document.body.classList.add("fellahi-auth-locked");
  }

  function removeGate() {
    gate.remove();
    document.body.classList.remove("fellahi-auth-locked");
  }

  function showMessage(message, success = false) {
    const box = gate.querySelector(".auth-message");
    if (!box) return;

    box.textContent = message;
    box.style.display = "block";
    box.style.background = success ? "#e8f7ed" : "#fff0ed";
    box.style.color = success ? "#176b45" : "#b52d20";
  }

  let db = null;
  let currentMode = "login";
  let busy = false;
  let drawerObserver = null;

  function renderForm() {
    currentMode = currentMode === "signup" ? "signup" : "login";

    gate.innerHTML = `
      <div class="auth-card">
        <div class="auth-hero">
          <svg viewBox="0 0 450 210" preserveAspectRatio="xMidYMid slice"
               xmlns="http://www.w3.org/2000/svg">
            <circle cx="355" cy="48" r="28" fill="#F5D98B" opacity=".95"/>
            <path d="M0 120 Q90 55 180 115 T450 95 V210 H0Z" fill="#367C50"/>
            <path d="M0 145 Q100 90 210 140 T450 125 V210 H0Z" fill="#75A95D"/>
            <path d="M0 175 Q100 125 220 170 T450 155 V210 H0Z" fill="#B4D58B"/>
            <path d="M0 195 Q130 160 250 190 T450 180 V210 H0Z" fill="#D6E9AD"/>
            <g fill="#E7F3D2" opacity=".8">
              <path d="M40 100 Q25 78 44 65 Q64 80 40 100Z"/>
              <path d="M60 105 Q58 78 82 75 Q87 99 60 105Z"/>
              <path d="M390 112 Q375 88 395 78 Q415 96 390 112Z"/>
            </g>
            <g stroke="#E8F5D8" stroke-width="2" opacity=".7" fill="none">
              <path d="M15 205 Q90 165 165 205"/>
              <path d="M180 205 Q270 155 360 205"/>
              <path d="M300 205 Q370 170 445 195"/>
            </g>
            <g fill="#D8F0C1">
              <path d="M110 145 Q95 120 112 108 Q132 124 110 145Z"/>
              <path d="M112 145 Q132 115 150 126 Q144 145 112 145Z"/>
              <path d="M112 145 V165" stroke="#D8F0C1" stroke-width="4"/>
            </g>
          </svg>

          <div class="hero-content">
            <div class="auth-logo">
              <svg viewBox="0 0 100 100" fill="none"
                   xmlns="http://www.w3.org/2000/svg">
                <path d="M50 83V43" stroke="#176b45" stroke-width="6" stroke-linecap="round"/>
                <path d="M50 58C22 58 16 37 17 20C39 19 57 30 50 58Z" fill="#79BD68"/>
                <path d="M51 46C54 20 73 12 89 14C91 37 76 52 51 46Z" fill="#176b45"/>
                <path d="M25 77C37 70 63 70 75 77" stroke="#176b45" stroke-width="5" stroke-linecap="round"/>
                <path d="M19 85H81" stroke="#176b45" stroke-width="5" stroke-linecap="round"/>
              </svg>
            </div>
            <h1>فلاحي 2.0</h1>
            <p>التكنولوجيا لخدمة الفلاح</p>
          </div>
        </div>

        <div class="auth-body">
          <div class="auth-intro">
            مرحباً بك في عالم فلاحي<br>
            أدواتك ومجتمعك وسوقك في مكان واحد
          </div>

          <div class="auth-tabs">
            <button type="button" data-mode="login"
              class="${currentMode === "login" ? "active" : ""}">
              تسجيل الدخول
            </button>
            <button type="button" data-mode="signup"
              class="${currentMode === "signup" ? "active" : ""}">
              حساب جديد
            </button>
          </div>

          <form id="fellahi-auth-form">
            <div class="auth-field" id="fellahi-name-field"
              style="display:${currentMode === "signup" ? "block" : "none"}">
              <label>الاسم الكامل</label>
              <input id="fellahi-name" type="text"
                placeholder="اكتب اسمك الكامل" autocomplete="name">
            </div>

            <div class="auth-field">
              <label>البريد الإلكتروني</label>
              <input id="fellahi-email" type="email"
                placeholder="example@email.com" autocomplete="email" required>
            </div>

            <div class="auth-field">
              <label>كلمة المرور</label>
              <input id="fellahi-password" type="password"
                placeholder="كلمة المرور"
                autocomplete="${currentMode === "login" ? "current-password" : "new-password"}"
                minlength="6" required>
            </div>

            <button class="auth-submit" id="fellahi-submit" type="submit">
              ${currentMode === "login" ? "دخول إلى التطبيق ←" : "إنشاء حساب جديد"}
            </button>

            <div class="auth-message"></div>
          </form>

          <div class="auth-footer">
            🌱 فلاحي 2.0 — شريكك في كل خطوة زراعية
          </div>
        </div>
      </div>
    `;

    gate.querySelectorAll("[data-mode]").forEach(button => {
      button.addEventListener("click", () => {
        currentMode = button.dataset.mode;
        renderForm();
      });
    });

    gate.querySelector("#fellahi-auth-form")
      .addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy || !db) return;

    const name = gate.querySelector("#fellahi-name").value.trim();
    const email = gate.querySelector("#fellahi-email").value.trim();
    const password = gate.querySelector("#fellahi-password").value;

    if (!email || !password) {
      showMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    if (currentMode === "signup" && !name) {
      showMessage("يرجى إدخال الاسم الكامل.");
      return;
    }

    if (password.length < 6) {
      showMessage("كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.");
      return;
    }

    busy = true;

    const submit = gate.querySelector("#fellahi-submit");
    submit.disabled = true;
    submit.textContent = "يرجى الانتظار...";

    try {
      let result;

      if (currentMode === "signup") {
        result = await db.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });

        if (result.error) throw result.error;

        if (result.data.session) {
          showMessage("تم إنشاء الحساب بنجاح. مرحباً بك!", true);
          setTimeout(removeGate, 700);
        } else {
          showMessage(
            "تم إنشاء الحساب. إذا طُلب منك تأكيد البريد الإلكتروني، افتح رسالة التأكيد ثم ارجع وسجّل الدخول.",
            true
          );
          currentMode = "login";
          setTimeout(renderForm, 1800);
        }
      } else {
        result = await db.auth.signInWithPassword({
          email,
          password
        });

        if (result.error) throw result.error;

        showMessage("تم تسجيل الدخول بنجاح!", true);
        setTimeout(removeGate, 500);
      }
    } catch (error) {
      showMessage(
        error && error.message
          ? error.message
          : "وقع خطأ. حاول مرة أخرى."
      );
    } finally {
      busy = false;

      const button = gate.querySelector("#fellahi-submit");
      if (button) {
        button.disabled = false;
        button.textContent =
          currentMode === "login"
            ? "دخول إلى التطبيق ←"
            : "إنشاء حساب جديد";
      }
    }
  }

  // إنشاء زر تسجيل الخروج
  function createLogoutButton() {
    const drawer = document.getElementById("drawer");
    if (!drawer || !db) return;

    let button = document.getElementById("fellahi-logout-button");

    if (button && button.parentElement === drawer) return;
    if (button) button.remove();

    button = document.createElement("button");
    button.id = "fellahi-logout-button";
    button.type = "button";
    button.innerHTML = "<span>🚪</span>تسجيل الخروج";

    button.addEventListener("click", async () => {
      if (!confirm("هل تريد تسجيل الخروج؟")) return;

      button.disabled = true;

      try {
        const { error } = await db.auth.signOut();
        if (error) throw error;
      } catch (error) {
        alert("تعذر تسجيل الخروج: " + error.message);
        button.disabled = false;
      }
    });

    drawer.appendChild(button);
  }

  // مراقبة القائمة مرة واحدة فقط
  function watchDrawer() {
    createLogoutButton();

    if (drawerObserver || !document.body) return;

    drawerObserver = new MutationObserver(() => {
      if (db) createLogoutButton();
    });

    drawerObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async function start() {
    createGate();

    try {
      if (!window.supabase) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
          script.onload = resolve;
          script.onerror = () =>
            reject(new Error("تعذر تحميل خدمة تسجيل الدخول."));
          document.head.appendChild(script);
        });
      }

      db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

      window.fellahiSupabase = db;

      const { data, error } = await db.auth.getSession();
      if (error) throw error;

      if (data.session) {
        removeGate();
        watchDrawer();
      } else {
        createGate();
        renderForm();
      }

      db.auth.onAuthStateChange((event, session) => {
        if (session) {
          removeGate();
          watchDrawer();
        } else {
          const logout = document.getElementById("fellahi-logout-button");
          if (logout) logout.remove();

          createGate();
          renderForm();
        }
      });

    } catch (error) {
      gate.innerHTML = `
        <div class="auth-card">
          <div class="auth-hero">
            <div class="hero-content">
              <h1>فلاحي 2.0</h1>
              <p>التكنولوجيا لخدمة الفلاح</p>
            </div>
          </div>
          <div class="auth-body">
            <p style="color:#b52d20;line-height:1.8">
              تعذر الاتصال بخدمة تسجيل الدخول.
            </p>
            <button class="auth-submit" id="fellahi-retry">
              إعادة المحاولة
            </button>
          </div>
        </div>
      `;

      gate.querySelector("#fellahi-retry")
        .addEventListener("click", () => location.reload());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
