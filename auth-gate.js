// فلاحي 2.0 — نظام تسجيل الدخول الموحد
(() => {
  "use strict";

  const SUPABASE_URL = "https://kldxlodykkomkresegyt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_AOy4zEw5LYHklwYOaQGmoA_G01FCILJ";

  const STYLE = `
    #fellahi-auth-gate {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: #f3f8f4;
      overflow-y: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: Arial,Tahoma,sans-serif;
      direction: rtl;
      color: #183329;
    }

    #fellahi-auth-gate * { box-sizing: border-box; }

    #fellahi-auth-gate .auth-card {
      width: 100%;
      max-width: 430px;
      background: white;
      border-radius: 25px;
      padding: 27px 23px;
      box-shadow: 0 12px 45px rgba(20,70,45,.12);
      text-align: center;
    }

    #fellahi-auth-gate .auth-logo {
      width: 112px;
      height: 112px;
      margin: 0 auto 12px;
      border-radius: 28px;
      background: linear-gradient(145deg,#176b45,#0d4930);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 8px 20px #176b4530;
    }

    #fellahi-auth-gate .auth-logo svg {
      width: 88px;
      height: 88px;
    }

    #fellahi-auth-gate h1 {
      color: #176b45;
      font-size: 29px;
      margin: 8px 0;
    }

    #fellahi-auth-gate .auth-subtitle {
      color: #718078;
      font-size: 14px;
      line-height: 1.8;
      margin-bottom: 22px;
    }

    #fellahi-auth-gate .auth-tabs {
      display: flex;
      background: #edf4ef;
      border-radius: 13px;
      padding: 4px;
      margin-bottom: 18px;
      gap: 5px;
    }

    #fellahi-auth-gate .auth-tabs button {
      flex: 1;
      border: 0;
      border-radius: 10px;
      padding: 12px 5px;
      background: transparent;
      color: #567064;
      font-weight: bold;
      cursor: pointer;
    }

    #fellahi-auth-gate .auth-tabs button.active {
      background: #176b45;
      color: white;
    }

    #fellahi-auth-gate .auth-field {
      text-align: right;
      margin: 12px 0;
    }

    #fellahi-auth-gate .auth-field label {
      display: block;
      font-size: 13px;
      font-weight: bold;
      margin: 0 3px 7px;
    }

    #fellahi-auth-gate input {
      width: 100%;
      border: 1px solid #dce8df;
      background: #fbfdfb;
      border-radius: 12px;
      padding: 14px;
      font-size: 15px;
      outline: none;
      direction: rtl;
    }

    #fellahi-auth-gate input:focus {
      border-color: #176b45;
      box-shadow: 0 0 0 3px #176b4515;
    }

    #fellahi-auth-gate .auth-submit {
      width: 100%;
      border: 0;
      border-radius: 13px;
      padding: 15px;
      margin-top: 12px;
      background: #176b45;
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    }

    #fellahi-auth-gate .auth-submit:disabled {
      opacity: .6;
      cursor: wait;
    }

    #fellahi-auth-gate .auth-message {
      display: none;
      padding: 11px;
      border-radius: 10px;
      margin-top: 13px;
      font-size: 13px;
      line-height: 1.7;
      overflow-wrap: anywhere;
    }

    #fellahi-auth-gate .auth-footer {
      margin-top: 20px;
      color: #89978e;
      font-size: 12px;
    }

    #fellahi-auth-gate .auth-loading {
      color: #176b45;
      font-weight: bold;
      padding: 25px;
    }

    #fellahi-logout-button {
      position: fixed;
      z-index: 999990;
      left: 12px;
      bottom: 85px;
      border: 0;
      border-radius: 30px;
      padding: 10px 15px;
      background: #176b45;
      color: white;
      font-weight: bold;
      box-shadow: 0 3px 12px #0002;
      cursor: pointer;
      display: none;
    }

    body.fellahi-auth-locked {
      overflow: hidden !important;
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

  function renderForm() {
    currentMode = currentMode === "signup" ? "signup" : "login";

    gate.innerHTML = `
      <div class="auth-card">

        <div class="auth-logo">
          <svg viewBox="0 0 100 100" fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <path d="M50 83V43" stroke="white"
              stroke-width="6" stroke-linecap="round"/>
            <path d="M50 58C22 58 16 37 17 20C39 19 57 30 50 58Z"
              fill="#B8E7A5"/>
            <path d="M51 46C54 20 73 12 89 14C91 37 76 52 51 46Z"
              fill="#D9F2C8"/>
            <path d="M25 77C37 70 63 70 75 77"
              stroke="#D9F2C8" stroke-width="5"
              stroke-linecap="round"/>
            <path d="M19 85H81" stroke="white"
              stroke-width="5" stroke-linecap="round"/>
          </svg>
        </div>

        <h1>فلاحي 2.0</h1>

        <div class="auth-subtitle">
          شريكك الذكي في الفلاحة<br>
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
              placeholder="اكتب اسمك الكامل"
              autocomplete="name">
          </div>

          <div class="auth-field">
            <label>البريد الإلكتروني</label>
            <input id="fellahi-email" type="email"
              placeholder="example@email.com"
              autocomplete="email" required>
          </div>

          <div class="auth-field">
            <label>كلمة المرور</label>
            <input id="fellahi-password" type="password"
              placeholder="كلمة المرور"
              autocomplete="${currentMode === "login" ? "current-password" : "new-password"}"
              minlength="6" required>
          </div>

          <button class="auth-submit" id="fellahi-submit" type="submit">
            ${currentMode === "login" ? "دخول إلى التطبيق" : "إنشاء حساب"}
          </button>

          <div class="auth-message"></div>
        </form>

        <div class="auth-footer">
          فلاحي 2.0 — التكنولوجيا لخدمة الفلاح
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
            ? "دخول إلى التطبيق"
            : "إنشاء حساب";
      }
    }
  }

  function createLogoutButton() {
    if (document.getElementById("fellahi-logout-button")) return;

    const button = document.createElement("button");
    button.id = "fellahi-logout-button";
    button.type = "button";
    button.textContent = "تسجيل الخروج";

    button.addEventListener("click", async () => {
      if (!confirm("هل تريد تسجيل الخروج؟")) return;

      button.disabled = true;

      const { error } = await db.auth.signOut();

      if (error) {
        alert("تعذر تسجيل الخروج: " + error.message);
        button.disabled = false;
      }
    });

    document.body.appendChild(button);
  }

  async function start() {
    createGate();

    try {
      if (!window.supabase) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
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
        createLogoutButton();
        document.getElementById("fellahi-logout-button").style.display =
          "block";
      } else {
        createGate();
        renderForm();
      }

      db.auth.onAuthStateChange((event, session) => {
        if (session) {
          removeGate();
          createLogoutButton();
          document.getElementById("fellahi-logout-button").style.display =
            "block";
        } else {
          const logout = document.getElementById("fellahi-logout-button");
          if (logout) logout.style.display = "none";

          createGate();
          renderForm();
        }
      });

    } catch (error) {
      gate.innerHTML = `
        <div class="auth-card">
          <h1>فلاحي 2.0</h1>
          <p style="color:#b52d20;line-height:1.8">
            تعذر الاتصال بخدمة تسجيل الدخول.
          </p>
          <button class="auth-submit" id="fellahi-retry">
            إعادة المحاولة
          </button>
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
