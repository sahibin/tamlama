// Ana değişkenler ve ayarlar
let sentences = [];
let currentSentenceIndex = 0;

const tamlamaTurleri = [
    "Belirtili İsim Tamlaması",
    "Belirtisiz İsim Tamlaması",
    "Zincirleme İsim Tamlaması"
];

// Sayfa yüklenince çalışacak temel fonksiyonlar
document.addEventListener('DOMContentLoaded', () => {
    loadSentences();
    setupEventListeners();
    setupBoxesWithClear();
});

// Temel event listener'ları ayarla
function setupEventListeners() {
    document.getElementById('addButton').addEventListener('click', () => openAddModal());
    document.getElementById('editButton').addEventListener('click', () => editCurrentSentence());
    document.getElementById('prevButton').addEventListener('click', () => navigateSentences('prev'));
    document.getElementById('nextButton').addEventListener('click', () => navigateSentences('next'));
    document.getElementById('exportButton').addEventListener('click', handleExport);
    document.getElementById('importButton').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', handleImport);
    document.getElementById('deleteButton').addEventListener('click', handleDelete);
    document.getElementById('addTamlamaButton').addEventListener('click', addNewTamlamaGroup);
    document.getElementById('saveTamlama').addEventListener('click', saveTamlama);
    document.getElementById('cancelTamlama').addEventListener('click', closeAddModal);
}

// Kutuları temizleme butonlarıyla ayarla
function setupBoxesWithClear() {
    const boxes = document.querySelectorAll('.element-content');
    boxes.forEach(box => {
        // Önce eski butonları temizle
        const oldButton = box.parentElement.querySelector('.clear-box-button');
        if (oldButton) {
            oldButton.remove();
        }

        const clearButton = document.createElement('button');
        clearButton.className = 'clear-box-button';
        clearButton.innerHTML = '✕ Tümünü Temizle';
        clearButton.onclick = () => clearBox(box);
        
        const boxContainer = box.parentElement;
        boxContainer.appendChild(clearButton);
    });
}

// Sentences.json dosyasını yükle
async function loadSentences() {
    try {
        const response = await fetch('sentences.json');
        if (!response.ok) throw new Error('Dosya yüklenemedi');
        
        const data = await response.json();
        if (data && data.sentences && Array.isArray(data.sentences)) {
            sentences = data.sentences.map(sentence => {
                if (sentence.tamlamalar) {
                    sentence.tamlamalar = sentence.tamlamalar.map(tamlama => {
                        if (tamlama.tur === "Takısız İsim Tamlaması") {
                            tamlama.tur = "Zincirleme İsim Tamlaması";
                        }
                        return tamlama;
                    });
                }
                return sentence;
            });
            currentSentenceIndex = 0;
            showCurrentSentence();
        }
    } catch (error) {
        console.error('Cümleler yüklenirken hata:', error);
        showPopup('Cümleler yüklenirken bir hata oluştu!');
    }
}

