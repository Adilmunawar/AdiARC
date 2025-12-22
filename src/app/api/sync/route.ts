import { NextResponse } from 'next/server';
import sql from 'mssql';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serverIp, dbName, dbUser, dbPassword, mutations } = body;

    // Configuration for Legacy SQL Server (Local Network)
    const config = {
      user: dbUser,
      password: dbPassword,
      server: serverIp,
      database: dbName,
      options: {
        encrypt: false, // Required for local/legacy servers
        trustServerCertificate: true // Required for self-signed certs
      }
    };

    // Connect
    const pool = await sql.connect(config);

    // Upload Loop
    let uploadedCount = 0;
    for (const item of mutations) {
      // Check if exists, then insert
      await pool.request()
        .input('mNo', sql.VarChar, item.id)
        .input('path', sql.VarChar, item.file)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM tbl_Mutations WHERE MutationNo = @mNo)
          BEGIN
            INSERT INTO tbl_Mutations (MutationNo, ImagePath, CreatedDate, Status)
            VALUES (@mNo, @path, GETDATE(), 'Uploaded via NextJS')
          END
        `);
      uploadedCount++;
    }

    await pool.close();
    return NextResponse.json({ success: true, count: uploadedCount });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
