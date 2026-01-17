"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Play } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function PowerShellQueriesTab() {
  const { toast } = useToast();

  const [server, setServer] = useLocalStorage("ps_server", "192.125.5.148");
  const [database, setDatabase] = useLocalStorage("ps_database", "Lahore4_Mauza");
  const [user, setUser] = useLocalStorage("ps_user", "sa");
  const [pass, setPass] = useLocalStorage("ps_pass", "justice@123");
  const [outFile, setOutFile] = useLocalStorage("ps_outfile", "$HOME\\Desktop\\Daily_Progress_Report.json");
  const [generatedScript, setGeneratedScript] = useState("");

  const handleGenerateScript = () => {
    if (!server || !database || !user || !pass || !outFile) {
      toast({
        title: "All fields required",
        description: "Please fill in all configuration fields to generate the script.",
        variant: "destructive",
      });
      return;
    }
    const query = `SELECT 
    sys.fn_varbintohexstr(U.user_name) AS [User Name],
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    
    SUM(CASE 
        WHEN I.is_approved = 1 
             AND CAST(I.intiqal_aprove_date AS DATE) = CAST(GETDATE() AS DATE) 
        THEN 1 
        ELSE 0 
    END) AS [Implemented Today],

    SUM(CASE 
        WHEN (I.is_approved = 0 OR I.is_approved IS NULL) 
             AND CAST(I.access_datetime AS DATE) = CAST(GETDATE() AS DATE) 
        THEN 1 
        ELSE 0 
    END) AS [Pending (Active Today)],

    COUNT(I.intiqal_id) AS [Total Activity Today]

FROM 
    [transactions].[Intiqal] I WITH (NOLOCK)
INNER JOIN 
    [users].[User] U WITH (NOLOCK) ON I.user_id = U.user_id
WHERE 
    CAST(I.access_datetime AS DATE) = CAST(GETDATE() AS DATE)
    OR CAST(I.intiqal_aprove_date AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY 
    U.user_name, 
    U.first_name, 
    U.last_name
ORDER BY 
    [Implemented Today] DESC;`;

    const script = `# --- Configuration ---
$Server   = "${server}"
$Database = "${database}"
$User     = "${user}"
$Pass     = "${pass}"
$OutFile  = "${outFile}"

# --- The Query ---
$Query = @"
${query}
"@

# --- Execution (Using standard .NET - No Modules Required) ---
try {
    Write-Host "Connecting to $Database on $Server..." -ForegroundColor Cyan

    # Setup Connection
    $ConnString = "Server=$Server;Database=$Database;User Id=$User;Password=$Pass;TrustServerCertificate=True;"
    $Connection = New-Object System.Data.SqlClient.SqlConnection
    $Connection.ConnectionString = $ConnString
    $Connection.Open()

    # Create Command
    $Command = $Connection.CreateCommand()
    $Command.CommandText = $Query
    $Command.CommandTimeout = 120

    # Execute and Fill Data
    $Adapter = New-Object System.Data.SqlClient.SqlDataAdapter $Command
    $DataSet = New-Object System.Data.DataSet
    $Adapter.Fill($DataSet) | Out-Null
    
    $Connection.Close()

    # Process Results
    $Table = $DataSet.Tables[0]
    
    if ($Table.Rows.Count -eq 0) {
        Write-Host "No activity found for today." -ForegroundColor Yellow
        "[]" | Out-File -FilePath $OutFile -Encoding utf8
    }
    else {
        # Convert DataTable to Custom Object List for clean JSON
        $DataList = @()
        foreach ($Row in $Table.Rows) {
            $Obj = [Ordered]@{}
            foreach ($Col in $Table.Columns) {
                $Obj[$Col.ColumnName] = $Row[$Col]
            }
            $DataList += $Obj
        }

        # Save to JSON
        $JsonData = $DataList | ConvertTo-Json -Depth 3 -Compress
        [System.IO.File]::WriteAllText($OutFile, $JsonData)
        
        Write-Host "Success! Saved to:" -ForegroundColor Green
        Write-Host $OutFile -ForegroundColor Yellow
    }

} catch {
    Write-Host "Connection Failed: $($_.Exception.Message)" -ForegroundColor Red
}`;

    setGeneratedScript(script);
    toast({
      title: "Script Generated",
      description: "The PowerShell script has been created and is ready to copy.",
    });
  };

  const handleCopy = async () => {
    if (!generatedScript) {
      toast({
        title: "Nothing to copy",
        description: "Generate a script first.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedScript);
      toast({
        title: "Script Copied",
        description: "The PowerShell script is now in your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy the script.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="h-5 w-5 bg-[#012456] rounded-sm flex items-center justify-center p-0.5">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-full w-full"
            >
                <polyline points="8 9 13 12 8 15" />
                <line x1="14" y1="15" x2="18" y2="15" />
            </svg>
          </div>
          PowerShell Query Generator
        </CardTitle>
        <CardDescription>
          Configure your database connection and generate a ready-to-use PowerShell script to export the Daily Progress Report as a JSON file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold">1. Connection Configuration</h3>
            <section className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ps-server-ip">Server IP</Label>
                <Input
                  id="ps-server-ip"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="e.g., 192.125.5.148"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-db-name">Database Name</Label>
                <Input
                  id="ps-db-name"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="e.g., Lahore4_Mauza"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-user">Username</Label>
                <Input
                  id="ps-user"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="e.g., sa"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-pass">Password</Label>
                <Input
                  id="ps-pass"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="e.g., justice@123"
                />
              </div>
            </section>
            <section className="space-y-1.5">
               <Label htmlFor="ps-outfile">Output File Path</Label>
               <Input
                  id="ps-outfile"
                  value={outFile}
                  onChange={(e) => setOutFile(e.target.value)}
                  placeholder="e.g., $HOME\\Desktop\\Daily_Progress_Report.json"
                />
            </section>
            <Button type="button" onClick={handleGenerateScript} className="mt-2">
                <Play className="mr-2 h-4 w-4" />
                Generate Script
            </Button>
          </div>
          <div className="flex flex-col gap-4 mt-6 lg:mt-0">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">2. Generated PowerShell Script</h3>
                <Button variant="outline" size="sm" onClick={handleCopy} disabled={!generatedScript}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Script
                </Button>
            </div>
            <Textarea
              readOnly
              value={generatedScript}
              placeholder="Your generated PowerShell script will appear here. Click 'Generate Script' to get started."
              className="h-[28rem] font-mono text-xs bg-muted/30"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}