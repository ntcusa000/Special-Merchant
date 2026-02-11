/**
 * 學生會特約店家 - 核心邏輯
 */

// --- 1. 定義與設定 ---
// --- 1. 定義與設定 ---
const CSV_URL = 'data/sheet.csv';
const MAPPING_URL = 'data/mapping.csv';
const IMAGE_BASE_PATH = 'data/images/';

let HERO_DATA = []; // 將由資料庫動態產生成內容

let allPartners = [];
let currentPage = 0;
const ITEMS_PER_PAGE = 6;
let currentHeroSlide = 0;
let heroInterval; // 儲存自動輪播計時器

// --- 2. 初始化功能 ---

function init() {
    fetchData(); // 先抓取資料，資料內部會呼叫 setupHeroCarousel
    setupEventListeners();
}

// --- 3. Hero 輪播邏輯 ---

function setupHeroCarousel() {
    const container = document.getElementById('hero-slides-container');
    const dotsContainer = document.getElementById('hero-dots');

    // 清除內容
    container.innerHTML = '';
    dotsContainer.innerHTML = '';

    if (HERO_DATA.length === 0) return;

    HERO_DATA.forEach((data, index) => {
        // 建立 Slide
        const slide = document.createElement('div');
        slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
        slide.style.backgroundImage = `url('${data.image}')`;
        container.appendChild(slide);

        // 建立 Dot
        const dot = document.createElement('div');
        dot.className = `hero-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToHeroSlide(index, true); // 手動點擊
        dotsContainer.appendChild(dot);
    });

    updateHeroDisplay();
    startHeroRotation();
}

function startHeroRotation() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        nextHeroSlide(false); // 自動播放，不重設計時器
    }, 3000);
}

function updateHeroDisplay() {
    if (HERO_DATA.length === 0) return;

    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    const title = document.getElementById('hero-title');
    const sub = document.getElementById('hero-sub');

    if (slides.length > 0) {
        slides.forEach((s, i) => s.classList.toggle('active', i === currentHeroSlide));
    }
    if (dots.length > 0) {
        dots.forEach((d, i) => d.classList.toggle('active', i === currentHeroSlide));
    }

    title.textContent = HERO_DATA[currentHeroSlide].title;
    sub.textContent = HERO_DATA[currentHeroSlide].sub;
}

function nextHeroSlide(manual = true) {
    if (HERO_DATA.length === 0) return;
    currentHeroSlide = (currentHeroSlide + 1) % HERO_DATA.length;
    updateHeroDisplay();
    if (manual) startHeroRotation();
}

function prevHeroSlide() {
    if (HERO_DATA.length === 0) return;
    currentHeroSlide = (currentHeroSlide - 1 + HERO_DATA.length) % HERO_DATA.length;
    updateHeroDisplay();
    startHeroRotation();
}

function goToHeroSlide(index, manual = true) {
    if (HERO_DATA.length === 0) return;
    currentHeroSlide = index;
    updateHeroDisplay();
    if (manual) startHeroRotation();
}

// --- 4. 資料抓取與處理 ---

async function fetchData() {
    const loading = document.getElementById('loading');
    try {
        const [sheetRes, mappingRes] = await Promise.all([
            fetch(CSV_URL),
            fetch(MAPPING_URL)
        ]);

        if (!sheetRes.ok || !mappingRes.ok) throw new Error('無法載入資料檔案');

        const sheetText = await sheetRes.text();
        const mappingText = await mappingRes.text();

        processData(sheetText, mappingText);
    } catch (error) {
        console.error('Error fetching data:', error);
        if (loading) loading.textContent = '載入資料失敗，請確認檔案路徑是否正確。';
    }
}

function processData(sheetText, mappingText) {
    // 1. 解析店家資料
    const sheetLines = sheetText.split(/\r?\n/).filter(line => line.trim() !== '');
    const sheetRows = sheetLines.slice(1);
    allPartners = sheetRows.map(line => {
        const columns = line.split(',');
        return {
            name: columns[0] || '',
            dealName: columns[1] || '',
            dealContent: columns[2] || '',
            address: columns[3] || '',
            contact: columns[4] || '',
            category: columns[5] || '精選商家'
        };
    }).filter(p => p.name);

    // 2. 解析圖片映射表並生成 HERO_DATA
    const mappingLines = mappingText.split(/\r?\n/).filter(line => line.trim() !== '');
    const mappingRows = mappingLines.slice(1);

    HERO_DATA = mappingRows.map(line => {
        const cols = line.split(',');
        const shopName = cols[0];
        const fileName = (cols[4] || '').trim();

        if (!shopName || !fileName) return null;

        const partner = allPartners.find(p => p.name === shopName);
        return {
            image: IMAGE_BASE_PATH + fileName,
            title: shopName,
            sub: partner ? partner.dealContent : '專屬學生優惠'
        };
    }).filter(item => item !== null);

    // 3. 渲染
    setupHeroCarousel();
    renderCurrentPage();
    renderLatestPartners();
}

// --- 5. 渲染店家功能 ---

function renderCurrentPage() {
    const grid = document.getElementById('partners-grid');
    grid.innerHTML = '';

    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = allPartners.slice(start, end);

    pageItems.forEach(partner => {
        // 從 HERO_DATA 或原始映射邏輯中找出該商家的圖片
        const mapping = HERO_DATA.find(h => h.title === partner.name);
        const imgUrl = mapping ? mapping.image : 'web_image/icon.jpg'; // 無圖片時使用 Logo 替代

        const card = document.createElement('div');
        card.className = 'partner-card';
        card.setAttribute('onclick', `updateMap('${partner.address}')`);
        card.innerHTML = `
      <div class="ticket-header">
        <div class="ticket-deal">${partner.dealName}</div>
      </div>
      <div class="card-img-container">
        <img src="${imgUrl}" alt="${partner.name}">
      </div>
      <div class="ticket-divider"></div>
      <div class="ticket-body">
        <div class="info-top">
          <div class="partner-name">${partner.name}</div>
          <div class="partner-deal-content">${partner.dealContent}</div>
        </div>
        <div class="partner-details">
          <div class="partner-loc">📍 ${partner.address.substring(0, 16)}${partner.address.length > 16 ? '...' : ''}</div>
          <div class="partner-contact">📞 ${partner.contact}</div>
        </div>
        <div class="ticket-hint">查看地圖 〉</div>
      </div>
    `;
        grid.appendChild(card);
    });

    // 更新按鈕狀態
    document.getElementById('page-prev').style.opacity = currentPage === 0 ? '0.3' : '1';
    document.getElementById('page-next').style.opacity = end >= allPartners.length ? '0.3' : '1';
}

function renderLatestPartners() {
    const list = document.getElementById('latest-list');
    list.innerHTML = '';

    const latest = allPartners.slice(-3).reverse();
    latest.forEach(p => {
        const li = document.createElement('li');
        li.className = 'latest-item';
        li.innerHTML = `
      <div class="item-badge">NEW</div>
      <div class="item-content">${p.name} - ${p.dealName}</div>
    `;
        list.appendChild(li);
    });
}

// --- 6. 互動與導覽 ---

function setupEventListeners() {
    // 手機端選單控制
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
        menuToggle.onclick = () => {
            menuToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
        };
    }

    // Hero 控制
    document.getElementById('hero-prev').onclick = prevHeroSlide;
    document.getElementById('hero-next').onclick = nextHeroSlide;

    // 分頁控制
    document.getElementById('page-prev').onclick = () => {
        if (currentPage > 0) {
            currentPage--;
            renderCurrentPage();
        }
    };
    document.getElementById('page-next').onclick = () => {
        if ((currentPage + 1) * ITEMS_PER_PAGE < allPartners.length) {
            currentPage++;
            renderCurrentPage();
        }
    };

    // 錨點平滑捲動
    document.querySelectorAll('.nav-link').forEach(link => {
        link.onclick = (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();

                // 點擊後關閉手機菜單
                if (menuToggle && mainNav) {
                    menuToggle.classList.remove('active');
                    mainNav.classList.remove('active');
                }

                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    // 更新主動狀態
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        };
    });
}

function updateMap(address) {
    const mapFrame = document.getElementById('google-map');
    const query = encodeURIComponent(address);
    mapFrame.src = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    // 捲動到地圖
    mapFrame.parentElement.scrollIntoView({ behavior: 'smooth' });
}

// --- 啟動 ---
init();
