// posta-categories.js - Gestione categorie e autocompletamento (Tag Multipli)

let availableCategories = ["Generale"];
let selectedCategoriesList = ["Generale"];

async function fetchCategories() {
    // RIMOZIONE DUPLICATO: Affidamento all'helper Spottio 
    availableCategories = await window.Spottio.getCategoriesList();
}

function renderSelectedCategories() {
    const container = document.getElementById('selected-categories-container');
    const hiddenInput = document.getElementById('post-category');
    if (!container) return;

    container.innerHTML = '';
    selectedCategoriesList.forEach(cat => {
        const chip = document.createElement('span');
        chip.className = "bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2";
        chip.innerHTML = `${cat} <button type="button" class="text-red-500 hover:text-red-700 font-bold" onclick="removeCategory('${cat}')">&times;</button>`;
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
                item.className = 'px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition';
                item.textContent = cat;
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
        if (!selectedCategoriesList.includes(catName)) selectedCategoriesList.push(catName);
        searchInput.value = '';
        renderSelectedCategories();
        dropdown.classList.add('hidden');
    }

    searchInput.addEventListener('focus', () => renderList(searchInput.value));
    searchInput.addEventListener('input', () => renderList(searchInput.value));

    addOption.addEventListener('click', async () => {
        const newCatName = searchInput.value.trim();
        if (!newCatName) return;
        const formattedName = newCatName.charAt(0).toUpperCase() + newCatName.slice(1);

        try {
            await window.db.collection('categories').add({
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