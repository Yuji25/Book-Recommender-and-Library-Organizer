// Initial page load setup - Add this at the start of your script
document.addEventListener('DOMContentLoaded', () => {
    // Hide genre selection on initial load
    const genreSelection = document.querySelector('.genre-selection');
    if (genreSelection) {
        genreSelection.style.display = 'none';
    }
});


// Google Books API Configuration
const API_KEY = 'AIzaSyB8tmpuEAZ33CfBWTwrKS74LgMLBjMUBMk';
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

// DOM Element Selectors
const searchInput = document.getElementById('book-search');
const searchButton = document.querySelector('.search-btn');
const getBooksButton = document.querySelector('.get-books-btn');
const resultsContainer = document.querySelector('.books-grid');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('section');

// Update your navigation toggle code to show/hide genres
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('active-section');
            section.classList.add('hidden');
        });

        // Show selected section
        const targetSection = document.getElementById(item.dataset.target);
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active-section');

        // Handle genre selection visibility
        const genreSelection = document.querySelector('.genre-selection');
        if (genreSelection) {
            genreSelection.style.display = item.dataset.target === 'recommendations' ? 'block' : 'none';
        }
    });
});

// Fetch Books by Genres
async function fetchBooksByGenres(genres) {
    try {
        // Construct genre query
        const genreQueries = genres.map(genre => `subject:"${genre}"`).join('+');
        const response = await fetch(`${BASE_URL}?q=${genreQueries}&key=${API_KEY}&maxResults=40`);
        const data = await response.json();
        
        console.log('Genre API Response:', data);
        
        if (!data.items || data.items.length === 0) {
            resultsContainer.innerHTML = '<p>No books found for selected genres.</p>';
            return;
        }
        
        displayBooks(data.items);
    } catch (error) {
        console.error('Error fetching books:', error);
        resultsContainer.innerHTML = `<p>Error fetching books: ${error.message}</p>`;
    }
}

