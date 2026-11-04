import type { Locale } from '@/lib/i18n/config';

export type LegalBlock = { h: string; p?: string[]; ul?: string[] };
export type LegalDoc = { title: string; updated: string; contactLabel: string; contactIntro: string; blocks: LegalBlock[] };
export type LegalKind = 'privacy' | 'terms' | 'accessibility';

const EN: Record<LegalKind, LegalDoc> = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: November 2026',
    contactLabel: 'Contact',
    contactIntro: 'To exercise your rights or ask about privacy, contact us:',
    blocks: [
      { h: 'Who we are', p: ['Music World is part of VArt Tools (org-va.com), operated by an individual developer in Israel. This policy explains what personal data the service collects, why, who receives it, and your rights under Israeli law, including the Protection of Privacy Law, 5741-1981.'] },
      { h: 'What we collect', ul: [
        'Account data: email address, username/display name, password (stored hashed by our authentication provider) and profile picture.',
        'Content you create: tracks, covers, videos, playlists, likes and related details (title, genre, tags, description).',
        'Usage counters: plays, downloads, shares and views of tracks and videos.',
        'Technical data: login session cookies, a language cookie, and your IP address, which our hosting and database providers process to deliver and protect the service.',
        'Offline listening: tracks you save for offline use are stored in your browser on your own device and are not sent to us.',
      ]},
      { h: 'Public content', p: ['Your username, profile, public playlists, tracks and videos are visible to everyone, can be played and downloaded by other users, and may be indexed by search engines. Do not publish information you want to keep private. You can delete your content at any time or ask us to remove it.'] },
      { h: 'Providers and transfers abroad', p: ['We use Supabase (authentication, database and file storage; servers in the Asia-Pacific region), Vercel (hosting) and Ko-fi (voluntary donations; we do not receive card details). Data may therefore be processed outside Israel. By using the service you agree to such transfers. The service does not show third-party ads.'] },
      { h: 'Retention and security', p: ['We keep data while your account exists or as needed to provide the service, and delete it on request unless the law requires otherwise. We use reasonable security measures such as encrypted connections and database access rules, but no system is completely secure.'] },
      { h: 'Your rights', p: ['You may ask to inspect the personal data we hold about you, correct it, or delete it, and may withdraw consent for future processing. You may also contact the Privacy Protection Authority in Israel. Providing data is voluntary, but without an email address you cannot create an account.'] },
      { h: 'Children', p: ['The service is intended for users aged 18 and over. We do not knowingly collect data from minors.'] },
      { h: 'Changes', p: ['We may update this policy; the date above shows the latest version.'] },
    ],
  },
  terms: {
    title: 'Terms of Use',
    updated: 'Last updated: November 2026',
    contactLabel: 'Contact',
    contactIntro: 'To report content or ask a question, contact us:',
    blocks: [
      { h: 'Acceptance', p: ['These terms govern your use of Music World (part of VArt Tools). By using the service or creating an account you agree to them and to the Privacy Policy. Nothing here limits rights that the law does not allow to be waived.'] },
      { h: 'Accounts', p: ['You must be 18 or older to register or upload content. Provide accurate information and keep your login details safe; you are responsible for activity in your account. We may limit, suspend or remove accounts or content, with or without notice, if these terms are breached, to protect the service or users, or as required by law.'] },
      { h: 'Your content', p: ['You are responsible for everything you upload. You confirm that you own it or have all rights and permissions needed to publish it, and that it does not infringe anyone’s copyright, privacy or other rights. Do not upload content that is unlawful, defamatory, hateful, threatening, sexually explicit, misleading or spam.', 'You grant us a non-exclusive licence to host, store and display your content, and you allow other users to stream and download it through the service for personal use. We may, but are not obliged to, review, restrict or remove content.'] },
      { h: 'Reporting content and copyright', p: ['If you believe content infringes your rights or is unlawful, contact us with a description and link, your name and contact details, and the basis of your claim. We will review it promptly and may remove the content or disable access. If your content was removed by mistake you may reply with an explanation. Repeat infringers may be suspended.'] },
      { h: 'Donations', p: ['Donations through the Ko-fi link are voluntary, processed by Ko-fi under its terms, and support the operation of the service. Where Israeli consumer protection law gives you rights, these terms do not limit them.'] },
      { h: 'Disclaimer and liability', p: ['The service is provided “as is” and “as available” without guarantees of availability or accuracy. To the maximum extent permitted by law we are not liable for indirect or consequential damages, loss of data or income, or for content uploaded by users. This does not exclude liability that cannot be excluded by law.'] },
      { h: 'Changes and governing law', p: ['We may update these terms; continued use means you accept the update. These terms are governed by the laws of the State of Israel and the competent courts in Israel, subject to mandatory consumer rights.'] },
    ],
  },
  accessibility: {
    title: 'Accessibility Statement',
    updated: 'Last updated: November 2026',
    contactLabel: 'Accessibility requests',
    contactIntro: 'If you found a barrier or need another way to use the service, contact us:',
    blocks: [
      { h: 'Our commitment', p: ['We want Music World to be usable by as many people as possible, including people with disabilities, and we work towards the Israeli Standard SI 5568 (based on WCAG 2.0 level AA).'] },
      { h: 'What we do', ul: ['Available in four languages, with right-to-left layout for Hebrew and Arabic.', 'Pages can be zoomed and adapt to phones, tablets and computers.', 'We review accessibility as we update the service.'] },
      { h: 'Known limitations', p: ['The service is not yet fully accessible. Some parts, such as the audio visualizer, mixer and player controls, may be difficult to use with a screen reader or keyboard only, or have insufficient colour contrast. Content uploaded by users (for example images without descriptions) is outside our control. We are working on improvements.'] },
      { h: 'Statement basis', p: ['This statement is based on our own review, not on a formal accessibility audit.'] },
    ],
  },
};

