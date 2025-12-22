// server-proxy.js
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.send('AdiArc SQL Server Bridge is running.');
});

app.post('/api/sql', async (req, res) => {
  const { action, config: reqConfig, data } = req.body;

  if (!reqConfig || !reqConfig.server || !reqConfig.database || !reqConfig.user || !reqConfig.password) {
    return res.status(400).json({ success: false, message: 'Incomplete SQL server configuration.' });
  }

  const sqlConfig = {
    user: reqConfig.user,
    password: reqConfig.password,
    server: reqConfig.server,
    database: reqConfig.database,
    options: {
      encrypt: false, // For local dev, can be true for Azure SQL
      trustServerCertificate: true, // Necessary for local SQL Server with self-signed certs
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  try {
    const pool = await sql.connect(sqlConfig);

    if (action === 'test') {
      try {
        const result = await pool.request().query('SELECT DB_NAME() as db');
        await pool.close();
        return res.json({ success: true, message: `Successfully connected to database: ${result.recordset[0].db}` });
      } catch (err) {
        await pool.close();
        console.error('SQL Connection Error:', err);
        return res.status(500).json({ success: false, message: 'Connection failed.', error: err.message });
      }
    }

    if (action === 'upload') {
      if (!data || !Array.isArray(data)) {
        await pool.close();
        return res.status(400).json({ success: false, message: 'No data provided for upload.' });
      }

      const transaction = new sql.Transaction(pool);
      try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        const query = `
          IF NOT EXISTS (SELECT 1 FROM tbl_Mutations WHERE MutationNo = @id)
          BEGIN
              INSERT INTO tbl_Mutations (MutationNo, ImagePath, CreatedDate, Status)
              VALUES (@id, @filename, GETDATE(), 'Uploaded via AdiArc')
          END
        `;
        
        let insertedCount = 0;
        for (const item of data) {
          const result = await pool.request()
            .input('id', sql.NVarChar, item.id)
            .input('filename', sql.NVarChar, item.fileName)
            .query(query);

            if (result.rowsAffected[0] > 0) {
              insertedCount++;
            }
        }
        
        await transaction.commit();
        await pool.close();
        return res.json({ success: true, message: `Sync complete. ${insertedCount} new records inserted.` });

      } catch (err) {
        await transaction.rollback();
        await pool.close();
        console.error('SQL Upload Error:', err);
        return res.status(500).json({ success: false, message: 'Upload failed during transaction.', error: err.message });
      }
    }
    
    await pool.close();
    return res.status(400).json({ success: false, message: 'Invalid action specified.' });

  } catch (err) {
    console.error('SQL Global Error:', err);
    return res.status(500).json({ success: false, message: 'A critical error occurred with the SQL server connection.', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`AdiArc Server Proxy listening at http://localhost:${port}`);
});
