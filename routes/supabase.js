const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://obpfsnzvgmvtzlvxhdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icGZzbnp2Z212dHpsdnhoZHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDkyMTE5MywiZXhwIjoyMDY2NDk3MTkzfQ.HDbj-YGNbozalQYON0c0X2CmLvDUZlFrBbbbrsYsRHk' // Use service role key ONLY on server
);

module.exports = supabase;