const RU: Record<LegalKind, LegalDoc> = {
  privacy: {
    title: 'Политика конфиденциальности',
    updated: 'Обновлено: ноябрь 2026',
    contactLabel: 'Контакты',
    contactIntro: 'Чтобы воспользоваться своими правами или задать вопрос о конфиденциальности, свяжитесь с нами:',
    blocks: [
      { h: 'Кто мы', p: ['Music World — часть VArt Tools (org-va.com), которой управляет разработчик-физлицо в Израиле. Эта политика объясняет, какие персональные данные собирает сервис, зачем, кто их получает и какие у вас права по израильскому законодательству, включая Закон о защите частной жизни 5741-1981.'] },
      { h: 'Что мы собираем', ul: [
        'Данные аккаунта: email, имя пользователя/отображаемое имя, пароль (хранится в виде хеша у провайдера авторизации) и аватар.',
        'Созданный вами контент: треки, обложки, видео, плейлисты, лайки и сопутствующие данные (название, жанр, теги, описание).',
        'Счётчики: прослушивания, скачивания, репосты и просмотры треков и видео.',
        'Технические данные: cookies сессии входа, cookie языка и ваш IP-адрес, который обрабатывают хостинг и провайдер базы данных для работы и защиты сервиса.',
        'Офлайн-прослушивание: треки, сохранённые для офлайна, хранятся в вашем браузере на вашем устройстве и нам не отправляются.',
      ]},
      { h: 'Публичный контент', p: ['Ваше имя пользователя, профиль, публичные плейлисты, треки и видео видны всем, их могут слушать и скачивать другие пользователи, и они могут индексироваться поисковиками. Не публикуйте то, что хотите сохранить в тайне. Вы можете удалить свой контент в любой момент или попросить нас это сделать.'] },
      { h: 'Поставщики и передача данных за границу', p: ['Мы используем Supabase (авторизация, база данных и хранение файлов; серверы в азиатско-тихоокеанском регионе), Vercel (хостинг) и Ko-fi (добровольные донаты; данные карт мы не получаем). Поэтому данные могут обрабатываться за пределами Израиля. Используя сервис, вы соглашаетесь на такую передачу. Сторонняя реклама в сервисе не показывается.'] },
      { h: 'Хранение и безопасность', p: ['Мы храним данные, пока существует ваш аккаунт или пока это нужно для работы сервиса, и удаляем их по запросу, если закон не требует иного. Мы применяем разумные меры защиты, такие как шифрованные соединения и правила доступа к базе данных, но ни одна система не защищена полностью.'] },
      { h: 'Ваши права', p: ['Вы можете запросить доступ к своим персональным данным, их исправление или удаление и отозвать согласие на дальнейшую обработку. Вы также можете обратиться в Управление по защите частной жизни Израиля. Предоставление данных добровольно, но без email создать аккаунт нельзя.'] },
      { h: 'Дети', p: ['Сервис предназначен для пользователей от 18 лет. Мы сознательно не собираем данные несовершеннолетних.'] },
      { h: 'Изменения', p: ['Мы можем обновлять политику; дата вверху показывает последнюю версию.'] },
    ],
  },
  terms: {
    title: 'Условия использования',
    updated: 'Обновлено: ноябрь 2026',
    contactLabel: 'Контакты',
    contactIntro: 'Чтобы пожаловаться на контент или задать вопрос, свяжитесь с нами:',
    blocks: [
      { h: 'Принятие условий', p: ['Эти условия регулируют использование Music World (части VArt Tools). Пользуясь сервисом или создавая аккаунт, вы соглашаетесь с ними и с Политикой конфиденциальности. Ничто здесь не ограничивает права, от которых закон не позволяет отказаться.'] },
      { h: 'Аккаунты', p: ['Для регистрации и загрузки контента вам должно быть 18 лет или больше. Указывайте верные данные и берегите данные для входа; вы отвечаете за действия в аккаунте. Мы можем ограничить, приостановить или удалить аккаунт или контент, с уведомлением или без него, при нарушении условий, для защиты сервиса или пользователей либо если этого требует закон.'] },
      { h: 'Ваш контент', p: ['Вы отвечаете за всё, что загружаете. Вы подтверждаете, что являетесь владельцем контента или имеете все права и разрешения на его публикацию и что он не нарушает чужие авторские права, право на частную жизнь или иные права. Не загружайте контент, который незаконен, клеветнический, разжигает ненависть, угрожает, сексуально откровенен, вводит в заблуждение или является спамом.', 'Вы предоставляете нам неисключительную лицензию на хранение и показ вашего контента и разрешаете другим пользователям слушать и скачивать его через сервис для личного использования. Мы вправе (но не обязаны) проверять, ограничивать или удалять контент.'] },
      { h: 'Жалобы на контент и авторские права', p: ['Если вы считаете, что контент нарушает ваши права или незаконен, свяжитесь с нами: укажите описание и ссылку, ваше имя и контакты, основание претензии. Мы оперативно рассмотрим обращение и можем удалить контент или закрыть доступ. Если ваш контент удалён по ошибке, вы можете ответить с пояснением. Повторных нарушителей можем блокировать.'] },
      { h: 'Донаты', p: ['Донаты через ссылку Ko-fi добровольны, обрабатываются Ko-fi по его условиям и идут на поддержку работы сервиса. Если израильский закон о защите потребителя даёт вам права, эти условия их не ограничивают.'] },
      { h: 'Отказ от гарантий и ответственность', p: ['Сервис предоставляется «как есть» и «по мере доступности» без гарантий доступности и точности. В максимально допустимой законом степени мы не отвечаем за косвенный или сопутствующий ущерб, потерю данных или дохода, а также за контент, загруженный пользователями. Это не исключает ответственность, которую по закону исключить нельзя.'] },
      { h: 'Изменения и применимое право', p: ['Мы можем обновлять условия; продолжение использования означает согласие с обновлением. К условиям применяется право государства Израиль и компетентные суды Израиля, с учётом обязательных прав потребителей.'] },
    ],
  },
  accessibility: {
    title: 'Заявление о доступности',
    updated: 'Обновлено: ноябрь 2026',
    contactLabel: 'Запросы по доступности',
    contactIntro: 'Если вы столкнулись с барьером или вам нужен другой способ пользоваться сервисом, свяжитесь с нами:',
    blocks: [
      { h: 'Наше обязательство', p: ['Мы хотим, чтобы Music World был доступен максимальному числу людей, включая людей с инвалидностью, и работаем над соответствием израильскому стандарту SI 5568 (на основе WCAG 2.0 уровня AA).'] },
      { h: 'Что мы делаем', ul: ['Четыре языка, написание справа налево для иврита и арабского.', 'Страницы можно масштабировать, они адаптируются под телефоны, планшеты и компьютеры.', 'Мы проверяем доступность по мере обновления сервиса.'] },
      { h: 'Известные ограничения', p: ['Сервис пока не полностью доступен. Некоторые части, такие как аудиовизуализатор, микшер и элементы плеера, могут быть неудобны для скринридера или управления только с клавиатуры либо иметь недостаточный цветовой контраст. Контент, загруженный пользователями (например, изображения без описаний), вне нашего контроля. Мы работаем над улучшениями.'] },
      { h: 'Основа заявления', p: ['Заявление основано на нашей собственной проверке, а не на формальном аудите доступности.'] },
    ],
  },
};

