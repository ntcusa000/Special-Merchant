/**
 * 學生會特約店家 - 核心邏輯
 */

// --- 1. 定義與設定 ---
// --- 1. 定義與設定 ---
const CSV_URL = 'data/sheet.csv';
const MAPPING_URL = 'data/mapping.csv';
const IMAGE_BASE_PATH = 'data/images/';

let HERO_DATA = []; // 保存映射與圖片資料以供 Modal 使用

let allPartners = [];
let currentPage = 0;
const ITEMS_PER_PAGE = 6;

// --- 2. 初始化功能 ---

function init() {
    fetchData(); // 先抓取資料
    setupEventListeners();
}

// --- 3. 資料抓取與處理 ---

async function fetchData() {
    const loading = document.getElementById('loading');
    try {
        // 並行取得 sheet.csv 與 mapping.csv（允許 mapping 不存在）
        const [sheetRes, mappingRes] = await Promise.all([
            fetch(CSV_URL),
            fetch(MAPPING_URL).catch(() => null)
        ]);

        if (!sheetRes.ok) throw new Error('無法載入主要資料檔案');

        const sheetText = await sheetRes.text();
        let mappingText = '';
        if (mappingRes && mappingRes.ok) {
            mappingText = await mappingRes.text();
        }

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

    // 2. 解析圖片映射表並生成 HERO_DATA (用於 Modal 顯示圖)
    if (mappingText) {
        const mappingLines = mappingText.split(/\r?\n/).filter(line => line.trim() !== '');
        const mappingRows = mappingLines.slice(1);

        HERO_DATA = mappingRows.map(line => {
            const cols = line.split(',');
            const shopName = cols[0];
            const fileName = (cols[4] || '').trim();

            if (!shopName || !fileName) return null;

            return {
                image: IMAGE_BASE_PATH + fileName,
                title: shopName
            };
        }).filter(item => item !== null);
    } else {
        HERO_DATA = [];
    }

    // 3. 渲染
    renderCurrentPage();
    renderLatestPartners();
}

// --- 4. 渲染店家功能 ---

function renderCurrentPage() {
    const grid = document.getElementById('partners-grid');
    grid.innerHTML = '';

    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = allPartners.slice(start, end);

    pageItems.forEach(partner => {
        const card = document.createElement('div');
        card.className = 'partner-card';
        // 改為開啟 Modal 且傳遞名稱
        // 將名稱編碼，避免 JSON.stringify 中含有引號造成語法錯誤
        const safeName = partner.name.replace(/'/g, "\\'");
        card.setAttribute('onclick', `openModal('${safeName}')`);
        card.innerHTML = `
      <div class="ticket-header">
        <div class="ticket-deal">${partner.dealName}</div>
        <div class="ticket-deal-name">${partner.name}</div>
      </div>
      <div class="ticket-body">
        <div class="info-top">
          <div class="partner-deal-content">${partner.dealContent}</div>
        </div>
        <div class="partner-details">
          <div class="partner-loc">📍 ${partner.address.substring(0, 16)}${partner.address.length > 16 ? '...' : ''}</div>
          <div class="partner-contact">📞 ${partner.contact}</div>
        </div>
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

// --- 5. 互動與導覽 ---

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

// --- Modal 功能 ---

function openModal(partnerName) {
    const partner = allPartners.find(p => p.name === partnerName);
    if (!partner) return;

    // 尋找圖片映射
    const mapping = HERO_DATA.find(h => h.title === partner.name);
    const imgUrl = mapping ? mapping.image : 'web_image/icon.jpg';
    
    // 獲取 DOM 元素
    const modal = document.getElementById('partner-modal');
    const modalImg = document.getElementById('modal-img');
    const modalBadge = document.getElementById('modal-badge');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const modalAddress = document.getElementById('modal-address');
    const modalPhone = document.getElementById('modal-phone');
    const mapBtn = document.getElementById('modal-map-btn');
    const phoneBtn = document.getElementById('modal-phone-btn');

    // 填入資料
    modalImg.src = imgUrl;
    if (mapping) {
        modalImg.classList.add('real-img');
    } else {
        modalImg.classList.remove('real-img');
    }

    modalBadge.textContent = partner.dealName;
    modalTitle.textContent = partner.name;
    modalDesc.textContent = partner.dealContent;
    modalAddress.textContent = partner.address;
    modalPhone.textContent = partner.contact;

    // 設定按鈕連結
    const query = encodeURIComponent(partner.address);
    mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
    
    // 清理電話號碼格式
    const cleanPhone = partner.contact.replace(/[^\d+]/g, '');
    phoneBtn.href = `tel:${cleanPhone}`;

    // 顯示 Modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景捲動
}

function closeModal() {
    const modal = document.getElementById('partner-modal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // 恢復背景捲動
}

// 移除原本的全域的 updateMap 函式，因為改成跳轉/開新地圖
// function updateMap(address) { ... }

// --- 啟動 ---
init();
