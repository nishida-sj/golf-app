// Create missing tables for competition grouping
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vkunuejjuonhhdzklhpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdW51ZWpqdW9uaGhkemtsaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI4OTUsImV4cCI6MjA2OTc4ODg5NX0.rIZjMpNrP0_aMdck-9X4B-wjhaOFXIyqccKNs65Uu1I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('Creating missing tables...');
  
  try {
    // Create competition_groups table
    const { error: groupsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS competition_groups (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
          group_number INTEGER NOT NULL,
          start_time TIME,
          notes VARCHAR(200),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(competition_id, group_number)
        );
      `
    });
    
    if (groupsError) {
      console.error('Error creating competition_groups table:', groupsError);
    } else {
      console.log('Successfully created competition_groups table');
    }

    // Create group_members table
    const { error: membersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS group_members (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          group_id UUID REFERENCES competition_groups(id) ON DELETE CASCADE,
          member_id UUID REFERENCES members(id) ON DELETE CASCADE,
          position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(group_id, position),
          UNIQUE(group_id, member_id)
        );
      `
    });
    
    if (membersError) {
      console.error('Error creating group_members table:', membersError);
    } else {
      console.log('Successfully created group_members table');
    }

    // Create indexes
    const { error: indexError1 } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_groups_competition ON competition_groups(competition_id);`
    });
    
    const { error: indexError2 } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);`
    });
    
    const { error: indexError3 } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_group_members_member ON group_members(member_id);`
    });

    if (indexError1 || indexError2 || indexError3) {
      console.error('Error creating indexes:', { indexError1, indexError2, indexError3 });
    } else {
      console.log('Successfully created indexes');
    }

    // Enable RLS and create policies
    const { error: rlsError1 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE competition_groups ENABLE ROW LEVEL SECURITY;
        CREATE POLICY IF NOT EXISTS "Enable all access for competition_groups" ON competition_groups FOR ALL USING (true);
      `
    });
    
    const { error: rlsError2 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
        CREATE POLICY IF NOT EXISTS "Enable all access for group_members" ON group_members FOR ALL USING (true);
      `
    });

    if (rlsError1 || rlsError2) {
      console.error('Error setting up RLS:', { rlsError1, rlsError2 });
    } else {
      console.log('Successfully set up RLS policies');
    }

    console.log('All tables created successfully!');

  } catch (error) {
    console.error('Failed to create tables:', error);
  }
}

createTables();