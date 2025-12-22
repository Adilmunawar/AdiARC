import { NextResponse } from 'next/server';
import sql from 'mssql';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      mode, // 'test', 'upload', or 'upload_direct'
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
            max: 1,
            min: 0,
            idleTimeoutMillis: 5000
        }
      };

      let pool;
      try {
        pool = new sql.ConnectionPool(baseConfig);
        const connection = await pool.connect();
        await connection.close();
      } catch (err: any) {
        const errorMessage = err.originalError?.message || err.message || 'An unknown connection error occurred.';
        return NextResponse.json({ success: false, error: `Connection Failed: ${errorMessage}` }, { status: 400 });
      }

      const dbConfig = { ...baseConfig, database: dbName };
      let dbPool;
      try {
        dbPool = new sql.ConnectionPool(dbConfig);
        const connection = await dbPool.connect();
        const dbResult = await connection.request()
          .input('dbName', sql.NVarChar, dbName)
          .query(`SELECT database_id FROM sys.databases WHERE name = @dbName`);
        
        await connection.close();

        if (dbResult.recordset.length === 0) {
          return NextResponse.json({ success: false, error: `Auth Successful, but Database '${dbName}' does not exist.` }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: "Server Reachable, Auth Valid, Database Exists." });
      } catch (err: any) {
         if (dbPool && dbPool.connected) await dbPool.close();
         const errorMessage = err.originalError?.message || err.message || 'An unknown database connection error occurred.';
         return NextResponse.json({ success: false, error: `Auth Successful, but could not connect to Database '${dbName}': ${errorMessage}` }, { status: 500 });
      }
    }

    if (mode === 'upload' || mode === 'upload_direct') {
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
          const imagePath = mode === 'upload_direct'
            ? `\\\\${serverIp}\\Images\\${item.filename}`
            : item.file; // 'upload' mode uses the path from inventory

          const result = await pool.request()
            .input('mNo', sql.VarChar, item.id)
            .input('path', sql.VarChar, imagePath)
            .query(`
              IF NOT EXISTS (SELECT 1 FROM tbl_Mutations WHERE MutationNo = @mNo)
              BEGIN
                INSERT INTO tbl_Mutations (MutationNo, ImagePath, CreatedDate, Status)
                VALUES (@mNo, @path, GETDATE(), 'Uploaded via NextJS')
              END
            `);
          
          if (result.rowsAffected[0] > 0) {
            uploadedCount++;
          }
        }

        await pool.close();
        return NextResponse.json({ success: true, count: uploadedCount });
    }
    
    return NextResponse.json({ success: false, error: "Invalid mode specified." }, { status: 400 });

  } catch (error: any) {
    console.error('API Sync Error:', error);
    const errorMessage = error.originalError?.message || error.message || "An unexpected server error occurred.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
