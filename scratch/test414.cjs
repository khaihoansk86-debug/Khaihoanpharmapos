const { supabaseClient } = require('d:/Khaihoanpharmapos/js/core/supabase.js');
async function test() {
    const uuids = Array(100).fill('12345678-1234-1234-1234-123456789012');
    const { data, error } = await supabaseClient.from('products').select('id').in('id', uuids);
    if (error) console.error('Error:', error);
    else console.log('Success, length:', data.length);
}
test();
