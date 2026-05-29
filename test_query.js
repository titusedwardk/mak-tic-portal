const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('projects').select('*, profiles ( full_name, affiliation ), project_files ( file_name, storage_path, file_type )').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
run();
