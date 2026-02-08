function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
}

let guestCount = 1;

function addGuest() {
    guestCount++;
    const container = document.getElementById('guest-cards-container');
    const div = document.createElement('div');
    div.className = 'guest-mini-card';
    div.innerHTML = `
        <h4>Guest ${guestCount} <span class="remove-guest" onclick="this.parentElement.parentElement.remove();">✕</span></h4>
        <input type="text" class="g-name" placeholder="Name">
        <input type="text" class="g-type" placeholder="Room Type" value="Standard-Half Board-Refundable Rate">
        <div class="flex-row">
            <input type="text" class="g-inc" placeholder="Inclusion" value="HalfBoard">
            <input type="text" class="g-pax" placeholder="Pax" value="Adult">
        </div>
        <input type="text" class="g-status" placeholder="Status" value="CONFIRMED">
        <input type="text" class="g-conf" placeholder="Conf No">
    `;
    container.appendChild(div);
}

function generatePDF() {
    // 1. Scroll to top to ensure clean capture environment
    window.scrollTo(0, 0);

    // 2. Create a Printing Overlay (Full Screen White)
    // This isolates the voucher from any scroll weirdness or background content
    const overlay = document.createElement('div');
    overlay.id = 'print-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh'; // Full screen
    overlay.style.backgroundColor = 'white';
    overlay.style.zIndex = '9999999'; // Highest
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'flex-start'; // Align top
    overlay.style.padding = '0'; // No padding
    overlay.style.margin = '0';
    overlay.style.overflow = 'hidden'; // No scrollbars inside overlay

    // 3. Clone and Mount Template
    const template = document.getElementById('base-template');
    const clone = template.cloneNode(true);
    clone.id = 'pdf-render-target';

    // Explicit styles for A4 container inside overlay
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.margin = '0'; // Clean edges
    clone.style.padding = '15mm'; // Internal padding moved here if needed, but let's stick to CSS
    clone.style.boxShadow = 'none';
    clone.style.display = 'block'; // Ensure block

    // Populate Data
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    const setTxt = (sel, val) => { const el = clone.querySelector(sel); if (el) el.textContent = val || ''; };

    setTxt('#tmpl_companyName', getVal('in_companyName'));
    setTxt('#tmpl_companyPhone', getVal('in_companyPhone'));

    const addr1 = getVal('in_companyAddr1');
    const addr2 = getVal('in_companyAddr2');
    const addrEl = clone.querySelector('#tmpl_companyAddr');
    if (addrEl) addrEl.innerHTML = addr1 + "<br>" + addr2;

    setTxt('#tmpl_pnr', getVal('in_pnr'));
    setTxt('#tmpl_issued', formatDate(getVal('in_issued')) + ":38");
    setTxt('#tmpl_refId', getVal('in_refId'));
    setTxt('#tmpl_supConf', getVal('in_supConf'));

    setTxt('#tmpl_hotelName', getVal('in_hotelName'));
    setTxt('#tmpl_hotelAddr', getVal('in_hotelAddr'));
    setTxt('#tmpl_hotelContact', getVal('in_hotelContact'));
    setTxt('#tmpl_hotelCity', getVal('in_hotelCity'));

    const roomEl = clone.querySelector('#tmpl_roomDesc');
    if (roomEl) roomEl.innerHTML = getVal('in_roomDesc').replace(/\|/g, '<br>');

    setTxt('#tmpl_rooms', getVal('in_rooms'));
    setTxt('#tmpl_checkIn', formatDate(getVal('in_checkIn')));
    setTxt('#tmpl_nights', getVal('in_nights'));
    setTxt('#tmpl_checkOut', formatDate(getVal('in_checkOut')));

    // Guests
    const guestList = clone.querySelector('#tmpl_guestList');
    if (guestList) {
        guestList.innerHTML = '';
        const cards = document.querySelectorAll('.guest-mini-card');
        cards.forEach(card => {
            const name = card.querySelector('.g-name').value;
            if (!name) return;
            const type = card.querySelector('.g-type').value;
            const inc = card.querySelector('.g-inc').value;
            const pax = card.querySelector('.g-pax').value;
            const status = card.querySelector('.g-status').value;
            let conf = card.querySelector('.g-conf').value;
            if (!conf) conf = getVal('in_refId');
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${name}</td><td>${type}</td><td>${inc}</td><td>${conf}</td><td>${pax}</td><td>${status}</td>`;
            guestList.appendChild(tr);
        });
    }

    // 4. Append to Overlay, Overlay to Body
    overlay.appendChild(clone);
    document.body.appendChild(overlay);

    // 5. Generate PDF
    const opt = {
        margin: 0,
        filename: 'MyTravelCompany_Voucher.pdf',
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0,
            windowWidth: overlay.offsetWidth, // Match viewport width exactly
            windowHeight: overlay.offsetHeight // Match viewport height
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(clone).save().then(() => {
        // 6. Cleanup
        document.body.removeChild(overlay);
    }).catch(err => {
        console.error(err);
        alert("PDF Generation Failed");
        document.body.removeChild(overlay);
    });
}
