document.addEventListener('DOMContentLoaded', () => {
    // 1. DIZIONARIO GLOBALE DELLE TRADUZIONI
    window.translations = {
        'it': {
            menuTitle: 'Menu', navPubblici: 'Spot', navCercaPersone: 'Trova', navMessaggi: 'Chat', navPosta: 'Spotta', navSegnalazioni: 'Segnalazioni', navProfilo: 'Profilo', navImpostazioni: 'Impostazioni', navAdmin: 'Gestione Utenti', logout: 'Esci',
            impostazioniTitle: 'Impostazioni', impostazioniDesc: 'Configura le preferenze del tuo account.', backgroundTitle: 'Colore di Sfondo', deleteAccountTitle: 'Elimina Account', deleteAccountDesc: 'Questa azione è irreversibile.', deleteAccountBtn: 'Elimina il mio account', modalTitle: 'Sei sicuro?', modalDesc: 'Vuoi davvero eliminare il tuo account?', modalCancelBtn: 'Annulla', modalConfirmBtn: 'Elimina',
            profileTitle: 'Profilo - Spottio', followersText: 'Follower', followingText: 'Seguiti', editBioBtn: 'Modifica Bio', adminActions: 'Gestione Segnalazioni (Admin)', logoutBtn: 'Logout', saveBtn: 'Salva', noBio: 'Nessuna bio impostata', bioUpdated: 'Bio aggiornata!', imgUpdated: 'Immagine aggiornata!', yourFollowers: 'I tuoi Follower', followedUsers: 'Utenti Seguiti', noUsers: 'Nessun utente in questa lista.', loading: 'Caricamento...', loadingError: 'Errore nel caricamento.', loadingPosts: 'Caricamento dei tuoi post...', userNotFound: 'Errore utente.', noTextPost: 'Post senza testo', generalCategory: 'Generale', noPostsFound: 'Nessun post', cannotLoadPosts: 'Impossibile caricare i post.', missingIndex: 'Manca l\'indice!', postWord: 'Post', saveError: 'Errore.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'Cerca impostazioni...', changePasswordTitle: 'Cambio Password', oldPassPlaceholder: 'Password attuale', newPassPlaceholder: 'Nuova password', updatePassBtn: 'Aggiorna Password', searchColorsPlaceholder: 'Cerca per nome, HEX o RGB', createColorLabel: 'Crea il tuo colore:', chooseColorPlaceholder: 'Scegli un colore per vedere il nome...', downloadAppTitle: 'Scarica App (APK)', downloadAppDesc: 'Scarica l\'ultima versione dell\'applicazione per il tuo dispositivo Android.', privacyProfileTitle: 'Privacy Profilo', privacyProfileDesc: 'Scegli chi può vedere i tuoi post. Quando il tuo account è privato, solo le persone che approvi potranno seguirti e vedere i tuoi contenuti.', privateAccountTitle: 'Account Privato', privateAccountDesc: 'I follower attuali non saranno influenzati.', exportDataTitle: 'Esporta Dati', exportDataDesc: 'Scarica una copia dei dati che hai condiviso su Spottio (Post, Profilo). Scegli il formato che preferisci.', exportJsonBtn: 'Esporta JSON', exportHtmlBtn: 'Esporta HTML', historyTitle: 'Storia', privacyDocTitle: 'Informativa Privacy', communityPolicyTitle: 'Policy della Community'
        },
        'en': {
            menuTitle: 'Menu', navPubblici: 'Public', navCercaPersone: 'Search People', navMessaggi: 'Messages', navPosta: 'Inbox', navSegnalazioni: 'Reports', navProfilo: 'Profile', navImpostazioni: 'Settings', navAdmin: 'User Management', logout: 'Log Out',
            impostazioniTitle: 'Settings', impostazioniDesc: 'Configure your account preferences.', backgroundTitle: 'Background Color', deleteAccountTitle: 'Delete Account', deleteAccountDesc: 'This action is irreversible.', deleteAccountBtn: 'Delete my account', modalTitle: 'Are you sure?', modalDesc: 'Do you really want to delete your account?', modalCancelBtn: 'Cancel', modalConfirmBtn: 'Delete',
            profileTitle: 'Profile - Spottio', followersText: 'Followers', followingText: 'Following', editBioBtn: 'Edit Bio', adminActions: 'Report Management (Admin)', logoutBtn: 'Log Out', saveBtn: 'Save', noBio: 'No bio set', bioUpdated: 'Bio updated!', imgUpdated: 'Image updated!', yourFollowers: 'Your Followers', followedUsers: 'Followed Users', noUsers: 'No users in this list.', loading: 'Loading...', loadingError: 'Loading error.', loadingPosts: 'Loading your posts...', userNotFound: 'User error.', noTextPost: 'Post without text', generalCategory: 'General', noPostsFound: 'No posts found', cannotLoadPosts: 'Unable to load posts.', missingIndex: 'Missing index!', postWord: 'Posts', saveError: 'Error saving.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'Search settings...', changePasswordTitle: 'Change Password', oldPassPlaceholder: 'Current password', newPassPlaceholder: 'New password', updatePassBtn: 'Update Password', searchColorsPlaceholder: 'Search by name, HEX or RGB', createColorLabel: 'Create your color:', chooseColorPlaceholder: 'Choose a color to see the name...', downloadAppTitle: 'Download App (APK)', downloadAppDesc: 'Download the latest version of the app for your Android device.', privacyProfileTitle: 'Profile Privacy', privacyProfileDesc: 'Choose who can see your posts. When your account is private, only people you approve can follow you and see your content.', privateAccountTitle: 'Private Account', privateAccountDesc: 'Current followers will not be affected.', exportDataTitle: 'Export Data', exportDataDesc: 'Download a copy of the data you shared on Spottio. Choose your preferred format.', exportJsonBtn: 'Export JSON', exportHtmlBtn: 'Export HTML', historyTitle: 'History', privacyDocTitle: 'Privacy Policy', communityPolicyTitle: 'Community Policy'
        },
        'es': {
            menuTitle: 'Menú', navPubblici: 'Públicos', navCercaPersone: 'Buscar Personas', navMessaggi: 'Mensajes', navPosta: 'Buzón', navSegnalazioni: 'Reportes', navProfilo: 'Perfil', navImpostazioni: 'Ajustes', navAdmin: 'Gestión de Usuarios', logout: 'Cerrar sesión',
            impostazioniTitle: 'Ajustes', impostazioniDesc: 'Configura las preferencias de tu cuenta.', backgroundTitle: 'Color de fondo', deleteAccountTitle: 'Eliminar Cuenta', deleteAccountDesc: 'Esta acción es irreversible.', deleteAccountBtn: 'Eliminar mi cuenta', modalTitle: '¿Estás seguro?', modalDesc: '¿Realmente quieres eliminar tu cuenta?', modalCancelBtn: 'Cancelar', modalConfirmBtn: 'Eliminar',
            profileTitle: 'Perfil - Spottio', followersText: 'Seguidores', followingText: 'Siguiendo', editBioBtn: 'Editar Bio', adminActions: 'Gestión de Reportes', logoutBtn: 'Cerrar sesión', saveBtn: 'Guardar', noBio: 'Sin biografía', bioUpdated: '¡Biografía actualizada!', imgUpdated: '¡Imagen actualizada!', yourFollowers: 'Tus Seguidores', followedUsers: 'Usuarios Seguidos', noUsers: 'No hay usuarios.', loading: 'Cargando...', loadingError: 'Error al cargar.', loadingPosts: 'Cargando tus posts...', userNotFound: 'Error de usuario.', noTextPost: 'Post sin texto', generalCategory: 'General', noPostsFound: 'No se encontraron posts', cannotLoadPosts: 'No se pueden cargar los posts.', missingIndex: '¡Falta el índice!', postWord: 'Posts', saveError: 'Error al guardar.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'Buscar ajustes...', changePasswordTitle: 'Cambiar Contraseña', oldPassPlaceholder: 'Contraseña actual', newPassPlaceholder: 'Nueva contraseña', updatePassBtn: 'Actualizar Contraseña', searchColorsPlaceholder: 'Buscar por nombre, HEX o RGB', createColorLabel: 'Crea tu color:', chooseColorPlaceholder: 'Elige un color para ver el nombre...', downloadAppTitle: 'Descargar App (APK)', downloadAppDesc: 'Descarga la última versión de la aplicación para tu dispositivo Android.', privacyProfileTitle: 'Privacidad del Perfil', privacyProfileDesc: 'Elige quién puede ver tus posts. Cuando tu cuenta es privada, solo las personas que apruebes podrán seguirte y ver tu contenido.', privateAccountTitle: 'Cuenta Privada', privateAccountDesc: 'Los seguidores actuales no se verán afectados.', exportDataTitle: 'Exportar Datos', exportDataDesc: 'Descarga una copia de los datos que has compartido en Spottio.', exportJsonBtn: 'Exportar JSON', exportHtmlBtn: 'Exportar HTML', historyTitle: 'Historia', privacyDocTitle: 'Política de Privacidad', communityPolicyTitle: 'Política de la Comunidad'
        },
        'fr': {
            menuTitle: 'Menu', navPubblici: 'Publics', navCercaPersone: 'Rechercher', navMessaggi: 'Messages', navPosta: 'Boîte de réception', navSegnalazioni: 'Signalements', navProfilo: 'Profil', navImpostazioni: 'Paramètres', navAdmin: 'Gestion Utilisateurs', logout: 'Déconnexion',
            impostazioniTitle: 'Paramètres', impostazioniDesc: 'Configurez vos préférences.', backgroundTitle: 'Couleur de fond', deleteAccountTitle: 'Supprimer le compte', deleteAccountDesc: 'Action irréversible.', deleteAccountBtn: 'Supprimer mon compte', modalTitle: 'Êtes-vous sûr ?', modalDesc: 'Voulez-vous vraiment supprimer ?', modalCancelBtn: 'Annuler', modalConfirmBtn: 'Supprimer',
            profileTitle: 'Profil - Spottio', followersText: 'Abonnés', followingText: 'Abonnements', editBioBtn: 'Modifier la Bio', adminActions: 'Gestion Signalements', logoutBtn: 'Déconnexion', saveBtn: 'Enregistrer', noBio: 'Aucune bio', bioUpdated: 'Bio mise à jour !', imgUpdated: 'Image mise à jour !', yourFollowers: 'Vos Abonnés', followedUsers: 'Utilisateurs Suivis', noUsers: 'Aucun utilisateur.', loading: 'Chargement...', loadingError: 'Erreur de chargement.', loadingPosts: 'Chargement de vos posts...', userNotFound: 'Erreur d\'utilisateur.', noTextPost: 'Post sans texte', generalCategory: 'Général', noPostsFound: 'Aucun post trouvé', cannotLoadPosts: 'Impossible de charger les posts.', missingIndex: 'Index manquant !', postWord: 'Posts', saveError: 'Erreur d\'enregistrement.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'Rechercher des paramètres...', changePasswordTitle: 'Changer le mot de passe', oldPassPlaceholder: 'Mot de passe actuel', newPassPlaceholder: 'Nouveau mot de passe', updatePassBtn: 'Mettre à jour le mot de passe', searchColorsPlaceholder: 'Rechercher par nom, HEX ou RGB', createColorLabel: 'Créez votre couleur :', chooseColorPlaceholder: 'Choisissez une couleur pour voir le nom...', downloadAppTitle: 'Télécharger l\'application (APK)', downloadAppDesc: 'Téléchargez la dernière version de l\'application pour Android.', privacyProfileTitle: 'Confidentialité du Profil', privacyProfileDesc: 'Choisissez qui peut voir vos posts. Si privé, seules les personnes approuvées peuvent vous suivre.', privateAccountTitle: 'Compte Privé', privateAccountDesc: 'Les abonnés actuels ne seront pas affectés.', exportDataTitle: 'Exporter les Données', exportDataDesc: 'Téléchargez une copie de vos données partagées.', exportJsonBtn: 'Exporter JSON', exportHtmlBtn: 'Exporter HTML', historyTitle: 'Histoire', privacyDocTitle: 'Politique de Confidentialité', communityPolicyTitle: 'Règles de la Communauté'
        },
        'de': {
            menuTitle: 'Menü', navPubblici: 'Öffentlich', navCercaPersone: 'Personen suchen', navMessaggi: 'Nachrichten', navPosta: 'Posteingang', navSegnalazioni: 'Meldungen', navProfilo: 'Profil', navImpostazioni: 'Einstellungen', navAdmin: 'Benutzerverwaltung', logout: 'Abmelden',
            impostazioniTitle: 'Einstellungen', impostazioniDesc: 'Konfigurieren Sie Ihr Konto.', backgroundTitle: 'Hintergrundfarbe', deleteAccountTitle: 'Konto löschen', deleteAccountDesc: 'Diese Aktion ist unwiderruflich.', deleteAccountBtn: 'Mein Konto löschen', modalTitle: 'Sind Sie sicher?', modalDesc: 'Möchten Sie Ihr Konto wirklich löschen?', modalCancelBtn: 'Abbrechen', modalConfirmBtn: 'Löschen',
            profileTitle: 'Profil - Spottio', followersText: 'Follower', followingText: 'Folge ich', editBioBtn: 'Bio bearbeiten', adminActions: 'Meldungsverwaltung', logoutBtn: 'Abmelden', saveBtn: 'Speichern', noBio: 'Keine Bio', bioUpdated: 'Bio aktualisiert!', imgUpdated: 'Bild aktualisiert!', yourFollowers: 'Deine Follower', followedUsers: 'Gefolgte Benutzer', noUsers: 'Keine Benutzer.', loading: 'Wird geladen...', loadingError: 'Ladefehler.', loadingPosts: 'Lade deine Posts...', userNotFound: 'Benutzerfehler.', noTextPost: 'Post ohne Text', generalCategory: 'Allgemein', noPostsFound: 'Keine Posts gefunden', cannotLoadPosts: 'Posts können nicht geladen werden.', missingIndex: 'Fehlender Index!', postWord: 'Posts', saveError: 'Fehler beim Speichern.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'Einstellungen suchen...', changePasswordTitle: 'Passwort ändern', oldPassPlaceholder: 'Aktuelles Passwort', newPassPlaceholder: 'Neues Passwort', updatePassBtn: 'Passwort aktualisieren', searchColorsPlaceholder: 'Suche nach Name, HEX oder RGB', createColorLabel: 'Erstelle deine Farbe:', chooseColorPlaceholder: 'Wähle eine Farbe, um den Namen zu sehen...', downloadAppTitle: 'App herunterladen (APK)', downloadAppDesc: 'Laden Sie die neueste Version für Ihr Android-Gerät herunter.', privacyProfileTitle: 'Profil-Datenschutz', privacyProfileDesc: 'Wählen Sie, wer Ihre Beiträge sehen kann. Bei einem privaten Konto können nur genehmigte Personen Ihnen folgen.', privateAccountTitle: 'Privates Konto', privateAccountDesc: 'Aktuelle Follower sind nicht betroffen.', exportDataTitle: 'Daten exportieren', exportDataDesc: 'Laden Sie eine Kopie Ihrer Daten herunter.', exportJsonBtn: 'JSON exportieren', exportHtmlBtn: 'HTML exportieren', historyTitle: 'Geschichte', privacyDocTitle: 'Datenschutzrichtlinie', communityPolicyTitle: 'Community-Richtlinien'
        },
        'ar': {
            menuTitle: 'القائمة', navPubblici: 'عام', navCercaPersone: 'بحث عن أشخاص', navMessaggi: 'رسائل', navPosta: 'صندوق الوارد', navSegnalazioni: 'تقارير', navProfilo: 'الملف الشخصي', navImpostazioni: 'الإعدادات', navAdmin: 'إدارة المستخدمين', logout: 'تسجيل خروج',
            impostazioniTitle: 'الإعدادات', impostazioniDesc: 'تكوين تفضيلات حسابك.', backgroundTitle: 'لون الخلفية', deleteAccountTitle: 'حذف الحساب', deleteAccountDesc: 'هذا الإجراء لا رجعة فيه.', deleteAccountBtn: 'حذف حسابي', modalTitle: 'هل أنت متأكد؟', modalDesc: 'هل تريد حقًا حذف حسابك؟', modalCancelBtn: 'إلغاء', modalConfirmBtn: 'حذف',
            profileTitle: 'الملف الشخصي - Spottio', followersText: 'المتابعون', followingText: 'يتابع', editBioBtn: 'تعديل السيرة الذاتية', adminActions: 'إدارة التقارير', logoutBtn: 'تسجيل خروج', saveBtn: 'حفظ', noBio: 'لا توجد سيرة ذاتية', bioUpdated: 'تم تحديث السيرة الذاتية!', imgUpdated: 'تم تحديث الصورة!', yourFollowers: 'متابعوك', followedUsers: 'المستخدمون المتابعون', noUsers: 'لا يوجد مستخدمون.', loading: 'جاري التحميل...', loadingError: 'خطأ في التحميل.', loadingPosts: 'جاري تحميل منشوراتك...', userNotFound: 'خطأ في المستخدم.', noTextPost: 'منشور بدون نص', generalCategory: 'عام', noPostsFound: 'لا توجد منشورات', cannotLoadPosts: 'تعذر تحميل المنشورات.', missingIndex: 'فهرس مفقود!', postWord: 'منشورات', saveError: 'خطأ في الحفظ.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'بحث في الإعدادات...', changePasswordTitle: 'تغيير كلمة المرور', oldPassPlaceholder: 'كلمة المرور الحالية', newPassPlaceholder: 'كلمة المرور الجديدة', updatePassBtn: 'تحديث كلمة المرور', searchColorsPlaceholder: 'البحث بالاسم أو HEX أو RGB', createColorLabel: 'إنشاء لونك:', chooseColorPlaceholder: 'اختر لونًا لرؤية الاسم...', downloadAppTitle: 'تنزيل التطبيق (APK)', downloadAppDesc: 'قم بتنزيل أحدث إصدار من التطبيق لجهاز Android الخاص بك.', privacyProfileTitle: 'خصوصية الملف الشخصي', privacyProfileDesc: 'اختر من يمكنه رؤية منشوراتك. عندما يكون حسابك خاصًا، يمكن فقط للأشخاص الذين توافق عليهم متابعتك.', privateAccountTitle: 'حساب خاص', privateAccountDesc: 'لن يتأثر المتابعون الحاليون.', exportDataTitle: 'تصدير البيانات', exportDataDesc: 'قم بتنزيل نسخة من بياناتك.', exportJsonBtn: 'تصدير JSON', exportHtmlBtn: 'تصدير HTML', historyTitle: 'تاريخ', privacyDocTitle: 'سياسة الخصوصية', communityPolicyTitle: 'سياسة المجتمع'
        },
        'ru': {
            menuTitle: 'Меню', navPubblici: 'Публичные', navCercaPersone: 'Поиск людей', navMessaggi: 'Сообщения', navPosta: 'Почта', navSegnalazioni: 'Жалобы', navProfilo: 'Профиль', navImpostazioni: 'Настройки', navAdmin: 'Управление пользователями', logout: 'Выйти',
            impostazioniTitle: 'Настройки', impostazioniDesc: 'Настройте ваш аккаунт.', backgroundTitle: 'Цвет фона', deleteAccountTitle: 'Удалить аккаунт', deleteAccountDesc: 'Это действие необратимо.', deleteAccountBtn: 'Удалить мой аккаунт', modalTitle: 'Вы уверены?', modalDesc: 'Действительно удалить аккаунт?', modalCancelBtn: 'Отмена', modalConfirmBtn: 'Удалить',
            profileTitle: 'Профиль - Spottio', followersText: 'Подписчики', followingText: 'Подписки', editBioBtn: 'Редактировать Био', adminActions: 'Управление жалобами', logoutBtn: 'Выйти', saveBtn: 'Сохранить', noBio: 'Био не указано', bioUpdated: 'Био обновлено!', imgUpdated: 'Фото обновлено!', yourFollowers: 'Ваши Подписчики', followedUsers: 'Вы подписаны', noUsers: 'Нет пользователей.', loading: 'Загрузка...', loadingError: 'Ошибка загрузки.', loadingPosts: 'Загрузка ваших постов...', userNotFound: 'Ошибка пользователя.', noTextPost: 'Пост без текста', generalCategory: 'Общее', noPostsFound: 'Посты не найдены', cannotLoadPosts: 'Не удалось загрузить посты.', missingIndex: 'Отсутствует индекс!', postWord: 'Посты', saveError: 'Ошибка сохранения.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'Поиск настроек...', changePasswordTitle: 'Изменить пароль', oldPassPlaceholder: 'Текущий пароль', newPassPlaceholder: 'Новый пароль', updatePassBtn: 'Обновить пароль', searchColorsPlaceholder: 'Поиск по имени, HEX или RGB', createColorLabel: 'Создайте свой цвет:', chooseColorPlaceholder: 'Выберите цвет, чтобы увидеть имя...', downloadAppTitle: 'Скачать приложение (APK)', downloadAppDesc: 'Загрузите последнюю версию приложения для Android.', privacyProfileTitle: 'Конфиденциальность профиля', privacyProfileDesc: 'Выберите, кто может видеть ваши посты. Если аккаунт закрыт, только одобренные люди могут подписаться на вас.', privateAccountTitle: 'Закрытый аккаунт', privateAccountDesc: 'Текущие подписчики не пострадают.', exportDataTitle: 'Экспорт данных', exportDataDesc: 'Загрузите копию ваших данных.', exportJsonBtn: 'Экспорт JSON', exportHtmlBtn: 'Экспорт HTML', historyTitle: 'История', privacyDocTitle: 'Политика конфиденциальности', communityPolicyTitle: 'Правила сообщества'
        },
        'ja': {
            menuTitle: 'メニュー', navPubblici: '公開', navCercaPersone: '検索', navMessaggi: 'メッセージ', navPosta: '受信トレイ', navSegnalazioni: '報告', navProfilo: 'プロフィール', navImpostazioni: '設定', navAdmin: 'ユーザー管理', logout: 'ログアウト',
            impostazioniTitle: '設定', impostazioniDesc: 'アカウントの設定。', backgroundTitle: '背景色', deleteAccountTitle: 'アカウント削除', deleteAccountDesc: 'この操作は元に戻せません。', deleteAccountBtn: 'アカウントを削除する', modalTitle: '本当によろしいですか？', modalDesc: '本当にアカウントを削除しますか？', modalCancelBtn: 'キャンセル', modalConfirmBtn: '削除',
            profileTitle: 'プロフィール - Spottio', followersText: 'フォロワー', followingText: 'フォロー中', editBioBtn: '自己紹介を編集', adminActions: '報告管理', logoutBtn: 'ログアウト', saveBtn: '保存', noBio: '自己紹介なし', bioUpdated: '更新しました！', imgUpdated: '画像更新！', yourFollowers: 'フォロワー', followedUsers: 'フォロー中', noUsers: 'ユーザーがいません。', loading: '読み込み中...', loadingError: 'エラー。', loadingPosts: '投稿を読み込み中...', userNotFound: 'ユーザーエラー。', noTextPost: 'テキストなしの投稿', generalCategory: '一般', noPostsFound: '投稿が見つかりません', cannotLoadPosts: '投稿を読み込めません。', missingIndex: 'インデックスがありません！', postWord: '投稿', saveError: '保存エラー。',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: '設定を検索...', changePasswordTitle: 'パスワード変更', oldPassPlaceholder: '現在のパスワード', newPassPlaceholder: '新しいパスワード', updatePassBtn: 'パスワードを更新', searchColorsPlaceholder: '名前、HEX、またはRGBで検索', createColorLabel: '色を作成:', chooseColorPlaceholder: '色を選択して名前を表示...', downloadAppTitle: 'アプリのダウンロード(APK)', downloadAppDesc: 'Androidデバイス用の最新バージョンをダウンロードしてください。', privacyProfileTitle: 'プロフィールのプライバシー', privacyProfileDesc: '投稿を閲覧できるユーザーを選択します。非公開アカウントの場合、承認された人のみがフォローできます。', privateAccountTitle: '非公開アカウント', privateAccountDesc: '現在のフォロワーには影響しません。', exportDataTitle: 'データのエクスポート', exportDataDesc: 'データのコピーをダウンロードします。', exportJsonBtn: 'JSONエクスポート', exportHtmlBtn: 'HTMLエクスポート', historyTitle: '歴史', privacyDocTitle: 'プライバシーポリシー', communityPolicyTitle: 'コミュニティガイドライン'
        },
        'nl': {
            menuTitle: 'Menu', navPubblici: 'Openbaar', navCercaPersone: 'Zoeken', navMessaggi: 'Berichten', navPosta: 'Postvak IN', navSegnalazioni: 'Meldingen', navProfilo: 'Profiel', navImpostazioni: 'Instellingen', navAdmin: 'Gebruikersbeheer', logout: 'Uitloggen',
            impostazioniTitle: 'Instellingen', impostazioniDesc: 'Configureer je account.', backgroundTitle: 'Achtergrondkleur', deleteAccountTitle: 'Account verwijderen', deleteAccountDesc: 'Deze actie is onomkeerbaar.', deleteAccountBtn: 'Verwijder mijn account', modalTitle: 'Weet je het zeker?', modalDesc: 'Wil je je account echt verwijderen?', modalCancelBtn: 'Annuleren', modalConfirmBtn: 'Verwijderen',
            profileTitle: 'Profiel - Spottio', followersText: 'Volgers', followingText: 'Volgend', editBioBtn: 'Bio bewerken', adminActions: 'Meldingenbeheer', logoutBtn: 'Uitloggen', saveBtn: 'Opslaan', noBio: 'Geen bio', bioUpdated: 'Bio geüpdatet!', imgUpdated: 'Afbeelding geüpdatet!', yourFollowers: 'Jouw Volgers', followedUsers: 'Gevolgde Gebruikers', noUsers: 'Geen gebruikers.', loading: 'Laden...', loadingError: 'Laadfout.', loadingPosts: 'Berichten laden...', userNotFound: 'Gebruikersfout.', noTextPost: 'Bericht zonder tekst', generalCategory: 'Algemeen', noPostsFound: 'Geen berichten gevonden', cannotLoadPosts: 'Kan berichten niet laden.', missingIndex: 'Ontbrekende index!', postWord: 'Berichten', saveError: 'Fout bij opslaan.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'Instellingen zoeken...', changePasswordTitle: 'Wachtwoord wijzigen', oldPassPlaceholder: 'Huidig wachtwoord', newPassPlaceholder: 'Nieuw wachtwoord', updatePassBtn: 'Wachtwoord bijwerken', searchColorsPlaceholder: 'Zoeken op naam, HEX of RGB', createColorLabel: 'Maak uw kleur:', chooseColorPlaceholder: 'Kies een kleur om de naam te zien...', downloadAppTitle: 'App downloaden (APK)', downloadAppDesc: 'Download de nieuwste versie voor je Android-apparaat.', privacyProfileTitle: 'Profielprivacy', privacyProfileDesc: 'Kies wie je berichten mag zien. Bij een privéaccount kunnen alleen goedgekeurde personen je volgen.', privateAccountTitle: 'Privéaccount', privateAccountDesc: 'Huidige volgers worden niet beïnvloed.', exportDataTitle: 'Gegevens exporteren', exportDataDesc: 'Download een kopie van je gegevens.', exportJsonBtn: 'JSON Exporteren', exportHtmlBtn: 'HTML Exporteren', historyTitle: 'Geschiedenis', privacyDocTitle: 'Privacybeleid', communityPolicyTitle: 'Communityrichtlijnen'
        },
        'pl': {
            menuTitle: 'Menu', navPubblici: 'Publiczne', navCercaPersone: 'Szukaj', navMessaggi: 'Wiadomości', navPosta: 'Skrzynka', navSegnalazioni: 'Zgłoszenia', navProfilo: 'Profil', navImpostazioni: 'Ustawienia', navAdmin: 'Zarządzanie', logout: 'Wyloguj',
            impostazioniTitle: 'Ustawienia', impostazioniDesc: 'Skonfiguruj swoje preferencje.', backgroundTitle: 'Kolor tła', deleteAccountTitle: 'Usuń konto', deleteAccountDesc: 'Ta akcja jest nieodwracalna.', deleteAccountBtn: 'Usuń moje konto', modalTitle: 'Jesteś pewien?', modalDesc: 'Czy na pewno chcesz usunąć konto?', modalCancelBtn: 'Anuluj', modalConfirmBtn: 'Usuń',
            profileTitle: 'Profil - Spottio', followersText: 'Obserwujący', followingText: 'Obserwowani', editBioBtn: 'Edytuj Bio', adminActions: 'Zarządzanie Zgłoszeniami', logoutBtn: 'Wyloguj', saveBtn: 'Zapisz', noBio: 'Brak bio', bioUpdated: 'Bio zaktualizowane!', imgUpdated: 'Zdjęcie zaktualizowane!', yourFollowers: 'Twoi Obserwujący', followedUsers: 'Obserwowani', noUsers: 'Brak użytkowników.', loading: 'Ładowanie...', loadingError: 'Błąd ładowania.', loadingPosts: 'Ładowanie postów...', userNotFound: 'Błąd użytkownika.', noTextPost: 'Post bez tekstu', generalCategory: 'Ogólne', noPostsFound: 'Nie znaleziono postów', cannotLoadPosts: 'Nie można załadować postów.', missingIndex: 'Brak indeksu!', postWord: 'Posty', saveError: 'Błąd zapisu.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'Szukaj ustawień...', changePasswordTitle: 'Zmień Hasło', oldPassPlaceholder: 'Obecne hasło', newPassPlaceholder: 'Nowe hasło', updatePassBtn: 'Aktualizuj Hasło', searchColorsPlaceholder: 'Szukaj po nazwie, HEX lub RGB', createColorLabel: 'Stwórz swój kolor:', chooseColorPlaceholder: 'Wybierz kolor, aby zobaczyć nazwę...', downloadAppTitle: 'Pobierz aplikację (APK)', downloadAppDesc: 'Pobierz najnowszą wersję aplikacji na urządzenie z systemem Android.', privacyProfileTitle: 'Prywatność Profilu', privacyProfileDesc: 'Wybierz, kto może zobaczyć Twoje posty. Jeśli konto jest prywatne, tylko zatwierdzone osoby mogą Cię obserwować.', privateAccountTitle: 'Konto Prywatne', privateAccountDesc: 'Obecni obserwujący nie zostaną usunięci.', exportDataTitle: 'Eksportuj Dane', exportDataDesc: 'Pobierz kopię swoich danych.', exportJsonBtn: 'Eksport JSON', exportHtmlBtn: 'Eksport HTML', historyTitle: 'Historia', privacyDocTitle: 'Polityka Prywatności', communityPolicyTitle: 'Zasady Społeczności'
        },
        'zh': {
            menuTitle: '菜单', navPubblici: '公开', navCercaPersone: '搜寻', navMessaggi: '消息', navPosta: '收件箱', navSegnalazioni: '报告', navProfilo: '个人资料', navImpostazioni: '设置', navAdmin: '用户管理', logout: '登出',
            impostazioniTitle: '设置', impostazioniDesc: '配置您的帐户。', backgroundTitle: '背景颜色', deleteAccountTitle: '删除帐户', deleteAccountDesc: '此操作不可逆。', deleteAccountBtn: '删除我的帐户', modalTitle: '确定吗？', modalDesc: '您真的要删除您的帐户吗？', modalCancelBtn: '取消', modalConfirmBtn: '删除',
            profileTitle: '个人资料 - Spottio', followersText: '粉丝', followingText: '关注', editBioBtn: '编辑简介', adminActions: '举报管理', logoutBtn: '登出', saveBtn: '保存', noBio: '暂无简介', bioUpdated: '简介已更新！', imgUpdated: '图片已更新！', yourFollowers: '您的粉丝', followedUsers: '您关注的人', noUsers: '没有用户。', loading: '加载中...', loadingError: '加载错误。', loadingPosts: '加载您的帖子...', userNotFound: '用户错误。', noTextPost: '无文字的帖子', generalCategory: '综合', noPostsFound: '未找到帖子', cannotLoadPosts: '无法加载帖子。', missingIndex: '缺少索引！', postWord: '帖子', saveError: '保存错误。',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: '搜索设置...', changePasswordTitle: '更改密码', oldPassPlaceholder: '当前密码', newPassPlaceholder: '新密码', updatePassBtn: '更新密码', searchColorsPlaceholder: '按名称，HEX 或 RGB 搜索', createColorLabel: '创建您的颜色：', chooseColorPlaceholder: '选择颜色以查看名称...', downloadAppTitle: '下载应用程序 (APK)', downloadAppDesc: '为您的Android设备下载最新版本的应用程序。', privacyProfileTitle: '个人资料隐私', privacyProfileDesc: '选择谁可以看到您的帖子。当您的帐户设为私密时，只有您批准的人才能关注您。', privateAccountTitle: '私密帐户', privateAccountDesc: '当前的关注者不会受到影响。', exportDataTitle: '导出数据', exportDataDesc: '下载您的数据副本。', exportJsonBtn: '导出 JSON', exportHtmlBtn: '导出 HTML', historyTitle: '历史', privacyDocTitle: '隐私政策', communityPolicyTitle: '社区准则'
        },
        'hi': {
            menuTitle: 'मेनू', navPubblici: 'सार्वजनिक', navCercaPersone: 'लोग खोजें', navMessaggi: 'संदेश', navPosta: 'इनबॉक्स', navSegnalazioni: 'रिपोर्ट', navProfilo: 'प्रोफ़ाइल', navImpostazioni: 'सेटिंग्स', navAdmin: 'उपयोगकर्ता प्रबंधन', logout: 'लॉग आउट',
            impostazioniTitle: 'सेटिंग्स', impostazioniDesc: 'अपना खाता कॉन्फ़िगर करें।', backgroundTitle: 'पृष्ठभूमि का रंग', deleteAccountTitle: 'खाता हटाएं', deleteAccountDesc: 'यह क्रिया अपरिवर्तनीय है।', deleteAccountBtn: 'मेरा खाता हटाएं', modalTitle: 'क्या आपको यकीन है?', modalDesc: 'क्या आप वाकई अपना खाता हटाना चाहते हैं?', modalCancelBtn: 'रद्द करें', modalConfirmBtn: 'हटाएं',
            profileTitle: 'प्रोफ़ाइल - Spottio', followersText: 'फ़ॉलोअर्स', followingText: 'फ़ॉलो कर रहे हैं', editBioBtn: 'बायो संपादित करें', adminActions: 'रिपोर्ट प्रबंधन', logoutBtn: 'लॉग आउट', saveBtn: 'सहेजें', noBio: 'कोई बायो नहीं', bioUpdated: 'बायो अपडेट किया गया!', imgUpdated: 'छवि अपडेट की गई!', yourFollowers: 'आपके फ़ॉलोअर्स', followedUsers: 'फॉलो किए गए उपयोगकर्ता', noUsers: 'कोई उपयोगकर्ता नहीं।', loading: 'लोड हो रहा है...', loadingError: 'लोडिंग त्रुटि।', loadingPosts: 'आपके पोस्ट लोड हो रहे हैं...', userNotFound: 'उपयोगकर्ता त्रुटि।', noTextPost: 'बिना टेक्स्ट का पोस्ट', generalCategory: 'सामान्य', noPostsFound: 'कोई पोस्ट नहीं मिली', cannotLoadPosts: 'पोस्ट लोड करने में असमर्थ।', missingIndex: 'इंडेक्स गायब है!', postWord: 'पोस्ट', saveError: 'बचाने में त्रुटि।',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: 'सेटिंग्स खोजें...', changePasswordTitle: 'पासवर्ड बदलें', oldPassPlaceholder: 'वर्तमान पासवर्ड', newPassPlaceholder: 'नया पासवर्ड', updatePassBtn: 'पासवर्ड अपडेट करें', searchColorsPlaceholder: 'नाम, HEX या RGB द्वारा खोजें', createColorLabel: 'अपना रंग बनाएं:', chooseColorPlaceholder: 'नाम देखने के लिए एक रंग चुनें...', downloadAppTitle: 'ऐप डाउनलोड करें (APK)', downloadAppDesc: 'अपने Android डिवाइस के लिए नवीनतम संस्करण डाउनलोड करें।', privacyProfileTitle: 'प्रोफ़ाइल गोपनीयता', privacyProfileDesc: 'चुनें कि आपके पोस्ट कौन देख सकता है। जब आपका खाता निजी होता है, तो केवल वे लोग आपका अनुसरण कर सकते हैं जिन्हें आप स्वीकार करते हैं।', privateAccountTitle: 'निजी खाता', privateAccountDesc: 'वर्तमान अनुयायी प्रभावित नहीं होंगे।', exportDataTitle: 'डेटा निर्यात करें', exportDataDesc: 'अपने डेटा की एक प्रति डाउनलोड करें।', exportJsonBtn: 'निर्यात JSON', exportHtmlBtn: 'निर्यात HTML', historyTitle: 'इतिहास', privacyDocTitle: 'गोपनीयता नीति', communityPolicyTitle: 'सामुदायिक दिशानिर्देश'
        },
        'ko-kp': {
            menuTitle: '메뉴', navPubblici: '공개', navCercaPersone: '사람 찾기', navMessaggi: '메시지', navPosta: '받은 편지함', navSegnalazioni: '신고', navProfilo: '프로필', navImpostazioni: '설정', navAdmin: '사용자 관리', logout: '로그아웃',
            impostazioniTitle: '설정', impostazioniDesc: '계정을 구성하십시오.', backgroundTitle: '배경색', deleteAccountTitle: '계정 삭제', deleteAccountDesc: '이 작업은 취소할 수 없습니다.', deleteAccountBtn: '내 계정 삭제', modalTitle: '확실합니까?', modalDesc: '정말 계정을 삭제하시겠습니까?', modalCancelBtn: '취소', modalConfirmBtn: '삭제',
            profileTitle: '프로필 - Spottio', followersText: '팔로워', followingText: '팔로잉', editBioBtn: '소개 수정', adminActions: '신고 관리', logoutBtn: '로그아웃', saveBtn: '저장', noBio: '소개 없음', bioUpdated: '소개 업데이트됨!', imgUpdated: '이미지 업데이트됨!', yourFollowers: '팔로워', followedUsers: '팔로잉', noUsers: '사용자 없음.', loading: '로딩 중...', loadingError: '로딩 오류.', loadingPosts: '게시물 로딩 중...', userNotFound: '사용자 오류.', noTextPost: '내용 없는 게시물', generalCategory: '일반', noPostsFound: '게시물 없음', cannotLoadPosts: '게시물 로드 불가.', missingIndex: '인덱스 누락!', postWord: '게시물', saveError: '저장 오류.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: '설정 검색...', changePasswordTitle: '비밀번호 변경', oldPassPlaceholder: '현재 비밀번호', newPassPlaceholder: '새 비밀번호', updatePassBtn: '비밀번호 업데이트', searchColorsPlaceholder: '이름, HEX 또는 RGB로 검색', createColorLabel: '색상 만들기:', chooseColorPlaceholder: '이름을 보려면 색상을 선택하세요...', downloadAppTitle: '앱 다운로드 (APK)', downloadAppDesc: 'Android 기기용 최신 버전을 다운로드하세요.', privacyProfileTitle: '프로필 개인정보 보호', privacyProfileDesc: '게시물을 볼 수 있는 사람을 선택하세요. 비공개 계정인 경우 승인한 사람만 팔로우할 수 있습니다.', privateAccountTitle: '비공개 계정', privateAccountDesc: '현재 팔로워는 영향을 받지 않습니다.', exportDataTitle: '데이터 내보내기', exportDataDesc: '데이터 사본을 다운로드하십시오.', exportJsonBtn: 'JSON 내보내기', exportHtmlBtn: 'HTML 내보내기', historyTitle: '역사', privacyDocTitle: '개인정보 처리방침', communityPolicyTitle: '커뮤니티 가이드라인'
        },
        'ko-kr': {
            menuTitle: '메뉴', navPubblici: '공개', navCercaPersone: '사람 찾기', navMessaggi: '메시지', navPosta: '받은 편지함', navSegnalazioni: '신고', navProfilo: '프로필', navImpostazioni: '설정', navAdmin: '사용자 관리', logout: '로그아웃',
            impostazioniTitle: '설정', impostazioniDesc: '계정을 구성하십시오.', backgroundTitle: '배경색', deleteAccountTitle: '계정 삭제', deleteAccountDesc: '이 작업은 취소할 수 없습니다.', deleteAccountBtn: '내 계정 삭제', modalTitle: '확실합니까?', modalDesc: '정말 계정을 삭제하시겠습니까?', modalCancelBtn: '취소', modalConfirmBtn: '삭제',
            profileTitle: '프로필 - Spottio', followersText: '팔로워', followingText: '팔로잉', editBioBtn: '소개 수정', adminActions: '신고 관리', logoutBtn: '로그아웃', saveBtn: '저장', noBio: '소개 없음', bioUpdated: '소개 업데이트됨!', imgUpdated: '이미지 업데이트됨!', yourFollowers: '팔로워', followedUsers: '팔로잉', noUsers: '사용자 없음.', loading: '로딩 중...', loadingError: '로딩 오류.', loadingPosts: '게시물 로딩 중...', userNotFound: '사용자 오류.', noTextPost: '내용 없는 게시물', generalCategory: '일반', noPostsFound: '게시물 없음', cannotLoadPosts: '게시물 로드 불가.', missingIndex: '인덱스 누락!', postWord: '게시물', saveError: '저장 오류.',
            // --- NUOVE TRADUZIONI IMPOSTAZIONI ---
            searchSettingsPlaceholder: '설정 검색...', changePasswordTitle: '비밀번호 변경', oldPassPlaceholder: '현재 비밀번호', newPassPlaceholder: '새 비밀번호', updatePassBtn: '비밀번호 업데이트', searchColorsPlaceholder: '이름, HEX 또는 RGB로 검색', createColorLabel: '색상 만들기:', chooseColorPlaceholder: '이름을 보려면 색상을 선택하세요...', downloadAppTitle: '앱 다운로드 (APK)', downloadAppDesc: 'Android 기기용 최신 버전을 다운로드하세요.', privacyProfileTitle: '프로필 개인정보 보호', privacyProfileDesc: '게시물을 볼 수 있는 사람을 선택하세요. 비공개 계정인 경우 승인한 사람만 팔로우할 수 있습니다.', privateAccountTitle: '비공개 계정', privateAccountDesc: '현재 팔로워는 영향을 받지 않습니다.', exportDataTitle: '데이터 내보내기', exportDataDesc: '데이터 사본을 다운로드하십시오.', exportJsonBtn: 'JSON 내보내기', exportHtmlBtn: 'HTML 내보내기', historyTitle: '역사', privacyDocTitle: '개인정보 처리방침', communityPolicyTitle: '커뮤니티 가이드라인'
        }
    };

    // 2. FUNZIONE GLOBALE DI TRADUZIONE JS
    window.t = function(key) {
        const lang = localStorage.getItem('selectedLanguage') || 'it';
        if (window.translations && window.translations[lang] && window.translations[lang][key]) {
            return window.translations[lang][key];
        }
        if (window.translations && window.translations['it'] && window.translations['it'][key]) {
            return window.translations['it'][key];
        }
        return key; 
    };

    // 3. HTML DEL MENU A TENDINA DELLE LINGUE
    const dropdownHtml = getLanguageDropdownHTML();

    // 4. SALVATAGGIO LINGUA SU FIRESTORE
    const saveLanguageToFirestore = async (lang) => {
        if (window.auth && window.db) {
            const user = window.auth.currentUser;
            if (user) {
                try {
                    const username = localStorage.getItem('username');
                    if (username) {
                        await window.db.collection('users').doc(username).update({ language: lang });
                    } else {
                        const snapshot = await window.db.collection('users').where('email', '==', user.email).get();
                        if (!snapshot.empty) {
                            await snapshot.docs[0].ref.update({ language: lang });
                        }
                    }
                } catch (error) {
                    console.error("Errore durante il salvataggio della lingua su Firestore:", error);
                }
            }
        }
    };
    
    // 5. APPLICAZIONE DEI TESTI AL DOM
    const updateContent = (lang) => {
        localStorage.setItem('selectedLanguage', lang);
        
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (window.translations[lang] && window.translations[lang][key]) {
                if (element.tagName.toLowerCase() === 'title') {
                    document.title = window.translations[lang][key];
                } 
                // Aggiunta la condizione per gli attributi placeholder (es: Input testuali)
                else if (element.tagName.toLowerCase() === 'input' && element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', window.translations[lang][key]);
                } 
                else {
                    const textSpan = element.querySelector('.nav-text, #logout-text');
                    if (textSpan) {
                        textSpan.textContent = window.translations[lang][key];
                    } else {
                        element.textContent = window.translations[lang][key];
                    }
                }
            }
        });
        
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    };

    // 6. INIZIALIZZAZIONE UI E LISTENER
    const container = document.getElementById('language-dropdown-container');
    if (container) {
        container.innerHTML = dropdownHtml;
    }

    const languageToggle = document.getElementById('language-toggle');
    const languageDropdownMenu = document.getElementById('language-dropdown-menu');
    const dropdownIcon = document.getElementById('dropdown-icon');
    const selectedFlag = document.getElementById('selected-flag');
    const selectedLangText = document.getElementById('selected-lang-text');
    const langOptions = document.querySelectorAll('.lang-option');

    if (languageToggle && languageDropdownMenu) {
        languageToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdownMenu.classList.toggle('hidden');
            if (dropdownIcon) dropdownIcon.classList.toggle('rotate-180');
        });

        document.addEventListener('click', (event) => {
            if (!languageToggle.contains(event.target) && !languageDropdownMenu.contains(event.target)) {
                languageDropdownMenu.classList.add('hidden');
                if (dropdownIcon) dropdownIcon.classList.remove('rotate-180');
            }
        });
    }

    const syncFlagUI = (lang) => {
        const option = document.querySelector(`.lang-option[data-lang="${lang}"]`);
        if (option && selectedFlag && selectedLangText) {
            selectedFlag.src = option.querySelector('img').src;
            selectedFlag.alt = `Bandiera ${option.getAttribute('data-text')}`;
            selectedLangText.textContent = option.getAttribute('data-text');
        }
    };

    langOptions.forEach(option => {
        option.addEventListener('click', async () => {
            const lang = option.getAttribute('data-lang');
            
            // Verifica qual è la lingua attualmente in uso
            const currentLang = localStorage.getItem('selectedLanguage') || 'it';
            
            // Chiude il menu a tendina
            if (languageDropdownMenu) languageDropdownMenu.classList.add('hidden');
            if (dropdownIcon) dropdownIcon.classList.remove('rotate-180');

            // SE LA LINGUA SELEZIONATA È GIÀ QUELLA ATTIVA, FERMATI QUI! (Evita il ricaricamento)
            if (lang === currentLang) {
                return;
            }

            // Altrimenti, procedi al cambio lingua
            updateContent(lang);
            syncFlagUI(lang);
            await saveLanguageToFirestore(lang);
            
            // Ricarica la pagina per applicare la lingua ai testi dinamici di Firebase
            // window.location.reload(); 
        });
    });

    document.addEventListener('navReady', () => {
        let currentLang = localStorage.getItem('selectedLanguage') || 'it';
        updateContent(currentLang);
    });

    // 7. CARICAMENTO IMMEDIATO DELLA LINGUA LOCALE
    let langToLoad = localStorage.getItem('selectedLanguage') || 'it';
    updateContent(langToLoad);
    syncFlagUI(langToLoad);

    // 8. SINCRONIZZAZIONE CON FIRESTORE ALL'AVVIO
    if (window.auth && window.db) {
        window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    let userDoc = null;
                    const username = localStorage.getItem('username');

                    if (username) {
                        userDoc = await window.db.collection('users').doc(username).get();
                    } else {
                        const snapshot = await window.db.collection('users').where('email', '==', user.email).get();
                        if (!snapshot.empty) {
                            userDoc = snapshot.docs[0];
                        }
                    }

                    if (userDoc && userDoc.exists) {
                        const dbLang = userDoc.data().language;
                        if (dbLang && dbLang !== langToLoad) {
                            updateContent(dbLang);
                            syncFlagUI(dbLang);
                        }
                    }
                } catch (e) {
                    console.error("Errore recupero lingua da Firestore all'avvio:", e);
                }
            }
        });
    }
});
