document.addEventListener('DOMContentLoaded', () => {
    
    // --- LOAD DATA DARI CONFIG.JS ---
    function loadConfig() {
        if (typeof CONFIG === 'undefined') {
            console.error("config.js tidak ditemukan atau gagal dimuat.");
            return;
        }

        // 1. Pengaturan Umum
        document.getElementById('web-title').innerText = CONFIG.judulWeb;
        document.getElementById('music-source').src = CONFIG.musik;
        document.getElementById('bg-music').load();

        // 2. Puzzle
        document.getElementById('puzzle-title').innerText = CONFIG.teksPuzzleJudul;
        document.getElementById('puzzle-clue').innerText = CONFIG.teksPuzzlePetunjuk;
        document.getElementById('puzzle-preview-img').src = CONFIG.fotoPuzzle;

        // 3. Amplop
        document.getElementById('envelope-text').innerText = CONFIG.teksAmplop;

        // 4. Galeri Polaroid
        for (let i = 0; i < 3; i++) {
            const data = CONFIG.polaroids[i];
            // Karena di DOM kita urutannya 3, 2, 1 (z-index reverse), kita petakan indeks
            // i=0 (polaroids[0]) => id=3 (paling bawah di DOM, paling akhir dilihat)
            // i=1 (polaroids[1]) => id=2 (tengah)
            // i=2 (polaroids[2]) => id=1 (paling atas di DOM, pertama dilihat)
            // Note: In HTML, photo-3 is bottom, photo-1 is top.
            // Let's assume CONFIG.polaroids[0] is for photo-3, polaroids[2] is for photo-1
            let idNum = 3 - i; 
            document.getElementById(`photo-${idNum}`).src = data.foto;
            document.getElementById(`polaroid-text-${idNum}`).innerText = data.caption;
        }

        // 5. Transisi Sinematik
        document.getElementById('gallery-end-text').innerHTML = CONFIG.teksTransisi;

        // 6. Finale
        document.getElementById('finale-title').innerText = CONFIG.judulSurat;
        document.getElementById('finale-text').innerHTML = CONFIG.isiSurat;
        document.getElementById('btn-restart').innerText = CONFIG.teksTombolUlang;
    }
    loadConfig();

    // --- PETALS (KELOPAK BUNGA) GENERATOR ---
    const petalsContainer = document.getElementById('petals-container');
    const totalPetals = 25; // Jumlah kelopak
    
    for (let i = 0; i < totalPetals; i++) {
        createPetal();
    }
    
    function createPetal() {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        
        // Randomize size, position, and animation
        const size = Math.random() * 15 + 10; // 10px to 25px
        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;
        
        petal.style.left = `${Math.random() * 100}vw`;
        
        const duration = Math.random() * 5 + 5; // 5s to 10s
        petal.style.animationDuration = `${duration}s`;
        
        const delay = Math.random() * 5; // 0 to 5s delay
        petal.style.animationDelay = `${delay}s`;
        
        petalsContainer.appendChild(petal);
    }

    // --- AUDIO SETUP ---
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');
    const musicIcon = document.getElementById('music-icon');
    let isMusicPlaying = false;
    let hasUserInteractedWithMusic = false; // Lacak apakah user pernah klik tombol musik

    function toggleMusic(isManualClick = false) {
        if (isManualClick) {
            hasUserInteractedWithMusic = true;
        }
        
        if (isMusicPlaying) {
            bgMusic.pause();
            musicIcon.innerText = '🔇';
        } else {
            bgMusic.play().catch(e => console.log("Autoplay ditahan browser"));
            musicIcon.innerText = '🎵';
        }
        isMusicPlaying = !isMusicPlaying;
    }

    musicBtn.addEventListener('click', () => toggleMusic(true));

    // Auto-play workaround
    document.body.addEventListener('click', () => {
        if (!isMusicPlaying && !hasUserInteractedWithMusic) {
            toggleMusic();
            hasUserInteractedWithMusic = true; // Anggap sebagai interaksi pertama
        }
    }, { once: true });


    // --- NAVIGATION LOGIC ---
    function switchScene(targetId) {
        document.querySelectorAll('.scene').forEach(scene => {
            scene.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');
        window.scrollTo(0,0);
        
        // Trigger Typewriter jika masuk ke scene-prolog
        if(targetId === 'scene-prolog') {
            playTypewriterSequence();
        }
    }

    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            
            switchScene(targetId);
        });
    });

    // --- PUZZLE DRAG & DROP LOGIC ---
    const dropBoard = document.getElementById('drop-board');
    const piecesTray = document.getElementById('pieces-tray');
    const puzzleSuccessOverlay = document.getElementById('puzzle-success-overlay');
    
    const gridSize = 3;
    const totalPieces = gridSize * gridSize;
    let lockedCount = 0;
    
    // Inisialisasi Puzzle
    function initPuzzle() {
        piecesTray.innerHTML = '';
        puzzleSuccessOverlay.classList.add('hidden');
        puzzleSuccessOverlay.classList.remove('show');
        lockedCount = 0;
        
        // Reset elemen dari fade-out (jika di-restart)
        const textLayer = document.querySelector('#scene-password .text-layer');
        const puzzlePreview = document.querySelector('.puzzle-preview');
        if(textLayer) textLayer.classList.remove('fade-out');
        piecesTray.classList.remove('fade-out');
        if(puzzlePreview) puzzlePreview.classList.remove('fade-out');
        
        // Reset style papan
        dropBoard.style.border = '2px dashed #d4a373';
        dropBoard.style.background = 'rgba(212, 163, 115, 0.4)';
        
        // Buat array urutan dan acak
        let pieces = Array.from({length: totalPieces}, (_, i) => i);
        pieces.sort(() => Math.random() - 0.5);
        
        pieces.forEach(pieceId => {
            const piece = document.createElement('div');
            piece.classList.add('dnd-piece');
            piece.dataset.id = pieceId;
            
            // Set background dynamically dari CONFIG
            const row = Math.floor(pieceId / gridSize);
            const col = pieceId % gridSize;
            piece.style.backgroundImage = `url('${CONFIG.fotoPuzzle}')`;
            piece.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
            
            // Tambahkan event listener untuk drag
            setupDragEvents(piece);
            
            piecesTray.appendChild(piece);
        });
        
        // Bersihkan slot di board (kalau ada sisa dari game sebelumnya)
        document.querySelectorAll('.drop-slot').forEach(slot => {
            slot.innerHTML = '';
        });
    }
    
    function setupDragEvents(piece) {
        let isDragging = false;
        let startX, startY;
        
        // Mouse Events
        piece.addEventListener('mousedown', dragStart);
        // Touch Events
        piece.addEventListener('touchstart', dragStart, {passive: false});
        
        function dragStart(e) {
            if(piece.classList.contains('locked')) return;
            
            // Mulai musik otomatis saat dia mulai main puzzle (HANYA JIKA user belum pernah pause manual)
            if (!isMusicPlaying && !hasUserInteractedWithMusic) {
                toggleMusic();
                hasUserInteractedWithMusic = true; // Tandai agar tidak memicu berulang kali
            }
            
            isDragging = true;
            piece.classList.add('dragging');
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const rect = piece.getBoundingClientRect();
            // Simpan offset kursor terhadap kepingan
            startX = clientX - rect.left;
            startY = clientY - rect.top;
            
            // Pindahkan piece ke body untuk absolute positioning yang bebas
            piece.style.width = rect.width + 'px';
            piece.style.height = rect.height + 'px';
            piece.style.position = 'fixed';
            piece.style.left = rect.left + 'px';
            piece.style.top = rect.top + 'px';
            
            document.body.appendChild(piece);
            
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchmove', dragMove, {passive: false});
            document.addEventListener('touchend', dragEnd);
            
            // Mencegah scroll saat drag di HP
            if(e.touches && e.cancelable) e.preventDefault(); 
        }
        
        function dragMove(e) {
            if (!isDragging) return;
            if(e.touches && e.cancelable) e.preventDefault();
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            piece.style.left = (clientX - startX) + 'px';
            piece.style.top = (clientY - startY) + 'px';
        }
        
        function dragEnd(e) {
            if (!isDragging) return;
            isDragging = false;
            piece.classList.remove('dragging');
            
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('touchend', dragEnd);
            
            checkDrop(piece);
        }
    }
    
    function checkDrop(piece) {
        const pieceId = piece.dataset.id;
        const targetSlot = document.querySelector(`.drop-slot[data-slot="${pieceId}"]`);
        
        if (targetSlot) {
            const pieceRect = piece.getBoundingClientRect();
            const slotRect = targetSlot.getBoundingClientRect();
            
            // Cek apakah pusat kepingan berada di dalam slot target (atau lumayan dekat)
            const pieceCenterX = pieceRect.left + pieceRect.width / 2;
            const pieceCenterY = pieceRect.top + pieceRect.height / 2;
            
            // Berikan sedikit toleransi jarak agar lebih mudah
            const tolerance = 20; 
            const isInside = (
                pieceCenterX > slotRect.left - tolerance &&
                pieceCenterX < slotRect.right + tolerance &&
                pieceCenterY > slotRect.top - tolerance &&
                pieceCenterY < slotRect.bottom + tolerance
            );
            
            if (isInside) {
                // KUNCI KEPINGAN!
                piece.style.position = 'relative';
                piece.style.left = '0';
                piece.style.top = '0';
                piece.style.width = '100%';
                piece.style.height = '100%';
                piece.classList.add('locked');
                
                targetSlot.appendChild(piece);
                lockedCount++;
                
                checkWinCondition();
                return;
            }
        }
        
        // JIKA SALAH, KEMBALIKAN KE NAMPAN
        piece.style.position = 'relative';
        piece.style.left = '0';
        piece.style.top = '0';
        piecesTray.appendChild(piece);
    }
    
    function checkWinCondition() {
        if (lockedCount === totalPieces) {
            // 1. Jeda lebih lama agar pemain puas melihat foto utuhnya (1.5 detik)
            setTimeout(() => {
                
                // 2. Pudar-hilangkan elemen UI di sekitarnya
                const textLayer = document.querySelector('#scene-password .text-layer');
                const puzzlePreview = document.querySelector('.puzzle-preview');
                
                if(textLayer) textLayer.classList.add('fade-out');
                piecesTray.classList.add('fade-out');
                if(puzzlePreview) puzzlePreview.classList.add('fade-out');
                
                dropBoard.style.border = 'none';
                dropBoard.style.background = 'transparent';
                
                // 3. Setelah memudar (1 detik), munculkan Overlay Hati
                setTimeout(() => {
                    puzzleSuccessOverlay.classList.remove('hidden');
                    
                    setTimeout(() => {
                        puzzleSuccessOverlay.classList.add('show');
                    }, 50);
                    
                    // 4. Setelah Hati muncul dan berdetak lebih lama (2.5 detik), pindah ke Prolog
                    setTimeout(() => {
                        switchScene('scene-prolog');
                        
                        // Bersihkan overlay Hati agar tidak menghalangi jika di-restart
                        puzzleSuccessOverlay.classList.remove('show');
                        setTimeout(() => {
                            puzzleSuccessOverlay.classList.add('hidden');
                        }, 1500);
                    }, 2500);
                    
                }, 1000);
                
            }, 1500); // Ditingkatkan dari 600ms menjadi 1500ms
        }
    }
    
    // --- EFEK KETIKAN PROLOG (TYPEWRITER) ---
    async function playTypewriterSequence() {
        const textElement = document.getElementById('typewriter-text');
        const container = document.querySelector('.typewriter-container');
        
        // Sembunyikan klimaks dan kembalikan container jika sedang me-restart
        container.style.display = 'flex';
        container.style.opacity = 1;
        textElement.innerHTML = '';
        
        const sentences = CONFIG.kalimatProlog;
        
        for (let i = 0; i < sentences.length; i++) {
            // Ketik kalimat
            await typeText(textElement, sentences[i], 65); // 65ms per huruf
            
            if(i < sentences.length - 1) {
                // Jeda setelah selesai ngetik agar bisa dibaca
                await sleep(2000); 
                
                // Fade out teks
                container.style.opacity = 0;
                
                // Tunggu fade out selesai
                await sleep(1000);
                
                // Kosongkan teks dan kembalikan opacity untuk kalimat berikutnya
                textElement.innerHTML = '';
                container.style.opacity = 1;
                await sleep(500); // jeda sebelum ngetik kalimat baru
            } else {
                // Kalimat terakhir selesai diketik
                await sleep(3500); // Diamkan 3.5 detik agar dibaca dan meresap
                
                // Teks memudar secara perlahan
                container.style.transition = 'opacity 1.5s ease';
                container.style.opacity = 0;
                
                await sleep(1500); // Tunggu sampai teks benar-benar hilang (gelap/bersih)
                
                // Setelah layar bersih, pindah secara otomatis memunculkan amplop kenangan
                switchScene('scene-envelope');
            }
        }
    }
    
    function typeText(element, text, speed) {
        return new Promise(resolve => {
            element.innerHTML = '';
            let i = 0;
            function type() {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            }
            type();
        });
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Panggil saat load
    initPuzzle();


    // --- POLAROID GALLERY LOGIC (SWIPE STACK) ---
    const polaroidWrapper = document.getElementById('polaroid-wrapper');
    const cards = Array.from(document.querySelectorAll('.polaroid-card'));
    const btnToSpotify = document.getElementById('btn-to-spotify');
    
    let stackedCards = [...cards]; 
    let currentCard = stackedCards[stackedCards.length - 1];
    
    let isDraggingStack = false;
    let stackStartX = 0, stackStartY = 0;
    
    function initSwipeStack() {
        if(stackedCards.length === 0) return;
        currentCard = stackedCards[stackedCards.length - 1];
        
        // Remove listeners if exist to prevent duplicate
        currentCard.removeEventListener('mousedown', startDragStack);
        currentCard.removeEventListener('touchstart', startDragStack);
        
        // Add new listeners
        currentCard.addEventListener('mousedown', startDragStack);
        currentCard.addEventListener('touchstart', startDragStack, {passive: false});
    }
    
    function startDragStack(e) {
        if(e.touches && e.cancelable) e.preventDefault();
        
        isDraggingStack = true;
        currentCard.classList.add('dragging');
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        stackStartX = clientX;
        stackStartY = clientY;
        
        document.addEventListener('mousemove', dragMoveStack);
        document.addEventListener('mouseup', dragEndStack);
        document.addEventListener('touchmove', dragMoveStack, {passive: false});
        document.addEventListener('touchend', dragEndStack);
    }
    
    function dragMoveStack(e) {
        if (!isDraggingStack) return;
        if(e.touches && e.cancelable) e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - stackStartX;
        const deltaY = clientY - stackStartY;
        
        // Putar sedikit seiring gesekan
        const rotate = deltaX * 0.05;
        
        currentCard.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
    }
    
    function dragEndStack(e) {
        if (!isDraggingStack) return;
        isDraggingStack = false;
        currentCard.classList.remove('dragging');
        
        document.removeEventListener('mousemove', dragMoveStack);
        document.removeEventListener('mouseup', dragEndStack);
        document.removeEventListener('touchmove', dragMoveStack);
        document.removeEventListener('touchend', dragEndStack);
        
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const deltaX = clientX - stackStartX;
        
        // Jika digeser cukup jauh (lebih dari 80px)
        if (Math.abs(deltaX) > 80) {
            // Buang kartu
            if (deltaX > 0) {
                currentCard.classList.add('fly-out-right');
            } else {
                currentCard.classList.add('fly-out-left');
            }
            
            currentCard.removeEventListener('mousedown', startDragStack);
            currentCard.removeEventListener('touchstart', startDragStack);
            
            stackedCards.pop();
            
            if (stackedCards.length === 0) {
                // Momen Sinematik ketika semua kartu habis
                
                // 1. Gelapkan background (buat efek dramatis)
                const body = document.body;
                body.style.transition = 'background 2s ease';
                body.style.background = '#1a0000'; // Merah marun sangat gelap hampir hitam
                
                // 2. Munculkan pesan rahasia
                const endMessage = document.getElementById('gallery-end-message');
                if (endMessage) {
                    endMessage.style.opacity = '1';
                }
                
                // 3. Setelah beberapa detik, pindah ke scene-finale otomatis
                setTimeout(() => {
                    // Pudar dulu messagenya
                    if (endMessage) endMessage.style.opacity = '0';
                    
                    setTimeout(() => {
                        
                        switchScene('scene-finale');
                        
                        // Kembalikan background aslinya perlahan
                        setTimeout(() => {
                            body.style.background = '';
                        }, 500);
                        
                    }, 1000); // Waktu pudar teks
                }, 4000); // Waktu baca teks
                
            } else {
                initSwipeStack();
            }
            
        } else {
            // Kembali membal ke tengah
            currentCard.style.transform = '';
        }
    }
    
    initSwipeStack();




    // --- ENVELOPE INTERACTION ---
    const envelopeBtn = document.getElementById('envelope-btn');
    const envelope = document.querySelector('.envelope');
    const envelopeText = document.querySelector('.envelope-text');
    
    if (envelopeBtn) {
        envelopeBtn.addEventListener('click', () => {
            if (envelopeBtn.classList.contains('opening')) return;
            
            // Tandai sedang dibuka agar tidak bisa diklik dua kali
            envelopeBtn.classList.add('opening');
            
            // Buka amplop
            envelope.classList.add('open');
            
            // Pudar teksnya
            if (envelopeText) {
                envelopeText.style.opacity = '0';
            }
            
            // Tunggu animasi terbuka dan terbang selesai (sekitar 2 detik)
            setTimeout(() => {
                switchScene('scene-gallery');
                
                // Pastikan nav buttons di galeri di-update (Dihapus karena pakai swipe stack)
                
                // Reset amplop untuk berjaga-jaga jika di-restart
                setTimeout(() => {
                    envelopeBtn.classList.remove('opening');
                    envelope.classList.remove('open');
                    if (envelopeText) {
                        envelopeText.style.opacity = '1';
                    }
                }, 1000);
            }, 2000);
        });
    }

    // --- TOMBOL ULANG DARI AWAL ---
    document.getElementById('btn-restart').addEventListener('click', () => {
        initPuzzle();
        
        // Reset Polaroid Swipe Stack
        cards.forEach(p => {
            p.classList.remove('fly-out-right', 'fly-out-left');
            p.style.transform = '';
        });
        stackedCards = [...cards];
        
        const endMessage = document.getElementById('gallery-end-message');
        if(endMessage) endMessage.style.opacity = '0';
        document.body.style.background = '';
        
        initSwipeStack();
        
        switchScene('scene-password');
    });

});
