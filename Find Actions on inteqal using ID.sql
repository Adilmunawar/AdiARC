-- 1. Open Master Key for Decryption
OPEN MASTER KEY DECRYPTION BY PASSWORD = 'youwilllose';

DECLARE @TargetIntiqalID UNIQUEIDENTIFIER = 'f23752b7-79de-4463-82e4-94b2cac69d64';

SELECT 
    ActionDate AS [Timestamp],
    ISNULL(U.first_name + ' ' + ISNULL(U.last_name, ''), 'Unknown/Deleted') AS [User Name],
    ISNULL(CONVERT(NVARCHAR(100), DECRYPTBYKEYAUTOCERT(CERT_ID('Usercert'), NULL, U.user_name)), 'N/A') AS [Login ID],
    [Source Table],
    [Activity Description]
FROM (
    -- 1. VISITOR LOG (Who opened the screen)
    SELECT access_datetime AS ActionDate, user_id, 'Visitor Info' AS [Source Table], 
           'Viewed Record (Type: ' + ISNULL(CAST(visitor_type AS NVARCHAR(MAX)), 'N/A') + ')' AS [Activity Description]
    FROM transactions.TransactionVisitorInfo WHERE transaction_id = @TargetIntiqalID

    UNION ALL

    -- 2. WORKFLOW OPERATIONS (Implemented, Forwarded)
    SELECT access_datetime, user_id, 'Workflow Ops', 
           CAST(remarks AS NVARCHAR(MAX))
    FROM transactions.TransactionOperations WHERE transaction_id = @TargetIntiqalID

    UNION ALL

    -- 3. INBOX MESSAGES (Senders)
    SELECT access_datetime, fromId, 'Inbox (Sender)', 
           'Sent Message: ' + CAST(subject AS NVARCHAR(MAX))
    FROM transactions.Inbox WHERE transactionId = @TargetIntiqalID

    UNION ALL

    -- 4. INBOX MESSAGES (Receivers)
    SELECT access_datetime, toId, 'Inbox (Receiver)', 
           'Received Message: ' + CAST(subject AS NVARCHAR(MAX))
    FROM transactions.Inbox WHERE transactionId = @TargetIntiqalID

    UNION ALL

    -- 5. JOB ASSIGNMENTS (Assigned By)
    SELECT access_datetime, assignedBy_user_id, 'Job Assignment (By)', 
           'Assigned Task to another user'
    FROM workflow.JobAssignment WHERE transaction_id = @TargetIntiqalID

    UNION ALL

    -- 6. JOB ASSIGNMENTS (Assigned To)
    SELECT access_datetime, assignedTo_user_id, 'Job Assignment (To)', 
           'Was Assigned a Task'
    FROM workflow.JobAssignment WHERE transaction_id = @TargetIntiqalID

    UNION ALL

    -- 7. REPORT GENERATION
    SELECT access_date_time, user_id, 'Report Log', 
           'Generated/Printed Report'
    FROM transactions.IntiqalReport WHERE intiqal_id = @TargetIntiqalID

    UNION ALL

    -- 8. CHARGES & FEES (Who handled payments)
    SELECT access_datetime, user_id, 'Charges/Fees', 
           'Updated Charges/Challan'
    FROM transactions.IntiqalCharges WHERE intiqal_id = @TargetIntiqalID

    UNION ALL

    -- 9. LOGICAL PARTITION (Who handled the data split)
    SELECT access_datetime, user_id, 'Logical Partition', 
           'Modified Mutation Structure'
    FROM transactions.IntiqalLogicalPartition WHERE intiqal_id = @TargetIntiqalID

    UNION ALL

    -- 10. TASK DETAILS (Specific task work)
    SELECT access_datetime, user_id, 'Task Detail', 
           'Worked on Task Detail'
    FROM workflow.TaskDetail WHERE intiqal_id = @TargetIntiqalID

    UNION ALL

    -- 11. SYSTEM LOGS (General Access)
    SELECT access_datetime, user_id, 'System Log', 
           'Accessed Table: ' + CAST(tablename AS NVARCHAR(MAX))
    FROM users.UsersLog WHERE transaction_id = @TargetIntiqalID

    UNION ALL

    -- 12. HISTORY (Edits)
    SELECT access_datetime, user_id, 'History Log', 
           'Status Change: ' + CAST(intiqal_status AS NVARCHAR(MAX))
    FROM transactions.HistoryIntiqal WHERE intiqal_id = @TargetIntiqalID

) AS AllEvents
-- Join to get User Names
LEFT JOIN users.[User] U ON AllEvents.user_id = U.user_id
WHERE AllEvents.user_id IS NOT NULL -- Filters out system automated tasks with no user
ORDER BY AllEvents.ActionDate DESC;

-- 2. Close Key
CLOSE MASTER KEY;