
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Copy, FileKey } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SqlGeneratorTab() {
  const { toast } = useToast();
  
  // State for Delete Intiqals
  const [intiqalIds, setIntiqalIds] = useState("");
  const [mauzaId, setMauzaId] = useState("");
  const [generatedDeleteQuery, setGeneratedDeleteQuery] = useState("");

  // State for Find User Login
  const [encryptionKey, setEncryptionKey] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [generatedFindUserQuery, setGeneratedFindUserQuery] = useState("");
  
  // State for Approve Intiqals
  const [approveIntiqalNos, setApproveIntiqalNos] = useState("");
  const [approveMauzaId, setApproveMauzaId] = useState("");
  const [generatedApproveQuery, setGeneratedApproveQuery] = useState("");


  const handleGenerateDeleteQuery = () => {
    const ids = intiqalIds
      .split(/[\s,;\n]+/)
      .map(id => id.trim())
      .filter(id => id);

    if (ids.length === 0) {
      toast({
        title: "No Intiqal IDs",
        description: "Please paste at least one Intiqal ID.",
        variant: "destructive",
      });
      return;
    }

    if (!mauzaId.trim()) {
      toast({
        title: "Missing Mauza ID",
        description: "Please provide the Mauza ID.",
        variant: "destructive",
      });
      return;
    }

    const formattedIds = ids.map(id => `'${id}'`).join(",\n    ");

    const query = `BEGIN TRAN;

DELETE FROM transactions.Intiqal
WHERE mauza_id = '${mauzaId.trim()}'
AND intiqal_id IN (
    ${formattedIds}
);

COMMIT TRAN;`;

    setGeneratedDeleteQuery(query);
    toast({
      title: "Query Generated",
      description: "The DELETE query has been created successfully.",
    });
  };

  const handleGenerateFindUserQuery = () => {
    if (!encryptionKey.trim()) {
      toast({
        title: "Missing Encryption Key",
        description: "Please provide the password for the master key.",
        variant: "destructive",
      });
      return;
    }
    if (!targetUserId.trim()) {
      toast({
        title: "Missing User ID",
        description: "Please provide the User ID to find.",
        variant: "destructive",
      });
      return;
    }

    const query = `OPEN MASTER KEY DECRYPTION BY PASSWORD = '${encryptionKey.trim()}';
DECLARE @TargetUserID UNIQUEIDENTIFIER = '${targetUserId.trim()}'
SELECT 
    U.first_name + ' ' + ISNULL(U.last_name, '') AS [Full Name],
    CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)) AS [Login ID]
FROM 
    users.[User] U
WHERE 
    U.user_id = @TargetUserID;
CLOSE MASTER KEY;`;
    
    setGeneratedFindUserQuery(query);
    toast({
      title: "Query Generated",
      description: "The find user login query has been created successfully.",
    });
  };

  const handleGenerateApproveQuery = () => {
    const tokens = approveIntiqalNos.split(/[\s,;\n]+/).map(id => id.trim()).filter(id => id);
    if (tokens.length === 0) {
      toast({ title: "No Intiqal Numbers", description: "Please enter at least one Intiqal number or range.", variant: "destructive" });
      return;
    }
    if (!approveMauzaId.trim()) {
      toast({ title: "Missing Mauza ID", description: "Please provide the Mauza ID.", variant: "destructive" });
      return;
    }

    const numbers = new Set<number>();
    for (const token of tokens) {
      const rangeMatch = token.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          for (let i = start; i <= end; i++) {
            numbers.add(i);
          }
        }
      } else {
        const num = parseInt(token, 10);
        if (!isNaN(num)) {
          numbers.add(num);
        }
      }
    }

    if (numbers.size === 0) {
        toast({ title: "No valid numbers found", description: "Please check your input for valid numbers or ranges.", variant: "destructive" });
        return;
    }

    const sortedNumbers = Array.from(numbers).sort((a,b) => a - b);
    const formattedNos = sortedNumbers.map(n => `'${n}'`).join(",\n    ");

    const query = `BEGIN TRAN;

UPDATE transactions.Intiqal
SET 
    is_approved = 1,
    intiqal_status = 6,
    intiqal_aprove_date = GETDATE()
WHERE 
    mauza_id = '${approveMauzaId.trim()}' AND
    LTRIM(RTRIM(CAST(intiqal_no AS NVARCHAR(50)))) IN (
        ${formattedNos}
    );

COMMIT TRAN;`;

    setGeneratedApproveQuery(query);
    toast({
      title: "Query Generated",
      description: `Approval script for ${sortedNumbers.length} intiqals has been created.`
    });
  };

  const handleCopy = async (queryToCopy: string) => {
    if (!queryToCopy) {
      toast({
        title: "Nothing to copy",
        description: "Generate a query first.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(queryToCopy);
      toast({
        title: "Query Copied",
        description: "The SQL query is now in your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy the query to your clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileKey className="h-5 w-5 text-primary" />
          SQL Script Generator
        </CardTitle>
        <CardDescription>
          Generate common SQL scripts for database maintenance tasks like deleting records or finding user credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="delete" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="delete">Delete Intiqals</TabsTrigger>
            <TabsTrigger value="findUser">Find User Login</TabsTrigger>
            <TabsTrigger value="approve">Approve Intiqals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="delete" className="mt-6">
             <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
              <div className="flex flex-col gap-4">
                <section className="space-y-2">
                  <Label htmlFor="mauza-id">1. Mauza ID</Label>
                  <Input
                    id="mauza-id"
                    value={mauzaId}
                    onChange={(e) => setMauzaId(e.target.value)}
                    placeholder="e.g., 41402c3e-57ff-4435-9d79-183f6d6a90cb"
                  />
                </section>
                <section className="space-y-2">
                  <Label htmlFor="intiqal-ids">2. Intiqal IDs to Delete</Label>
                  <Textarea
                    id="intiqal-ids"
                    value={intiqalIds}
                    onChange={(e) => setIntiqalIds(e.target.value)}
                    placeholder="Paste your list of Intiqal IDs here, separated by new lines, commas, or spaces."
                    className="h-72 font-mono text-xs"
                  />
                </section>
                <Button type="button" onClick={handleGenerateDeleteQuery}>
                    Generate Delete Script
                </Button>
              </div>
              <div className="flex flex-col gap-4 mt-6 lg:mt-0">
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="generated-delete-query">3. Generated SQL Script</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedDeleteQuery)} disabled={!generatedDeleteQuery}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    id="generated-delete-query"
                    readOnly
                    value={generatedDeleteQuery}
                    placeholder="Your generated SQL DELETE script will appear here."
                    className="h-96 font-mono text-xs bg-muted/30"
                  />
                </section>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="findUser" className="mt-6">
            <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
              <div className="flex flex-col gap-4">
                <section className="space-y-2">
                  <Label htmlFor="encryption-key">1. Encryption Key (Password)</Label>
                  <Input
                    id="encryption-key"
                    type="password"
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    placeholder="Enter the master key password"
                  />
                </section>
                <section className="space-y-2">
                  <Label htmlFor="target-user-id">2. Target User ID</Label>
                  <Input
                    id="target-user-id"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Paste the UNIQUEIDENTIFIER of the user"
                  />
                </section>
                <Button type="button" onClick={handleGenerateFindUserQuery}>
                    Generate Find Login Script
                </Button>
              </div>
              <div className="flex flex-col gap-4 mt-6 lg:mt-0">
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="generated-find-user-query">3. Generated SQL Script</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedFindUserQuery)} disabled={!generatedFindUserQuery}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    id="generated-find-user-query"
                    readOnly
                    value={generatedFindUserQuery}
                    placeholder="Your generated SQL script to find a user login will appear here."
                    className="h-96 font-mono text-xs bg-muted/30"
                  />
                </section>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="approve" className="mt-6">
             <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
              <div className="flex flex-col gap-4">
                <section className="space-y-2">
                  <Label htmlFor="approve-mauza-id">1. Mauza ID</Label>
                  <Input
                    id="approve-mauza-id"
                    value={approveMauzaId}
                    onChange={(e) => setApproveMauzaId(e.target.value)}
                    placeholder="e.g., 41402c3e-57ff-4435-9d79-183f6d6a90cb"
                  />
                </section>
                <section className="space-y-2">
                  <Label htmlFor="approve-intiqal-nos">2. Intiqal Numbers to Approve</Label>
                  <Textarea
                    id="approve-intiqal-nos"
                    value={approveIntiqalNos}
                    onChange={(e) => setApproveIntiqalNos(e.target.value)}
                    placeholder="Paste your list of Intiqal numbers here. Ranges like 5001-5100 are supported."
                    className="h-72 font-mono text-xs"
                  />
                </section>
                <Button type="button" onClick={handleGenerateApproveQuery}>
                    Generate Approve Script
                </Button>
              </div>
              <div className="flex flex-col gap-4 mt-6 lg:mt-0">
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="generated-approve-query">3. Generated SQL Script</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedApproveQuery)} disabled={!generatedApproveQuery}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    id="generated-approve-query"
                    readOnly
                    value={generatedApproveQuery}
                    placeholder="Your generated SQL UPDATE script will appear here."
                    className="h-96 font-mono text-xs bg-muted/30"
                  />
                </section>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


    