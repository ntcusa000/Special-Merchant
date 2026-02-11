// 簡易錨點定位高亮
const links = document.querySelectorAll('.nav-link');
const setActive = () => {
  const hash = location.hash || '#home';
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
};
window.addEventListener('hashchange', setActive);

/* Google Sheet Data Fetcher */
/* Google Sheet Data Fetcher (JSONP) */
const SHEET_ID = '1NRrs9PXp_1XfSAx3bDxnpII0X_YMWHWBLEl5Kn_qTuM';
const JSONP_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=responseHandler:handleSheetData`;

const partnersGrid = document.getElementById('partners-grid');
const loadingEl = document.getElementById('loading');

// Callback function to handle the JSONP response
window.handleSheetData = function (data) {
  // Clear loading
  if (loadingEl) loadingEl.style.display = 'none';

  if (!data || !data.table || !data.table.rows) {
    if (loadingEl) {
      loadingEl.textContent = '載入失敗，無法讀取資料。';
      loadingEl.style.display = 'block';
    }
    return;
  }

  const rows = data.table.rows;

  // Render Main Grid
  rows.forEach(row => {
    // ... code that builds partner card ...
    const cells = row.c;
    if (!cells || cells.length < 2) return;

    // Helper to get text value from cell (prefer formatted 'f', then value 'v')
    const getText = (index) => {
      if (!cells[index]) return '';
      return cells[index].f || cells[index].v || '';
    };

    const name = getText(0) || '未以此名稱';
    const deal = getText(1) || '詳情請洽店家';
    const address = getText(2) || '';
    const contact = getText(3) || '';

    const card = document.createElement('div');
    card.className = 'partner-card';
    card.innerHTML = `
      <div class="partner-name">${name}</div>
      <div class="partner-deal">${deal}</div>
      <div class="partner-info">
        ${address ? `<div>📍 ${address}</div>` : ''}
        ${contact ? `<div>📞 ${contact}</div>` : ''}
      </div>
      <div style="font-size:12px;color:#999;margin-top:4px;text-align:right">點擊查看地圖 🗺️</div>
    `;

    // Add Click Event to Update Map
    card.style.cursor = 'pointer';
    card.onclick = () => {
      const mapFrame = document.getElementById('google-map');
      if (mapFrame && address) {
        // Update iframe src with new query
        const mapQuery = encodeURIComponent(address); // Just use address directly
        mapFrame.src = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

        // Scroll to map section smoothly
        document.getElementById('partners').scrollIntoView({ behavior: 'smooth' });

        // Optional: Highlight active card
        document.querySelectorAll('.partner-card').forEach(c => c.style.borderColor = '#ddd');
        card.style.borderColor = '#c37b4a'; // Accent color
      } else if (!address) {
        alert('此商家未提供地址，無法定位。');
      }
    };

    partnersGrid.appendChild(card);
  });

  // Render Latest List (Last 3 items)
  const latestList = document.getElementById('latest-partners-list');
  if (latestList) {
    // Get the last 3 rows (or fewer if less than 3 exist)
    // Reverse to show the absolute last one at the top? No, usually list order 
    // User asked for "bottom 3". Let's take last 3 and reverse them so the very newest is top.
    const lastThree = rows.slice(-3).reverse();

    lastThree.forEach(row => {
      const cells = row.c;
      if (!cells || cells.length < 1) return;

      const getText = (index) => {
        if (!cells[index]) return '';
        return cells[index].f || cells[index].v || '';
      };

      const name = getText(0) || '未以此名稱';

      // Date is not in sheet, so we hide it or user "New" text
      // User didn't ask to add date column, so we just show name.

      const li = document.createElement('li');
      li.className = 'latest-item';
      li.innerHTML = `
            <div class="latest-date">NEW</div>
            <div class="latest-link" style="border-bottom:none; font-size:16px;">${name}</div>
        `;
      latestList.appendChild(li);
    });
  }
};

function fetchPartners() {
  // Create a script tag to fetch data via JSONP
  const script = document.createElement('script');
  script.src = JSONP_URL;
  script.onerror = () => {
    if (loadingEl) {
      loadingEl.textContent = '連線失敗，請檢查網路狀態。';
      loadingEl.style.display = 'block';
    }
  };
  document.body.appendChild(script);
}

// Init
fetchPartners();