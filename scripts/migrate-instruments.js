#!/usr/bin/env node

/**
 * Migration script for research instruments
 * 
 * This script reads the research instruments JSON file and directly inserts
 * any instruments that don't exist in the database.
 * 
 * Usage: node scripts/migrate-instruments.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure you have a .env file with these variables');
  console.error('Note: Migration requires service role key for administrative operations');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Load research instruments from JSON file
 */
function loadInstruments() {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'research-instruments.json');
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(jsonData);
    return data.instruments || [];
  } catch (error) {
    console.error('❌ Error loading research instruments:', error.message);
    process.exit(1);
  }
}

/**
 * Check which instruments already exist in the database
 */
async function getExistingInstruments() {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('title, source')
      .order('title');

    if (error) throw error;
    
    // Create a set of existing instrument identifiers
    const existing = new Set();
    data.forEach(survey => {
      // Use title as primary identifier
      existing.add(survey.title.toLowerCase().trim());
      // Also check for partial matches on key terms
      const titleWords = survey.title.toLowerCase().split(/[\s-]+/);
      titleWords.forEach(word => {
        if (word.length > 3) existing.add(word);
      });
    });
    
    return existing;
  } catch (error) {
    console.error('❌ Error fetching existing surveys:', error.message);
    throw error;
  }
}

/**
 * Execute migration for new instruments
 */
async function executeMigration(instruments) {
  console.log(`\n🚀 Executing migration for ${instruments.length} instruments...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const instrument of instruments) {
    try {
      // Create extended schema with all metadata
      const extendedSchema = {
        ...instrument.schema,
        metadata: {
          category: instrument.category,
          license: instrument.license,
          validated: instrument.validated,
          population: instrument.population,
          administration_time: instrument.administration_time,
          norms: instrument.norms,
          psychometric_properties: instrument.psychometric_properties
        }
      };

      const { error } = await supabase
        .from('surveys')
        .insert({
          title: instrument.title,
          description: instrument.description,
          version: instrument.version,
          source: instrument.source,
          schema: extendedSchema,
          is_official: true,
          is_public: true,
          created_by: null, // Official surveys have no creator
          price: instrument.price || 0.00,
          currency: instrument.currency || 'USD'
        });

      if (error) {
        console.error(`❌ Failed to insert ${instrument.title}:`, error.message);
        console.error('Error details:', error);
        errorCount++;
      } else {
        console.log(`✅ Added: ${instrument.title} ${instrument.price > 0 ? `($${instrument.price})` : '(Free)'}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error inserting ${instrument.title}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successfully added: ${successCount} instruments`);
  console.log(`   ❌ Failed to add: ${errorCount} instruments`);
  
  if (errorCount > 0) {
    console.log(`\n⚠️  Some instruments failed to migrate. Check the errors above.`);
  } else if (successCount > 0) {
    console.log(`\n🎉 All instruments migrated successfully!`);
  }
}

/**
 * Main migration function
 */
async function migrateInstruments() {
  console.log('🔍 Loading research instruments...');
  
  try {
    // Load instruments from JSON
    const allInstruments = loadInstruments();
    console.log(`📖 Loaded ${allInstruments.length} instruments from data file`);

    // Validate all instruments before starting
    console.log('🔍 Validating instrument data...');
    allInstruments.forEach(validateInstrument);
    console.log('✅ All instruments passed validation');

    // Check existing instruments
    console.log('🔍 Checking existing instruments in database...');
    const existingInstruments = await getExistingInstruments();
    console.log(`📊 Found ${existingInstruments.size} existing surveys in database`);

    // Filter out instruments that already exist
    const newInstruments = allInstruments.filter(instrument => {
      const titleLower = instrument.title.toLowerCase().trim();
      
      // Check if title already exists
      if (existingInstruments.has(titleLower)) {
        console.log(`⏭️  Skipping existing: ${instrument.title}`);
        return false;
      }
      
      // Check for partial matches to avoid duplicates
      const keyWords = titleLower.split(/[\s-]+/).filter(word => word.length > 3);
      const hasPartialMatch = keyWords.some(word => existingInstruments.has(word));
      
      if (hasPartialMatch) {
        console.log(`⏭️  Skipping potential duplicate: ${instrument.title}`);
        return false;
      }
      
      return true;
    });

    console.log(`📋 Instruments to migrate: ${newInstruments.length}`);
    
    if (newInstruments.length === 0) {
      console.log('✅ All instruments already exist in database');
      return;
    }

    // Show what will be migrated
    console.log('\nInstruments to be added:');
    newInstruments.forEach(instrument => {
      const priceDisplay = instrument.price > 0 ? ` ($${instrument.price})` : ' (Free)';
      console.log(`  • ${instrument.title}${priceDisplay}`);
    });

    // Execute migration directly
    await executeMigration(newInstruments);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Validate instrument data structure
 */
function validateInstrument(instrument) {
  const required = ['id', 'title', 'description', 'source', 'schema'];
  const missing = required.filter(field => !instrument[field]);
  
  if (missing.length > 0) {
    throw new Error(`Instrument "${instrument.title || 'Unknown'}" missing required fields: ${missing.join(', ')}`);
  }
  
  if (!instrument.schema.questions || !Array.isArray(instrument.schema.questions)) {
    throw new Error(`Instrument "${instrument.title}" has invalid schema: missing questions array`);
  }
  
  if (!instrument.schema.scoring_rules || typeof instrument.schema.scoring_rules !== 'object') {
    throw new Error(`Instrument "${instrument.title}" has invalid schema: missing scoring_rules object`);
  }
  
  // Validate price if present
  if (instrument.price !== undefined) {
    if (typeof instrument.price !== 'number' || instrument.price < 0) {
      throw new Error(`Instrument "${instrument.title}" has invalid price: must be a non-negative number`);
    }
    
    // Check decimal places
    const decimalPlaces = (instrument.price.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new Error(`Instrument "${instrument.title}" has invalid price: cannot have more than 2 decimal places`);
    }
  }
  
  return true;
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🏥 SurveyStack Research Instruments Migration Tool\n');
  
  migrateInstruments()
    .then(() => {
      console.log('\n🎉 Migration process completed!');
    })
    .catch((error) => {
      console.error('\n💥 Migration process failed:', error.message);
      process.exit(1);
    });
}

export default migrateInstruments;