const HE: Record<LegalKind, LegalDoc> = {
  privacy: {
    title: 'מדיניות פרטיות',
    updated: 'עודכן: נובמבר 2026',
    contactLabel: 'יצירת קשר',
    contactIntro: 'למימוש זכויותיך או לשאלות בנושא פרטיות, פנו אלינו:',
    blocks: [
      { h: 'מי אנחנו', p: ['Music World הוא חלק מ-VArt Tools (org-va.com), המופעל על ידי מפתח פרטי בישראל. מדיניות זו מסבירה אילו נתונים אישיים השירות אוסף, לאיזו מטרה, מי מקבל אותם, ומהן זכויותיכם לפי הדין הישראלי, לרבות חוק הגנת הפרטיות, התשמ"א-1981.'] },
      { h: 'מה אנחנו אוספים', ul: [
        'נתוני חשבון: כתובת אימייל, שם משתמש/שם תצוגה, סיסמה (נשמרת בצורה מגובבת אצל ספק האימות) ותמונת פרופיל.',
        'תוכן שיצרתם: רצועות, עטיפות, סרטונים, פלייליסטים, לייקים ופרטים נלווים (כותרת, ז\'אנר, תגיות, תיאור).',
        'מונים: האזנות, הורדות, שיתופים וצפיות ברצועות ובסרטונים.',
        'נתונים טכניים: עוגיות התחברות, עוגיית שפה וכתובת ה-IP שלכם, המעובדת על ידי ספקי האחסון ומסד הנתונים להפעלת השירות ולאבטחתו.',
        'האזנה לא מקוונת: רצועות ששמרתם לשימוש לא מקוון נשמרות בדפדפן שלכם במכשירכם ואינן נשלחות אלינו.',
      ]},
      { h: 'תוכן ציבורי', p: ['שם המשתמש, הפרופיל, פלייליסטים ציבוריים, רצועות וסרטונים גלויים לכולם, ניתן להאזין להם ולהוריד אותם על ידי משתמשים אחרים, והם עשויים להיות מאונדקסים במנועי חיפוש. אל תפרסמו מידע שברצונכם לשמור בפרטיות. אפשר למחוק את התוכן בכל עת או לבקש מאיתנו להסיר אותו.'] },
      { h: 'ספקים והעברת מידע לחו"ל', p: ['אנו משתמשים ב-Supabase (אימות, מסד נתונים ואחסון קבצים; שרתים באזור אסיה-פסיפיק), ב-Vercel (אחסון) וב-Ko-fi (תרומות מרצון; איננו מקבלים פרטי כרטיס). לכן ייתכן שהמידע יעובד מחוץ לישראל. בשימוש בשירות אתם מסכימים להעברות כאלה. השירות אינו מציג פרסומות של צד שלישי.'] },
      { h: 'שמירה ואבטחה', p: ['אנו שומרים מידע כל עוד החשבון קיים או כנדרש להפעלת השירות, ומוחקים אותו לפי בקשה אלא אם הדין מחייב אחרת. אנו נוקטים אמצעי אבטחה סבירים כגון חיבורים מוצפנים וכללי גישה למסד הנתונים, אך אין מערכת מאובטחת לחלוטין.'] },
      { h: 'הזכויות שלכם', p: ['אתם רשאים לבקש לעיין במידע האישי שאנו מחזיקים עליכם, לתקנו או למחוק אותו, ולבטל הסכמה לעיבוד עתידי. ניתן גם לפנות לרשות להגנת הפרטיות בישראל. מסירת המידע היא מרצון, אך בלי כתובת אימייל אי אפשר ליצור חשבון.'] },
      { h: 'ילדים', p: ['השירות מיועד למשתמשים בני 18 ומעלה. איננו אוספים ביודעין מידע על קטינים.'] },
      { h: 'שינויים', p: ['אנו עשויים לעדכן מדיניות זו; התאריך למעלה מציין את הגרסה העדכנית.'] },
    ],
  },
  terms: {
    title: 'תנאי שימוש',
    updated: 'עודכן: נובמבר 2026',
    contactLabel: 'יצירת קשר',
    contactIntro: 'לדיווח על תוכן או לשאלות, פנו אלינו:',
    blocks: [
      { h: 'הסכמה', p: ['תנאים אלה חלים על השימוש ב-Music World (חלק מ-VArt Tools). בשימוש בשירות או ביצירת חשבון אתם מסכימים להם ולמדיניות הפרטיות. אין בתנאים אלה כדי לפגוע בזכויות שהדין אינו מאפשר לוותר עליהן.'] },
      { h: 'חשבונות', p: ['הרשמה והעלאת תוכן מותרות רק לבני 18 ומעלה. יש למסור פרטים נכונים ולשמור על פרטי ההתחברות; אתם אחראים לפעילות בחשבונכם. אנו רשאים להגביל, להשעות או להסיר חשבון או תוכן, בהודעה או בלעדיה, בעת הפרת התנאים, להגנה על השירות או על משתמשים, או כנדרש בדין.'] },
      { h: 'התוכן שלכם', p: ['אתם אחראים לכל מה שאתם מעלים. אתם מצהירים שהתוכן שלכם או שיש לכם את כל הזכויות וההרשאות לפרסמו, ושאינו פוגע בזכויות יוצרים, בפרטיות או בזכויות אחרות של מישהו. אסור להעלות תוכן בלתי חוקי, מוציא דיבה, משנא, מאיים, בעל אופי מיני מפורש, מטעה או ספאם.', 'אתם מעניקים לנו רישיון לא בלעדי לאחסן ולהציג את התוכן שלכם, ומתירים למשתמשים אחרים להזרים ולהוריד אותו דרך השירות לשימוש אישי. אנו רשאים, אך לא חייבים, לבדוק, להגביל או להסיר תוכן.'] },
      { h: 'דיווח על תוכן וזכויות יוצרים', p: ['אם לדעתכם תוכן פוגע בזכויותיכם או אינו חוקי, פנו אלינו עם תיאור וקישור, שמכם ופרטי קשר, והבסיס לטענה. נבדוק את הפנייה בהקדם ועשויים להסיר את התוכן או לחסום גישה אליו. אם התוכן שלכם הוסר בטעות תוכלו להשיב עם הסבר. מפרים חוזרים עשויים להיחסם.'] },
      { h: 'תרומות', p: ['תרומות דרך קישור Ko-fi הן מרצון, מעובדות על ידי Ko-fi לפי תנאיה, ותומכות בהפעלת השירות. במקום שבו חוק הגנת הצרכן הישראלי מקנה לכם זכויות, תנאים אלה אינם מגבילים אותן.'] },
      { h: 'הסרת אחריות', p: ['השירות ניתן "כפי שהוא" ו"כפי שזמין" ללא התחייבות לזמינות או לדיוק. במידה המרבית שהדין מתיר, איננו אחראים לנזק עקיף או תוצאתי, לאובדן נתונים או הכנסה, או לתוכן שמעלים משתמשים. אין בכך כדי לשלול אחריות שאין אפשרות לשלול על פי דין.'] },
      { h: 'שינויים והדין החל', p: ['אנו עשויים לעדכן את התנאים; המשך השימוש משמעו הסכמה לעדכון. על התנאים חל דין מדינת ישראל ובתי המשפט המוסמכים בישראל, בכפוף לזכויות צרכן קוגנטיות.'] },
    ],
  },
  accessibility: {
    title: 'הצהרת נגישות',
    updated: 'עודכן: נובמבר 2026',
    contactLabel: 'פניות בנושא נגישות',
    contactIntro: 'אם נתקלתם במחסום או שאתם זקוקים לדרך אחרת להשתמש בשירות, פנו אלינו:',
    blocks: [
      { h: 'המחויבות שלנו', p: ['אנו רוצים ש-Music World יהיה שמיש עבור כמה שיותר אנשים, לרבות אנשים עם מוגבלות, ופועלים לעמידה בתקן הישראלי ת"י 5568 (המבוסס על WCAG 2.0 ברמה AA).'] },
      { h: 'מה אנחנו עושים', ul: ['ארבע שפות, עם פריסה מימין לשמאל לעברית ולערבית.', 'ניתן להגדיל את העמודים והם מתאימים לטלפונים, לטאבלטים ולמחשבים.', 'אנו בודקים נגישות עם עדכון השירות.'] },
      { h: 'מגבלות ידועות', p: ['השירות עדיין אינו נגיש במלואו. חלקים כגון הוויזואליזר, המיקסר ופקדי הנגן עשויים להיות קשים לשימוש עם קורא מסך או במקלדת בלבד, או בעלי ניגודיות צבעים לא מספקת. תוכן שמעלים משתמשים (למשל תמונות ללא תיאור) אינו בשליטתנו. אנו פועלים לשיפור.'] },
      { h: 'בסיס ההצהרה', p: ['הצהרה זו מבוססת על בדיקה פנימית שלנו ולא על ביקורת נגישות רשמית.'] },
    ],
  },
};

export function getLegalDoc(kind: LegalKind, locale: Locale): LegalDoc {
  const set = locale === 'ru' ? RU : locale === 'he' ? HE : EN; // Arabic falls back to English text
  return set[kind];
}