// Cümleleri göster
function showCurrentSentence() {
    if (!sentences || sentences.length === 0) return;
    
    const sentence = sentences[currentSentenceIndex];
    const container = document.getElementById('currentSentence');
    
    // Önce mevcut içeriği temizle
    container.innerHTML = '';
    clearElementBoxes();
    
    if (sentence && sentence.text) {
        const words = sentence.text.split(' ');
        words.forEach((word, index) => {
            setTimeout(() => {
                const wordEl = document.createElement('span');
                wordEl.className = 'word';
                wordEl.draggable = true;
                wordEl.textContent = word;
                
                wordEl.addEventListener('dragstart', handleDragStart);
                wordEl.addEventListener('touchstart', handleTouchStart);
                wordEl.addEventListener('touchmove', handleTouchMove);
                wordEl.addEventListener('touchend', handleTouchEnd);
                
                container.appendChild(wordEl);
            }, index * 50);
        });
    }

    updateNavigation();
}
// Kelime işlemleri ve UI kontrolleri
function addWordToBox(text, box) {
    if (!text || !box) return;

    // Kelime zaten ekli mi kontrol et
    const existingWords = Array.from(box.querySelectorAll('.word-text'))
        .map(el => el.textContent.trim());
    
    if (existingWords.includes(text)) {
        showPopup('Bu kelime zaten eklenmiş!');
        return;
    }
    
    const wordContainer = document.createElement('div');
    wordContainer.className = 'word-in-box';
    
    const wordText = document.createElement('span');
    wordText.className = 'word-text';
    wordText.textContent = text;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Kelimeyi Kaldır';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        wordContainer.style.opacity = '0';
        wordContainer.style.transform = 'translateX(-10px)';
        setTimeout(() => {
            wordContainer.remove();
            checkTamlama();
        }, 300);
    };
    
    // Kelimeye tıklanabilirlik ekle
    wordContainer.onclick = (e) => {
        if (!e.target.classList.contains('delete-button')) {
            wordContainer.style.opacity = '0';
            wordContainer.style.transform = 'translateX(-10px)';
            setTimeout(() => {
                wordContainer.remove();
                checkTamlama();
            }, 300);
        }
    };
    
    wordContainer.appendChild(wordText);
    wordContainer.appendChild(deleteBtn);
    
    wordContainer.style.opacity = '0';
    wordContainer.style.transform = 'translateX(-10px)';
    box.appendChild(wordContainer);
    
    setTimeout(() => {
        wordContainer.style.transition = 'all 0.3s ease';
        wordContainer.style.opacity = '1';
        wordContainer.style.transform = 'translateX(0)';
    }, 10);
    
    checkTamlama();
}

// Kutu temizleme işlemleri
function clearBox(box) {
    const words = box.querySelectorAll('.word-in-box');
    words.forEach(word => {
        word.style.opacity = '0';
        word.style.transform = 'translateX(-10px)';
        setTimeout(() => {
            word.remove();
            checkTamlama();
        }, 300);
    });
}

function clearElementBoxes() {
    const boxes = document.querySelectorAll('.element-content');
    boxes.forEach(box => {
        box.innerHTML = '';
        box.addEventListener('dragover', handleDragOver);
        box.addEventListener('drop', handleDrop);
    });
}

// Navigasyon işlemleri
function updateNavigation() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    
    if (prevButton && nextButton) {
        prevButton.disabled = currentSentenceIndex === 0;
        nextButton.disabled = currentSentenceIndex === sentences.length - 1;
    }
}

function navigateSentences(direction) {
    if (direction === 'prev' && currentSentenceIndex > 0) {
        currentSentenceIndex--;
        showCurrentSentence();
    } else if (direction === 'next' && currentSentenceIndex < sentences.length - 1) {
        currentSentenceIndex++;
        showCurrentSentence();
    }
}

// Tamlama kontrolü
function checkTamlama() {
    const tamlayanBox = document.querySelector('[data-element="tamlayan"]');
    const tamlananBox = document.querySelector('[data-element="tamlanan"]');
    
    if (!tamlayanBox || !tamlananBox) return;

    const tamlayanWords = Array.from(tamlayanBox.querySelectorAll('.word-text'))
        .map(el => el.textContent.trim())
        .join(' ');
    
    const tamlananWords = Array.from(tamlananBox.querySelectorAll('.word-text'))
        .map(el => el.textContent.trim())
        .join(' ');
    
    if (tamlayanWords && tamlananWords) {
        const currentSentence = sentences[currentSentenceIndex];
        if (currentSentence && currentSentence.tamlamalar) {
            const matchingTamlama = currentSentence.tamlamalar.find(tamlama => {
                const tamlayanMatch = tamlama.tamlayan === tamlayanWords;
                const tamlananMatch = tamlama.tamlanan === tamlananWords;
                return tamlayanMatch && tamlananMatch;
            });
            
            if (matchingTamlama) {
                showPopup("Doğru eşleştirme! Tamlamanın türünü görmek ister misiniz?", true, matchingTamlama);
            }
        }
    }
}

// Popup mesajları gösterme
function showPopup(message, showTurButton = false, tamlama = null) {
    const popup = document.getElementById('popup');
    const content = popup.querySelector('.popup-content');
    content.innerHTML = message;
    
    if (showTurButton && tamlama) {
        const turButton = document.createElement('button');
        turButton.className = 'button';
        turButton.style.marginTop = '0.5rem';
        turButton.style.width = '100%';
        turButton.textContent = 'Türünü Göster';
        turButton.onclick = () => {
            content.innerHTML = `Tamlama Türü: ${tamlama.tur}`;
        };
        content.appendChild(turButton);
    }
    
    popup.style.display = 'block';
    
    if (!showTurButton) {
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    }
}
// Sürükle-bırak işlemleri
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.textContent);
    e.target.style.opacity = '0.7';
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.background = '#f0fff4';
}

