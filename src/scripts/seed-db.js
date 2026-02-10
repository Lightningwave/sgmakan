/**
 * Seed database with initial data (Supabase)
 * Populates neighborhoods, cafes, pending_cafes, and ai_pipeline_log
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { supabase, pool } = require('./db-config');

const neighborhoodsSeed = [
  {
    name: 'Tiong Bahru',
    slug: 'tiong-bahru',
    icon: '🥐',
    image_url:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    description:
      'Hip enclave of cafes, indie boutiques, and iconic murals'
  },
  {
    name: 'Joo Chiat',
    slug: 'joo-chiat',
    icon: '🏠',
    image_url:
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
    description:
      'Vibrant heritage town with colorful Peranakan shophouses'
  },
  {
    name: 'Dempsey Hill',
    slug: 'dempsey-hill',
    icon: '🌿',
    image_url:
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
    description:
      'Former military barracks turned premier lifestyle destination'
  },
  {
    name: 'Telok Ayer',
    slug: 'telok-ayer',
    icon: '🏢',
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    description: 'Bustling CBD district with historic shophouses'
  }
];

const cafesSeed = [
  {
    slug: 'plain-vanilla-tiong-bahru',
    title: 'Plain Vanilla',
    neighborhood_name: 'Tiong Bahru',
    location: 'Tiong Bahru',
    rating: 4.6,
    price: '$$',
    mrt: 'Tiong Bahru',
    vibe: 'Minimalist',
    tags: ['brunch', 'cakes', 'coffee'],
    description:
      'A classic neighborhood cafe known for its cupcakes and calm atmosphere.',
    image_url:
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
    source: 'manual',
    is_active: true
  },
  {
    slug: 'glasshouse-joo-chiat',
    title: 'Glasshouse',
    neighborhood_name: 'Joo Chiat',
    location: 'Joo Chiat',
    rating: 4.4,
    price: '$$',
    mrt: 'Eunos',
    vibe: 'Vintage',
    tags: ['brunch', 'pastries'],
    description:
      'Cozy cafe with warm lighting and comforting brunch staples.',
    image_url:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    source: 'manual',
    is_active: true
  },
  {
    slug: 'ps-cafe-dempsey',
    title: 'PS.Cafe',
    neighborhood_name: 'Dempsey Hill',
    location: 'Dempsey Hill',
    rating: 4.5,
    price: '$$$',
    mrt: 'Napier',
    vibe: 'Garden',
    tags: ['brunch', 'dining', 'garden'],
    description:
      'Lush greenery and large plates make this a relaxed weekend spot.',
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    source: 'manual',
    is_active: true
  },
  {
    slug: 'the-sailor-imbue-telok-ayer',
    title: 'The Sailor & Imbue',
    neighborhood_name: 'Telok Ayer',
    location: 'Telok Ayer',
    rating: 4.3,
    price: '$$',
    mrt: 'Telok Ayer',
    vibe: 'Industrial',
    tags: ['coffee', 'bakery'],
    description:
      'Modern cafe with good coffee and a curated pastry selection.',
    image_url:
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
    source: 'manual',
    is_active: true
  }
];

const pendingSeed = [
  {
    title: 'Riverside Brew',
    neighborhood_name: 'Tiong Bahru',
    location: 'Tiong Bahru',
    rating: 4.1,
    price: '$$',
    mrt: 'Tiong Bahru',
    vibe: 'Cozy',
    tags: ['espresso', 'brunch'],
    description:
      'Small-batch roasts and a quiet space for work.',
    image_url:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    ai_confidence: 0.82,
    status: 'pending'
  },
  {
    title: 'Sunlit Espresso',
    neighborhood_name: 'Joo Chiat',
    location: 'Joo Chiat',
    rating: 4.0,
    price: '$',
    mrt: 'Eunos',
    vibe: 'Bright',
    tags: ['coffee', 'pastries'],
    description:
      'Bright, airy cafe with a strong espresso focus.',
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    ai_confidence: 0.73,
    status: 'pending'
  }
];

const aiLogSeed = [
  {
    pipeline_type: 'discovery',
    status: 'completed',
    cafes_found: 12,
    cafes_verified: 7,
    cafes_failed: 5,
    details: { source: 'weekly_trends', notes: 'Week 32 crawl' }
  },
  {
    pipeline_type: 'verification',
    status: 'completed',
    cafes_found: 8,
    cafes_verified: 6,
    cafes_failed: 2,
    details: { validator: 'image+schema', notes: 'Auto-verified batch' }
  }
];

async function getCount(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

async function seedNeighborhoods() {
  const count = await getCount('neighborhoods');
  if (count > 0) {
    console.log(`✅ neighborhoods already populated (${count}), skipping`);
    return;
  }

  const { error } = await supabase
    .from('neighborhoods')
    .insert(neighborhoodsSeed);

  if (error) throw error;
  console.log(`✅ Inserted ${neighborhoodsSeed.length} neighborhoods`);
}

async function seedCafes() {
  const count = await getCount('cafes');
  if (count > 0) {
    console.log(`✅ cafes already populated (${count}), skipping`);
    return;
  }

  const { data: neighborhoods, error: neighborhoodsError } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id, name');

  if (neighborhoodsError) throw neighborhoodsError;

  const neighborhoodMap = {};
  neighborhoods.forEach((n) => {
    neighborhoodMap[n.name] = n.neighborhood_id;
  });

  const cafeRows = cafesSeed.map((cafe) => ({
    slug: cafe.slug,
    title: cafe.title,
    neighborhood_id: neighborhoodMap[cafe.neighborhood_name] || null,
    location: cafe.location,
    rating: cafe.rating,
    price: cafe.price,
    mrt: cafe.mrt,
    vibe: cafe.vibe,
    tags: cafe.tags,
    description: cafe.description,
    image_url: cafe.image_url,
    source: cafe.source,
    is_active: cafe.is_active
  }));

  const { error } = await supabase.from('cafes').insert(cafeRows);
  if (error) throw error;
  console.log(`✅ Inserted ${cafeRows.length} cafes`);
}

async function seedPendingCafes() {
  const count = await getCount('pending_cafes');
  if (count > 0) {
    console.log(`✅ pending_cafes already populated (${count}), skipping`);
    return;
  }

  const { data: neighborhoods, error: neighborhoodsError } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id, name');

  if (neighborhoodsError) throw neighborhoodsError;

  const neighborhoodMap = {};
  neighborhoods.forEach((n) => {
    neighborhoodMap[n.name] = n.neighborhood_id;
  });

  const pendingRows = pendingSeed.map((cafe) => ({
    title: cafe.title,
    neighborhood_id: neighborhoodMap[cafe.neighborhood_name] || null,
    location: cafe.location,
    rating: cafe.rating,
    price: cafe.price,
    mrt: cafe.mrt,
    vibe: cafe.vibe,
    tags: cafe.tags,
    description: cafe.description,
    image_url: cafe.image_url,
    ai_confidence: cafe.ai_confidence,
    status: cafe.status
  }));

  const { error } = await supabase.from('pending_cafes').insert(pendingRows);
  if (error) throw error;
  console.log(`✅ Inserted ${pendingRows.length} pending cafes`);
}

async function seedAiLogs() {
  const count = await getCount('ai_pipeline_log');
  if (count > 0) {
    console.log(`✅ ai_pipeline_log already populated (${count}), skipping`);
    return;
  }

  const { error } = await supabase.from('ai_pipeline_log').insert(aiLogSeed);
  if (error) throw error;
  console.log(`✅ Inserted ${aiLogSeed.length} AI log entries`);
}

async function runSeed() {
  try {
    console.log('🚀 Seeding database...');
    await seedNeighborhoods();
    await seedCafes();
    await seedPendingCafes();
    await seedAiLogs();
    console.log('✅ Seeding complete');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await pool.end();
  }
}

runSeed();
