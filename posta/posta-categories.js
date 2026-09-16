// posta-categories.js - Gestione categorie e autocompletamento (Tag Multipli con avviso integrato nella barra e limite max 5)

let availableCategories = ["Generale"];
let selectedCategoriesList = ["Generale"];
const MAX_CATEGORIES = 5;

async function fetchCategories() {
    if (window.Spottio && typeof window.Spottio.getCategoriesList === 'function') {
        availableCategories = await window.Spottio.getCategoriesList();
        return;
    }

    try {
        const dbInstance = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
        if (dbInstance) {
            const list = ["Generale"];
            const snapshot = await dbInstance.collection('categories').get();
            snapshot.forEach(doc => {
                const name = doc.data().name;
                if (name && !list.includes(name)) list.push(name);
            });
            availableCategories = list;
        }
    } catch (e) {
        console.warn("Recupero categorie di fallback:", e);
    }
}

function showCategoryLimitWarning() {
    const searchInput = document.getElementById('category-search');
    const warningMsg = document.getElementById('category-warning-msg');

    if (warningMsg) {
        warningMsg.classList.remove('hidden');
    }

    if (searchInput) {
        searchInput.classList.add('ring-2', 'ring-red-500', 'bg-red-50');
        searchInput.placeholder = "Massimo 5 categorie consentite!";
    }

    setTimeout(() => {
        if (warningMsg) warningMsg.classList.add('hidden');
        if (searchInput) {
            searchInput.classList.remove('ring-2', 'ring-red-500', 'bg-red-50');
            searchInput.placeholder = "Cerca o inserisci una categoria... (Max 5)";
        }
    }, 3000);
}

function renderSelectedCategories() {
    const container = document.getElementById('selected-categories-container');
    const hiddenInput = document.getElementById('post-category');
    if (!container) return;

    container.innerHTML = '';
    selectedCategoriesList.forEach(cat => {
        const chip = document.createElement('span');
        chip.className = "bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm";
        chip.innerHTML = `${cat} <button type="button" class="text-red-500 hover:text-red-700 font-bold ml-0.5" onclick="window.removeCategory && window.removeCategory('${cat}')">&times;</button>`;
        container.appendChild(chip);
    });

    if (hiddenInput) {
        hiddenInput.value = JSON.stringify(selectedCategoriesList);
    }
}

window.removeCategory = function(catName) {
    selectedCategoriesList = selectedCategoriesList.filter(c => c !== catName);
    if (selectedCategoriesList.length === 0) selectedCategoriesList.push("Generale");
    renderSelectedCategories();
};

function setupCategoryAutocomplete() {
    const searchInput = document.getElementById('category-search');
    const dropdown = document.getElementById('category-dropdown');
    const categoryList = document.getElementById('category-list');
    const addOption = document.getElementById('add-category-option');
    const newCatNameSpan = document.getElementById('new-cat-name');

    if (!searchInput || !dropdown) return;

    function renderList(query = '') {
        const cleanQuery = query.trim().toLowerCase();
        categoryList.innerHTML = '';

        const filtered = availableCategories.filter(cat => 
            cat.toLowerCase().includes(cleanQuery)
        );

        if (filtered.length > 0) {
            filtered.forEach(cat => {
                const item = document.createElement('div');
                const isSelected = selectedCategoriesList.includes(cat);
                item.className = `px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center transition ${isSelected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'}`;
                item.innerHTML = `<span>${cat}</span>${isSelected ? '<span class="text-xs text-blue-600">✓ Selezionata</span>' : ''}`;
                
                item.addEventListener('click', () => {
                    selectCategory(cat);
                });
                categoryList.appendChild(item);
            });
        }

        const exactMatch = availableCategories.some(cat => cat.toLowerCase() === cleanQuery);
        if (cleanQuery.length > 0 && !exactMatch) {
            newCatNameSpan.textContent = query.trim();
            addOption.classList.remove('hidden');
        } else {
            addOption.classList.add('hidden');
        }

        dropdown.classList.remove('hidden');
    }

    function selectCategory(catName) {
        if (selectedCategoriesList.includes(catName)) {
            searchInput.value = '';
            dropdown.classList.add('hidden');
            return;
        }

        if (selectedCategoriesList.length === 1 && selectedCategoriesList[0] === "Generale" && catName !== "Generale") {
            selectedCategoriesList = [catName];
        } else {
            if (selectedCategoriesList.length >= MAX_CATEGORIES) {
                dropdown.classList.add('hidden');
                showCategoryLimitWarning();
                return;
            }
            selectedCategoriesList.push(catName);
        }

        searchInput.value = '';
        renderSelectedCategories();
        dropdown.classList.add('hidden');
    }

    searchInput.addEventListener('focus', () => renderList(searchInput.value));
    searchInput.addEventListener('input', () => renderList(searchInput.value));

    addOption.addEventListener('click', async () => {
        const newCatName = searchInput.value.trim();
        if (!newCatName) return;

        if (selectedCategoriesList.length >= MAX_CATEGORIES && !(selectedCategoriesList.length === 1 && selectedCategoriesList[0] === "Generale")) {
            dropdown.classList.add('hidden');
            showCategoryLimitWarning();
            return;
        }

        const formattedName = newCatName.charAt(0).toUpperCase() + newCatName.slice(1);

        try {
            const dbInstance = window.db || firebase.firestore();
            await dbInstance.collection('categories').add({
                name: formattedName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (!availableCategories.includes(formattedName)) availableCategories.push(formattedName);
            selectCategory(formattedName);
        } catch (error) {
            console.error("Errore salvataggio categoria:", error);
            alert("Errore durante il salvataggio della categoria.");
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden');
    });
}

document.addEventListener('DOMContentLoaded', () => renderSelectedCategories());