// Display Books in Grid
function displayBooks(books) {
    resultsContainer.innerHTML = ''; // Clear previous results
    
    books.forEach(book => {
        // Robust thumbnail and title handling
        const thumbnailUrl = book.volumeInfo?.imageLinks?.thumbnail || 
                             book.volumeInfo?.imageLinks?.smallThumbnail;
        const bookTitle = book.volumeInfo.title || 'Untitled Book';
        
        const bookCard = document.createElement('div');
        bookCard.classList.add('book-card');
        
        if (thumbnailUrl) {
            // Book with thumbnail
            bookCard.innerHTML = `
                <img src="${thumbnailUrl}" alt="${bookTitle}" class="book-thumbnail">
            `;
        } else {
            // Book without thumbnail
            bookCard.innerHTML = `
                <div class="book-thumbnail no-image">
                    <span class="book-title-placeholder">${truncateText(bookTitle, 30)}</span>
                </div>
            `;
        }
        
        bookCard.addEventListener('click', () => openBookModal(book));
        resultsContainer.appendChild(bookCard);
    });
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Fetch Books by Search
async function fetchBooksBySearch(query) {
    try {
        const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=40`);
        const data = await response.json();
        
        console.log('Search API Response:', data);
        
        if (!data.items || data.items.length === 0) {
            resultsContainer.innerHTML = '<p>No books found. Try a different search.</p>';
            return;
        }
        
        displayBooks(data.items);
    } catch (error) {
        console.error('Error fetching books:', error);
        resultsContainer.innerHTML = `<p>Error fetching books: ${error.message}</p>`;
    }
}

// (1) Rest of the previous script remains the same

// Open Book Modal
function openBookModal(book) {
    const modalContent = document.querySelector('.modal-content');
    const thumbnailUrl = book.volumeInfo?.imageLinks?.thumbnail || 
                        book.volumeInfo?.imageLinks?.smallThumbnail || 
                        'placeholder-url';
    
    modalContent.innerHTML = `
        <div class="modal-book-details">
            <div class="modal-book-info">
                <h2>${book.volumeInfo.title}</h2>
                <p><strong>Author(s):</strong> ${book.volumeInfo.authors?.join(', ') || 'Unknown'}</p>
                <p><strong>Published:</strong> ${book.volumeInfo.publishedDate || 'N/A'}</p>
                <p><strong>Publisher:</strong> ${book.volumeInfo.publisher || 'N/A'}</p>
                <p><strong>Rating:</strong> ${book.volumeInfo.averageRating || 'No ratings'} / 5</p>
                <p><strong>Genres:</strong> ${book.volumeInfo.categories?.join(', ') || 'N/A'}</p>
                <div class="track-button-container">
                    <button class="track-btn">Track</button>
                    <div class="track-options">
                        <button data-status="reading">Reading</button>
                        <button data-status="completed">Completed</button>
                        <button data-status="favorites">Favorites</button>
                        <button data-status="planToRead">Plan to Read</button>
                        <button data-status="onHold">On Hold</button>
                    </div>
                </div>
            </div>
            <div class="modal-book-image">
                <img src="${thumbnailUrl}" alt="${book.volumeInfo.title}">
            </div>
        </div>
        <div class="modal-synopsis">
            <h3>Synopsis</h3>
            <p>${book.volumeInfo.description || 'No synopsis available.'}</p>
        </div>`;

    // Track button functionality
    const trackBtn = modalContent.querySelector('.track-btn');
    const trackOptions = modalContent.querySelector('.track-options');
    
    trackBtn.addEventListener('click', () => {
        trackOptions.classList.toggle('show');
    });

    // Track options functionality
    trackOptions.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            addBookToLibrary(book, button.dataset.status);
            closeModal();
            showNotification('Book added to ' + button.dataset.status);
        });
    });

    document.getElementById('book-modal').classList.add('show-modal');
}

// Close Modal (sus)
// function closeModal() {
//     document.getElementById('book-modal').classList.remove('show-modal');
// }

// Update the closeModal function
function closeModal(modalElement) {
    if (modalElement && modalElement.classList) {
        modalElement.classList.remove('show-modal');
    }
}

// Update the modal event listeners
document.querySelectorAll('.modal').forEach(modal => {
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });

    // Close when clicking X button
    const closeButton = modal.querySelector('.close-modal');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            closeModal(modal);
        });
    }
});


// Event Listeners
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        fetchBooksBySearch(query);
    }
});

getBooksButton.addEventListener('click', () => {
    const selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedGenres.length > 0) {
        fetchBooksByGenres(selectedGenres);
    }
});

// Close modal when clicking outside
document.getElementById('book-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('book-modal')) {
        closeModal();
    }
});

// Library Management
let libraryData = {
    reading: [],
    completed: [],
    favorites: [],
    planToRead: [],
    onHold: []
};

// Load library data from localStorage
function loadLibraryData() {
    const savedData = localStorage.getItem('libraryBooks');
    if (savedData) {
        libraryData = JSON.parse(savedData);
    }
}

// Save library data to localStorage
function saveLibraryData() {
    localStorage.setItem('libraryBooks', JSON.stringify(libraryData));
}

// Add book to library
function addBookToLibrary(book, status) {
    const bookData = {
        id: book.id,
        title: book.volumeInfo.title,
        thumbnail: book.volumeInfo.imageLinks?.thumbnail || null,
        pagesRead: 0,
        totalPages: book.volumeInfo.pageCount || 0,
        startDate: null,
        endDate: null,
        rating: null,
        status: status
    };

    libraryData[status].push(bookData);
    saveLibraryData();
    renderLibraryTab(status);
}

// Update book progress
function updateBookProgress(bookId, newData) {
    Object.keys(libraryData).forEach(status => {
        const bookIndex = libraryData[status].findIndex(book => book.id === bookId);
        if (bookIndex !== -1) {
            const book = libraryData[status][bookIndex];
            
            // Remove from current status if status changed
            if (newData.status && newData.status !== status) {
                libraryData[status].splice(bookIndex, 1);
                libraryData[newData.status].push({
                    ...book,
                    ...newData
                });
            } else {
                // Update existing book
                libraryData[status][bookIndex] = {
                    ...book,
                    ...newData
                };
            }
            
            saveLibraryData();
            renderLibraryTab(newData.status || status);
        }
    });
}

// Render library tab
function renderLibraryTab(status) {
    const libraryContent = document.querySelector('.library-content');
    const books = libraryData[status];

    let html = '<div class="books-grid">';
    books.forEach(book => {
        html += `
            <div class="book-card" data-book-id="${book.id}">
                ${book.thumbnail 
                    ? `<img src="${book.thumbnail}" alt="${book.title}" class="book-thumbnail">`
                    : `<div class="book-thumbnail no-image"><span>${book.title}</span></div>`
                }
            </div>
        `;
    });
    html += '</div>';

    libraryContent.innerHTML = html;

    // Add click handlers for track changes
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', () => {
            const bookId = card.dataset.bookId;
            openTrackModal(bookId);
        });
    });
}

function openTrackModal(bookId) {
    const modal = document.getElementById('track-modal');
    const book = findBookInLibrary(bookId);
    
    if (book) {
        // Add book title to modal
        const titleElement = modal.querySelector('.track-book-title');
        titleElement.textContent = book.title;
        document.getElementById('book-status').value = book.status;
        document.getElementById('pages-read').value = book.pagesRead;
        document.getElementById('start-date').value = book.startDate || '';
        document.getElementById('end-date').value = book.endDate || '';
        document.getElementById('rating').value = book.rating || '';

        const infoBtn = modal.querySelector('.info-btn');
        infoBtn.onclick = () => {
            showBookInfo(bookId);
        };

        // Show modal
        modal.classList.add('show-modal');

        // Handle save changes
        const saveBtn = modal.querySelector('.save-changes-btn');
        saveBtn.onclick = () => {
            const newData = {
                status: document.getElementById('book-status').value,
                pagesRead: parseInt(document.getElementById('pages-read').value),
                startDate: document.getElementById('start-date').value,
                endDate: document.getElementById('end-date').value,
                rating: parseFloat(document.getElementById('rating').value)
            };
            
            updateBookProgress(bookId, newData);
            closeModal(modal);
        };

        // Handle remove button
        const removeBtn = modal.querySelector('.remove-btn');
        removeBtn.onclick = () => {
            removeFromLibrary(bookId);
            closeModal(modal);
            showNotification('Book removed from library');
        };

        // Handle info button
        
    }
}

// Update the showBookInfo function
async function showBookInfo(bookId) {
    try {
        const response = await fetch(`${BASE_URL}/${bookId}?key=${API_KEY}`);
        const book = await response.json();
        
        const infoModal = document.getElementById('book-info-modal');
        const modalContent = infoModal.querySelector('.modal-content');
        const thumbnailUrl = book.volumeInfo?.imageLinks?.thumbnail || 
                            book.volumeInfo?.imageLinks?.smallThumbnail;
        
        modalContent.innerHTML = `
            <div class="modal-book-details">
                <div class="modal-book-info">
                    <h2>${book.volumeInfo.title}</h2>
                    <p><strong>Author(s):</strong> ${book.volumeInfo.authors?.join(', ') || 'Unknown'}</p>
                    <p><strong>Published:</strong> ${book.volumeInfo.publishedDate || 'N/A'}</p>
                    <p><strong>Publisher:</strong> ${book.volumeInfo.publisher || 'N/A'}</p>
                    <p><strong>Rating:</strong> ${book.volumeInfo.averageRating || 'No ratings'} / 5</p>
                    <p><strong>Genres:</strong> ${book.volumeInfo.categories?.join(', ') || 'N/A'}</p>
                </div>
                <div class="modal-book-image">
                    <img src="${thumbnailUrl}" alt="${book.volumeInfo.title}">
                </div>
            </div>
            <div class="modal-synopsis">
                <h3>Synopsis</h3>
                <p>${book.volumeInfo.description || 'No synopsis available.'}</p>
            </div>`;

        const trackModal = document.getElementById('track-modal');
        closeModal(trackModal);
        infoModal.classList.add('show-modal');
    } catch (error) {
        console.error('Error fetching book info:', error);
        showNotification('Error loading book information');
    }
}

// Helper function to find book in library
function findBookInLibrary(bookId) {
    for (const status in libraryData) {
        const book = libraryData[status].find(b => b.id === bookId);
        if (book) return book;
    }
    return null;
}

// Navigation and tab handling
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Show/hide sections
        document.querySelectorAll('section').forEach(section => {
            section.classList.remove('active-section');
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(item.dataset.target);
        targetSection.style.display = 'block';
        
        // Show results container for search and recommendations
        const resultsContainer = document.querySelector('.results-container');
        resultsContainer.style.display = ['search', 'recommendations'].includes(item.dataset.target) ? 'block' : 'none';
    });
});

// Library tab handling
document.querySelectorAll('.library-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.library-tabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderLibraryTab(tab.dataset.libTab);
    });
});

// Initial load
loadLibraryData();

// Add removeFromLibrary function
function removeFromLibrary(bookId) {
    Object.keys(libraryData).forEach(status => {
        libraryData[status] = libraryData[status].filter(book => book.id !== bookId);
    });
    saveLibraryData();
    renderLibraryTab(document.querySelector('.library-tabs .tab.active').dataset.libTab);
}

// Show notification function
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Initialize library section visibility
document.querySelector('.library-tabs').style.display = 'none';
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const libraryTabs = document.querySelector('.library-tabs');
        libraryTabs.style.display = item.dataset.target === 'library' ? 'flex' : 'none';
    });
});

// Add this at the beginning of your script.js file
function reloadGif() {
    const gifIcon = document.querySelector('.title-icon');
    const currentSrc = gifIcon.src;
    gifIcon.src = '';
    gifIcon.src = currentSrc;
}

// Reload the GIF every 5 seconds
setInterval(reloadGif, 10000);