import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export async function initBrowser() {
    try {
        console.log('🔌 Đang kết nối tới trình duyệt Chrome thật (Port 9222)...');
        const browser = await puppeteer.connect({
            browserURL: 'http://localhost:9222',
            defaultViewport: null
        });
        console.log('✅ Đã kết nối thành công tới Chrome!');
        return browser;
        return true;
    } catch (error) {
        console.error('❌ Không thể kết nối tới Chrome Port 9222!');
        console.error('👉 Vui lòng nhấp đúp mở file "Mo_Chrome_Zalo_Bot.bat" ngoài Desktop trước!');
        throw error;
    }
}

export async function getZaloPage(browser) {
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('chat.zalo.me'));
    if (!page) {
        page = await browser.newPage();
        await page.goto('https://chat.zalo.me/', { waitUntil: 'domcontentloaded' });
    }
    return page;
}

export async function ensureZaloHealthy(browser) {
    const page = await getZaloPage(browser);
    const hasSearch = await page.evaluate(() => Boolean(document.querySelector('#contact-search-input')));
    if (hasSearch) return { healthy: true, action: 'none' };

    const needsActivation = await page.evaluate(() =>
        document.body?.innerText?.includes('Kích hoạt') === true
    );
    if (needsActivation) {
        await dispatchCdpClick(page, '.z--btn--v2');
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (await page.evaluate(() => Boolean(document.querySelector('#contact-search-input')))) {
            return { healthy: true, action: 'activated' };
        }
    }

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const recovered = await page.evaluate(() => Boolean(document.querySelector('#contact-search-input')));
    return { healthy: recovered, action: recovered ? 'reloaded' : 'manual_activation_required' };
}

export async function sendZaloMessage(browser, targetName, message) {
    try {
        const page = await getZaloPage(browser);
        await page.bringToFront();

        console.log(`🔍 Đang tìm kiếm người nhận: ${targetName}...`);

        const searchSelector = '#contact-search-input';
        await page.waitForSelector(searchSelector, { timeout: 15000 });

        await page.click(searchSelector);

        // Xóa sạch ô tìm kiếm cũ
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');

        // Gõ tên người nhận
        await page.keyboard.type(targetName, { delay: 60 });
        await new Promise(r => setTimeout(r, 1500));
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 1500));

        console.log(`💬 Đang soạn tin nhắn cho ${targetName}...`);
        const chatInputSelector = '#richInput';
        await page.waitForSelector(chatInputSelector, { timeout: 10000 });

        await page.evaluate((msg) => {
            const input = document.querySelector('#richInput');
            if (input) {
                input.focus();
                document.execCommand('insertText', false, msg);
            }
        }, message);

        await new Promise(r => setTimeout(r, 1000));
        console.log(`📤 Đang bấm Gửi tới ${targetName}...`);
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 2000));
        console.log(`✅ Đã gửi tin nhắn cho [${targetName}] thành công!`);
    } catch (error) {
        console.error(`❌ Lỗi khi gửi Zalo cho [${targetName}]:`, error.message);
    }
}

function normalizeZaloText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi-VN');
}

async function dispatchCdpClick(page, selector) {
    const point = await page.evaluate((targetSelector) => {
        const element = document.querySelector(targetSelector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, selector);
    if (!point) return false;

    const client = await page.createCDPSession();
    await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1
    });
    await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1
    });
    await client.detach();
    return true;
}

async function dispatchCdpPoint(page, point) {
    if (!point) return false;
    const client = await page.createCDPSession();
    await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1
    });
    await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: point.x,
        y: point.y,
        button: 'left',
        clickCount: 1
    });
    await client.detach();
    return true;
}

