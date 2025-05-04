document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById("loadingScreen");
    const body = document.body;
    body.classList.add("no-scroll");

    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Theme toggle functionality
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // Update icon
        document.getElementById('themeToggleBtn').innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    try {
        const settings = await fetch('/src/settings.json').then(res => res.json());

        const setContent = (id, property, value) => {
            const element = document.getElementById(id);
            if (element) element[property] = value;
        };
        
        // Set page content from settings
        setContent('page', 'textContent', settings.name || "Skyzopedia UI");
        setContent('wm', 'textContent', `© ${new Date().getFullYear()} ${settings.apiSettings.creator}. All rights reserved.` || `© ${new Date().getFullYear()} Skyzopedia. All rights reserved.`);
        setContent('header', 'textContent', settings.name || "Skyzopedia UI");
        setContent('name', 'textContent', settings.name || "Skyzopedia UI");
        setContent('version', 'textContent', settings.version || "v1.0");
        setContent('versionHeader', 'textContent', settings.header.status || "Active!");
        setContent('description', 'textContent', settings.description || "Simple API's");

        // Set links
        const apiLinksContainer = document.getElementById('apiLinks');
        if (apiLinksContainer && settings.links?.length) {
            settings.links.forEach(({ url, name }) => {
                const link = Object.assign(document.createElement('a'), {
                    href: url,
                    textContent: name,
                    target: '_blank',
                    className: 'api-link'
                });
                apiLinksContainer.appendChild(link);
            });
        }

        // Create API content
        const apiContent = document.getElementById('apiContent');
        settings.categories.forEach((category) => {
            const sortedItems = category.items.sort((a, b) => a.name.localeCompare(b.name));
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-section';
            
            const categoryHeader = document.createElement('h3');
            categoryHeader.className = 'category-header';
            categoryHeader.textContent = category.name;
            categoryElement.appendChild(categoryHeader);
            
            const itemsRow = document.createElement('div');
            itemsRow.className = 'row';
            
            sortedItems.forEach((item, index) => {
                const itemCol = document.createElement('div');
                itemCol.className = 'col-md-6 col-lg-4 api-item';
                itemCol.dataset.name = item.name;
                itemCol.dataset.desc = item.desc;
                
                const heroSection = document.createElement('div');
                heroSection.className = 'hero-section';
                
                const infoDiv = document.createElement('div');
                
                const itemTitle = document.createElement('h5');
                itemTitle.className = 'mb-0';
                itemTitle.textContent = item.name;
                
                const itemDesc = document.createElement('p');
                itemDesc.className = 'text-muted mb-0';
                itemDesc.textContent = item.desc;
                
                infoDiv.appendChild(itemTitle);
                infoDiv.appendChild(itemDesc);
                
                const getBtn = document.createElement('button');
                getBtn.className = 'btn get-api-btn';
                getBtn.textContent = 'GET';
                getBtn.dataset.apiPath = item.path;
                getBtn.dataset.apiName = item.name;
                getBtn.dataset.apiDesc = item.desc;
                
                heroSection.appendChild(infoDiv);
                heroSection.appendChild(getBtn);
                
                itemCol.appendChild(heroSection);
                itemsRow.appendChild(itemCol);
            });
            
            categoryElement.appendChild(itemsRow);
            apiContent.appendChild(categoryElement);
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const apiItems = document.querySelectorAll('.api-item');
            const categoryHeaders = document.querySelectorAll('.category-header');

            apiItems.forEach(item => {
                const name = item.getAttribute('data-name').toLowerCase();
                const desc = item.getAttribute('data-desc').toLowerCase();
                item.style.display = (name.includes(searchTerm) || desc.includes(searchTerm)) ? '' : 'none';
            });

            categoryHeaders.forEach(header => {
                const categorySection = header.closest('.category-section');
                const categoryRow = categorySection.querySelector('.row');
                const visibleItems = categoryRow.querySelectorAll('.api-item:not([style*="display: none"])');
                categorySection.style.display = visibleItems.length ? '' : 'none';
            });
        });

        // API Button click handler
        document.addEventListener('click', event => {
            if (!event.target.classList.contains('get-api-btn')) return;

            const { apiPath, apiName, apiDesc } = event.target.dataset;
            const modal = new bootstrap.Modal(document.getElementById('apiResponseModal'));
            const modalRefs = {
                label: document.getElementById('apiResponseModalLabel'),
                desc: document.getElementById('apiResponseModalDesc'),
                content: document.getElementById('apiResponseContent'),
                endpoint: document.getElementById('apiEndpoint'),
                spinner: document.getElementById('apiResponseLoading'),
                queryInputContainer: document.getElementById('apiQueryInputContainer'),
                submitBtn: document.getElementById('submitQueryBtn')
            };

            // Reset modal
            modalRefs.label.textContent = apiName;
            modalRefs.desc.textContent = apiDesc;
            modalRefs.content.textContent = '';
            modalRefs.endpoint.textContent = '';
            modalRefs.spinner.classList.add('d-none');
            modalRefs.content.classList.add('d-none');
            modalRefs.endpoint.classList.add('d-none');

            modalRefs.queryInputContainer.innerHTML = '';
            modalRefs.submitBtn.classList.add('d-none');

            let baseApiUrl = `${window.location.origin}${apiPath}`;
            let params = new URLSearchParams(apiPath.split('?')[1]);
            let hasParams = params.toString().length > 0;

            if (hasParams) {
                // Create input fields for parameters
                const paramContainer = document.createElement('div');
                paramContainer.className = 'param-container';

                const paramsArray = Array.from(params.keys());
                
                paramsArray.forEach((param, index) => {
                    const paramGroup = document.createElement('div');
                    paramGroup.className = index < paramsArray.length - 1 ? 'mb-3' : '';

                    // Create label
                    const label = document.createElement('label');
                    label.className = 'form-label';
                    label.textContent = param;
                    label.htmlFor = `param-${param}`;
                    
                    // Create input
                    const inputField = document.createElement('input');
                    inputField.type = 'text';
                    inputField.className = 'form-control';
                    inputField.id = `param-${param}`;
                    inputField.placeholder = `Enter ${param}...`;
                    inputField.dataset.param = param;
                    inputField.required = true;
                    inputField.addEventListener('input', validateInputs);

                    paramGroup.appendChild(label);
                    paramGroup.appendChild(inputField);
                    paramContainer.appendChild(paramGroup);
                });
                
                // Check for inner description
                const currentItem = settings.categories
                    .flatMap(category => category.items)
                    .find(item => item.path === apiPath);

                if (currentItem && currentItem.innerDesc) {
                    const innerDescDiv = document.createElement('div');
                    innerDescDiv.className = 'text-muted mt-3';
                    innerDescDiv.style.fontSize = '13px';
                    innerDescDiv.innerHTML = currentItem.innerDesc.replace(/\n/g, '<br>');
                    paramContainer.appendChild(innerDescDiv);
                }

                modalRefs.queryInputContainer.appendChild(paramContainer);
                modalRefs.submitBtn.classList.remove('d-none');

                // Submit button handler
                modalRefs.submitBtn.onclick = async () => {
                    const inputs = modalRefs.queryInputContainer.querySelectorAll('input');
                    const newParams = new URLSearchParams();
                    let isValid = true;

                    inputs.forEach(input => {
                        if (!input.value.trim()) {
                            isValid = false;
                            input.classList.add('is-invalid');
                        } else {
                            input.classList.remove('is-invalid');
                            newParams.append(input.dataset.param, input.value.trim());
                        }
                    });

                    if (!isValid) {
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'alert alert-danger mt-3';
                        errorMsg.textContent = 'Please fill in all required fields.';
                        
                        // Remove existing error message if any
                        const existingError = modalRefs.queryInputContainer.querySelector('.alert');
                        if (existingError) existingError.remove();
                        
                        modalRefs.queryInputContainer.appendChild(errorMsg);
                        return;
                    }

                    const apiUrlWithParams = `${window.location.origin}${apiPath.split('?')[0]}?${newParams.toString()}`;
                    
                    modalRefs.queryInputContainer.innerHTML = '';
                    modalRefs.submitBtn.classList.add('d-none');
                    handleApiRequest(apiUrlWithParams, modalRefs, apiName);
                };
            } else {
                handleApiRequest(baseApiUrl, modalRefs, apiName);
            }

            modal.show();
        });

        // Input validation
        function validateInputs() {
            const submitBtn = document.getElementById('submitQueryBtn');
            const inputs = document.querySelectorAll('.param-container input');
            const isValid = Array.from(inputs).every(input => input.value.trim() !== '');
            submitBtn.disabled = !isValid;
        }

        // Handle API request
        async function handleApiRequest(apiUrl, modalRefs, apiName) {
            modalRefs.spinner.classList.remove('d-none');
            modalRefs.content.classList.add('d-none');

            try {
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.startsWith('image/')) {
                    // Handle image response
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);

                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = apiName;
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '10px';
                    img.style.boxShadow = 'var(--shadow)';

                    modalRefs.content.innerHTML = '';
                    modalRefs.content.appendChild(img);
                } else {
                    // Handle JSON response
                    const data = await response.json();
                    
                    // Pretty-print JSON with syntax highlighting
                    const formattedJson = syntaxHighlight(JSON.stringify(data, null, 2));
                    modalRefs.content.innerHTML = formattedJson;
                }

                modalRefs.endpoint.textContent = apiUrl;
                modalRefs.endpoint.classList.remove('d-none');
            } catch (error) {
                modalRefs.content.textContent = `Error: ${error.message}`;
                modalRefs.content.classList.add('error-message');
            } finally {
                modalRefs.spinner.classList.add('d-none');
                modalRefs.content.classList.remove('d-none');
            }
        }
        
        // JSON syntax highlighting
        function syntaxHighlight(json) {
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    } finally {
        // Add animation to loading screen disappearance
        setTimeout(() => {
            loadingScreen.style.opacity = 0;
            loadingScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                loadingScreen.style.display = "none";
                body.classList.remove("no-scroll");
            }, 500);
        }, 1500);
    }
});

// Scroll event for navbar
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const navbarBrand = document.querySelector('.navbar-brand');
    
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
        navbarBrand.classList.add('visible');
    } else {
        navbar.classList.remove('scrolled');
        navbarBrand.classList.remove('visible');
    }
});