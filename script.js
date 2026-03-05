// --- 1. CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyIPMJkkNyixopJDKSmvkWcyfMjkhKAI4to5dC-8ot-cINWLlwXg4pLFmThXEtw-Q/exec";

let allProducts = [];
let currentData = [];

/**
 * Page load hote hi data mangwane ki logic
 */
window.onload = async () => {
    const grid = document.getElementById('productDisplay');
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:30px; color:#f3047c;"></i><p>Loading New Collection...</p></div>';

    // Pehle wala data clear kar rahe hain taki koi confusion na ho
    localStorage.removeItem('myProducts');
    
    // Cloud se ekdum taaza data lao
    await refreshData();
};

/**
 * Google Sheets se Fresh Data Lane Ke Liye
 */
async function refreshData() {
    try {
        // Cache busting: Har baar naya time stamp taki server se naya data aaye
        const fetchUrl = SCRIPT_URL + (SCRIPT_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
        
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Server not responding");
        
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
            // --- MAIN FIX ---
            // Sheet mein naya product last mein hota hai, use top pe lane ke liye reverse()
            allProducts = [...freshProducts].reverse(); 
            currentData = [...allProducts];
            
            // Save in LocalStorage
            localStorage.setItem('myProducts', JSON.stringify(allProducts));
            
            // Render to Screen
            render(allProducts); 
            console.log("Success! Newest Products are on Top.");
        } else {
            render([]);
        }
    } catch (error) {
        console.error("Sync Error:", error);
    }
    updateCartBadge();
}

/**
 * Render Function
 */
function render(data) {
    const grid = document.getElementById('productDisplay');
    if (!grid) return;

    if (!data || data.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;"><h3>Stock Update Ho Raha Hai</h3></div>`;
        return;
    }

    grid.innerHTML = '';
    
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
 * UI Functions
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
    if (type === 'low') sorted.sort((a, b) => a.price - b.price);
    else if (type === 'high') sorted.sort((a, b) => b.price - a.price);
    else sorted = [...allProducts]; // Default is Newest
    render(sorted);
}

function openProduct(id) {
    window.location.href = `details.html?id=${id}`; 
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadgeIndex');
    if (!badge) return;
    let cart = JSON.parse(localStorage.getItem('myCart')) || [];
    badge.innerText = cart.length;
    badge.style.display = cart.length > 0 ? "block" : "none";
}

function addToWishlist(id) { alert("Added to Wishlist! ❤️"); }

window.onfocus = refreshData;