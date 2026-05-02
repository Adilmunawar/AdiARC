import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const saveDir = formData.get('saveDir') as string;
        const files = formData.getAll('files') as File[];

        if (!saveDir || !files || files.length === 0) {
            return NextResponse.json({ error: 'Missing saveDir or files' }, { status: 400 });
        }

        // Ensure directory exists
        if (!fs.existsSync(saveDir)) {
            try {
                fs.mkdirSync(saveDir, { recursive: true });
            } catch (err: any) {
                return NextResponse.json({ error: `Failed to create directory: ${err.message}` }, { status: 500 });
            }
        }

        const savedPaths = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const targetPath = path.join(saveDir, file.name);
            
            try {
                fs.writeFileSync(targetPath, buffer);
                savedPaths.push(targetPath);
            } catch (err: any) {
                return NextResponse.json({ error: `Failed to write file ${file.name}: ${err.message}` }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, savedPaths });
    } catch (error: any) {
        console.error('Save Scan Error:', error);
        return NextResponse.json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
