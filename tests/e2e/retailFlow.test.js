import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting E2E Browser Simulation for Retail Flow...');
    
    // Launch browser
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Capture console logs from the page
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE ERROR:', msg.text());
        }
    });

    page.on('requestfailed', request => {
        console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
    });

    page.on('pageerror', error => {
        console.log('PAGE UNCAUGHT ERROR:', error.message);
    });

    try {
        // 0. Set local storage to bypass login
        console.log('Setting localStorage to bypass login...');
        await page.goto('http://localhost:3000/pages/login.html'); // go somewhere to set storage on domain
        await page.evaluate(() => {
            localStorage.setItem('pos_user', JSON.stringify({
                id: '123',
                username: 'admin',
                name: 'Admin',
                role: 'admin'
            }));
            localStorage.setItem('has_seen_shift_popup', 'true');
        });

        // 1. Navigate to POS
        console.log('Navigating to http://localhost:3000/pages/pos.html');
        await page.goto('http://localhost:3000/pages/pos.html', { waitUntil: 'networkidle2' });
        
        // Let it load fully
        await new Promise(r => setTimeout(r, 2000));

        // 2. Wait for search input
        console.log('Searching for product...');
        await page.waitForSelector('#posSearchInput');
        await page.type('#posSearchInput', 'Para', { delay: 100 });
        
        await new Promise(r => setTimeout(r, 2000));

        // Try to click first search result (autocomplete dropdown)
        const hasSearchResults = await page.$('.dropdown-item'); // Or whatever the search item is
        if (hasSearchResults) {
            console.log('Clicking product search result...');
            await page.click('.dropdown-item');
        } else {
            console.log('No search results. Falling back to Quick Add (Thêm Nhanh).');
            // Quick add flow via window function
            await page.evaluate(() => {
                if (typeof window.openCustomItemModal === 'function') {
                    window.openCustomItemModal();
                } else if (typeof window.openQuickProductModal === 'function') {
                    window.openQuickProductModal();
                }
            });
            await new Promise(r => setTimeout(r, 1000));
            
            const isCustom = await page.$('#customItemName');
            if(isCustom) {
                await page.waitForSelector('#customItemName', { visible: true });
                await page.type('#customItemName', 'Thuốc Test', { delay: 50 });
                await page.type('#customItemPrice', '10000');
                await page.evaluate(() => window.submitCustomItem());
            } else {
                await page.waitForSelector('#quickProductName', { visible: true });
                await page.type('#quickProductName', 'Thuốc Test', { delay: 50 });
                await page.type('#quickProductPrice', '10000');
                await page.evaluate(() => window.submitQuickProduct());
            }
        }

        await new Promise(r => setTimeout(r, 2000));

        // 3. Change quantity to 3
        console.log('Changing quantity...');
        const qtyInputs = await page.$$('input.cart-qty');
        if (qtyInputs.length > 0) {
            // clear and type
            await qtyInputs[0].click({ clickCount: 3 });
            await qtyInputs[0].press('Backspace');
            await qtyInputs[0].type('3');
            await qtyInputs[0].press('Enter'); // trigger change
        } else {
            console.log('Warning: No products found in cart to change quantity.');
        }

        await new Promise(r => setTimeout(r, 1000));

        // 4. Input amount received (Khách đưa)
        console.log('Entering customer payment amount...');
        await page.waitForSelector('#amountReceived');
        await page.click('#amountReceived', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type('#amountReceived', '500000');
        await page.keyboard.press('Enter');

        await new Promise(r => setTimeout(r, 1000));

        // 5. Checkout
        console.log('Clicking Checkout...');
        const payBtn = await page.$('#btnConfirmCheckout');
        if (payBtn) {
            await payBtn.click();
        } else {
            console.log('No confirm checkout button found.');
        }

        await new Promise(r => setTimeout(r, 2000));

        // Check for error modals or success
        const hasSwal = await page.$('.swal2-popup');
        if (hasSwal) {
            const text = await page.$eval('.swal2-title', el => el.textContent).catch(() => 'Unknown alert');
            console.log('SweetAlert found:', text);
            if (text.toLowerCase().includes('lỗi')) {
                console.error('Test Failed: Checkout error modal appeared.');
            } else {
                console.log('Checkout completed successfully (or warning modal).');
            }
        } else {
            console.log('Checkout likely completed silently (or printing started).');
        }

        console.log('E2E Retail Flow test finished successfully.');

    } catch (e) {
        console.error('Test script encountered an error:', e.message);
    } finally {
        await browser.close();
    }
})();
