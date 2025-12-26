
import { NextResponse } from 'next/server';
import sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      mode, // 'test', 'upload_direct'
      serverIp, 
      port,
      dbName, 
      dbUser, 
      dbPassword, 
      connectionTimeout,
      mutations 
    } = body;

    const parsedPort = port ? parseInt(port, 10) : 1433;
    const parsedTimeout = connectionTimeout ? parseInt(connectionTimeout, 10) : 15000;

    // This is the full config for authenticated actions.
    const getBaseConfig = (database?: string) => ({
      user: dbUser,
      password: dbPassword,
      server: serverIp,
      port: parsedPort,
      database: database,
      options: {
        encrypt: false, // REQUIRED for SQL 2008/2012 local networks
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: parsedTimeout,
        // Downgrade Security for Old Servers
        cryptoCredentialsDetails: {
            minVersion: 'TLSv1' as any
        }
      },
      pool: {
          max: 1, // Keep pool small for testing and single operations
          min: 0,
          idleTimeoutMillis: 5000
      }
    });

    if (mode === 'test') {
      // --- Full Credential Test Logic ---
      let pool;
      try {
        // Phase 1: Connect without DB name to test auth and network
        pool = new sql.ConnectionPool(getBaseConfig());
        await pool.connect();
        await pool.close();
      } catch (err: any) {
        const errorCode = err.code || 'UNKNOWN';
        const errorMessage = err.originalError?.message || err.message || 'An unknown connection error occurred.';
        return NextResponse.json({ success: false, error: `Connection Failed (${errorCode}): ${errorMessage}` }, { status: 400 });
      }

      // Phase 2: Connect with DB name to check existence
      const dbPool = new sql.ConnectionPool(getBaseConfig(dbName));
      try {
        await dbPool.connect();
        const dbResult = await dbPool.request()
          .input('dbName', sql.NVarChar, dbName)
          .query(`SELECT database_id FROM sys.databases WHERE name = @dbName`);
        
        await dbPool.close();

        if (dbResult.recordset.length === 0) {
          return NextResponse.json({ success: false, error: `Auth Successful, but Database '${dbName}' does not exist.` }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: "Server Reachable, Auth Valid, Database Exists." });
      } catch (err: any) {
         if (dbPool && dbPool.connected) await dbPool.close();
         const errorCode = err.code || 'UNKNOWN';
         const errorMessage = err.originalError?.message || err.message || 'An unknown database connection error occurred.';
         return NextResponse.json({ success: false, error: `Auth Successful, but connection to Database '${dbName}' failed (${errorCode}): ${errorMessage}` }, { status: 500 });
      }
    }

    if (mode === 'upload_direct') {
        if (!mutations || !Array.isArray(mutations) || mutations.length === 0) {
            return NextResponse.json({ success: false, error: "Invalid or empty mutations list provided." }, { status: 400 });
        }

        const uploadConfig = getBaseConfig(dbName);
        let pool;
        
        try {
            pool = await sql.connect(uploadConfig);
            
            let uploadedCount = 0;
            const errors = [];

            for (const item of mutations) {
                const transaction = new sql.Transaction(pool);
                try {
                    await transaction.begin();
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
                    await transaction.commit();
                } catch (err: any) {
                    await transaction.rollback();
                    const errorMessage = err.originalError?.message || err.message;
                    errors.push(`Failed to upload ${item.filename}: ${errorMessage}`);
                }
            }
            
            if (errors.length > 0) {
                return NextResponse.json({ success: false, error: `Completed with ${errors.length} errors.`, details: errors }, { status: 500 });
            }

            return NextResponse.json({ success: true, count: uploadedCount });

        } catch (error: any) {
            console.error('Direct Upload Connection Error:', error);
            const errorCode = error.code || 'SERVER_ERROR';
            const errorMessage = error.originalError?.message || error.message || "An unexpected server error occurred during direct upload.";
            return NextResponse.json({ success: false, error: `(${errorCode}) ${errorMessage}` }, { status: 500 });
        } finally {
             if (pool && pool.connected) {
                await pool.close();
            }
        }
    }
    
    return NextResponse.json({ success: false, error: "Invalid mode specified." }, { status: 400 });

  } catch (error: any) {
    console.error('API Sync Error:', error);
    const errorCode = error.code || 'SERVER_ERROR';
    const errorMessage = error.originalError?.message || error.message || "An unexpected server error occurred.";
    return NextResponse.json({ success: false, error: `(${errorCode}) ${errorMessage}` }, { status: 500 });
  }
}
