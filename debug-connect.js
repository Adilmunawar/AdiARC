const sql = require('mssql');

// --- CONFIGURATION ---
// 1. IP Address
const SERVER = '192.125.6.11'; 
// 2. Database Name (Use 'master' first to test login, then 'Judiya_Pur')
const DATABASE = 'master'; 
// 3. Auth
const USER = 'sa';
const PASSWORD = 'justice@123';

async function testConnection() {
    console.log(`\n--- 🔍 DIAGNOSTIC MODE: Connecting to ${SERVER} ---`);
    console.log(`User: ${USER}`);
    console.log(`Target DB: ${DATABASE}`);

    // Configuration 1: The "Modern" Attempt
    const configModern = {
        user: USER,
        password: PASSWORD,
        server: SERVER,
        database: DATABASE,
        options: {
            encrypt: true, // Modern Default
            trustServerCertificate: true,
            connectTimeout: 5000
        }
    };

    // Configuration 2: The "Legacy" Attempt (Most likely to work for you)
    const configLegacy = {
        user: USER,
        password: PASSWORD,
        server: SERVER,
        database: DATABASE,
        options: {
            encrypt: false, // REQUIRED for SQL 2008/2012 local networks
            trustServerCertificate: true,
            enableArithAbort: true,
            connectTimeout: 5000,
            // Downgrade Security for Old Servers
            cryptoCredentialsDetails: {
                minVersion: 'TLSv1'
            }
        }
    };

    try {
        console.log("\nAttempt 1: Trying Modern Secure Connection...");
        await sql.connect(configModern);
        console.log("✅ SUCCESS! Connected using Modern Settings.");
        await sql.close();
        return;
    } catch (err) {
        console.log("❌ Failed (Modern):", err.code || err.message);
    }

    try {
        console.log("\nAttempt 2: Trying LEGACY Connection (No Encryption + TLS 1.0)...");
        await sql.connect(configLegacy);
        console.log("✅ SUCCESS! Connected using Legacy Settings.");
        console.log("👉 ACTION: Update your route.ts to use 'encrypt: false'");
        
        // Test Query
        const result = await sql.query`SELECT @@VERSION as ver`;
        console.log("\nServer Version:", result.recordset[0].ver);
        
        await sql.close();
        return;
    } catch (err) {
        console.log("❌ Failed (Legacy):", err.message);
        console.log("\n--- 🛑 DIAGNOSIS REPORT ---");
        
        if (err.code === 'ESOCKET') {
            console.log("Reason: The Server is not reachable at this IP/Port.");
            console.log("Fix 1: Is TCP/IP enabled in SQL Configuration Manager?");
            console.log("Fix 2: Is Windows Firewall blocking Port 1433?");
        } else if (err.code === 'ELOGIN') {
            console.log("Reason: The Server was found, but Password/User is wrong.");
        } else if (err.code === 'EPROTOCOL') {
            console.log("Reason: The Server is too old for Node.js default security.");
        }
    }
}

testConnection();