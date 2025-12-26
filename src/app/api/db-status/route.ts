
import { NextResponse } from 'next/server';
import net from 'net';

// This function attempts a quick socket connection to the IP and port.
// It avoids the overhead of the full mssql driver for a simple "is it online?" check.
function pingServer(host: string, port: number, timeout = 1500): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        const onError = () => {
            socket.destroy();
            resolve(false);
        };

        socket.setTimeout(timeout);
        socket.once('error', onError);
        socket.once('timeout', onError);

        socket.connect(port, host, () => {
            socket.end();
            resolve(true);
        });
    });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serverIp, port } = body;

    if (!serverIp || !port) {
        return NextResponse.json({ success: false, error: "Server IP and Port are required." }, { status: 400 });
    }

    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort)) {
        return NextResponse.json({ success: false, error: "Invalid port number." }, { status: 400 });
    }

    const isLive = await pingServer(serverIp, parsedPort);
    
    if (isLive) {
        return NextResponse.json({ success: true, message: "Server is Active and Reachable." });
    } else {
        return NextResponse.json({ success: false, error: "Connection Failed: The server is not reachable at this IP and port." }, { status: 400 });
    }

  } catch (error: any) {
    console.error('API DB Status Error:', error);
    return NextResponse.json({ success: false, error: "An unexpected server error occurred." }, { status: 500 });
  }
}
