import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

// Elementy DOM
const searchForm = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');

// Zmienne pomocnicze
let currentPage = 1;
let totalHitsCount = 0;
let lightboxInstance;

// Stałe
const apiKey = '42569428-b104c6fed739ee1603d22c65f';
const imagesPerPage = 40;

// Funkcja do pobierania danych z serwera
const fetchData = async (query, page) => {
  try {
    const { data } = await axios.get(
      `https://pixabay.com/api/?key=${apiKey}&q=${query}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=${imagesPerPage}`
    );
    return data;
  } catch (error) {
    throw new Error(error);
  }
};

// Funkcja do renderowania obrazków
const renderImages = (data, append = false) => {
  if (data.hits.length === 0) {
    Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    gallery.innerHTML = '';
  } else {
    const markup = data.hits
      .map(
        ({
          webformatURL,
          largeImageURL,
          tags,
          likes,
          views,
          comments,
          downloads,
        }) => `
      <div class="photo-card">
        <a href="${largeImageURL}" class="lightbox">
          <img src="${webformatURL}" alt="${tags}" loading="lazy" />
        </a>
        <div class="info">
          <p class="info-item"><b>Likes:</b> ${likes}</p>
          <p class="info-item"><b>Views:</b> ${views}</p>
          <p class="info-item"><b>Comments:</b> ${comments}</p>
          <p class="info-item"><b>Downloads:</b> ${downloads}</p>
        </div>
      </div>`
      )
      .join('');
    if (append) {
      gallery.innerHTML += markup;
    } else {
      gallery.innerHTML = markup;
    }
    // Inicjalizacja SimpleLightbox
    lightboxInstance = new SimpleLightbox('.lightbox');
    // Przewijanie strony w dół po renderowaniu obrazków
    const { height: cardHeight } =
      gallery.firstElementChild.getBoundingClientRect();
    window.scrollBy({
      top: cardHeight * 2,
      behavior: 'smooth',
    });

    // Sprawdź, czy jest więcej obrazów do pobrania
    if (data.hits.length < imagesPerPage * currentPage) {
      loadMoreBtn.style.display = 'none'; // Jeśli nie ma więcej obrazów, ukryj przycisk "Load More"
    } else {
      loadMoreBtn.style.display = 'block'; // Jeśli są jeszcze obrazy, pokaż przycisk "Load More"
    }
  }
};

// Funkcja do wysyłania informacji o liczbie znalezionych obrazów
const sendImageCountInfo = (count) => {
  const message = count < 500 ? `Sorry, we found only ${count} images.` : `Hooray! We found ${count} images.`;
  Notiflix.Notify.info(message);
};

// Funkcja do wyszukiwania obrazków
const searchImages = async query => {
  try {
    const data = await fetchData(query, currentPage);
    totalHitsCount = data.totalHits;
    renderImages(data);
    if (data.hits.length === 0) {
      loadMoreBtn.style.display = 'none';
    } else {
      sendImageCountInfo(totalHitsCount); // Wyślij informację o liczbie znalezionych obrazów
    }
  } catch (error) {
    Notiflix.Notify.failure(`ERROR: ${error.message}`);
  }
};

// Obsługa zdarzenia przesłania formularza wyszukiwania
searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const query = event.target.searchQuery.value.trim();
  if (query === '') {
    Notiflix.Notify.warning('Please enter a search query!');
    return;
  }
  currentPage = 1;
  searchImages(query);
});

// Obsługa przycisku "Load More"
loadMoreBtn.addEventListener('click', async () => {
  currentPage++;
  try {
    const query = searchForm.searchQuery.value.trim(); // Pobierz aktualną wartość pola wyszukiwania
    const data = await fetchData(query, currentPage);
    renderImages(data, true);
    // Usuń przycisk "Load More", aby uniknąć ponownego pobierania wyników dla starego zapytania
    loadMoreBtn.style.display = 'none';
  } catch (error) {
    Notiflix.Notify.failure(`ERROR: ${error.message}`);
  }
});

// Ukrycie przycisku "Load More" na początku
loadMoreBtn.style.display = 'none';
