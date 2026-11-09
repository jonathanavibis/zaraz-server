import Banner from '../models/Banner.js';
import { renderBaseLayout, isHtmlRequest } from '../utils/viewRenderer.js';

export const getAllBanners = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const banners = await Banner.find({}).sort({ createdAt: -1 });

    const wantsHtml = isHtmlRequest(req);

    if (wantsHtml) {
      const cardsHtml = banners.map((b) => {
        const bg = b.image || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80';
        return `
        <div class="card" style="padding: 0; overflow: hidden; position: relative; border-radius: 20px;">
          <div style="height: 220px; background: url('${bg}') center/cover no-repeat; position: relative;">
            <div style="position: absolute; inset: 0; background: linear-gradient(90deg, rgba(7, 12, 20, 0.95) 0%, rgba(7, 12, 20, 0.7) 50%, rgba(7, 12, 20, 0.2) 100%); padding: 2rem; display: flex; flex-direction: column; justify-content: center; max-width: 65%;">
              <span style="font-size: 0.72rem; font-weight: 700; color: var(--emerald-light); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem;">
                ${b.tag || 'Promotional Event'}
              </span>
              <h3 style="font-size: 1.5rem; font-weight: 800; color: #fff; line-height: 1.25; margin-bottom: 0.5rem;">
                ${b.title}
              </h3>
              <p style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 1rem;">
                ${b.subtitle || 'Shop exclusive Daraz-style discount deals on Zaraz.'}
              </p>
              <div>
                <a href="${b.link || '/products'}" class="btn btn-emerald btn-sm">${b.cta || 'Shop Now'} &rarr;</a>
              </div>
            </div>
            <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 0.5rem;">
              <span class="badge-pill badge-official">Active Banner</span>
            </div>
          </div>
        </div>`;
      }).join('');

      const htmlContent = `
        <div class="page-header">
          <div class="page-title">
            <h2>🖼️ Promotional Banners & Sliders Component</h2>
            <p>Hero Carousel Banners & Flash Campaign Graphics (<code>zaraz_db</code>)</p>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <span class="badge-api">GET /banners</span>
            <button onclick="openModal('addBannerModal')" class="btn btn-emerald btn-sm">+ Create New Banner</button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2.5rem;">
          ${cardsHtml.length > 0 ? cardsHtml : '<div class="card" style="text-align: center; padding: 3rem;">No banners currently configured.</div>'}
        </div>

        <!-- Add Banner Modal -->
        <div id="addBannerModal" class="modal-backdrop">
          <div class="modal-box">
            <div class="modal-header">
              <h3>🖼️ Create New Promotional Banner</h3>
              <button onclick="closeModal('addBannerModal')" class="close-btn">&times;</button>
            </div>
            <form id="addBannerForm" onsubmit="handleCreateBanner(event)">
              <div class="form-group">
                <label>Banner Headline Title *</label>
                <input type="text" id="bTitle" required class="form-control" placeholder="e.g. Mega Ramadan Super Saver Sale 2026" />
              </div>
              <div class="form-group">
                <label>Subtitle / Description</label>
                <input type="text" id="bSubtitle" class="form-control" placeholder="e.g. Up to 65% OFF across all flagship tech brands" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Tag / Category</label>
                  <input type="text" id="bTag" class="form-control" placeholder="e.g. Flash Campaign" />
                </div>
                <div class="form-group">
                  <label>CTA Button Text</label>
                  <input type="text" id="bCta" class="form-control" placeholder="e.g. Explore Deals" />
                </div>
              </div>
              <div class="form-group">
                <label>Background Image URL *</label>
                <input type="url" id="bImage" required class="form-control" placeholder="https://images.unsplash.com/..." />
              </div>
              <div class="form-group">
                <label>Destination Link</label>
                <input type="text" id="bLink" class="form-control" placeholder="e.g. /products?flashSale=true" />
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
                <button type="button" onclick="closeModal('addBannerModal')" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-emerald">Publish Banner</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const extraScripts = `
        <script>
          async function handleCreateBanner(e) {
            e.preventDefault();
            const payload = {
              title: document.getElementById('bTitle').value,
              subtitle: document.getElementById('bSubtitle').value,
              tag: document.getElementById('bTag').value,
              cta: document.getElementById('bCta').value,
              image: document.getElementById('bImage').value,
              link: document.getElementById('bLink').value || '/products'
            };

            try {
              const res = await fetch('/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (data.success) {
                showToast('Banner created successfully!');
                closeModal('addBannerModal');
                setTimeout(() => window.location.reload(), 800);
              } else {
                showToast(data.message || 'Failed to create banner', 'error');
              }
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        </script>
      `;

      return res.status(200).send(renderBaseLayout({
        title: 'Banners Component',
        activeNav: 'banners',
        content: htmlContent,
        jsonUrl: '/banners?format=json',
        extraScripts,
      }));
    }

    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message,
    });
  }
};

export const createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Banner added successfully',
      banner,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message,
    });
  }
};
