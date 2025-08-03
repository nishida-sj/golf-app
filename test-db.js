// Database connection test
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vkunuejjuonhhdzklhpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdW51ZWpqdW9uaGhkemtsaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI4OTUsImV4cCI6MjA2OTc4ODg5NX0.rIZjMpNrP0_aMdck-9X4B-wjhaOFXIyqccKNs65Uu1I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection by fetching years
    const { data: years, error: yearsError } = await supabase
      .from('years')
      .select('*')
      .limit(1);
    
    if (yearsError) {
      console.error('Years table error:', yearsError);
    } else {
      console.log('Years table access successful:', years?.length || 0, 'records');
    }

    // Test competitions table
    const { data: competitions, error: competitionsError } = await supabase
      .from('competitions')
      .select('*')
      .limit(1);
    
    if (competitionsError) {
      console.error('Competitions table error:', competitionsError);
    } else {
      console.log('Competitions table access successful:', competitions?.length || 0, 'records');
    }

    // Test new tables (these might not exist yet)
    const { data: groups, error: groupsError } = await supabase
      .from('competition_groups')
      .select('*')
      .limit(1);
    
    if (groupsError) {
      console.error('Competition_groups table error:', groupsError);
    } else {
      console.log('Competition_groups table access successful:', groups?.length || 0, 'records');
    }

    const { data: groupMembers, error: groupMembersError } = await supabase
      .from('group_members')
      .select('*')
      .limit(1);
    
    if (groupMembersError) {
      console.error('Group_members table error:', groupMembersError);
    } else {
      console.log('Group_members table access successful:', groupMembers?.length || 0, 'records');
    }

  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();