async function clickConversationByName(page, normalizedTarget, selectors) {
    const point = await page.evaluate(({ target, candidateSelectors }) => {
        const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi-VN');
        const candidates = [...document.querySelectorAll(candidateSelectors)];
        const item = candidates.find(element => normalize(element.innerText).startsWith(target));
        if (!item) return null;
        const rect = item.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, { target: normalizedTarget, candidateSelectors: selectors });
    return dispatchCdpPoint(page, point);
}

/**
 * Chrome 136+ can occasionally hang on Puppeteer's high-level keyboard API.
 * This sender uses DOM input events plus raw CDP key events instead.
 */
export async function sendZaloMessageCdp(browser, targetName, message) {
    try {
        const page = await getZaloPage(browser);
        await page.bringToFront();
        await page.waitForSelector('#contact-search-input', { timeout: 15000 });

        const normalizedTarget = normalizeZaloText(targetName);
        let opened = await clickConversationByName(page, normalizedTarget, '.msg-item');

        if (!opened) {
            await page.evaluate((name) => {
                const input = document.querySelector('#contact-search-input');
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
                setter?.call(input, name);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, targetName);
            await new Promise(resolve => setTimeout(resolve, 1800));

            opened = await clickConversationByName(
                page,
                normalizedTarget,
                '.msg-item, [data-id*="Search"], [class*="search"]'
            );
        }
        if (!opened) throw new Error(`Không tìm thấy đúng người nhận: ${targetName}`);

        await page.waitForSelector('#richInput', { timeout: 10000 });
        await dispatchCdpClick(page, '#richInput');
        await page.evaluate(() => {
            const input = document.querySelector('#richInput');
            if (!input) return;
            input.focus();
            input.innerHTML = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });

        const client = await page.createCDPSession();
        const lines = String(message).split('\n');
        for (let index = 0; index < lines.length; index += 1) {
            if (lines[index]) {
                await page.evaluate(() => {
                    const input = document.querySelector('#richInput');
                    if (!input) return;
                    input.focus();
                    const range = document.createRange();
                    range.selectNodeContents(input);
                    range.collapse(false);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                });
                await client.send('Input.insertText', { text: lines[index] });
            }
            if (index < lines.length - 1) {
                await client.send('Input.dispatchKeyEvent', {
                    type: 'keyDown',
                    key: 'Shift',
                    code: 'ShiftLeft',
                    windowsVirtualKeyCode: 16,
                    nativeVirtualKeyCode: 16,
                    modifiers: 8
                });
                await client.send('Input.dispatchKeyEvent', {
                    type: 'keyDown',
                    key: 'Enter',
                    code: 'Enter',
                    windowsVirtualKeyCode: 13,
                    nativeVirtualKeyCode: 13,
                    modifiers: 8
                });
                await client.send('Input.dispatchKeyEvent', {
                    type: 'keyUp',
                    key: 'Enter',
                    code: 'Enter',
                    windowsVirtualKeyCode: 13,
                    nativeVirtualKeyCode: 13,
                    modifiers: 8
                });
                await client.send('Input.dispatchKeyEvent', {
                    type: 'keyUp',
                    key: 'Shift',
                    code: 'ShiftLeft',
                    windowsVirtualKeyCode: 16,
                    nativeVirtualKeyCode: 16
                });
            }
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        const inserted = await page.evaluate((expectedText) => {
            const actual = document.querySelector('#richInput')?.innerText || '';
            const tail = expectedText.slice(-Math.min(30, expectedText.length));
            return actual.length >= expectedText.length * 0.8 && actual.includes(tail);
        }, message);
        if (!inserted) throw new Error('Không chèn được nội dung vào ô chat.');

        await client.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: 'Enter',
            code: 'Enter',
            windowsVirtualKeyCode: 13,
            nativeVirtualKeyCode: 13
        });
        await client.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: 'Enter',
            code: 'Enter',
            windowsVirtualKeyCode: 13,
            nativeVirtualKeyCode: 13
        });
        await client.detach();
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log(`✅ Đã gửi tin nhắn CDP cho [${targetName}]`);
        return true;
    } catch (error) {
        console.error(`❌ Lỗi gửi Zalo CDP cho [${targetName}]:`, error.message);
        return false;
    }
}
