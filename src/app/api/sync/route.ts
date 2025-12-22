import { NextResponse } from 'next/server';
import sql from 'mssql';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      mode, // 'test' or 'upload'
      serverIp, 
      port,
      dbName, 
      dbUser, 
      dbPassword, 
      encrypt,
      trustServerCertificate,
      connectionTimeout,
      mutations 
    } = body;

    const parsedPort = port ? parseInt(port, 10) : 1433;
    const parsedTimeout = connectionTimeout ? parseInt(connectionTimeout, 10) : 15000;

    if (mode === 'test') {
      // Phase 1: Test network and auth without specifying a database
      const baseConfig = {
        user: dbUser,
        password: dbPassword,
        server: serverIp,
        port: parsedPort,
        options: {
          encrypt: encrypt,
          trustServerCertificate: trustServerCertificate,
          connectTimeout: parsedTimeout,
        },
        pool: {
            max: 1, // Keep the pool small for tests
        }
      };

      let pool;
      try {
        pool = await sql.connect(baseConfig);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Connection Failed: Check Server IP, Port, or User Credentials.` }, { status: 400 });
      }

      // Phase 2: Check if the database exists
      try {
        const dbResult = await pool.request()
          .input('dbName', sql.NVarChar, dbName)
          .query(`SELECT database_id FROM sys.databases WHERE name = @dbName`);
        
        await pool.close();

        if (dbResult.recordset.length === 0) {
          return NextResponse.json({ success: false, error: `Auth Successful, but Database '${dbName}' does not exist.` }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: "Server Reachable, Auth Valid, Database Exists." });
      } catch (err: any) {
         if (pool) await pool.close();
         return NextResponse.json({ success: false, error: `Database Query Failed: ${err.message}` }, { status: 500 });
      }
    }

    if (mode === 'upload') {
        const uploadConfig = {
            user: dbUser,
            password: dbPassword,
            server: serverIp,
            port: parsedPort,
            database: dbName,
            options: {
              encrypt: encrypt,
              trustServerCertificate: trustServerCertificate,
              connectTimeout: parsedTimeout,
            }
          };

        const pool = await sql.connect(uploadConfig);

        let uploadedCount = 0;
        for (const item of mutations) {
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
    }
    
    return NextResponse.json({ success: false, error: "Invalid mode specified." }, { status: 400 });

  } catch (error: any) {
    console.error('API Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message || "An unexpected server error occurred." }, { status: 500 });
  }
}
