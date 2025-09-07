document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM Utama ---
    const loadingScreen = document.getElementById('loading-screen');
    const apiTitleEl = document.getElementById('api-title');
    const apiDescEl = document.getElementById('api-description');
    const searchInput = document.getElementById('searchInput');
    const apiListContainer = document.getElementById('api-list-container');
    const modal = document.getElementById('api-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const sendRequestBtn = document.getElementById('send-request-btn');
    const copyResponseBtn = document.getElementById('copy-response-btn');

    let apiData = []; // Menyimpan semua data API

    /**
     * Memuat data dari settings.json dan menginisialisasi halaman.
     */
    async function init() {
        try {
            const response = await fetch('/assets/settings.json');
            if (!response.ok) throw new Error('settings.json tidak ditemukan.');
            const settings = await response.json();
            
            // Simpan data untuk pencarian
            apiData = settings.categories || [];

            // Update info header
            document.title = settings.name || 'API Documentation';
            apiTitleEl.textContent = settings.name || 'API Title';
            apiDescEl.textContent = settings.description || 'API Description';
            
            // Render daftar API
            renderAPIs(apiData);

        } catch (error) {
            console.error("Gagal memuat API:", error);
            apiListContainer.innerHTML = `<p style="text-align: center; color: var(--error-color);">Gagal memuat data API.</p>`;
        } finally {
            // Sembunyikan layar loading
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
        }
    }

    /**
     * Merender kategori dan item API ke dalam DOM.
     * @param {Array} categories - Array kategori dari settings.json.
     */
    function renderAPIs(categories) {
        apiListContainer.innerHTML = ''; // Kosongkan dulu
        if (categories.length === 0) {
             apiListContainer.innerHTML = `<p style="text-align: center;">Tidak ada API yang ditemukan.</p>`;
             return;
        }

        categories.forEach((category, index) => {
            if (!category.items || category.items.length === 0) return;

            const section = document.createElement('section');
            section.className = 'api-category';
            section.style.animationDelay = `${index * 100}ms`;

            const iconMap = {
                "OpenAI & AI Models": "fa-robot",
                "Downloader": "fa-download",
                "Anime": "fa-dragon",
                "Search": "fa-search",
                "Image Creator": "fa-palette",
                "API": "fa-server",
                "Tools": "fa-wrench",
                "Random": "fa-shuffle"
            };
            const icon = iconMap[category.name] || 'fa-code-branch';

            section.innerHTML = `
                <h2 class="category-title"><i class="fas ${icon}"></i> ${category.name}</h2>
                <div class="api-grid">
                    ${category.items.map(item => `
                        <div class="api-item" data-path="${item.path}">
                            <div class="api-item-header">
                                <h3>${item.name}</h3>
                                <span class="status-badge ${item.status || 'ready'}">${item.status || 'ready'}</span>
                            </div>
                            <p>${item.desc}</p>
                            <div class="api-path"><code>${item.path}</code></div>
                        </div>
                    `).join('')}
                </div>
            `;
            apiListContainer.appendChild(section);
        });

        // Tambahkan event listener ke setiap item API yang baru dirender
        document.querySelectorAll('.api-item').forEach(item => {
            item.addEventListener('click', () => openModal(item.dataset.path));
        });
    }
    
    /**
     * Membuka modal dan mengisi datanya berdasarkan path API.
     * @param {string} path - path endpoint yang dipilih.
     */
    function openModal(path) {
        let selectedItem = null;
        apiData.forEach(cat => {
            const found = cat.items.find(item => item.path === path);
            if (found) selectedItem = found;
        });

        if (!selectedItem) return;

        // Isi data modal
        modal.querySelector('#modal-title').textContent = selectedItem.name;
        modal.querySelector('#modal-desc').textContent = selectedItem.desc;
        modal.querySelector('#modal-endpoint-path').textContent = selectedItem.path;
        
        const paramsInputs = modal.querySelector('#params-inputs');
        paramsInputs.innerHTML = '';
        if (selectedItem.params && Object.keys(selectedItem.params).length > 0) {
            Object.entries(selectedItem.params).forEach(([key, desc]) => {
                paramsInputs.innerHTML += `
                    <div class="param-group">
                        <label for="param-${key}">${key}</label>
                        <input type="text" id="param-${key}" name="${key}" placeholder="${desc}">
                    </div>
                `;
            });
            modal.querySelector('#params-container').style.display = 'block';
        } else {
            modal.querySelector('#params-container').style.display = 'none';
        }

        // Simpan path untuk digunakan saat mengirim request
        sendRequestBtn.dataset.path = selectedItem.path;

        // Reset tampilan response
        modal.querySelector('#response-status').textContent = '';
        modal.querySelector('#response-output').textContent = 'Menunggu permintaan...';
        
        modal.style.display = 'flex';
    }

    /**
     * Menutup modal.
     */
    function closeModal() {
        modal.style.display = 'none';
    }

    /**
     * Mengirim permintaan API dan menampilkan hasilnya.
     */
    async function handleSendRequest() {
        const path = sendRequestBtn.dataset.path;
        if (!path) return;

        const responseOutput = modal.querySelector('#response-output');
        const responseStatus = modal.querySelector('#response-status');
        responseOutput.textContent = 'Memuat...';
        sendRequestBtn.disabled = true;

        // Kumpulkan parameter dari input
        const params = {};
        modal.querySelectorAll('#params-inputs input').forEach(input => {
            if (input.value) {
                params[input.name] = encodeURIComponent(input.value);
            }
        });
        
        // Bangun URL
        let finalUrl = path;
        Object.entries(params).forEach(([key, value]) => {
            finalUrl = finalUrl.replace(`{${key}}`, value).replace(`${key}=`, `${key}=${value}`);
        });

        try {
            const response = await fetch(finalUrl);
            const data = await response.json();
            
            responseStatus.textContent = `Status: ${response.status}`;
            responseStatus.style.color = response.ok ? 'var(--success-color)' : 'var(--error-color)';
            responseOutput.innerHTML = syntaxHighlight(data);

        } catch (error) {
            responseStatus.textContent = 'Error';
            responseStatus.style.color = 'var(--error-color)';
            responseOutput.textContent = `Gagal mengirim permintaan:\n${error}`;
        } finally {
            sendRequestBtn.disabled = false;
        }
    }
    
    /**
     * Fungsi untuk syntax highlighting JSON.
     * @param {object} json - Objek JSON.
     * @returns {string} - String HTML dengan highlight.
     */
    function syntaxHighlight(json) {
        let jsonString = JSON.stringify(json, undefined, 2);
        jsonString = jsonString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
    }

    /**
     * Menyalin teks dari kotak respons.
     */
    function copyResponse() {
        const textToCopy = modal.querySelector('#response-output').textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Respons disalin!');
        });
    }
    
    /**
     * Menyaring daftar API berdasarkan input pencarian.
     */
    function handleSearch() {
        const query = searchInput.value.toLowerCase();
        const filteredCategories = apiData.map(category => {
            const filteredItems = category.items.filter(item => 
                item.name.toLowerCase().includes(query) || 
                item.path.toLowerCase().includes(query) ||
                item.desc.toLowerCase().includes(query)
            );
            return { ...category, items: filteredItems };
        }).filter(category => category.items.length > 0);
        
        renderAPIs(filteredCategories);
    }
    
    // --- Event Listeners ---
    searchInput.addEventListener('input', handleSearch);
    closeModalBtn.addEventListener('click', closeModal);
    sendRequestBtn.addEventListener('click', handleSendRequest);
    copyResponseBtn.addEventListener('click', copyResponse);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // --- Inisialisasi ---
    init();
});
 