import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { images, saveDir } = await req.json();

        if (!saveDir || !images || !Array.isArray(images)) {
            return NextResponse.json({ error: 'Missing saveDir or images array' }, { status: 400 });
        }

        // Ensure directory exists
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        const savedPaths = [];

        for (const img of images) {
            const { base64, filename } = img;
            
            // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
            const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const targetPath = path.join(saveDir, filename);
            
            fs.writeFileSync(targetPath, buffer);
            savedPaths.push(targetPath);
        }

        return NextResponse.json({ success: true, savedPaths });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
