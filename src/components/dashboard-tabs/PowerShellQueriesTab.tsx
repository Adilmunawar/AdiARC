
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PowerShellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m8 16 3-3-3-3" />
    <path d="m12 17 4 0" />
  </svg>
);


export function PowerShellQueriesTab() {
  const { toast } = useToast();

  // Shared Connection State
  const [server, setServer] = useLocalStorage("ps_server", "192.125.5.148");
  const [database, setDatabase] = useLocalStorage("ps_database", "Lahore4_Mauza");
  const [user, setUser] = useLocalStorage("ps_user", "sa");
  const [pass, setPass] = useLocalStorage("ps_pass", "justice@123");

  // Mutation Report State
  const [mutationOutFile, setMutationOutFile] = useLocalStorage("ps_mutation_outfile", "$HOME\\Desktop\\Daily_Progress_Report.json");
  const [generatedMutationScript, setGeneratedMutationScript] = useState("");

  // Data Entry Report State
  const [dataEntryOutFile, setDataEntryOutFile] = useLocalStorage("ps_dataentry_outfile", "$HOME\\Desktop\\Combined_Data_Entry_Report.json");
  const [generatedDataEntryScript, setGeneratedDataEntryScript] = useState("");

  const handleGenerateMutationScript = () => {
    if (!server || !database || !user || !pass || !mutationOutFile) {
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
$OutFile  = "${mutationOutFile}"

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

    setGeneratedMutationScript(script);
    toast({
      title: "Script Generated",
      description: "The Mutation Report PowerShell script has been created.",
    });
  };

  const handleGenerateDataEntryScript = () => {
     if (!server || !database || !user || !pass || !dataEntryOutFile) {
      toast({
        title: "All fields required",
        description: "Please fill in all configuration fields to generate the script.",
        variant: "destructive",
      });
      return;
    }
    const query = `WITH 
ShajraCounts AS (
    SELECT user_id, COUNT(familytree_id) as cnt 
    FROM [familytree].[FamilyTree] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY user_id
),
OwnershipCounts AS (
    SELECT user_id, COUNT(ownership_id) as cnt
    FROM [rhz].[Ownership] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY user_id
),
KhasraCounts AS (
    SELECT user_id, COUNT(khasra_id) as cnt
    FROM [rhz].[Khasra] WITH (NOLOCK)
    WHERE CAST(access_date_time AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY user_id
),
PossessionCounts AS (
    SELECT user_id, COUNT(possession_id) as cnt
    FROM [rhz].[Possession] WITH (NOLOCK)
    WHERE CAST(access_datetime AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY user_id
)

SELECT 
    sys.fn_varbintohexstr(U.user_name) AS [User Name],
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    
    ISNULL(S.cnt, 0) AS [Shajra (Family Tree)],
    ISNULL(O.cnt, 0) AS [Ownership],
    ISNULL(K.cnt, 0) AS [Khasra],
    ISNULL(P.cnt, 0) AS [Possession (Kashtkar)],
    
    (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0)) AS [Total Entries Today]

FROM [users].[User] U WITH (NOLOCK)
LEFT JOIN ShajraCounts S ON U.user_id = S.user_id
LEFT JOIN OwnershipCounts O ON U.user_id = O.user_id
LEFT JOIN KhasraCounts K ON U.user_id = K.user_id
LEFT JOIN PossessionCounts P ON U.user_id = P.user_id

WHERE (ISNULL(S.cnt, 0) + ISNULL(O.cnt, 0) + ISNULL(K.cnt, 0) + ISNULL(P.cnt, 0)) > 0
ORDER BY [Total Entries Today] DESC;`;

 const script = `# --- Configuration ---
$Server   = "${server}"
$Database = "${database}"
$User     = "${user}"
$Pass     = "${pass}"
$OutFile  = "${dataEntryOutFile}"

# --- The Combined Query ---
$Query = @"
${query}
"@

# --- Execution (Module-Free Method) ---
try {
    Write-Host "Connecting to $Server ($Database)..." -ForegroundColor Cyan

    # 1. Setup Standard Connection
    $ConnString = "Server=$Server;Database=$Database;User Id=$User;Password=$Pass;TrustServerCertificate=True;"
    $Connection = New-Object System.Data.SqlClient.SqlConnection($ConnString)
    $Connection.Open()

    # 2. execute Command
    $Command = $Connection.CreateCommand()
    $Command.CommandText = $Query
    $Command.CommandTimeout = 120 # 2 minute timeout for heavy queries

    # 3. Fetch Data
    $Adapter = New-Object System.Data.SqlClient.SqlDataAdapter $Command
    $DataSet = New-Object System.Data.DataSet
    $Adapter.Fill($DataSet) | Out-Null
    $Connection.Close()

    # 4. Process Results
    $Table = $DataSet.Tables[0]
    
    if ($Table.Rows.Count -eq 0) {
        "[]" | Out-File -FilePath $OutFile -Encoding utf8
        Write-Host "No data entry activity found for today." -ForegroundColor Yellow
    } else {
        # Clean Conversion to JSON
        $DataList = @()
        foreach ($Row in $Table.Rows) {
            $Obj = [Ordered]@{}
            foreach ($Col in $Table.Columns) {
                $Obj[$Col.ColumnName] = $Row[$Col]
            }
            $DataList += $Obj
        }

        # Save File
        $JsonData = $DataList | ConvertTo-Json -Depth 3 -Compress
        [System.IO.File]::WriteAllText($OutFile, $JsonData)
        
        Write-Host "Success! Report saved to:" -ForegroundColor Green
        Write-Host $OutFile -ForegroundColor White
    }

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}`;

    setGeneratedDataEntryScript(script);
    toast({
        title: "Script Generated",
        description: "The Data Entry Report PowerShell script has been created.",
    });
  };

  const handleCopy = async (queryToCopy: string) => {
    if (!queryToCopy) {
      toast({
        title: "Nothing to copy",
        description: "Generate a script first.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(queryToCopy);
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
          <PowerShellIcon className="h-5 w-5 text-primary" />
          PowerShell Query Generator
        </CardTitle>
        <CardDescription>
          Configure your database connection and generate ready-to-use PowerShell scripts to export reports as JSON files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
            <div className="space-y-1.5">
                <Label htmlFor="ps-server-ip">Server IP</Label>
                <Input id="ps-server-ip" value={server} onChange={(e) => setServer(e.target.value)} placeholder="e.g., 192.125.5.148" />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="ps-db-name">Database Name</Label>
                <Input id="ps-db-name" value={database} onChange={(e) => setDatabase(e.target.value)} placeholder="e.g., Lahore4_Mauza" />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="ps-user">Username</Label>
                <Input id="ps-user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="e.g., sa" />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="ps-pass">Password</Label>
                <Input id="ps-pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="e.g., justice@123" />
            </div>
        </section>

        <Tabs defaultValue="mutation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mutation">Mutation Report</TabsTrigger>
            <TabsTrigger value="data-entry">Data Entry Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mutation" className="mt-6">
             <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
              <div className="flex flex-col gap-4">
                 <section className="space-y-1.5">
                   <Label htmlFor="ps-mutation-outfile">Output File Path</Label>
                   <Input id="ps-mutation-outfile" value={mutationOutFile} onChange={(e) => setMutationOutFile(e.target.value)} placeholder="e.g., $HOME\\Desktop\\Daily_Progress_Report.json" />
                </section>
                <Button type="button" onClick={handleGenerateMutationScript} className="mt-2">
                    <Play className="mr-2 h-4 w-4" />
                    Generate Mutation Script
                </Button>
              </div>
              <div className="flex flex-col gap-4 mt-6 lg:mt-0">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Generated Script</h3>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(generatedMutationScript)} disabled={!generatedMutationScript}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Script
                    </Button>
                </div>
                <Textarea readOnly value={generatedMutationScript} placeholder="Your generated PowerShell script will appear here." className="h-80 font-mono text-xs bg-muted/30" />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="data-entry" className="mt-6">
             <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
              <div className="flex flex-col gap-4">
                <section className="space-y-1.5">
                   <Label htmlFor="ps-dataentry-outfile">Output File Path</Label>
                   <Input id="ps-dataentry-outfile" value={dataEntryOutFile} onChange={(e) => setDataEntryOutFile(e.target.value)} placeholder="e.g., $HOME\\Desktop\\Combined_Data_Entry_Report.json" />
                </section>
                <Button type="button" onClick={handleGenerateDataEntryScript} className="mt-2">
                    <Play className="mr-2 h-4 w-4" />
                    Generate Data Entry Script
                </Button>
              </div>
              <div className="flex flex-col gap-4 mt-6 lg:mt-0">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Generated Script</h3>
                    <Button variant="outline" size="sm" onClick={() => handleCopy(generatedDataEntryScript)} disabled={!generatedDataEntryScript}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Script
                    </Button>
                </div>
                <Textarea readOnly value={generatedDataEntryScript} placeholder="Your generated PowerShell script will appear here." className="h-80 font-mono text-xs bg-muted/30" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
