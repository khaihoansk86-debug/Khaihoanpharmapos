const SUPABASE_URL = 'https://iejgtdcdzababydaqjef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AjGRJy05OUTeqEJxvhy8eg_Rck3CpU1';

async function run() {
    console.log("=== DB CONSTRAINTS DIAGNOSTIC START ===");
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    const testOrderCode = 'TEST_CONSTRAINTS_' + Date.now();
    let orderId = null;

    try {
        // 1. Try to create a return-like order with negative total
        console.log("1. Creating test order with negative total...");
        const orderPayload = {
            order_code: testOrderCode,
            customer_name: 'Test Constraints',
            subtotal: -10000,
            discount: 0,
            total: -10000,
            amount_received: 0,
            change_amount: 0,
            status: 'completed',
            order_type: 'retail'
        };

        const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderPayload)
        });

        if (!orderRes.ok) {
            const errText = await orderRes.text();
            throw new Error(`Failed to create order: ${errText}`);
        }

        const orders = await orderRes.json();
        const order = orders[0];
        orderId = order.id;
        console.log(`✓ Order created with ID: ${orderId}`);

        // 2. Try to insert order items with negative quantity (represents return item)
        console.log("2. Inserting order item with negative quantity (-1)...");
        const itemPayload = {
            order_id: orderId,
            product_name: 'Test Return Product',
            product_code: 'TEST_RET',
            unit_name: 'Vỉ',
            unit_price: 10000,
            quantity: -1,
            total_price: -10000
        };

        const itemRes = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
            method: 'POST',
            headers,
            body: JSON.stringify(itemPayload)
        });

        if (!itemRes.ok) {
            const errText = await itemRes.text();
            console.error(`✗ Failed to insert negative quantity item: ${errText}`);
            console.log("NOTE: This means Migration 017 (quantity CHECK constraint) is NOT applied yet!");
        } else {
            console.log("✓ Negative quantity item inserted successfully!");
            console.log("NOTE: Migration 017 is ACTIVE on the server!");
        }

        // 3. Verify cashbook trigger automation
        console.log("3. Verifying cashbook transactions trigger...");
        const cashbookUrl = `${SUPABASE_URL}/rest/v1/cashbook_transactions?ref_type=eq.sales&ref_id=eq.${orderId}`;
        const cashbookRes = await fetch(cashbookUrl, { headers });
        if (cashbookRes.ok) {
            const txs = await cashbookRes.json();
            if (txs.length > 0) {
                const tx = txs[0];
                console.log(`✓ Cashbook entry found: Code: ${tx.transaction_code}, Type: ${tx.type}, Amount: ${tx.amount}, Category: ${tx.category}`);
                if (tx.type === 'expense' && Number(tx.amount) === 10000) {
                    console.log("✓ Cashbook automation trigger correctly converted negative order total to positive expense transaction.");
                } else {
                    console.warn(`⚠ Cashbook entry has unexpected state: Type: ${tx.type}, Amount: ${tx.amount}`);
                }
            } else {
                console.log("✗ No cashbook entry generated for this order.");
            }
        } else {
            console.error("Failed to query cashbook transactions:", await cashbookRes.text());
        }

    } catch (e) {
        console.error("Error during test:", e.message);
    } finally {
        // Cleanup
        if (orderId) {
            console.log("\n4. Cleaning up test order and related entries...");
            const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'DELETE',
                headers
            });
            if (deleteRes.ok) {
                console.log("✓ Test data cleaned up successfully.");
            } else {
                console.error("Failed to delete test order:", await deleteRes.text());
            }
        }
        console.log("=== DIAGNOSTIC END ===");
    }
}

run();
