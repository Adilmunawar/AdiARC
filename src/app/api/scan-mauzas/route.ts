import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CATEGORY_MAPPING: Record<string, string[]> = {
    'Mutation': ['mutation', 'mutations', 'انتقال', 'intiqal', 'interum', 'intaram', 'motation', 'mutaion'],
    'RHZ': ['rhz', 'roznamcha', 'روزنامچہ'],
    'Shajra': ['shajra', 'شجرہ', 'shijra', 'map'],
    'Fardbadar': ['fardbadar', 'fard badar', 'فرد بدر', 'بدرات'],
    'Field Book': ['field book', 'fieldbook', 'فیلڈ بک']
};

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif']);

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    }
  );
}

function detectCategory(filePath: string, baseMauzaPath: string) {
    const relPath = path.relative(baseMauzaPath, filePath).toLowerCase();
    
    // 1. HUNTING MODE: Deep Path Scan
    for (const [standardCat, keywords] of Object.entries(CATEGORY_MAPPING)) {
        for (const kw of keywords) {
            if (relPath.includes(kw.toLowerCase())) {
                return standardCat;
            }
        }
    }
    
    // 2. DYNAMIC DISCOVERY (Fallback)
    const parentDir = path.basename(path.dirname(filePath));
    if (path.resolve(path.dirname(filePath)) === path.resolve(baseMauzaPath)) {
        return "Uncategorized Root Files";
    }
    
    return toTitleCase(parentDir.trim());
}

async function scanDirectory(dir: string, baseMauzaPath: string, stats: Record<string, number>) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDirectory(fullPath, baseMauzaPath, stats);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (IMAGE_EXTENSIONS.has(ext)) {
                    const category = detectCategory(fullPath, baseMauzaPath);
                    stats[category] = (stats[category] || 0) + 1;
                }
            }
        }
    } catch (err) {
        // Silently handle read errors for specific folders if access is denied
        console.error("Error scanning", dir, err);
    }
}

export async function POST(req: Request) {
    try {
        const { mauzas } = await req.json();
        
        const results = [];
        for (const m of mauzas) {
            const stats: Record<string, number> = {};
            
            try {
                // Check if directory exists first
                const stat = await fs.stat(m.path);
                if (stat.isDirectory()) {
                    await scanDirectory(m.path, m.path, stats);
                    results.push({ name: m.name, stats, status: 'Success' });
                } else {
                    results.push({ name: m.name, stats, status: 'Invalid Path' });
                }
            } catch (err) {
                 results.push({ name: m.name, stats, status: 'Path Not Found' });
            }
        }
        
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
