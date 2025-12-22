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
            max: 1,
            min: 0,
            idleTimeoutMillis: 5000 // Close idle connections quickly for tests
        }
      };

      let pool;
      try {
        // Use a temporary connection that is closed immediately
        pool = new sql.ConnectionPool(baseConfig);
        const connection = await pool.connect();
        await connection.close();
      } catch (err: any) {
        // Return the *actual* error from the driver for better debugging
        const errorMessage = err.originalError?.message || err.message || 'An unknown connection error occurred.';
        return NextResponse.json({ success: false, error: `Connection Failed: ${errorMessage}` }, { status: 400 });
      }

      // Phase 2: Check if the database exists by connecting with the DB name
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
         // Provide a more specific error if the connection fails at this stage
         const errorMessage = err.originalError?.message || err.message || 'An unknown database connection error occurred.';
         return NextResponse.json({ success: false, error: `Auth Successful, but could not connect to Database '${dbName}': ${errorMessage}` }, { status: 500 });
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
    // Also improve the catch-all error to be more specific
    const errorMessage = error.originalError?.message || error.message || "An unexpected server error occurred.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
