# فلاحي – Fellahi (نسخة أولية)

## محتويات النسخة

* واجهة عربية RTL متجاوبة.
* حاسبة كمية السماد: المساحة بالهكتار × الجرعة بالكيلوغرام/هكتار.
* تسجيل مواعيد السقي.
* دليل تمهيدي لعدد من المحاصيل.
* سجل النباتات والأشجار.
* حفظ محلي على الجهاز عبر localStorage.
* دعم التثبيت كتطبيق PWA والعمل دون اتصال بعد أول تحميل (عند الاستضافة عبر HTTPS).

## تشغيل سريع

افتح `index.html` في المتصفح للمعاينة. بعض ميزات PWA والتثبيت والعمل دون اتصال تحتاج استضافة HTTPS.

## نشر مجاني مقترح

يمكن نشر الملفات على GitHub Pages مجاناً:

1. أنشئ حساب GitHub ومستودعاً جديداً باسم `fellahi`.
1. ارفع جميع الملفات الموجودة في المجلد إلى المستودع.
1. من Settings ثم Pages اختر Deploy from a branch ثم `main` و`/root`.
1. افتح الرابط الناتج عبر الهاتف.

## التثبيت

* Android: افتح رابط الموقع في Chrome ثم اختر Install app أو Add to Home screen.
* iPhone: افتح الرابط في Safari ثم Share ثم Add to Home Screen.

## حدود النسخة

* لا يوجد تشخيص صور بالذكاء الاصطناعي بعد.
* البيانات محفوظة على نفس الجهاز والمتصفح فقط؛ حذف بيانات المتصفح قد يمحوها.
* لا توجد مزامنة بين الأجهزة أو حسابات مستخدمين.
* المحتوى الزراعي عام، ولا يقدم جرعات تسميد أو علاجاً شخصياً. يجب الرجوع لتحليل التربة والماء وملصق المنتج ومختص محلي.

## Global edition update

* Interface language selector: Arabic, English, French.
* Interface direction changes automatically: RTL for Arabic, LTR for English and French.
* Language choice is saved locally on the device.
* This is initial interface localization; agricultural recommendations must be localized and validated for each region before use.

## Fellahi Global 3.0 — Plant health check interface

* Added a plant photo picker with local preview.
* Added crop, country/region, and symptom fields.
* Added Arabic, English, and French labels for the new screen.
* This release does not perform AI diagnosis yet. A secure backend/API must be connected before image analysis can be offered. Do not present unverified guesses as diagnoses. \\n\\n## صفحات أساسية\\nأضيفت صفحات عن فلاحي وسياسة الخصوصية واتصل بنا داخل مجلد pages. استبدل [teqnifilahi@gmail.com](mailto:teqnifilahi@gmail.com) في صفحات التواصل ببريد تملكه قبل النشر. هذه الصفحات لا تضمن قبول AdSense؛ راجع السياسات وأضف محتوى زراعياً أصلياً ومفيداً.\\n