function handleDrop(e) {
    e.preventDefault();
    const word = e.dataTransfer.getData('text/plain');
    const box = e.target.closest('.element-content');
    if (!box) return;

    addWordToBox(word, box);
    e.currentTarget.style.background = '#f7fafc';
}

// Dokunmatik cihaz işlemleri
function handleTouchStart(e) {
    const touch = e.touches[0];
    const word = e.target;
    
    if (word.classList.contains('dragging')) return;
    
    e.preventDefault();
    word.style.opacity = '0.7';
    word.classList.add('dragging');
    word.style.zIndex = '1000';
    
    const rect = word.getBoundingClientRect();
    word.dataset.initialX = rect.left;
    word.dataset.initialY = rect.top;
    word.dataset.touchX = touch.clientX;
    word.dataset.touchY = touch.clientY;
    
    const ghost = word.cloneNode(true);
    ghost.id = 'ghost-element';
    ghost.style.position = 'fixed';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.opacity = '0.5';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '1001';
    document.body.appendChild(ghost);

    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

function handleTouchMove(e) {
    const word = e.target;
    if (!word.classList.contains('dragging')) return;
    
    const touch = e.touches[0];
    const ghost = document.getElementById('ghost-element');
    if (!ghost) return;
    
    const deltaX = touch.clientX - word.dataset.touchX;
    const deltaY = touch.clientY - word.dataset.touchY;
    
    ghost.style.left = `${parseInt(word.dataset.initialX) + deltaX}px`;
    ghost.style.top = `${parseInt(word.dataset.initialY) + deltaY}px`;
    
    const elements = document.querySelectorAll('.element-content');
    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            element.style.background = '#f0fff4';
        } else {
            element.style.background = '#f7fafc';
        }
    });
}

function handleTouchEnd(e) {
    const word = e.target;
    if (!word.classList.contains('dragging')) return;
    
    const ghost = document.getElementById('ghost-element');
    if (ghost) ghost.remove();
    
    const touch = e.changedTouches[0];
    const elements = document.querySelectorAll('.element-content');
    let dropped = false;
    
    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            addWordToBox(word.textContent, element);
            dropped = true;
        }
        element.style.background = '#f7fafc';
    });
    
    word.style.opacity = '';
    word.classList.remove('dragging');
    word.style.zIndex = '';
}

// Modal işlemleri
function openAddModal(sentence = null) {
    const modal = document.getElementById('addModal');
    const container = document.getElementById('tamlamaContainer');
    const sentenceInput = document.getElementById('sentenceInput');
    
    container.innerHTML = '';
    sentenceInput.value = '';

    if (sentence) {
        modal.dataset.editing = 'true';
        sentenceInput.value = sentence.text;
        
        if (sentence.tamlamalar && sentence.tamlamalar.length > 0) {
            sentence.tamlamalar.forEach(tamlama => {
                const group = createTamlamaGroup();
                const tamlayanInput = group.querySelector('input[placeholder="Tamlayan (Birden fazla kelime kullanabilirsiniz)"]');
                const tamlananInput = group.querySelector('input[placeholder="Tamlanan (Birden fazla kelime kullanabilirsiniz)"]');
                const turSelect = group.querySelector('select');
                
                tamlayanInput.value = tamlama.tamlayan;
                tamlananInput.value = tamlama.tamlanan;
                turSelect.value = tamlama.tur;
                container.appendChild(group);
            });
        } else {
            container.appendChild(createTamlamaGroup());
        }
    } else {
        container.appendChild(createTamlamaGroup());
    }

    modal.style.display = 'flex';
    sentenceInput.focus();
}

function addNewTamlamaGroup() {
    const container = document.getElementById('tamlamaContainer');
    const group = createTamlamaGroup();
    container.appendChild(group);
}

