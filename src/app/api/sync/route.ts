import { NextResponse } from 'next/server';
import sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

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
      // encrypt and trustServerCertificate from client are ignored
      connectionTimeout,
      mutations 
    } = body;

    const parsedPort = port ? parseInt(port, 10) : 1433;
    const parsedTimeout = connectionTimeout ? parseInt(connectionTimeout, 10) : 15000;

    const baseConfig = {
      user: dbUser,
      password: dbPassword,
      server: serverIp,
      port: parsedPort,
      options: {
        encrypt: false, // CRITICAL: Enforce legacy setting
        trustServerCertificate: true, // CRITICAL: Enforce legacy setting
        connectTimeout: parsedTimeout,
        enableArithAbort: true,
      },
      pool: {
          max: 1,
          min: 0,
          idleTimeoutMillis: 5000
      }
    };

    if (mode === 'test') {
      let pool;
      try {
        // Phase 1: Connect without DB name to test auth
        pool = new sql.ConnectionPool(baseConfig);
        await pool.connect();
        await pool.close();
      } catch (err: any) {
        const errorMessage = err.originalError?.message || err.message || 'An unknown connection error occurred.';
        return NextResponse.json({ success: false, error: `Connection Failed: ${errorMessage}` }, { status: 400 });
      }

      // Phase 2: Connect with DB name to check existence
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

    if (mode === 'upload_direct') {
        const uploadConfig = {
          ...baseConfig,
          database: dbName,
        };

        const pool = await sql.connect(uploadConfig);
        const transaction = new sql.Transaction(pool);
        
        let uploadedCount = 0;
        try {
            await transaction.begin();

            for (const item of mutations) {
                // Use a new request for each check inside the loop
                const checkRequest = new sql.Request(transaction);
                const checkResult = await checkRequest
                    .input('docNumberCheck', sql.VarChar, item.id)
                    .query(`SELECT 1 FROM [transactions].[TransactionImages] WHERE doc_number = @docNumberCheck`);
                
                if (checkResult.recordset.length === 0) {
                    const imgId = uuidv4();
                    const transImgId = uuidv4();
                    const serverPath = `\\\\${serverIp}\\Images\\${item.filename}`;

                    const insertRequest = new sql.Request(transaction);
                    await insertRequest
                        .input('imgId', sql.UniqueIdentifier, imgId)
                        .input('transImgId', sql.UniqueIdentifier, transImgId)
                        .input('docNumber', sql.VarChar, item.id)
                        .input('filename', sql.VarChar, item.filename)
                        .input('serverPath', sql.VarChar, serverPath)
                        .query(`
                            INSERT INTO [transactions].[ScanImages] ([image_id], [name], [image_type], [image_file_path], [access_datetime])
                            VALUES (@imgId, @filename, 'jpg', @serverPath, GETDATE());

                            INSERT INTO [transactions].[TransactionImages] ([transaction_image_id], [image_id], [doc_number], [transaction_type], [access_datetime], [status_primary_db])
                            VALUES (@transImgId, @imgId, @docNumber, 'Intiqal', GETDATE(), 1);
                        `);
                    uploadedCount++;
                }
            }
            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err; // Let the outer catch handle it
        } finally {
            await pool.close();
        }

        return NextResponse.json({ success: true, count: uploadedCount });
    }
    
    return NextResponse.json({ success: false, error: "Invalid mode specified." }, { status: 400 });

  } catch (error: any) {
    console.error('API Sync Error:', error);
    const errorMessage = error.originalError?.message || error.message || "An unexpected server error occurred.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
