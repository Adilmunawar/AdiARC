const fs = require('fs');
const path = require('path');

console.log("1. Script Started. Checking modules...");

let ExifReader;
try {
    ExifReader = require('exifreader');
    console.log("2. ExifReader loaded successfully.");
} catch (e) {
    console.error("❌ ERROR: Could not load 'exifreader'.");
    console.error("   Please run this command first: npm install exifreader");
    process.exit(1);
}

// ==========================================
// ⚙️ YOUR CONFIGURATION
// ==========================================
const CONFIG = {
    // ✅ FIXED: Using forward slashes (/) instead of backslashes (\)
    SOURCE_FOLDER: 'C:/Users/M Adil/Desktop/Test Images for mutation extraction', 
    
    DESTINATION_FOLDER: 'C:/Users/M Adil/Desktop/reuploadrequired',
    
    // Your missing number(s)
    MISSING_LIST_INPUT: `88362`,
    
    EXTENSIONS: ['.jpg', '.jpeg', '.png', '.tif', '.tiff']
};

// ==========================================
// 🚀 MAIN SCRIPT
// ==========================================
async function main() {
    console.log(`\n3. Checking Source Folder...`);
    console.log(`   Path: "${CONFIG.SOURCE_FOLDER}"`);

    if (!fs.existsSync(CONFIG.SOURCE_FOLDER)) {
        console.error(`❌ ERROR: Folder not found!`);
        console.error(`   Make sure the folder name is exactly right.`);
        return;
    }
    console.log("   ✅ Folder exists.");

    // Parse IDs
    const targetIds = new Set(CONFIG.MISSING_LIST_INPUT.split(/[\s,;]+/).map(t => t.trim()).filter(Boolean));
    console.log(`4. Hunting for IDs:`, [...targetIds].join(", "));

    // Find Files
    console.log("5. Scanning for images...");
    let files = [];
    try {
        files = fs.readdirSync(CONFIG.SOURCE_FOLDER)
            .filter(f => CONFIG.EXTENSIONS.includes(path.extname(f).toLowerCase()))
            .map(f => path.join(CONFIG.SOURCE_FOLDER, f));
    } catch (e) {
        console.error("❌ Error reading folder files:", e.message);
        return;
    }

    console.log(`   Found ${files.length} images.`);

    if (files.length === 0) {
        console.error("❌ No images found. Check if they are .jpg, .png, etc.");
        return;
    }

    // Process
    console.log("6. Reading Metadata...");
    
    if (!fs.existsSync(CONFIG.DESTINATION_FOLDER)) {
        fs.mkdirSync(CONFIG.DESTINATION_FOLDER, { recursive: true });
        console.log(`   Created destination folder.`);
    }

    let foundCount = 0;
    
    for (const file of files) {
        process.stdout.write(`   -> Checking: ${path.basename(file)}... `);
        
        try {
            const buffer = fs.readFileSync(file);
            const tags = await ExifReader.load(buffer, { expanded: true });
            
            // Extract Number Logic (Golden Key Check)
            let foundID = null;
            
            // 1. Check strict XMP DocumentNo
            if (tags && tags['xmp:DocumentNo']) {
                foundID = tags['xmp:DocumentNo'].description;
            } 
            // 2. Fallback: Search deeply if strict tag moved
            else if (tags) {
                // Quick scan of values
                Object.values(tags).forEach(tag => {
                    if (tag && tag.description && typeof tag.description === 'string') {
                         if (targetIds.has(tag.description.trim())) foundID = tag.description.trim();
                    }
                });
            }

            if (foundID && targetIds.has(String(foundID).trim())) {
                console.log(`✅ MATCH! [${foundID}]`);
                
                const destFile = path.join(CONFIG.DESTINATION_FOLDER, `${foundID}_${path.basename(file)}`);
                fs.copyFileSync(file, destFile);
                foundCount++;
            } else {
                console.log(foundID ? `(Found ${foundID} - Skip)` : "(No ID)");
            }

        } catch (err) {
            console.log("❌ Read Error");
        }
    }

    console.log("\n=========================");
    console.log(`DONE. Cloned ${foundCount} matching files.`);
    console.log(`Location: ${CONFIG.DESTINATION_FOLDER}`);
}

main().catch(err => console.error("CRITICAL ERROR:", err));