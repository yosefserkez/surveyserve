#!/usr/bin/env node

/**
 * Script to update CORS configuration with custom domains
 * 
 * Usage: node scripts/update-cors-domains.js yourdomain.com
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsFilePath = path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'cors.ts');

function updateCorsDomains(domain) {
  if (!domain) {
    console.error('❌ Please provide a domain name');
    console.error('Usage: node scripts/update-cors-domains.js yourdomain.com');
    process.exit(1);
  }

  // Normalize domain
  const normalizedDomain = domain.startsWith('http') ? domain : `https://${domain}`;
  
  try {
    // Read the current CORS file
    let content = fs.readFileSync(corsFilePath, 'utf8');
    
    // Check if domain is already in the allowed origins
    if (content.includes(normalizedDomain)) {
      console.log(`✅ Domain ${normalizedDomain} is already in the allowed origins`);
      return;
    }
    
    // Find the allowedOrigins array and add the new domain
    const allowedOriginsRegex = /const allowedOrigins = \[([\s\S]*?)\];/;
    const match = content.match(allowedOriginsRegex);
    
    if (!match) {
      console.error('❌ Could not find allowedOrigins array in CORS file');
      process.exit(1);
    }
    
    const currentOrigins = match[1];
    const newOrigins = currentOrigins + `\n    '${normalizedDomain}',`;
    
    // Replace the array
    const newContent = content.replace(
      allowedOriginsRegex,
      `const allowedOrigins = [${newOrigins}\n  ];`
    );
    
    // Write the updated content
    fs.writeFileSync(corsFilePath, newContent);
    
    console.log(`✅ Added ${normalizedDomain} to allowed origins`);
    console.log('📝 Next steps:');
    console.log('1. Deploy the updated Edge Functions:');
    console.log('   supabase functions deploy');
    console.log('2. Add the domain to Supabase project settings:');
    console.log('   - Go to Supabase Dashboard → Settings → API');
    console.log('   - Add to "Additional Allowed Origins"');
    console.log('3. Update your hosting platform environment variables');
    
  } catch (error) {
    console.error('❌ Error updating CORS configuration:', error.message);
    process.exit(1);
  }
}

// Get domain from command line arguments
const domain = process.argv[2];
updateCorsDomains(domain); 