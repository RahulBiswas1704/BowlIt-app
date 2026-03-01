require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    console.log("Testing connection to store_settings table...");
    const { data, error } = await supabaseAdmin
        .from('store_settings')
        .select('*');

    if (error) {
        console.error("❌ ERROR: ", error.message, error.code, error.details);
    } else {
        console.log("✅ SUCCESS! Table found. Data:", data);
    }
}

testConnection();
