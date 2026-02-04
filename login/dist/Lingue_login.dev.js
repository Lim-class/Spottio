"use strict";

// Oggetto per le traduzioni
var translations = {
  it: {
    pageTitle: 'Benvenuto su Spottio!',
    welcomeTitle: 'Benvenuto su Spottio!',
    loginUsernamePlaceholder: 'Inserisci il tuo nome utente',
    loginPasswordPlaceholder: 'Inserisci la tua password',
    loginButton: 'Accedi',
    showSignupButton: 'Registrati',
    signupUsernamePlaceholder: 'Scegli un nome utente',
    signupPasswordPlaceholder: 'Crea una password',
    showLoginButton: 'Accedi',
    signupButton: 'Registrati',
    loginSuccess: 'Accesso effettuato con successo!',
    loginError: 'Nome utente o password non validi. Riprova.',
    signupUsernameExists: 'Nome utente già esistente. Scegline un altro.',
    signupSuccess: 'Registrazione riuscita! Ora puoi accedere con il tuo nuovo account.'
  },
  en: en_translations,
  es: es_translations,
  fr: fr_translations,
  de: {
    pageTitle: 'Willkommen bei Spottio!',
    welcomeTitle: 'Willkommen bei Spottio!',
    loginUsernamePlaceholder: 'Benutzername eingeben',
    loginPasswordPlaceholder: 'Passwort eingeben',
    loginButton: 'Anmelden',
    showSignupButton: 'Registrieren',
    signupUsernamePlaceholder: 'Wählen Sie einen Benutzernamen',
    signupPasswordPlaceholder: 'Erstellen Sie ein Passwort',
    showLoginButton: 'Anmelden',
    signupButton: 'Registrieren',
    loginSuccess: 'Anmeldung erfolgreich!',
    loginError: 'Ungültiger Benutzername oder Passwort. Bitte versuchen Sie es erneut.',
    signupUsernameExists: 'Benutzername existiert bereits. Bitte wählen Sie einen anderen.',
    signupSuccess: 'Registrierung erfolgreich! Sie können sich jetzt mit Ihrem neuen Konto anmelden.'
  },
  ar: {
    pageTitle: 'مرحبًا بك في سبوتيو!',
    welcomeTitle: 'مرحبًا بك في سبوتيو!',
    loginUsernamePlaceholder: 'أدخل اسم المستخدم الخاص بك',
    loginPasswordPlaceholder: 'أدخل كلمة المرور الخاصة بك',
    loginButton: 'تسجيل الدخول',
    showSignupButton: 'التسجيل',
    signupUsernamePlaceholder: 'اختر اسم مستخدم',
    signupPasswordPlaceholder: 'أنشئ كلمة مرور',
    showLoginButton: 'تسجيل الدخول',
    signupButton: 'التسجيل',
    loginSuccess: 'تم تسجيل الدخول بنجاح!',
    loginError: 'اسم المستخدم أو كلمة المرور غير صالحة. الرجاء المحاولة مرة أخرى.',
    signupUsernameExists: 'اسم المستخدم موجود بالفعل. الرجاء اختيار واحد آخر.',
    signupSuccess: 'تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول بحسابك الجديد.'
  },
  ru: {
    pageTitle: 'Добро пожаловать в Spottio!',
    welcomeTitle: 'Добро пожаловать в Spottio!',
    loginUsernamePlaceholder: 'Введите ваше имя пользователя',
    loginPasswordPlaceholder: 'Введите ваш пароль',
    loginButton: 'Войти',
    showSignupButton: 'Зарегистрироваться',
    signupUsernamePlaceholder: 'Выберите имя пользователя',
    signupPasswordPlaceholder: 'Создайте пароль',
    showLoginButton: 'Войти',
    signupButton: 'Зарегистрироваться',
    loginSuccess: 'Вход выполнен успешно!',
    loginError: 'Неверное имя пользователя или пароль. Пожалуйста, попробуйте еще раз.',
    signupUsernameExists: 'Имя пользователя уже существует. Пожалуйста, выберите другое.',
    signupSuccess: 'Регистрация прошла успешно! Теперь вы можете войти в свой новый аккаунт.'
  },
  ja: {
    pageTitle: 'Spottioへようこそ！',
    welcomeTitle: 'Spottioへようこそ！',
    loginUsernamePlaceholder: 'ユーザー名を入力してください',
    loginPasswordPlaceholder: 'パスワードを入力してください',
    loginButton: 'ログイン',
    showSignupButton: 'サインアップ',
    signupUsernamePlaceholder: 'ユーザー名を選択してください',
    signupPasswordPlaceholder: 'パスワードを作成してください',
    showLoginButton: 'ログイン',
    signupButton: 'サインアップ',
    loginSuccess: 'ログインに成功しました！',
    loginError: 'ユーザー名またはパスワードが無効です。もう一度お試しください。',
    signupUsernameExists: 'ユーザー名はすでに存在します。別のユーザー名を選択してください。',
    signupSuccess: '登録に成功しました！新しいアカウントでログインできます。'
  },
  nl: {
    pageTitle: 'Welkom bij Spottio!',
    welcomeTitle: 'Welkom bij Spottio!',
    loginUsernamePlaceholder: 'Voer uw gebruikersnaam in',
    loginPasswordPlaceholder: 'Voer uw wachtwoord in',
    loginButton: 'Inloggen',
    showSignupButton: 'Aanmelden',
    signupUsernamePlaceholder: 'Kies een gebruikersnaam',
    signupPasswordPlaceholder: 'Maak een wachtwoord',
    showLoginButton: 'Inloggen',
    signupButton: 'Aanmelden',
    loginSuccess: 'Inloggen succesvol!',
    loginError: 'Ongeldige gebruikersnaam of wachtwoord. Probeer het opnieuw.',
    signupUsernameExists: 'Gebruikersnaam bestaat al. Kies alstublieft een andere.',
    signupSuccess: 'Registratie succesvol! U kunt nu inloggen met uw nieuwe account.'
  }
}; // Funzione per mostrare un messaggio di stato

