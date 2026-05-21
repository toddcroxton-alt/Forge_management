require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://buzusggqhlnxiecupmuk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Requires the Secret/Service Role Key for backend updates

if (!SUPABASE_KEY) {
    console.error("Missing SUPABASE_KEY. Exiting.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to extract a clean number from a raw price string like "$24.99 AUD"
function cleanPrice(rawText) {
    const match = rawText.match(/[\d]+(\.[\d]+)?/);
    return match ? parseFloat(match[0]) : null;
}

// Site-specific parsers
function parsePrice(html, url) {
    const $ = cheerio.load(html);
    let priceText = null;

    if (url.includes('inkstation.com.au')) {
        // Try to find typical e-commerce price tags
        priceText = $('.price').first().text() || $('[itemprop="price"]').first().attr('content');
    } else if (url.includes('bambulab.com')) {
        priceText = $('.price-item--regular').first().text() || $('.product-price').first().text();
    } else if (url.includes('polymaker.com')) {
        priceText = $('.price__regular .price-item--regular').first().text();
    } else if (url.includes('sunlu.com')) {
        priceText = $('.price-item--sale').first().text() || $('.price-item--regular').first().text();
    } else {
        // Fallback: search for first obvious price looking element
        priceText = $('.price').first().text() || $('meta[property="product:price:amount"]').attr('content');
    }

    if (!priceText) return null;
    return cleanPrice(priceText);
}

async function runScraper() {
    console.log("Starting FORGE_MANAGER Automated Updater...");
    
    // Fetch all filaments with a valid reorder URL
    const { data: filaments, error } = await supabase
        .from('filaments')
        .select('id, name, reorder_url, rrp')
        .not('reorder_url', 'is', null);

    if (error) {
        console.error("Error fetching filaments:", error);
        return;
    }

    console.log(`Found ${filaments.length} filaments to update.`);

    for (const filament of filaments) {
        if (!filament.reorder_url) continue;

        try {
            console.log(`Fetching ${filament.name} from ${filament.reorder_url}...`);
            const response = await axios.get(filament.reorder_url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const newPrice = parsePrice(response.data, filament.reorder_url);

            if (newPrice && newPrice !== filament.rrp) {
                console.log(` -> Found new price: $${newPrice} (was $${filament.rrp}). Updating...`);
                await supabase
                    .from('filaments')
                    .update({ rrp: newPrice })
                    .eq('id', filament.id);
            } else if (newPrice === filament.rrp) {
                console.log(` -> Price unchanged at $${newPrice}.`);
            } else {
                console.log(` -> Could not extract price from HTML.`);
            }

        } catch (err) {
            console.error(` -> Failed to fetch URL: ${err.message}`);
        }
    }

    console.log("Automated Updater Finished.");
}

runScraper();