function createTamlamaGroup() {
    const group = document.createElement('div');
    group.className = 'tamlama-group';

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-tamlama-button';
    removeButton.innerHTML = '×';
    removeButton.onclick = () => {
        if (document.querySelectorAll('.tamlama-group').length > 1) {
            group.style.opacity = '0';
            setTimeout(() => group.remove(), 300);
        } else {
            showPopup('En az bir tamlama grubu olmalıdır!');
        }
    };

    const tamlayanInput = document.createElement('input');
    tamlayanInput.type = 'text';
    tamlayanInput.className = 'tamlama-input';
    tamlayanInput.placeholder = 'Tamlayan (Birden fazla kelime kullanabilirsiniz)';

    const tamlananInput = document.createElement('input');
    tamlananInput.type = 'text';
    tamlananInput.className = 'tamlama-input';
    tamlananInput.placeholder = 'Tamlanan (Birden fazla kelime kullanabilirsiniz)';

    const tamlamaTuruSelect = document.createElement('select');
    tamlamaTuruSelect.className = 'tamlama-select';
    tamlamaTurleri.forEach(tur => {
        const option = document.createElement('option');
        option.value = tur;
        option.textContent = tur;
        tamlamaTuruSelect.appendChild(option);
    });

    group.appendChild(removeButton);
    group.appendChild(tamlayanInput);
    group.appendChild(tamlananInput);
    group.appendChild(tamlamaTuruSelect);

    return group;
}

function editCurrentSentence() {
    if (sentences[currentSentenceIndex]) {
        openAddModal(sentences[currentSentenceIndex]);
    }
}

function saveTamlama() {
    const sentenceInput = document.getElementById('sentenceInput');
    const text = sentenceInput.value.trim();
    
    if (!text) {
        showPopup('Lütfen bir cümle girin.');
        sentenceInput.focus();
        return;
    }

    const tamlamaGroups = document.querySelectorAll('.tamlama-group');
    const tamlamalar = [];

    for (let group of tamlamaGroups) {
        const tamlayan = group.querySelector('input[placeholder="Tamlayan (Birden fazla kelime kullanabilirsiniz)"]').value.trim();
        const tamlanan = group.querySelector('input[placeholder="Tamlanan (Birden fazla kelime kullanabilirsiniz)"]').value.trim();
        const tur = group.querySelector('select').value;

        if (!tamlayan || !tamlanan) {
            showPopup('Lütfen tüm tamlayan ve tamlanan alanlarını doldurun.');
            return;
        }

        tamlamalar.push({ tamlayan, tamlanan, tur });
    }

    const newSentence = { text, tamlamalar };

    if (document.getElementById('addModal').dataset.editing) {
        sentences[currentSentenceIndex] = newSentence;
        showPopup('Cümle başarıyla güncellendi!');
    } else {
        sentences.push(newSentence);
        currentSentenceIndex = sentences.length - 1;
        showPopup('Yeni cümle başarıyla eklendi!');
    }

    showCurrentSentence();
    closeAddModal();
}

function closeAddModal() {
    const modal = document.getElementById('addModal');
    modal.style.display = 'none';
    delete modal.dataset.editing;
}

// Dosya işlemleri
function handleExport() {
    const data = JSON.stringify({ sentences }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentences.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showPopup('Cümleler başarıyla dışa aktarıldı!');
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data && data.sentences && Array.isArray(data.sentences)) {
                sentences = data.sentences;
                currentSentenceIndex = 0;
                showCurrentSentence();
                showPopup('Cümleler başarıyla içe aktarıldı!');
            } else {
                throw new Error('Geçersiz dosya yapısı');
            }
        } catch (error) {
            showPopup('Geçersiz dosya formatı!');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Silme işlemi
function handleDelete() {
    if (confirm('Bu cümleyi silmek istediğinizden emin misiniz?')) {
        sentences.splice(currentSentenceIndex, 1);
        if (sentences.length === 0) {
            sentences.push({
                text: "Lütfen yeni bir cümle ekleyin",
                tamlamalar: []
            });
        }
        if (currentSentenceIndex >= sentences.length) {
            currentSentenceIndex = sentences.length - 1;
        }
        showCurrentSentence();
        showPopup('Cümle silindi.');
    }
}