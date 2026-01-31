BEGIN TRAN;

UPDATE transactions.Intiqal
SET 
    intiqal_status = 6,
    is_approved = 1,
    user_id = 'e3cc6444-3008-4599-bc0a-91d49c5df8fb',
    intiqal_aprove_date = GETDATE()
WHERE 
    intiqal_id IN (
        'fcb516fc-1458-4627-8411-12cd1cd80f48',
    'fb54759e-1452-4cef-b582-17574694e806',
    '4de8cce9-0798-4553-b156-1c1abd59b275',
    '134794f3-ef85-46dc-b8b6-2a7c006b90b1',
    'b727696d-30b8-46db-be24-35a1c319fefc',
    '4b9f9940-ba65-438e-9d1c-4dc22a180efd',
    '6ad63f0d-e03b-480c-9aa6-4eb2cf500ed6',
    '2b0c5bfa-9683-4242-beb3-51c4411df732',
    '157e69ea-7f40-4cee-9812-55c6d707c9ef',
    'd377c7ff-f6a9-4268-a0ac-58d85700dd92',
    'f5503a49-1f0e-463e-8206-92dfc7eed853',
    'd9d83f00-70c1-40d7-9201-975f394cc43e',
    'dde63849-6e06-4230-998d-9a8a9ffa5c2e',
    '94b0bc2d-895b-42d7-b1b6-9ff07235dd78',
    '38d37d9f-8452-4254-8df6-a3a811df1b92',
    '33d6219c-64c1-4e80-8532-a98468e197ee',
    '7f4596e5-0251-4fd3-b3f7-b641fc2f3616',
    '02c7fa68-a7bd-4a41-bb05-b9bd5ba64ddc',
    '9750170e-6d98-415f-af4f-c92003af92cc',
    '1e383168-76fe-403f-bdaf-cc5e4164487d',
    '6e3bed31-1eeb-4397-86fa-dbc9dda89694',
    'b377c25d-2e23-45d3-b957-e4e8a5f415fc',
    '14a6e85a-1423-482d-8a76-e66e763c0f99',
    '6206d747-be60-49f6-8067-e91a59c47bcb',
    'bd5c655f-4dee-4974-abb6-e9c128503b8d',
    '0b413dba-acdc-4aff-bb5d-ed504671ed8f',
    'd21127d2-41ba-43f8-8284-f3f52bf4ea68'
    )
COMMIT TRAN;