function showMessage(message) {
  var isError = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var messageElement = document.getElementById('message-container');
  messageElement.textContent = message;
  messageElement.className = "mt-4 text-center text-sm font-medium ".concat(isError ? 'text-red-600' : 'text-green-600');
} // Funzione per mostrare un form e nascondere l'altro


function toggleForms(showLogin) {
  var loginForm = document.getElementById('login-form');
  var signupForm = document.getElementById('signup-form');

  if (showLogin) {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  }

  showMessage(''); // Pulisce il messaggio quando si cambia form
} // Funzione per impostare la lingua


function setLanguage(lang) {
  var currentLang = translations[lang];
  if (!currentLang) return; // Aggiorna l'attributo lang del tag html

  document.documentElement.lang = lang; // Aggiorna il testo e i placeholder in base alla lingua

  document.getElementById('page-title').textContent = currentLang.pageTitle;
  document.getElementById('welcome-title').textContent = currentLang.welcomeTitle;
  document.getElementById('login-username').placeholder = currentLang.loginUsernamePlaceholder;
  document.getElementById('login-password').placeholder = currentLang.loginPasswordPlaceholder;
  document.getElementById('login-button').textContent = currentLang.loginButton;
  document.getElementById('show-signup').textContent = currentLang.showSignupButton;
  document.getElementById('signup-username').placeholder = currentLang.signupUsernamePlaceholder;
  document.getElementById('signup-password').placeholder = currentLang.signupPasswordPlaceholder;
  document.getElementById('show-login').textContent = currentLang.showLoginButton;
  document.getElementById('signup-button').textContent = currentLang.signupButton; // Salva la lingua nel localStorage

  localStorage.setItem('language', lang);
}