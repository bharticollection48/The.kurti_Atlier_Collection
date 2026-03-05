// --- 1. CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIPMJkkNyixopJDKSmvkWcyfMjkhKAI4to5dC-8ot-cINWLlwXg4pLFmThXEtw-Q/exec";

let allProducts = [];
let currentData = [];

/**
 * Page load hone par logic
 */
window.onload = async () => {
    const grid = document.getElementById('productDisplay');
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:30px; color:#f3047c;"></i><p>Loading Latest Collection...</p></div>';

    // 1. LocalStorage se data load karein (Taki user ko wait na karna pade)
    const localData = localStorage.getItem('myProducts');
    if (localData) {
        try {
            allProducts = JSON.parse(localData);
            currentData = [...allProducts];
            render(allProducts); 
        } catch(e) { console.error("Cache error"); }
    }
    
    // 2. Refresh fresh data from Cloud
    await refreshData();
};

/**
 * Google Sheets se Fresh Data Fetch karna
 */
async function refreshData() {
    try {
        const fetchUrl = SCRIPT_URL + (SCRIPT_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
        const response = await fetch(fetchUrl);
        const result = await response.json();
        
        let freshProducts = [];

        if (result.products && Array.isArray(result.products)) {
            freshProducts = result.products;
            if(result.settings) {
                localStorage.setItem('ghabaUPI', result.settings.upi);
                localStorage.setItem('adminPassword', result.settings.password);
            }
        } else if (Array.isArray(result)) {
            freshProducts = result;
        }

        if (freshProducts.length > 0) {
            // --- 100% WORKING FIX ---
            // Sheet mein naya product hamesha aakhri row mein hota hai.
            // Hum use yahan 'reverse' kar denge taaki wo hamesha sabse upar dikhe.
            allProducts = [...freshProducts].reverse(); 
            
            currentData = [...allProducts];
            localStorage.setItem('myProducts', JSON.stringify(allProducts));
            render(allProducts); 
            console.log("New products are now at the top!");
        }
    } catch (error) {
        console.error("Sync Error:", error);
    }
    updateCartBadge();
}

/**
 * UI Render Function
 */
function render(data) {
    const grid = document.getElementById('productDisplay');
    if (!grid) return;

    if (!data || data.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;"><h3>No Products Found</h3></div>`;
        return;
    }

    grid.innerHTML = '';
    
    // Yahan hum loop direct chalayenge kyunki refreshData mein hi reverse kar diya hai
    data.forEach(p => {
        const currentPrice = parseFloat(p.price) || 0;
        const originalPrice = Math.round(currentPrice / 0.6); 
        
        let imgPath = p.mainImg || p.img || (p.gallery && p.gallery[0]) || 'https://via.placeholder.com/300?text=No+Image';

        grid.innerHTML += `
            <div class="product-card" onclick="openProduct(${p.id})">
                <div class="img-wrapper">
                    <img src="${imgPath}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=Image+Error'">
                    <div class="wishlist-icon" onclick="event.stopPropagation(); addToWishlist(${p.id})">
                        <i class="fa-regular fa-heart"></i>
                    </div>
                </div>
                <div class="product-info">
                    <p class="product-name">${p.name}</p>
                    <div class="price-container">
                        <span class="main-price">₹${currentPrice}</span>
                        <span class="old-price">₹${originalPrice}</span>
                        <span class="discount-badge">40% OFF</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px;">
                         <span class="rating-pill">4.5 <i class="fa-solid fa-star" style="font-size: 8px;"></i></span>
                        <span style="font-size: 11px; color: #1aab2a; font-weight:bold;">Free Delivery</span>
                    </div>
                </div>
            </div>`;
    });
}

/**
 * Filter & Search
 */
function searchProduct() {
    const val = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allProducts.filter(p => 
        (p.name && p.name.toLowerCase().includes(val)) || 
        (p.category && p.category.toLowerCase().includes(val))
    );
    render(filtered);
}

function filterProducts(categoryName) {
    currentData = (categoryName === 'All') 
        ? [...allProducts] 
        : allProducts.filter(p => p.category === categoryName);
    render(currentData);
}

function sortProducts(type) {
    let sorted = [...currentData];
    if (type === 'low') {
        sorted.sort((a, b) => a.price - b.price);
    } else if (type === 'high') {
        sorted.sort((a, b) => b.price - a.price);
    } else {
        // Default: Newest first
        sorted = [...allProducts];
    }
    render(sorted);
}

function openProduct(id) {
    window.location.href = `details.html?id=${id}`; 
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadgeIndex');
    if (badge) {
        let cart = JSON.parse(localStorage.getItem('myCart')) || [];
        badge.innerText = cart.length;
        badge.style.display = cart.length > 0 ? "block" : "none";
    }
}

function addToWishlist(id) {
    alert("Added to wishlist! ❤️");
}

window.onfocus = refreshData;