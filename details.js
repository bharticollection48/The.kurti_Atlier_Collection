// --- 1. CONFIGURATION ---
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbw9rKH_KHDEl-STw0E1CoAL_xdqud4TMb22xccZFsNBN0xHY-pBQOCLYA3D6E8dzfgi/exec";

// URL से Product ID निकालना
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// ग्लोबल वेरिएबल
window.selectedSize = "";

/**
 * डेटा लोड करने का फंक्शन
 */
async function initDetails() {
    console.log("Loading details for ID:", productId);
    
    let allProducts = [];
    const loader = document.getElementById('loader');

    try {
        // 1. Google Sheet से डेटा लाने की कोशिश करें
        // 'no-cache' मोड ब्राउज़र को मजबूर करता है कि वो नया डेटा ही लाए
        const response = await fetch(GOOGLE_SHEET_URL, { cache: "no-store" });
        
        if (!response.ok) throw new Error("Server Response Failed");
        
        const data = await response.json();
        
        // डेटा का सही फॉर्मेट चेक करें
        allProducts = data.products || (Array.isArray(data) ? data : []);
        
        if (allProducts.length > 0) {
            localStorage.setItem('myProducts', JSON.stringify(allProducts));
        }

    } catch (e) {
        console.warn("Internet/Cloud error, checking local storage...");
        // इंटरनेट नहीं है तो पुराने डेटा से काम चलायें
        const cached = localStorage.getItem('myProducts');
        if (cached) {
            allProducts = JSON.parse(cached);
        }
    }

    // 2. प्रोडक्ट ढूँढें
    if (allProducts.length > 0) {
        const product = allProducts.find(p => String(p.id) === String(productId));
        
        if (product) {
            renderProduct(product, allProducts);
            if(loader) loader.style.display = 'none';
        } else {
            showError("Product Not Found! (ID mismatch)");
        }
    } else {
        showError("Network Issue: Could not load data.");
    }
}

/**
 * स्क्रीन पर डेटा दिखाने का फंक्शन
 */
function renderProduct(product, allProducts) {
    // Basic Details
    if(document.getElementById('pName')) document.getElementById('pName').innerText = product.name;
    if(document.getElementById('pPrice')) document.getElementById('pPrice').innerText = '₹' + product.price;
    if(document.getElementById('pCat')) document.getElementById('pCat').innerText = product.category || "General";
    
    // MRP/Discount Logic
    if(document.getElementById('pOld')) {
        const off = 45; 
        const oldPrice = Math.round(product.price / (1 - off/100));
        document.getElementById('pOld').innerText = '₹' + oldPrice;
        document.getElementById('pOff').innerText = off + "% OFF";
    }

    // Image Gallery
    const mainDisplay = document.getElementById('mainDisplay');
    const thumbRow = document.getElementById('thumbRow');
    
    if (mainDisplay && thumbRow) {
        thumbRow.innerHTML = ''; 
        let galleryArray = [];
        
        if(product.mainImg || product.img) galleryArray.push(product.mainImg || product.img);
        
        if (Array.isArray(product.gallery)) {
            galleryArray = [...galleryArray, ...product.gallery];
        } else if (typeof product.gallery === 'string' && product.gallery.trim() !== "") {
            galleryArray = [...galleryArray, ...product.gallery.split(',').map(s => s.trim())];
        }

        const finalGallery = [...new Set(galleryArray)].slice(0, 7);
        mainDisplay.src = finalGallery[0] || 'https://via.placeholder.com/400';

        finalGallery.forEach((img, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumb-card ${index === 0 ? 'active' : ''}`;
            thumb.innerHTML = `<img src="${img}" onerror="this.src='https://via.placeholder.com/100?text=Error'">`;
            thumb.onclick = () => {
                mainDisplay.src = img;
                document.querySelectorAll('.thumb-card').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbRow.appendChild(thumb);
        });
    }

    // Size Selection
    const sizeArea = document.getElementById('sizeArea');
    const sizeOptions = document.getElementById('sizeOptions');
    const cat = (product.category || "").toUpperCase();

    if(sizeArea && (cat.includes('KURTI') || cat.includes('SAREE') || cat.includes('DRESS'))) {
        sizeArea.style.display = 'block';
        sizeOptions.innerHTML = '';
        const sizes = cat.includes('SAREE') ? ["Free Size"] : ["S", "M", "L", "XL", "XXL"];
        
        sizes.forEach(sz => {
            const btn = document.createElement('button');
            btn.className = "btn-size";
            btn.innerText = sz;
            btn.onclick = () => {
                document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.selectedSize = sz;
            };
            sizeOptions.appendChild(btn);
        });
    }
}

/**
 * Error Handling
 */
function showError(msg) {
    document.body.innerHTML = `
        <div style="text-align:center; padding:100px 20px; font-family:sans-serif;">
            <i class="fa-solid fa-wifi" style="font-size:50px; color:#ccc;"></i>
            <h2 style="color:#666; margin-top:20px;">${msg}</h2>
            <p>Kripya internet check karein ya thodi der baad try karein.</p>
            <a href="index.html" style="display:inline-block; margin-top:20px; padding:10px 25px; background:#f3047c; color:white; border-radius:30px; text-decoration:none;">Go Back</a>
        </div>`;
}

window.onload = initDetails;