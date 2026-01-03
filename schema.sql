CREATE TABLE [transactions].[HistoryIntiqalCourtOrder] (
[intiqalcourtorder_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[case_number] nvarchar(50),
[case_type] nvarchar(100),
[application_date] datetime,
[decision_date] datetime,
[court_name] nvarchar(100),
[judge_name] nvarchar(100),
[case_detail] nvarchar(250),
[copyattestation_date] date,
[operation_id] int,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [tmp].[tmpRemarksabc123] (
[remarks_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[description] nvarchar(1000),
[remarks_type] smallint,
[remarks_insertion_type] smallint,
[is_redink] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [transactions].[IntiqalPatta] (
[intiqalpatta_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[patta_start_date] datetime,
[patta_end_date] datetime,
[patta_lagan] nvarchar(50),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion,
PRIMARY KEY ([intiqalpatta_id])
);

CREATE TABLE [transactions].[TransactionOperations] (
[transaction_id] uniqueidentifier NOT NULL,
[Operation_id] uniqueidentifier NOT NULL,
[Remarks] nvarchar(200),
[transaction_type] nvarchar(50),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([transaction_id], [Operation_id])
);

CREATE TABLE [tmp].[tmpPersonKhatuniabc123] (
[person_khatuni_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[is_updated] bit NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [fardbadr].[FardBadrKhatuni] (
[fardbadrkhatuni_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[khatuni_type_id] uniqueidentifier,
[fardbadrtype_id] varchar(500),
[possession_id] uniqueidentifier,
[person_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khatuni_no] varbinary(150),
[person_share_old] varbinary(100),
[person_area] varchar(50),
[total_share] varbinary(100),
[total_area] varchar(50),
[person_status_id] uniqueidentifier,
[laagan] varbinary(1100),
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[person_share] varchar(250),
PRIMARY KEY ([fardbadrkhatuni_id])
);

CREATE TABLE [rhz].[Possession] (
[possession_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share_old] varbinary(100),
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[wrong_fields] varchar(200),
[dimension] nvarchar(30),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
[person_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[sys_datetime] datetime DEFAULT (getdate()),
[Area] int,
[person_share] varchar(250),
[person_area_1] bigint,
PRIMARY KEY ([possession_id])
);

CREATE TABLE [transactions].[IntiqalErrors] (
[intiqalerror_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[error_description] nvarchar(1000),
[user_id] uniqueidentifier,
[access_datetime] datetime,
PRIMARY KEY ([intiqalerror_id])
);

CREATE TABLE [transactions].[IntiqalTateema] (
[IntiqalTateema_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier NOT NULL,
[land_type_id] uniqueidentifier NOT NULL,
[khatuni_no] varbinary(60),
[current_khasra_no] varbinary(150),
[old_khasra_no] varbinary(150),
[north] int NOT NULL,
[east] int NOT NULL,
[west] int NOT NULL,
[south] int NOT NULL,
[northwest] int,
[westsouth] int,
[southeast] int,
[eastnorth] int,
[calc_area] varchar(50),
[sketch] nvarchar(max),
[sketch_image] varbinary(max),
[area] varchar(50),
[remarks] nvarchar(500),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[area_format] smallint,
PRIMARY KEY ([IntiqalTateema_id])
);

CREATE TABLE [tmp].[tmpOwnership1] (
[mauza_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[family_no] nvarchar(500),
[first_name] nvarchar(200),
[relation_id] int,
[last_name] nvarchar(200),
[person_status_id] int,
[person_status] nvarchar(100),
[dep_person_fname] nvarchar(200),
[caste_id] uniqueidentifier,
[caste_name] nvarchar(100),
[person_share] varchar(100),
[person_area] bigint,
[pass_book_no] varchar(15),
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [correction].[Khasra] (
[khasra_id] uniqueidentifier NOT NULL,
[parent_khasra_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khasra_no] varbinary(1650),
[old_khasra_no] varbinary(6100),
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[khasra_area] bigint,
[khasra_dimension] varbinary(150),
[print_sequence_no] int,
[is_blocked] bit,
[block_detail] nvarchar(150),
[is_urban] bit,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[land_classification] smallint,
[location] smallint,
[rate] int,
[rate_units] smallint,
[user_id] uniqueidentifier,
[muraba_no] varchar(10),
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[khasra_correction_id] bigint NOT NULL IDENTITY(1,1),
[is_new] bit,
[change_fields] nvarchar(200),
[TaskID] uniqueidentifier,
[land_type_name] nvarchar(200),
[irrigation_source_name] nvarchar(200),
[OperationType] int,
PRIMARY KEY ([khasra_correction_id])
);

CREATE TABLE [users].[Module] (
[module_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[description] nvarchar(50),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([module_id])
);

CREATE TABLE [transactions].[HistoryIntiqalKhatuni] (
[intiqalkhatuni_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khatuni_no] nvarchar(50),
[khatuni_description] nvarchar(2000),
[is_new] bit,
[old_laagan] nvarchar(500),
[new_laagan] nvarchar(500),
[operation_id] int,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [generic].[BandSawalAnswers] (
[band_sawal_answer_id] uniqueidentifier NOT NULL,
[band_sawal_id] uniqueidentifier NOT NULL,
[question_id] int NOT NULL,
[answer] nvarchar(100),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([band_sawal_answer_id])
);

CREATE TABLE [transactions].[IntiqalChecks] (
[intiqal_check_id] uniqueidentifier NOT NULL,
[intiqal_type] int NOT NULL,
[IP_Address] nvarchar(50) NOT NULL,
[intiqal_check_description] nvarchar(1000) NOT NULL,
[is_check_implimented] bit NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
PRIMARY KEY ([intiqal_check_id])
);

CREATE TABLE [tmp].[tmptbl_Duplicate_intiqal] (
[district_name] nvarchar(50),
[tehsil_name] nvarchar(50),
[mauza_name] nvarchar(50),
[mauza_id] uniqueidentifier NOT NULL,
[intiqals] varchar(max)
);

CREATE TABLE [users].[UserRoles] (
[user_roles_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[role_id] uniqueidentifier NOT NULL,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([user_roles_id])
);

CREATE TABLE [transactions].[HistoryIntiqalCharges] (
[intiqalcharges_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[intiqal_district_fee] bigint,
[Intiqal_fee] bigint,
[intiqal_stamp_duty] bigint,
[intiqal_cvt] bigint,
[chalan_no] varchar(15),
[bank_name] nvarchar(200),
[branch_name] nvarchar(200),
[amount_paid] bigint,
[payment_date] datetime,
[history_operation_id] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [transactions].[IntiqalBankOrder] (
[intiqalbankorder_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[issue_date] datetime,
[letter_number] varbinary(250),
[bank_name] varbinary(450),
[branch_name] varbinary(450),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqalbankorder_id])
);

CREATE TABLE [dbo].[webpages_UsersInRoles] (
[UserId] int NOT NULL,
[RoleId] int NOT NULL,
PRIMARY KEY ([UserId], [RoleId])
);

CREATE TABLE [tmp].[tmptbl_mauzas] (
[mauza_id] uniqueidentifier NOT NULL,
[is_done] bit
);

CREATE TABLE [Setup].[TaxRate] (
[tax_id] uniqueidentifier NOT NULL,
[start_area] varchar(25) NOT NULL,
[end_area] varchar(25) NOT NULL,
[rate_per_akar] int NOT NULL,
[is_bagh] bit NOT NULL,
[date] datetime,
[province_id] smallint NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([tax_id])
);

CREATE TABLE [tmp].[RoleRights] (
[role_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[role_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [tmp].[tmpIntiqalRegisteryabc123] (
[intiqalregistery_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[registery_no] varchar(50),
[bahi_no] int,
[jild_no] int,
[sub_registrar] nvarchar(50),
[registery_date] datetime,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [Setup].[IntiqalFees] (
[Intiqal_fee_id] bigint NOT NULL IDENTITY(1,1),
[Intiqal_type_id] int NOT NULL,
[Intiqal_fee] bigint,
[Stamp_duty] bigint NOT NULL,
[Council_fee] bigint,
[Patwari_fee] bigint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([Intiqal_fee_id])
);

CREATE TABLE [rhz].[HistoryPersonKhatuni] (
[person_khatuni_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[is_updated] bit DEFAULT ((0)) NOT NULL,
[operation_id] smallint,
[parent_person_khatuni_id] uniqueidentifier,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [utility].[JobStatus] (
[instance_id] int,
[job_id] uniqueidentifier,
[name] varchar(50),
[run_date] datetime,
[run_time] datetime,
[run_datetime] AS ([run_date]+[run_time]) NOT NULL,
[description] varchar(2000),
[completion_status] smallint
);

CREATE TABLE [rhz].[HistoryKhasraAbadi] (
[khasra_abadi_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier NOT NULL,
[land_type_id] uniqueidentifier,
[block_no] nvarchar(50),
[allotment_no] int,
[registery_area] varchar(21),
[taqseem_reason] nvarchar(50),
[mustamil_reason] nvarchar(50),
[rent] nvarchar(50),
[operation_id] smallint,
[parent_khasra_abadi_id] uniqueidentifier,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [fard].[FardGuardian] (
[fard_id] uniqueidentifier NOT NULL,
[case_no] varchar(50) NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[decision_date] datetime NOT NULL,
[court_name] nvarchar(50) NOT NULL,
[case_image] image,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fard_id], [case_no])
);

CREATE TABLE [tmp].[DataTransferLog] (
[ID] int NOT NULL IDENTITY(1,1),
[logrowcount] int,
[logdescription] varchar(8000),
[errmsg] varchar(8000)
);

CREATE TABLE [transactions].[Inbox] (
[fromId] uniqueidentifier NOT NULL,
[toId] uniqueidentifier NOT NULL,
[subject] nvarchar(50) NOT NULL,
[message] nvarchar(200) NOT NULL,
[transactionId] uniqueidentifier NOT NULL,
[transactionType] varchar(50) NOT NULL,
[access_datetime] datetime NOT NULL,
[IsRead] bit,
[timestamp] rowversion NOT NULL,
[messageId] uniqueidentifier NOT NULL
);

CREATE TABLE [tmp].[IntiqalLogicalPartition] (
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[intiqal_sub_type_id] int,
[TotalKhewatArea] bigint,
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [tmp].[tmptbl_intiqal] (
[district_name] nvarchar(50),
[tehsil_name] nvarchar(50),
[mauza_name] nvarchar(50),
[mauza_id] uniqueidentifier NOT NULL,
[intiqalNoFrom] int,
[intiqalNoTo] int,
[existingIntiqalNo] int,
[missingIntiqals] varchar(max)
);

CREATE TABLE [rhz].[HistoryRHZTitle] (
[title_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[receiving_date] datetime,
[entry_date] datetime,
[shajranasb] nvarchar(100),
[indexkhasra] nvarchar(100),
[rhz] nvarchar(max),
[note] nvarchar(100),
[rhd] nvarchar(100),
[maprightschahat] nvarchar(100),
[fard] nvarchar(100),
[maprightspan] nvarchar(100),
[shajra] nvarchar(100),
[fardbadr] nvarchar(100),
[noteqanongo] nvarchar(100),
[notero] nvarchar(100),
[certificate] nvarchar(100),
[approvedtransfer] nvarchar(100),
[comments] nvarchar(100),
[operation_id] smallint,
[parent_title_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [tmp].[menu] (
[menu_id] int NOT NULL,
[description] nvarchar(255),
[parent_id] int
);

CREATE TABLE [tmp].[FamilyTree] (
[familytree_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[person_id] uniqueidentifier,
[family_no] varbinary(200),
[dep_person_id] uniqueidentifier,
[is_numberdar] bit,
[is_childless] bit,
[sequence_no] int,
[remarks] nvarchar(1000),
[intiqal_no] int,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[family_type] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [tmp].[FieldLevelSecurity1] (
[field_level_security_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier NOT NULL,
[field_id] nvarchar(50) NOT NULL,
[field_name] nvarchar(150) NOT NULL,
[access_date_time] datetime,
[access_user_id] uniqueidentifier,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [rhz].[Khewat] (
[khewat_id] uniqueidentifier NOT NULL,
[parent_khewat_id] uniqueidentifier,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[khewat_no] varbinary(150),
[old_khewat_no] varbinary(1000),
[sub_khewat_no] varbinary(150) DEFAULT ((1)),
[maalia] varbinary(1100),
[haboob] varbinary(250),
[is_shared] bit,
[is_sikni] bit,
[khewat_type] smallint,
[is_blocked] bit DEFAULT ((0)),
[block_detail] nvarchar(500),
[total_share] varbinary(100),
[total_area] varchar(50),
[is_updated] bit DEFAULT ((0)),
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[FirstOwner] nvarchar(200),
[TotalOwners] int,
[time_stamp] rowversion NOT NULL,
[area_format] smallint,
[khewat_type_meezan] smallint,
[sys_datetime] datetime DEFAULT (getdate()),
[total_khasra_area] bigint,
[total_khewat_area] bigint,
[Area] int,
[total_area_1] bigint,
PRIMARY KEY ([khewat_id])
);

CREATE TABLE [tmp].[tmpIntiqalCourtOrderabc123] (
[intiqalcourtorder_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[case_number] nvarchar(50),
[case_type] nvarchar(100),
[application_date] datetime,
[decision_date] datetime,
[court_name] nvarchar(100),
[judge_name] nvarchar(100),
[case_detail] nvarchar(250),
[copyattestation_date] date,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [users].[FieldLevelUserRights] (
[field_level_user_rights_id] uniqueidentifier NOT NULL,
[field_level_security_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[is_enable] bit DEFAULT ((1)),
[is_visible] bit DEFAULT ((1)),
[access_date_time] datetime,
[access_user_id] uniqueidentifier NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([field_level_user_rights_id])
);

CREATE TABLE [fard].[FardPersons] (
[fardperson_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[fardkhewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[person_status_id] int,
[poss_person_status_id] uniqueidentifier,
[person_area] varchar(50),
[person_share_old] varbinary(100),
[actual_person_area] varchar(50),
[actual_person_share] varbinary(100),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[area_format] smallint DEFAULT ((2)),
[person_share] varchar(250),
PRIMARY KEY ([fardperson_id])
);

CREATE TABLE [tmp].[tmpPossession2] (
[mauza_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[khatuni_no] nvarchar(50),
[first_name] nvarchar(200),
[relation_id] int,
[depPersonName] nvarchar(200),
[last_name] nvarchar(200),
[person_status_id] uniqueidentifier,
[person_status_name] nvarchar(100),
[khatuni_type_id] uniqueidentifier,
[khatuni_type_name] nvarchar(200),
[caste_id] uniqueidentifier,
[caste_name] nvarchar(100),
[person_share] varchar(60),
[person_area] bigint,
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [users].[UsersLog] (
[userlog_id] uniqueidentifier NOT NULL,
[operation_id] int,
[tablename] varchar(50),
[transaction_id] uniqueidentifier,
[ipadress] varchar(50),
[user_id] uniqueidentifier,
[access_datetime] datetime,
PRIMARY KEY ([userlog_id])
);

CREATE TABLE [tmp].[tmpPossession1] (
[mauza_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[khatuni_no] nvarchar(50),
[first_name] nvarchar(200),
[relation_id] int,
[depPersonName] nvarchar(200),
[last_name] nvarchar(200),
[person_status_id] uniqueidentifier,
[person_status_name] nvarchar(100),
[khatuni_type_id] uniqueidentifier,
[khatuni_type_name] nvarchar(200),
[caste_id] uniqueidentifier,
[caste_name] nvarchar(100),
[person_share] varchar(60),
[person_area] bigint,
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [territory].[PatwarCircle] (
[patwar_circle_id] uniqueidentifier NOT NULL,
[qanoon_goi_id] uniqueidentifier,
[patwar_circle_name] nvarchar(50),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([patwar_circle_id])
);

CREATE TABLE [tmp].[forms] (
[form_id] uniqueidentifier NOT NULL,
[module_id] uniqueidentifier NOT NULL,
[menu_id] int,
[description] nvarchar(50),
[path] nvarchar(200),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [rhz].[Khasra] (
[khasra_id] uniqueidentifier NOT NULL,
[parent_khasra_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khasra_no] varbinary(1650),
[old_khasra_no] varbinary(6100),
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[khasra_area] varchar(50),
[khasra_dimension] varbinary(150),
[print_sequence_no] int,
[is_blocked] bit,
[block_detail] nvarchar(150),
[is_urban] bit,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[land_classification] smallint,
[location] smallint,
[rate] int,
[rate_units] smallint,
[user_id] uniqueidentifier,
[muraba_no] varchar(10),
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[khasra_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[khasra_no_urdu] nvarchar(1650),
[sub_khasra_no] nvarchar(50),
[sys_datetime] datetime DEFAULT (getdate()),
[Area] int,
[Khasra_area_1] bigint,
PRIMARY KEY ([khasra_id])
);

CREATE TABLE [tmp].[Pattiabc123] (
[patti_id] uniqueidentifier NOT NULL,
[taraf_id] uniqueidentifier,
[patti_name] nvarchar(50) NOT NULL,
[mauza_id] uniqueidentifier,
[remarks] nvarchar(500) NOT NULL,
[print_sequence_no] int NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [tmp].[FieldLevelSecurity] (
[field_level_security_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier NOT NULL,
[field_id] nvarchar(50) NOT NULL,
[field_name] nvarchar(150) NOT NULL,
[access_date_time] datetime,
[access_user_id] uniqueidentifier,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [rhz].[NumberdarKhewat] (
[numberdar_khewat_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[numberdar_id] uniqueidentifier,
[starting_khewat] varchar(25) NOT NULL,
[ending_khewat] varchar(25) NOT NULL,
[is_updated] bit,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([numberdar_khewat_id])
);

CREATE TABLE [rhz].[HistoryRemarksKhatuni] (
[remarkskhatuni_id] uniqueidentifier NOT NULL,
[remarks_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier,
[is_updated] bit NOT NULL,
[operation_id] smallint,
[parent_remarkskhatuni_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [tmp].[FieldLevelSecurity2] (
[field_level_security_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier NOT NULL,
[field_id] nvarchar(50) NOT NULL,
[field_name] nvarchar(150) NOT NULL,
[access_date_time] datetime,
[access_user_id] uniqueidentifier,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [tmp].[Ownership] (
[ownership_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[person_status_id] int,
[person_share_old] varbinary(300),
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier NOT NULL,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[access_datetime] datetime NOT NULL,
[kamasmarla] bit,
[time_stamp] rowversion NOT NULL,
[person_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[name_tarf_numberdar] nvarchar(100),
[parta_qisam_war] nvarchar(100),
[person_share] varchar(250)
);

CREATE TABLE [Setup].[PersonStatusRights] (
[person_status_id] uniqueidentifier NOT NULL,
[person_status_name] nvarchar(50) NOT NULL,
[is_sikni] bit,
[is_transaction] bit,
[Is_CalculateArea] bit,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([person_status_id])
);

CREATE TABLE [utility].[Version] (
[version_id] uniqueidentifier NOT NULL,
[major_version] int,
[minor_version] int,
[reason] nvarchar(2000),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([version_id])
);

CREATE TABLE [fard].[FardVisitors] (
[fardvisitor_id] uniqueidentifier NOT NULL,
[fard_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[owner_id] uniqueidentifier,
[visitor_status] int,
[is_verified] bit DEFAULT ((0)) NOT NULL,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fardvisitor_id])
);

CREATE TABLE [territory].[HistoryMauza] (
[mauza_id] uniqueidentifier NOT NULL,
[patwar_circle_id] uniqueidentifier,
[chak_tashkhees_id] uniqueidentifier,
[mauza_name] nvarchar(50),
[had_bust_no] int,
[feet_per_marla] smallint,
[preparation_year] int,
[is_misl_mayadi] bit,
[is_mauza_sikni] bit,
[is_marla_calculation_unit] bit,
[mauza_stage] tinyint,
[has_shamilat] bit,
[mauza_type] tinyint,
[area_format] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[operation_id] int,
[machine_id] varchar(50)
);

CREATE TABLE [territory].[Taraf] (
[taraf_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[taraf_name] nvarchar(50) NOT NULL,
[remarks] nvarchar(500) NOT NULL,
[print_sequence_no] int DEFAULT ((1)) NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([taraf_id])
);

CREATE TABLE [generic].[FieldBook] (
[fieldbook_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[land_type_id] uniqueidentifier,
[current_khasra_no] varbinary(850),
[old_khasra_no] varbinary(850),
[khatuni_no] varbinary(850),
[area] varchar(50),
[north] nvarchar(1000),
[east] nvarchar(1000),
[west] nvarchar(1000),
[south] nvarchar(1000),
[calc_area] nvarchar(3000),
[remarks] nvarchar(3000),
[sketch] nvarchar(max),
[is_updated] bit,
[is_active] bit,
[year] int,
[sequence_no] int,
[is_wrong] bit,
[wrong_detail] varchar(200),
[user_id] uniqueidentifier,
[muraba_no] varchar(10),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[person_info] nvarchar(4000),
[middle] nvarchar(200),
PRIMARY KEY ([fieldbook_id])
);

CREATE TABLE [tmp].[UserRights] (
[user_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[user_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [rhz].[HistoryRemarksPerson] (
[remarksperson_id] uniqueidentifier NOT NULL,
[remarks_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[is_updated] bit NOT NULL,
[operation_id] smallint,
[parent_remarksperson_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [dbo].[khewatKhatuni_1] (
[mauza_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[khatuni_id] uniqueidentifier,
[khatuni_no] nvarchar(100),
[sub_khatuni_no] nvarchar(100),
[totalmeezan] varchar(100)
);

CREATE TABLE [users].[UserQanoonGoi] (
[user_id] uniqueidentifier NOT NULL,
[qanoon_goi_id] uniqueidentifier NOT NULL,
[active_status] bit
);

CREATE TABLE [tmp].[forms1] (
[form_id] uniqueidentifier NOT NULL,
[module_id] uniqueidentifier NOT NULL,
[menu_id] int,
[description] nvarchar(50),
[path] nvarchar(200),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [tmp].[SSISmauza] (
[ID] uniqueidentifier
);

CREATE TABLE [generic].[NaqshaHaqooqChahatWaNalChahat] (
[naqshahaqooq_chahat_Id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier,
[is_chah] bit,
[chah_name] nvarchar(100),
[depth] int,
[umaq] int,
[harta_detail] nvarchar(250),
[nal_length] int,
[filter_length] int,
[diameter] varchar(50),
[power_source] nvarchar(100),
[is_continuous] bit,
[previous_detail] nvarchar(1000),
[person_id] uniqueidentifier,
[chah_user_name] nvarchar(50),
[remarks] nvarchar(1000),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[mauza_id] uniqueidentifier,
PRIMARY KEY ([naqshahaqooq_chahat_Id])
);

CREATE TABLE [transactions].[HistoryGardawri] (
[gardawari_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[crop_type_id] uniqueidentifier,
[land_type_id] uniqueidentifier,
[season_type_id] smallint,
[khasra_area] varchar(50),
[gardawari_date] datetime,
[gardawari_year] smallint,
[is_kharaba] bit,
[is_seh_hadda] bit,
[seh_hadda_description] nvarchar(100),
[is_dual_crop] bit,
[is_fruit] bit,
[total_land_types] smallint,
[operation_id] int,
[parent_gardawari_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [tmp].[ErrorLogKhasra] (
[khasra_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[erro_rdescription] varchar(500)
);

CREATE TABLE [rhz].[HistoryRemarks] (
[remarks_history_id] bigint NOT NULL IDENTITY(1,1),
[remarks_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[khewat_id] uniqueidentifier,
[description] nvarchar(3000),
[remarks_type] smallint,
[remarks_insertion_type] smallint,
[is_redink] bit,
[is_updated] bit,
[operation_id] smallint,
[parent_remarks_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([remarks_history_id])
);

CREATE TABLE [generic].[Partaal] (
[partaal_id] uniqueidentifier NOT NULL,
[patwar_circle_id] uniqueidentifier NOT NULL,
[name] nvarchar(25),
[designation] nvarchar(50),
[prev_check_date] datetime DEFAULT (((1)/(1))/(1)),
[curr_check_date] datetime,
[note] nvarchar(4000),
[remarks] nvarchar(1000),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([partaal_id], [patwar_circle_id])
);

CREATE TABLE [Setup].[KhatuniType] (
[khatuni_type_id] uniqueidentifier NOT NULL,
[khatuni_type_name] nvarchar(100) NOT NULL,
[is_transaction] bit,
[col_no] int,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
[khatuni_type_name_trimmed] AS (ltrim(rtrim([khatuni_type_name]))) PERSISTED NOT NULL,
PRIMARY KEY ([khatuni_type_id])
);

CREATE TABLE [users].[QanoonGoiRights] (
[qanoon_goi_rights_id] uniqueidentifier NOT NULL,
[qanoon_goi_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([qanoon_goi_rights_id])
);

CREATE TABLE [rhz].[PersonKhewat] (
[person_khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[is_owner] bit NOT NULL,
[is_updated] bit DEFAULT ((0)) NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([person_khewat_id])
);

CREATE TABLE [transactions].[RdInfo] (
[rdinfo_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[registery_no] varchar(50),
[bahi_no] int,
[jild_no] int,
[image_file] varbinary(max),
[registrytype] nvarchar(100),
[registry_stage] tinyint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion,
[mauza_id] uniqueidentifier
);

CREATE TABLE [tmp].[tmpWronEnteries] (
[KhewatSort] int,
[PrintGroup] int,
[mauza_id] uniqueidentifier,
[khewat_no] nvarchar(400),
[first_name] nvarchar(400),
[relation_name] nvarchar(200),
[last_name] nvarchar(400),
[caste_name] nvarchar(100),
[address] nvarchar(400),
[person_area] varchar(15),
[person_share] varchar(200),
[khasra_no] nvarchar(400),
[khasra_area] bigint,
[land_type_name] int,
[family_no] varchar(50),
[detail] nvarchar(2000)
);

CREATE TABLE [dbo].[khewatKhatuni] (
[mauza_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[khatuni_id] uniqueidentifier,
[khatuni_no] nvarchar(100),
[sub_khatuni_no] nvarchar(100),
[totalmeezan] varchar(100)
);

CREATE TABLE [mail].[Attachments] (
[attachment_id] uniqueidentifier NOT NULL,
[mail_id] uniqueidentifier,
[attachment_type_id] uniqueidentifier,
[attachment_name] nvarchar(50),
[attachment_file] varbinary(max),
[attachment_string] nvarchar(4000),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([attachment_id])
);

CREATE TABLE [tmp].[tempStatePossession] (
[possession_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share] varchar(21),
[person_area] bigint,
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[dimension] nvarchar(30),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL
);

CREATE TABLE [transactions].[TransactionVisitorInfo] (
[transactionvisitor_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier,
[transaction_id] uniqueidentifier NOT NULL,
[transaction_type] int,
[registery_no] varchar(50),
[bahi_no] int,
[jild_no] int,
[sub_registrar] nvarchar(50),
[registery_date] datetime,
[visitor_type] nvarchar(50),
[is_verified] bit,
[copyattestation_date] date,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([transactionvisitor_id])
);

CREATE TABLE [generic].[PassBookLog] (
[pass_book_id] uniqueidentifier NOT NULL,
[pass_book_no] varchar(10) NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[issue_date] datetime NOT NULL,
[post_office] nvarchar(50),
[units] int,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([pass_book_id])
);

CREATE TABLE [generic].[FardTaqseemAabRemarks] (
[fardtaqseemaabremark_id] uniqueidentifier NOT NULL,
[fard_taqseemaab_id] uniqueidentifier NOT NULL,
[remarks] nvarchar(1000),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fardtaqseemaabremark_id])
);

CREATE TABLE [tmp].[IntiqalPersonShare] (
[intiqalperson_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[poss_person_status_id] uniqueidentifier,
[person_status_id] smallint NOT NULL,
[person_total_share] varbinary(100),
[person_total_area] varchar(50),
[person_selling_share] varbinary(100) NOT NULL,
[person_selling_area] varchar(50),
[person_remaining_share] varbinary(100),
[khewat_total_area] varchar(50),
[khewat_total_khasra] varchar(25),
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[person_remaining_area] varchar(50),
[seller_bakibadastoor] varchar(50),
[buyer_bakibadastoor] varchar(50),
[area_format] smallint,
[total_share_transf] varchar(50),
[total_area_transf] varchar(50),
[measured_area] varchar(30)
);

CREATE TABLE [tmp].[tempStateKhasra] (
[khasra_id] uniqueidentifier NOT NULL,
[parent_khasra_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khasra_no] nvarchar(800),
[old_khasra_no] nvarchar(1000),
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[khasra_area] bigint,
[khasra_dimension] varchar(15),
[print_sequence_no] int,
[is_blocked] bit,
[block_detail] nvarchar(150),
[is_urban] bit,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[land_classification] smallint,
[location] smallint,
[rate] int,
[rate_units] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime
);

CREATE TABLE [tmp].[tmpIntiqalTateemaabc123] (
[IntiqalTateema_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier NOT NULL,
[land_type_id] uniqueidentifier NOT NULL,
[khatuni_no] varbinary(60),
[current_khasra_no] varbinary(150),
[old_khasra_no] varbinary(150),
[north] int NOT NULL,
[east] int NOT NULL,
[west] int NOT NULL,
[south] int NOT NULL,
[northwest] int,
[westsouth] int,
[southeast] int,
[eastnorth] int,
[calc_area] int,
[sketch] nvarchar(max),
[sketch_image] varbinary(max),
[area] int,
[remarks] nvarchar(500),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[area_format] smallint
);

CREATE TABLE [web].[Person] (
[person_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier,
[first_name] nvarchar(200),
[relation_id] int,
[last_name] nvarchar(200),
[address] nvarchar(200),
[nic] varchar(15),
[is_govt] bit,
[is_alive] bit,
[is_kashmiri] bit,
[pass_book_no] varchar(15),
[is_department] bit,
[thumb] nvarchar(max),
[pic_path] varchar(50),
[person_pic] varbinary(max),
[is_blocked] bit,
[block_detail] nvarchar(500),
[old_person_id] uniqueidentifier,
[is_updated] bit,
[is_active] bit,
[user_id] uniqueidentifier,
[person_fname] nvarchar(150),
[access_date_time] datetime
);

CREATE TABLE [rhz].[RHZTitle] (
[title_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[noteqanongo] nvarchar(100),
[receiving_date] datetime,
[entry_date] datetime,
[shajranasb] nvarchar(100),
[indexkhasra] nvarchar(100),
[rhz] nvarchar(max),
[note] nvarchar(100),
[rhd] nvarchar(100),
[maprightschahat] nvarchar(100),
[fard] nvarchar(100),
[maprightspan] nvarchar(100),
[shajra] nvarchar(100),
[fardbadr] nvarchar(100),
[notero] nvarchar(100),
[certificate] nvarchar(100),
[approvedtransfer] nvarchar(100),
[comments] nvarchar(100),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([title_id])
);

CREATE TABLE [users].[Menu] (
[menu_id] int NOT NULL,
[description] nvarchar(255),
[parent_id] int,
PRIMARY KEY ([menu_id])
);

CREATE TABLE [territory].[Patti] (
[patti_id] uniqueidentifier NOT NULL,
[taraf_id] uniqueidentifier,
[patti_name] nvarchar(50) NOT NULL,
[mauza_id] uniqueidentifier,
[remarks] nvarchar(500) NOT NULL,
[print_sequence_no] int DEFAULT ((1)) NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([patti_id])
);

CREATE TABLE [tmp].[Khatuni] (
[khatuni_id] uniqueidentifier NOT NULL,
[parent_khatuni_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khatuni_no] varbinary(250),
[sub_khatuni_no] varbinary(250),
[khatuni_type_id] uniqueidentifier,
[khatuni_description] nvarchar(4000),
[laagan] varbinary(1100),
[is_blocked] bit,
[block_detail] nvarchar(150),
[total_share] varbinary(200),
[total_area] varchar(50),
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(400),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[KashatkarName] nvarchar(200),
[Lagaan_Dahinda] nvarchar(4000),
[Building_owner] nvarchar(4000),
[time_stamp] rowversion NOT NULL,
[old_khatuni_no] varbinary(250),
[area_format] smallint
);

CREATE TABLE [transactions].[Taghayar] (
[taghayar_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_id] uniqueidentifier,
[intiqal_id] uniqueidentifier,
[gardawari_date] datetime,
[season_id] smallint,
[taghayar_status] smallint,
[taghayar_type] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([taghayar_id])
);

CREATE TABLE [Setup].[ChakTashkhees] (
[chak_tashkhees_id] uniqueidentifier NOT NULL,
[chak_tashkhees_name] nvarchar(50) NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([chak_tashkhees_id])
);

CREATE TABLE [tmp].[Tarafabc123] (
[taraf_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[taraf_name] nvarchar(50) NOT NULL,
[remarks] nvarchar(500) NOT NULL,
[print_sequence_no] int NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [transactions].[HistoryIntiqalPersonShare] (
[intiqalperson_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[poss_person_status_id] uniqueidentifier,
[person_status_id] smallint NOT NULL,
[person_total_share] varchar(21),
[person_total_area] varchar(50),
[person_selling_share] varchar(21) NOT NULL,
[person_selling_area] varchar(50),
[person_remaining_share] varchar(21),
[khewat_total_area] varchar(50),
[khewat_total_khasra] varchar(25),
[is_new] bit,
[operation_id] int,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[area_format] smallint
);

CREATE TABLE [generic].[NoteQanoonGo] (
[note_qanoongo_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[checking_date] datetime NOT NULL,
[checker_name] nvarchar(25),
[designation] nvarchar(50),
[checker_note] nvarchar(2000),
[checker_remarks] nvarchar(255),
[user_id] uniqueidentifier,
[access_datetime] datetime DEFAULT (getdate()),
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([note_qanoongo_id])
);

CREATE TABLE [tmp].[tmpScanImagesabc123] (
[image_id] uniqueidentifier NOT NULL,
[transaction_id] uniqueidentifier,
[name] varchar(250),
[image_type] nvarchar(50),
[image_file_path] nvarchar(250),
[user_id] uniqueidentifier,
[access_datetime] smalldatetime
);

CREATE TABLE [tmp].[tmpFieldBookMissing] (
[mauza_id] uniqueidentifier NOT NULL,
[fieldbook_id] uniqueidentifier NOT NULL,
[north] nvarchar(1000),
[east] nvarchar(1000),
[west] nvarchar(1000),
[south] nvarchar(1000),
[calc_area] nvarchar(max),
[land_type_id] uniqueidentifier,
[land_type_name] nvarchar(100),
[current_khasra_no] nvarchar(400),
[old_khasra_no] nvarchar(400),
[area] int,
[MissingDBRecord] nvarchar(35),
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [generic].[IntiqalDeed] (
[intiqaldeed_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[intiqal_id] uniqueidentifier,
[intiqal_type_id] int,
[khewat_no] int,
[area] nvarchar(50),
[fees] int,
[old_owner_detail] nvarchar(500),
[new_owner_detail] nvarchar(500),
[registry_no] int,
[registry_date] datetime,
[remarks] nvarchar(150),
[is_active] bit,
[is_wrong] bit,
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqaldeed_id])
);

CREATE TABLE [transactions].[IntiqalKhasra] (
[intiqalkhasra_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier NOT NULL,
[new_khasra_no] varbinary(150),
[khasra_total_area] varchar(50),
[khasra_selling_area] varchar(50),
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[area_format] smallint,
[khasra_remaining_area] varchar(50),
[khasra_total_area1] int,
[khasra_selling_area1] int,
[khasra_remaining_area1] int,
[khewat_total_area1] int,
PRIMARY KEY ([intiqalkhasra_id])
);

CREATE TABLE [rhz].[KhasraAbadi] (
[khasra_abadi_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier NOT NULL,
[land_type_id] uniqueidentifier,
[block_no] nvarchar(50),
[allotment_no] int,
[registery_area] bigint,
[taqseem_reason] nvarchar(50),
[mustamil_reason] nvarchar(50),
[rent] nvarchar(50),
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([khasra_abadi_id])
);

CREATE TABLE [transactions].[TransactionRemarks] (
[transaction_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[fardbadr_id] uniqueidentifier,
[taghayar_id] uniqueidentifier,
[designation] nvarchar(50),
[report] nvarchar(max),
[date] datetime,
[trans_id] uniqueidentifier,
[transaction_type_id] int,
PRIMARY KEY ([transaction_id])
);

CREATE TABLE [tmp].[WrongRecords] (
[KhewatSort] int,
[PrintGroup] int,
[mauza_id] uniqueidentifier,
[khewat_no] nvarchar(200),
[first_name] nvarchar(300),
[relation_name] nvarchar(100),
[last_name] nvarchar(300),
[caste_name] nvarchar(50),
[address] nvarchar(500),
[person_area] varchar(15),
[person_share] varchar(200),
[khasra_no] nvarchar(200),
[khasra_area] varchar(200),
[land_type_name] nvarchar(200),
[family_no] varchar(50),
[detail] nvarchar(1000),
[owner_name] nvarchar(1500)
);

CREATE TABLE [Setup].[IntiqalInitiation] (
[intiqalinitiation_id] int NOT NULL,
[intiqal_type_id] int NOT NULL,
[intiqal_initiation_id] int NOT NULL,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqalinitiation_id])
);

CREATE TABLE [tmp].[tmpIntiqalPersonInfoabc123] (
[intiqalperson_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[status] int,
[is_verified] bit,
[dep_person_id] uniqueidentifier,
[is_alive] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[old_person_caste_id] uniqueidentifier,
[old_person_name] nvarchar(400)
);

CREATE TABLE [tmp].[tempStateFamilyTree] (
[familytree_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[person_id] uniqueidentifier,
[family_no] varchar(100),
[dep_person_id] uniqueidentifier,
[is_numberdar] bit,
[is_childless] bit,
[sequence_no] int,
[remarks] nvarchar(1000),
[intiqal_no] int,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[family_type] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime
);

CREATE TABLE [tmp].[IntiqalCourtOrder] (
[intiqalcourtorder_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[case_number] nvarchar(50),
[case_type] nvarchar(100),
[application_date] datetime,
[decision_date] datetime,
[court_name] nvarchar(100),
[judge_name] nvarchar(100),
[case_detail] nvarchar(250),
[copyattestation_date] date,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion
);

CREATE TABLE [tmp].[DailyUserRecord] (
[id] int NOT NULL IDENTITY(1,1),
[dbname] varchar(50),
[date] datetime,
[user_name] nvarchar(100),
[login_name] nvarchar(100),
[familytree] int,
[ownership] int,
[possession] int,
[khasra] int,
[khatuni] int,
[khewat] int,
[gardawri] int,
[fardbadr] int,
[taghayar] int,
[intiqal] int,
[fieldbook] int,
[WajibUlArz] int,
[NaqshaHaqooqChahatWaNalChahat] int,
[FardTaqseemAab] int
);

CREATE TABLE [territory].[QanoonGoi] (
[qanoon_goi_id] uniqueidentifier NOT NULL,
[tehsil_id] uniqueidentifier,
[qanoon_goi_name] nvarchar(50),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([qanoon_goi_id])
);

CREATE TABLE [Setup].[FardBadrType] (
[fardbadrtype_id] uniqueidentifier NOT NULL,
[fardbadr_description] nvarchar(100) NOT NULL,
[fardbadrtype_no] tinyint,
[major_type_id] tinyint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion,
PRIMARY KEY ([fardbadrtype_id])
);

CREATE TABLE [generic].[Hidiati] (
[hidati_id] uniqueidentifier NOT NULL,
[patwar_circle_id] uniqueidentifier NOT NULL,
[letter_no] nvarchar(50),
[letter_date] datetime,
[receiving_date] datetime,
[designation] nvarchar(100),
[topic] nvarchar(500),
[description] nvarchar(4000),
[remarks] nvarchar(50),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([hidati_id], [patwar_circle_id])
);

CREATE TABLE [rhz].[HistoryPossessionAbadi] (
[possession_abadi_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[person_status_id] uniqueidentifier NOT NULL,
[person_type] smallint,
[person_share] varchar(15),
[person_area] varchar(20),
[dep_person_id] uniqueidentifier,
[rent] nvarchar(50),
[is_updated] bit,
[operation_id] smallint,
[parent_possession_abadi_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [fardbadr].[HistoryFardBadrKhasra] (
[fardbadrkhasra_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[khatuni_id] uniqueidentifier,
[khasra_id] uniqueidentifier NOT NULL,
[new_khasra_no] varchar(50),
[khasra_area] bigint,
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[history_operation_id] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [fardbadr].[FardBadrPerson] (
[fardbadrperson_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[person_name] varbinary(150),
[relation_id] int,
[person_fname] varbinary(150),
[nic] varbinary(80),
[address] varbinary(450),
[pass_book_no] varbinary(80),
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fardbadrperson_id])
);

CREATE TABLE [rhz].[HistoryNumberdarKhewat] (
[numberdar_khewat_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[numberdar_id] uniqueidentifier,
[starting_khewat] varchar(25) NOT NULL,
[ending_khewat] varchar(25) NOT NULL,
[is_updated] bit,
[operation_id] smallint,
[parent_numberdar_khewat_id] uniqueidentifier,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [transactions].[TaghayarCultivator] (
[taghayarcultivator_id] uniqueidentifier NOT NULL,
[taghayar_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[dep_person_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share_old] varbinary(100),
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[person_share] varchar(250),
PRIMARY KEY ([taghayarcultivator_id])
);

CREATE TABLE [familytree].[FamilyTreeImages] (
[id] int NOT NULL,
[data] image,
PRIMARY KEY ([id])
);

CREATE TABLE [tmp].[UserRights2] (
[user_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[user_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [users].[MauzaRights] (
[mauza_rights_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([mauza_rights_id])
);

CREATE TABLE [tmp].[tmpIntiqalPersonShareabc123] (
[intiqalperson_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[poss_person_status_id] uniqueidentifier,
[person_status_id] smallint NOT NULL,
[person_total_share] varbinary(100),
[person_total_area] int,
[person_selling_share] varbinary(100) NOT NULL,
[person_selling_area] int,
[person_remaining_share] varbinary(100),
[khewat_total_area] int,
[khewat_total_khasra] varchar(25),
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[person_remaining_area] varchar(50),
[seller_bakibadastoor] varchar(50),
[buyer_bakibadastoor] varchar(50),
[area_format] smallint,
[total_share_transf] varchar(50),
[total_area_transf] varchar(50),
[measured_area] varchar(50)
);

CREATE TABLE [transactions].[ScanImages] (
[image_id] uniqueidentifier NOT NULL,
[transaction_id] uniqueidentifier,
[name] varchar(250),
[image_type] nvarchar(50),
[image_file] varbinary(max),
[image_file_path] nvarchar(4000),
[user_id] uniqueidentifier,
[access_datetime] smalldatetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([image_id])
);

CREATE TABLE [transactions].[HistoryIntiqalPatta] (
[intiqalpatta_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[patta_start_date] datetime,
[patta_end_date] datetime,
[patta_lagan] nvarchar(50),
[operation_id] int,
[access_user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [tmp].[Khewat] (
[khewat_id] uniqueidentifier NOT NULL,
[parent_khewat_id] uniqueidentifier,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[khewat_no] varbinary(150),
[old_khewat_no] varbinary(1000),
[sub_khewat_no] varbinary(150),
[maalia] varbinary(1100),
[haboob] varbinary(250),
[is_shared] bit,
[is_sikni] bit,
[khewat_type] smallint,
[is_blocked] bit,
[block_detail] nvarchar(500),
[total_share] varbinary(100),
[total_area] varchar(50),
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[FirstOwner] nvarchar(200),
[TotalOwners] int,
[time_stamp] rowversion NOT NULL,
[area_format] smallint,
[khewat_type_meezan] smallint
);

CREATE TABLE [dbo].[webpages_Membership] (
[UserId] int NOT NULL,
[CreateDate] datetime,
[ConfirmationToken] nvarchar(128),
[IsConfirmed] bit DEFAULT ((0)),
[LastPasswordFailureDate] datetime,
[PasswordFailuresSinceLastSuccess] int DEFAULT ((0)) NOT NULL,
[Password] nvarchar(128) NOT NULL,
[PasswordChangedDate] datetime,
[PasswordSalt] nvarchar(128) NOT NULL,
[PasswordVerificationToken] nvarchar(128),
[PasswordVerificationTokenExpirationDate] datetime,
PRIMARY KEY ([UserId])
);

CREATE TABLE [users].[UserPatwarCircle] (
[user_id] uniqueidentifier NOT NULL,
[patwar_circle_id] uniqueidentifier NOT NULL,
[active_status] bit
);

CREATE TABLE [tmp].[tmp_FieldBook] (
[fieldbook_id] uniqueidentifier,
[district_name] nvarchar(50),
[tehsil_name] nvarchar(50),
[mauza_id] uniqueidentifier,
[mauza_name] nvarchar(50),
[current_khasra] nvarchar(200),
[khatuni_no] nvarchar(250),
[current_khasra_no] nvarchar(200),
[old_khasra_no] nvarchar(200),
[north] nvarchar(1000),
[east] nvarchar(1000),
[west] nvarchar(1000),
[south] nvarchar(1000),
[area] varchar(25),
[land_type_id] uniqueidentifier,
[land_type_name] nvarchar(50),
[remarks] nvarchar(500),
[calc_area] nvarchar(300),
[preparation_year] varchar(50),
[access_date_time] datetime,
[mauza_type] int,
[page_number] int,
[year] int,
[current_khasra_no1] nvarchar(200),
[person_info] nvarchar(max)
);

CREATE TABLE [generic].[Complaint] (
[complaint_id] uniqueidentifier NOT NULL,
[fard_id] uniqueidentifier,
[mauza_id] uniqueidentifier NOT NULL,
[complaint_no] nvarchar(200) NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[operation_id] uniqueidentifier,
[visit_purpose] nvarchar(20) NOT NULL,
[complaint_type] nvarchar(50) NOT NULL,
[complaint_detail] nvarchar(3000) NOT NULL,
[officer_name] nvarchar(50) NOT NULL,
[re_visit_date] datetime NOT NULL,
[new_caste_id] uniqueidentifier,
[new_name] nvarchar(105),
[status] smallint NOT NULL,
[report_patwari] nvarchar(2000),
[command_revenue_officer] nvarchar(2000),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([complaint_id])
);

CREATE TABLE [familytree].[RptShajraRows] (
[jobid] uniqueidentifier,
[pageno] int,
[rowno] int,
[col1] nvarchar(2000),
[pic1] int DEFAULT ((128)) NOT NULL,
[col2] nvarchar(2000),
[pic2] int DEFAULT ((128)) NOT NULL,
[col3] nvarchar(2000),
[pic3] int DEFAULT ((128)) NOT NULL,
[col4] nvarchar(2000),
[pic4] int DEFAULT ((128)) NOT NULL,
[col5] nvarchar(2000),
[pic5] int DEFAULT ((128)) NOT NULL,
[col6] nvarchar(2000),
[pic6] int DEFAULT ((128)) NOT NULL,
[col7] nvarchar(2000),
[pic7] int DEFAULT ((128)) NOT NULL,
[col8] nvarchar(2000),
[pic8] int DEFAULT ((128)) NOT NULL,
[row_id] int NOT NULL IDENTITY(1,1),
PRIMARY KEY ([row_id])
);

CREATE TABLE [tmp].[GardawriTemp] (
[mauza_id] uniqueidentifier,
[season_type_id] int,
[land_type_name] nvarchar(200),
[crop_name] nvarchar(200),
[gardawari_year] int,
[crop_type_id] uniqueidentifier,
[CropTotalOrder] int,
[khasra_area] varchar(25)
);

CREATE TABLE [tmp].[tmpFardBadrabc123] (
[fardbadr_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_id] uniqueidentifier,
[fardbadrtype_id] uniqueidentifier,
[fardbadr_no] int,
[fardbadr_status] smallint,
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime
);

CREATE TABLE [rhz].[GISKhasras] (
[giskhasras_id] int NOT NULL IDENTITY(1,1),
[khasra_id] uniqueidentifier,
[featId] int,
PRIMARY KEY ([giskhasras_id])
);

CREATE TABLE [users].[PatwarCircleRights] (
[patwar_circle_rights_id] uniqueidentifier NOT NULL,
[patwar_circle_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([patwar_circle_rights_id])
);

CREATE TABLE [tmp].[IntiqalCharges] (
[intiqalcharges_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[intiqal_district_fee] bigint,
[Intiqal_fee] bigint,
[intiqal_stamp_duty] bigint,
[intiqal_cvt] bigint,
[chalan_no] varchar(15),
[bank_name] varbinary(450),
[branch_name] varbinary(450),
[amount_paid] bigint,
[payment_date] datetime,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [rhz].[HistoryRemarksKhasra] (
[remarkskhasra_id] uniqueidentifier NOT NULL,
[remarks_id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[is_updated] bit NOT NULL,
[operation_id] smallint,
[parent_remarkskhasra_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [rhz].[RemarksKhasra] (
[remarkskhasra_id] uniqueidentifier NOT NULL,
[remarks_id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[is_updated] bit NOT NULL,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([remarkskhasra_id])
);

CREATE TABLE [fard].[Scan] (
[document_id] uniqueidentifier NOT NULL,
[document_name] nvarchar(50),
[description] nvarchar(50),
[image] binary(50),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([document_id])
);

CREATE TABLE [tmp].[RoleRights2] (
[role_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[role_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [tmp].[tmpNaqshaHaqooqChahatWaNalChahat] (
[mauza_id] uniqueidentifier,
[naqshahaqooq_chahat_Id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[khasra_no] nvarchar(800),
[is_chah] bit,
[chah_name] nvarchar(100),
[depth] int,
[umaq] int,
[harta_detail] nvarchar(250),
[nal_length] int,
[filter_length] int,
[diameter] varchar(50),
[power_source] nvarchar(100),
[previous_detail] nvarchar(1000),
[chah_user_name] nvarchar(50),
[is_continuous] bit
);

CREATE TABLE [tmp].[tmpIntiqalBankOrderabc123] (
[intiqalbankorder_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[issue_date] datetime,
[letter_number] varbinary(250),
[bank_name] varbinary(450),
[branch_name] varbinary(450),
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [utility].[tempdb_space_usage] (
[dt] datetime DEFAULT (getdate()),
[session_id] int DEFAULT (NULL),
[scope] char(70),
[Instance_unallocated_extent_pages] bigint,
[version_store_pages] bigint,
[Instance_userobj_alloc_pages] bigint,
[Instance_internalobj_alloc_pages] bigint,
[Instance_mixed_extent_alloc_pages] bigint,
[Sess_task_userobj_alloc_pages] bigint,
[Sess_task_userobj_deallocated_pages] bigint,
[Sess_task_internalobj_alloc_pages] bigint,
[Sess_task_internalobj_deallocated_pages] bigint,
[query_text] nvarchar(max)
);

CREATE TABLE [mail].[Mail] (
[mail_id] uniqueidentifier NOT NULL,
[from_id] uniqueidentifier,
[from_name] nvarchar(100),
[subject] nvarchar(100),
[message] nvarchar(4000),
[is_read] bit,
[is_active] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([mail_id])
);

CREATE TABLE [utility].[SSISConfigurations] (
[ConfigurationFilter] nvarchar(255) NOT NULL,
[ConfiguredValue] nvarchar(255),
[PackagePath] nvarchar(255) NOT NULL,
[ConfiguredValueType] nvarchar(20) NOT NULL
);

CREATE TABLE [users].[AdminUsers] (
[ID] int NOT NULL IDENTITY(1,1),
[Name] varchar(50),
[Email] varchar(50),
[Address] varchar(500),
[PhoneNo] varchar(50),
[Designation] varchar(50),
[Password] varchar(50),
[IsAdministrator] bit,
[IsActive] bit,
[CreatedDate] datetime,
[UpdatedDate] datetime,
PRIMARY KEY ([ID])
);

CREATE TABLE [Setup].[LandType] (
[land_type_id] uniqueidentifier NOT NULL,
[land_type_name] nvarchar(50) NOT NULL,
[is_cultivated] bit NOT NULL,
[is_irrigated] bit,
[is_sikni] bit NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion,
PRIMARY KEY ([land_type_id])
);

CREATE TABLE [users].[HistoryUserRights] (
[user_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[user_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[operation_id] int,
[machine_id] varchar(50),
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [familytree].[FamilyNumberLog] (
[family_number_log_id] uniqueidentifier NOT NULL,
[family_tree_id] uniqueidentifier,
[computrized_familytree_no] nvarchar(50),
[patwari_familytree_no] nvarchar(50),
PRIMARY KEY ([family_number_log_id])
);

CREATE TABLE [tmp].[menu2] (
[menu_id] int NOT NULL,
[description] nvarchar(255),
[parent_id] int
);

CREATE TABLE [familytree].[FamilyTreeCasteSequence_tmp] (
[familytree_caste_seq_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[caste_id] uniqueidentifier NOT NULL,
[sequence_no] int NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([familytree_caste_seq_id])
);

CREATE TABLE [territory].[ServiceCentreRegion] (
[service_centre_region_id] uniqueidentifier NOT NULL,
[service_centre_id] uniqueidentifier,
[qanoon_goi_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([service_centre_region_id])
);

CREATE TABLE [workflow].[JobAssignment] (
[job_assignment_id] uniqueidentifier NOT NULL,
[transaction_id] uniqueidentifier,
[assignedBy_user_id] uniqueidentifier,
[assignedTo_user_id] uniqueidentifier,
[remarks] nvarchar(250),
[task_type] tinyint,
[status] tinyint,
[dbname] varchar(20),
[access_datetime] datetime,
[is_primary] bit,
PRIMARY KEY ([job_assignment_id])
);

CREATE TABLE [generic].[Configurations] (
[config_key] varchar(50) NOT NULL,
[config_value] varbinary(2000),
[id] varbinary(500),
PRIMARY KEY ([config_key])
);

CREATE TABLE [generic].[WrongEntries] (
[wrong_entry_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[transaction_id] uniqueidentifier,
[pk_field_name] varchar(50),
[table_name] varchar(50),
[wrong_field_name] varchar(200),
[detail] nvarchar(1000),
[khewat_no] varchar(50),
[grp_field] varchar(50),
[difference] bigint,
[KhewatOwners] int,
PRIMARY KEY ([wrong_entry_id])
);

CREATE TABLE [tmp].[tmpOwnership2] (
[mauza_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[family_no] nvarchar(500),
[first_name] nvarchar(200),
[relation_id] int,
[last_name] nvarchar(200),
[person_status_id] int,
[person_status] nvarchar(100),
[dep_person_fname] nvarchar(200),
[caste_id] uniqueidentifier,
[caste_name] nvarchar(100),
[person_share] varchar(100),
[person_area] bigint,
[pass_book_no] varchar(15),
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [fardbadr].[FardBadrKhasra] (
[fardbadrkhasra_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[khatuni_id] uniqueidentifier,
[khasra_id] uniqueidentifier NOT NULL,
[new_khasra_no] varbinary(150),
[khasra_area] varchar(50),
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fardbadrkhasra_id])
);

CREATE TABLE [rhz].[NakhlishtanTreeQuantity] (
[nakhlistantree_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier,
[madaah_qty] int,
[khassi_qty] int,
[naar_qty] int,
[total_qty] int,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([nakhlistantree_id])
);

CREATE TABLE [error].[ErrorLog] (
[error_id] bigint NOT NULL IDENTITY(1,1),
[error_code] bigint,
[error_desc] varchar(1500),
[error_origin] varchar(1500),
[error_type] varchar(100),
[error_action] varchar(50),
[error_time] datetime DEFAULT (getdate()),
[host_name] varchar(50),
PRIMARY KEY ([error_id])
);

CREATE TABLE [Setup].[ChakUnit] (
[chak_unit_id] uniqueidentifier NOT NULL,
[tehsil_id] uniqueidentifier NOT NULL,
[chak_tashkhees_id] uniqueidentifier NOT NULL,
[land_type_id] uniqueidentifier NOT NULL,
[unit] smallint NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([chak_unit_id])
);

CREATE TABLE [tmp].[tmpPossession] (
[mauza_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[khatuni_no] nvarchar(50),
[first_name] nvarchar(200),
[relation_id] int,
[depPersonName] nvarchar(200),
[last_name] nvarchar(200),
[person_status_id] uniqueidentifier,
[person_status_name] nvarchar(100),
[khatuni_type_id] uniqueidentifier,
[khatuni_type_name] nvarchar(200),
[caste_id] uniqueidentifier,
[caste_name] nvarchar(100),
[person_share] varchar(60),
[person_area] bigint,
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [rhz].[RegisterSchema] (
[register_schema_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier,
[share] varchar(21),
[list_owner_id] uniqueidentifier,
[logical_partition_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([register_schema_id])
);

CREATE TABLE [generic].[BandSawal] (
[band_sawal_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[patwari_approved_date] datetime,
[gardawar_approved_date] datetime,
[ro_approved_date] datetime,
[approved_place] nvarchar(50),
[seller_approved_date] datetime,
[witness_approved_date] datetime,
[band_sawal_orders] nvarchar(100),
[ro_statement] nvarchar(50),
[remarks] nvarchar(50),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([band_sawal_id])
);

CREATE TABLE [generic].[ParchaKhatuni] (
[parchakhatuni_id] uniqueidentifier NOT NULL,
[khewat_no] varchar(50),
[khatuni_no] varchar(50),
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[person_id] uniqueidentifier,
[person_status_id] uniqueidentifier,
[person_share] varchar(25),
[person_area] varchar(15),
[remarks_possession] nvarchar(200),
[old_khasra_no] varchar(50),
[current_khasra_no] varchar(50),
[area] varchar(15),
[share] varchar(25),
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[laagan] varchar(10),
[haboob] varchar(10),
[remarks] nvarchar(200),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([parchakhatuni_id])
);

CREATE TABLE [transactions].[IntiqalLogicalPartition] (
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[intiqal_sub_type_id] int,
[TotalKhewatArea] bigint,
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqal_logicalpartition_id])
);

CREATE TABLE [tmp].[tempStateOwnership] (
[ownership_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[person_status_id] int,
[dep_person_id] uniqueidentifier NOT NULL,
[parent_ownership_id] uniqueidentifier,
[operation_id] smallint,
[person_area] bigint,
[person_share] varchar(21),
[access_datetime] datetime NOT NULL,
[data_type] char(1),
[is_active] bit,
[is_updated] bit NOT NULL,
[print_sequence_no] int NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[time_stamp] rowversion NOT NULL,
[ownership_history_id] bigint NOT NULL IDENTITY(1,1),
[is_wrong] bit,
[wrong_fields] varchar(200),
[is_blocked] bit,
[block_detail] nvarchar(1000)
);

CREATE TABLE [Setup].[IntiqalInitiationType] (
[intiqal_initiation_id] int NOT NULL,
[intiqal_initiation_description] nvarchar(100),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqal_initiation_id])
);

CREATE TABLE [generic].[RegisterScheme] (
[Register_scheme_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[person_name] nvarchar(300),
[old_area] bigint,
[new_area] bigint,
[old_land_type] nvarchar(20),
[new_land_type] nvarchar(20),
[khasra_number] nvarchar(50),
[date] datetime,
[qanoongo_statement] nvarchar(100),
[officer_statement] nvarchar(100),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([Register_scheme_id])
);

CREATE TABLE [tmp].[tmppersonkhewatabc123] (
[person_khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[is_owner] bit NOT NULL,
[is_updated] bit NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [users].[UserModule] (
[user_module_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier,
[module_id] uniqueidentifier NOT NULL,
[is_locked] bit NOT NULL,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([user_module_id])
);

CREATE TABLE [rhz].[Remarks] (
[remarks_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[khewat_id] uniqueidentifier,
[description] nvarchar(4000),
[remarks_type] smallint,
[remarks_insertion_type] smallint,
[is_redink] bit,
[parent_remarks_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[sys_datetime] datetime DEFAULT (getdate()),
PRIMARY KEY ([remarks_id])
);

CREATE TABLE [generic].[UserLog] (
[record_id] uniqueidentifier NOT NULL,
[tablename] varchar(50),
[ip_address] varchar(20),
[user_name] nvarchar(35),
[operation_id] smallint,
[field_updated_deleted] nvarchar(100),
[access_datetime] datetime,
PRIMARY KEY ([record_id])
);

CREATE TABLE [reference].[HistoryPerson] (
[person_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier,
[first_name_old] varbinary(450),
[relation_id] int,
[last_name_old] varbinary(450),
[address] varbinary(450),
[nic] varbinary(450),
[is_govt] bit DEFAULT ((0)),
[is_alive] bit,
[is_kashmiri] bit,
[pass_book_no] varbinary(450),
[is_department] bit,
[thumb] nvarchar(max),
[pic_path] varchar(50),
[is_blocked] bit,
[block_detail] nvarchar(500),
[is_updated] bit,
[is_active] bit,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[operation_id] smallint,
[old_person_id] uniqueidentifier,
[person_history_id] bigint NOT NULL IDENTITY(1,1),
[first_name] nvarchar(250),
[last_name] nvarchar(250),
PRIMARY KEY ([person_history_id])
);

CREATE TABLE [fardbadr].[FardBadr] (
[fardbadr_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_id] uniqueidentifier,
[fardbadrtype_id] uniqueidentifier,
[fardbadr_no] int,
[fardbadr_status] smallint DEFAULT ((1)),
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime DEFAULT (getdate()),
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fardbadr_id])
);

CREATE TABLE [mail].[MailReceiver] (
[mail_id] uniqueidentifier NOT NULL,
[sent_to] uniqueidentifier NOT NULL,
[copy_to] uniqueidentifier,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([mail_id], [sent_to])
);

CREATE TABLE [reference].[Person] (
[person_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier,
[first_name_old] varbinary(750),
[relation_id] int,
[last_name_old] varbinary(750),
[address] varbinary(550),
[nic] varbinary(80),
[is_govt] bit DEFAULT ((0)),
[is_alive] bit,
[is_kashmiri] bit,
[pass_book_no] varbinary(80),
[is_department] bit,
[thumb] nvarchar(max),
[pic_path] varchar(50),
[person_pic] varbinary(max),
[is_blocked] bit,
[block_detail] nvarchar(500),
[old_person_id] uniqueidentifier,
[is_updated] bit,
[is_active] bit,
[user_id] uniqueidentifier,
[person_fname] nvarchar(150),
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[first_name] nvarchar(500),
[last_name] nvarchar(500),
PRIMARY KEY ([person_id])
);

CREATE TABLE [transactions].[StateBeforeIntiqal] (
[state_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[status_xml] xml,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([state_id])
);

CREATE TABLE [transactions].[IntiqalRegistery] (
[intiqalregistery_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[registery_no] varchar(50),
[bahi_no] int,
[jild_no] int,
[sub_registrar] nvarchar(50),
[registery_date] datetime,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqalregistery_id])
);

CREATE TABLE [tmp].[CSVtable] (
[fard_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(150),
[khasra_no] nvarchar(150),
[location] smallint,
[location_name] nvarchar(50),
[rate_units] smallint,
[rate_units_name] nvarchar(50),
[rate] int
);

CREATE TABLE [tmp].[tempStatePerson] (
[person_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier,
[first_name_old] nvarchar(200),
[relation_id] int,
[last_name_old] nvarchar(200),
[address] nvarchar(200),
[nic] varchar(15),
[is_govt] bit,
[is_alive] bit,
[is_kashmiri] bit,
[pass_book_no] varchar(15),
[is_department] bit,
[thumb] nvarchar(max),
[pic_path] varchar(50),
[is_blocked] bit,
[block_detail] nvarchar(500),
[is_updated] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[old_person_id] uniqueidentifier,
[is_active] bit,
[first_name] varchar(250),
[last_name] varchar(250)
);

CREATE TABLE [tmp].[Remarks] (
[remarks_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[description] nvarchar(4000),
[remarks_type] smallint,
[remarks_insertion_type] smallint,
[is_redink] bit,
[parent_remarks_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [transactions].[IntiqalReport] (
[intiqal_report_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[khewat_no] nvarchar(50),
[khatuni_no] nvarchar(50),
[owner_name] nvarchar(500),
[possessor_name] nvarchar(500),
[khata_detail] nvarchar(250),
[area_landtype] nvarchar(150),
[is_new] bit,
[IntiqalType_date] nvarchar(500),
[Maalia_IntiqalFee] nvarchar(500),
[ReportPatwari_Ro] nvarchar(500),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqal_report_id])
);

CREATE TABLE [rhz].[HistoryPersonKhewat] (
[person_khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[is_owner] bit NOT NULL,
[is_updated] bit DEFAULT ((0)) NOT NULL,
[operation_id] smallint,
[parent_person_khewat_id] uniqueidentifier,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [dbo].[webpages_OAuthMembership] (
[Provider] nvarchar(30) NOT NULL,
[ProviderUserId] nvarchar(100) NOT NULL,
[UserId] int NOT NULL,
PRIMARY KEY ([Provider], [ProviderUserId])
);

CREATE TABLE [rhz].[HistoryKhewat] (
[khewat_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[old_khewat_no] nvarchar(400),
[maalia] nvarchar(250),
[haboob] nvarchar(100),
[is_shared] bit,
[is_sikni] bit,
[is_blocked] bit DEFAULT ((0)),
[block_detail] nvarchar(500),
[ref_khewat_no] varchar(25) DEFAULT ((0)),
[total_share] varchar(21),
[is_updated] bit DEFAULT ((0)),
[total_area] varchar(50),
[operation_id] smallint,
[parent_khewat_id] uniqueidentifier,
[sub_khewat_no] nvarchar(100),
[khewat_type] smallint,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[area_format] smallint
);

CREATE TABLE [tmp].[tmp] (
[person_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier,
[first_name] varbinary(750),
[relation_id] int,
[last_name] varbinary(750),
[address] varbinary(550),
[nic] varbinary(80),
[is_govt] bit,
[is_alive] bit,
[is_kashmiri] bit,
[pass_book_no] varbinary(80),
[is_department] bit,
[thumb] nvarchar(max),
[pic_path] varchar(50),
[person_pic] varbinary(max),
[is_blocked] bit,
[block_detail] nvarchar(500),
[old_person_id] uniqueidentifier,
[is_updated] bit,
[is_active] bit,
[user_id] uniqueidentifier,
[person_fname] nvarchar(150),
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [correction].[Ownership] (
[ownership_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[person_status_id] int,
[person_share_old] varbinary(300),
[person_area] bigint,
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier NOT NULL,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[access_datetime] datetime NOT NULL,
[kamasmarla] bit,
[time_stamp] rowversion NOT NULL,
[ownership_correction_id] bigint NOT NULL IDENTITY(1,1),
[is_new] bit,
[change_fields] nvarchar(200),
[nic] varbinary(80),
[address] varbinary(550),
[person_name] nvarchar(200),
[status_name] nvarchar(50),
[dep_person_name] nvarchar(200),
[task_id] uniqueidentifier,
[operation_type] int,
[person_share] varchar(250),
PRIMARY KEY ([ownership_correction_id])
);

CREATE TABLE [correction].[Khewat] (
[khewat_id] uniqueidentifier NOT NULL,
[parent_khewat_id] uniqueidentifier,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[khewat_no] varbinary(150),
[old_khewat_no] varbinary(1000),
[sub_khewat_no] varbinary(150),
[maalia] varbinary(1100),
[haboob] varbinary(250),
[is_shared] bit,
[is_sikni] bit,
[khewat_type] smallint,
[is_blocked] bit,
[block_detail] nvarchar(500),
[total_share] varbinary(100),
[total_area] bigint,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[FirstOwner] nvarchar(200),
[TotalOwners] int,
[time_stamp] rowversion NOT NULL,
[is_new] bit,
[change_fields] nvarchar(200),
[TaskID] uniqueidentifier,
[khewat_correction_id] bigint NOT NULL IDENTITY(1,1),
[OperationType] int,
PRIMARY KEY ([khewat_correction_id])
);

CREATE TABLE [web].[Ownership] (
[ownership_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[person_status_id] int,
[person_share] varchar(21),
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier NOT NULL,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[access_datetime] datetime NOT NULL,
[kamasmarla] bit,
[person_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[name_tarf_numberdar] nvarchar(100),
[parta_qisam_war] nvarchar(100)
);

CREATE TABLE [transactions].[CourtOrder] (
[court_order_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[person_id] uniqueidentifier,
[transaction_id] uniqueidentifier,
[remarks_id] uniqueidentifier,
[transaction_type_id] smallint NOT NULL,
[is_updated] bit NOT NULL,
[discription] nvarchar(4000),
[status] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([court_order_id])
);

CREATE TABLE [rhz].[KhatuniNumberLog] (
[khatuni_no_log_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[computrized_khatuni_no] nvarchar(50),
[patwari_khatuni_no] nvarchar(50),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([khatuni_no_log_id])
);

CREATE TABLE [users].[User] (
[user_id] uniqueidentifier NOT NULL,
[user_name] varbinary(4000),
[user_password] varbinary(4000),
[first_name] nvarchar(50),
[last_name] nvarchar(50),
[user_nic] varchar(15),
[user_active_status] bit,
[user_thumb] nvarchar(max),
[is_biomatric_on] bit,
[is_first_login] bit,
[secret_question] nvarchar(100),
[secret_answer] nvarchar(100),
[dep_user_id] uniqueidentifier,
[user_signature] varbinary(max),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([user_id])
);

CREATE TABLE [workflow].[TaskDetail] (
[task_id] uniqueidentifier NOT NULL,
[family_no] varchar(50),
[khewat_id] uniqueidentifier,
[intiqal_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[is_new] bit DEFAULT ((0)),
[fardbadr_id] uniqueidentifier
);

CREATE TABLE [tmp].[tmpFieldBookMissingMissing] (
[mauza_id] uniqueidentifier NOT NULL,
[fieldbook_id] uniqueidentifier NOT NULL,
[north] nvarchar(1000),
[east] nvarchar(1000),
[west] nvarchar(1000),
[south] nvarchar(1000),
[calc_area] nvarchar(max),
[land_type_id] uniqueidentifier,
[land_type_name] nvarchar(100),
[current_khasra_no] nvarchar(400),
[old_khasra_no] nvarchar(400),
[area] int,
[MissingDBRecord] varchar(10),
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [tmp].[tmppossessionabc123] (
[possession_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share_old] varbinary(100),
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[wrong_fields] varchar(200),
[dimension] nvarchar(30),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[area_format] smallint,
[person_share] varchar(250)
);

CREATE TABLE [transactions].[IntiqalTrees] (
[intiqaltrees_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier NOT NULL,
[new_khasra_no] varbinary(150),
[male_tree] int,
[female_tree] int,
[khasi_tree] int,
[is_new] bit,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqaltrees_id])
);

CREATE TABLE [familytree].[HistoryFamilyTreeTitle] (
[mauza_id] uniqueidentifier NOT NULL,
[rhzdate] datetime,
[field1] nvarchar(1000),
[field2] nvarchar(1000),
[field3] nvarchar(1000),
[field4] nvarchar(1000),
[field5] nvarchar(1000),
[field6] nvarchar(1000),
[field7] nvarchar(1000),
[operation_id] smallint,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [generic].[HistoryFieldBook] (
[fieldbook_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[land_type_id] uniqueidentifier,
[current_khasra_no] nvarchar(400),
[old_khasra_no] nvarchar(400),
[khatuni_no] nvarchar(400),
[area] varchar(50),
[north] nvarchar(1000),
[east] nvarchar(1000),
[west] nvarchar(1000),
[south] nvarchar(1000),
[calc_area] nvarchar(3000),
[remarks] nvarchar(3000),
[sketch] nvarchar(max),
[is_updated] bit,
[is_active] bit,
[year] int,
[sequence_no] int,
[is_wrong] bit,
[wrong_detail] varchar(200),
[user_id] uniqueidentifier,
[muraba_no] varchar(10),
[access_datetime] datetime,
[operation_id] smallint,
[middle] nvarchar(200)
);

CREATE TABLE [fardbadr].[HistoryFardBadrFamilyTree] (
[fardbadrfamilytree_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier,
[fardbadrtype_id] varchar(500),
[fardbadrperson_id] uniqueidentifier,
[familytree_id] uniqueidentifier,
[person_id] uniqueidentifier,
[dep_person_id] uniqueidentifier,
[family_no] varbinary(200),
[is_numberdar] bit,
[is_childless] bit,
[family_type] smallint,
[is_wrong] bit,
[wrong_fields] varchar(200),
[history_operation_id] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [rhz].[HistoryPossession] (
[possession_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share] varchar(21) NOT NULL,
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[operation_id] smallint,
[parent_possession_id] uniqueidentifier,
[is_active] bit,
[is_wrong] bit,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[wrong_fields] varchar(200),
[dimension] nvarchar(30),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[area_format] smallint
);

CREATE TABLE [users].[HistoryUserRoles] (
[user_roles_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[role_id] uniqueidentifier NOT NULL,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[operation_id] int,
[machine_id] varchar(50),
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [correction].[FamilyTree] (
[familytree_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[person_id] uniqueidentifier,
[family_no] varbinary(200),
[dep_person_id] uniqueidentifier,
[is_numberdar] bit,
[is_childless] bit,
[sequence_no] int,
[remarks] nvarchar(1000),
[intiqal_no] int,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[family_type] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[familytree_correction_id] bigint NOT NULL IDENTITY(1,1),
[is_new] bit,
[change_fields] nvarchar(200),
[khewats_nos] nvarchar(100),
[fname] nvarchar(200),
[Relation_id] int,
[Relation_Name] nvarchar(100),
[Dep_PersonName] nvarchar(100),
[is_govt] bit,
[is_alive] bit,
[is_kashmiri] bit,
[is_department] bit,
[Task_id] uniqueidentifier,
[OperationType] int,
[CasteId] uniqueidentifier
);

CREATE TABLE [users].[UserRights] (
[user_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[user_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([user_right_id])
);

CREATE TABLE [users].[RoleRights] (
[role_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[role_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([role_right_id])
);

CREATE TABLE [Setup].[Crop] (
[crop_id] uniqueidentifier NOT NULL,
[crop_name] nvarchar(100) NOT NULL,
[is_bagh] bit NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion,
PRIMARY KEY ([crop_id])
);

CREATE TABLE [fardbadr].[FardBadrKhewat] (
[fardbadrkhewat_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[ownership_id] uniqueidentifier,
[person_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khewat_no] varbinary(150),
[person_share_old] varbinary(200),
[person_area] varchar(50),
[total_share] varbinary(200),
[total_area] varchar(50),
[ownership_status_id] int,
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[maalia] varbinary(1100),
[haboob] varbinary(250),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[person_share] varchar(250),
PRIMARY KEY ([fardbadrkhewat_id])
);

CREATE TABLE [generic].[FardTaqseemAab] (
[fard_taqseemaab_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[person_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[share] varchar(21),
[remarks] nvarchar(500),
[print_sequence_no] int,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fard_taqseemaab_id])
);

CREATE TABLE [rhz].[HistoryKhasra] (
[khasra_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier,
[khasra_no] nvarchar(250),
[old_khasra_no] nvarchar(250),
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[khasra_area] varchar(50),
[khasra_dimension] nvarchar(25),
[print_sequence_no] int,
[is_blocked] bit,
[block_detail] nvarchar(150),
[is_urban] bit,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[land_classification] smallint,
[location] smallint,
[rate] int,
[rate_units] smallint,
[operation_id] smallint,
[parent_khasra_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[khasra_history_id] bigint NOT NULL IDENTITY(1,1),
[area_format] varchar(50),
PRIMARY KEY ([khasra_history_id])
);

CREATE TABLE [Setup].[Register] (
[register_id] int NOT NULL,
[register_name] nvarchar(50) NOT NULL,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([register_id])
);

CREATE TABLE [fard].[FardKhewats] (
[fardkhewat_id] uniqueidentifier NOT NULL,
[fard_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier,
[is_KhanaKasht] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fardkhewat_id])
);

CREATE TABLE [tmp].[TmpKhatuni] (
[tmp_khatuni_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[create_new_khatuni] bit NOT NULL,
[new_khatuni_type_id] uniqueidentifier,
[new_khatuni_laagan] nvarchar(250),
[new_khatuni_description] nvarchar(2000),
[khatuni_id] uniqueidentifier,
[new_khatuni_no] nvarchar(50),
[is_possessor_delete] bit NOT NULL,
PRIMARY KEY ([tmp_khatuni_id])
);

CREATE TABLE [rhz].[RemarksKhatuni] (
[remarkskhatuni_id] uniqueidentifier NOT NULL,
[remarks_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier,
[is_updated] bit NOT NULL,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([remarkskhatuni_id])
);

CREATE TABLE [transactions].[FtpPath] (
[path_id] uniqueidentifier NOT NULL,
[ftp_path] nvarchar(300) NOT NULL,
[usename] nvarchar(100) NOT NULL,
[password] nvarchar(100) NOT NULL,
[file_type] nvarchar(50),
[access_datetime] datetime,
[user_id] uniqueidentifier,
[timestamp] rowversion NOT NULL,
PRIMARY KEY ([path_id])
);

CREATE TABLE [web].[Khasra] (
[khasra_id] uniqueidentifier NOT NULL,
[parent_khasra_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khasra_no] nvarchar(800),
[old_khasra_no] nvarchar(1000),
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[khasra_area] varchar(50),
[khasra_dimension] varchar(15),
[print_sequence_no] int,
[is_blocked] bit,
[block_detail] nvarchar(150),
[is_urban] bit,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[land_classification] smallint,
[location] smallint,
[rate] int,
[rate_units] smallint,
[user_id] uniqueidentifier,
[muraba_no] varchar(10),
[access_date_time] datetime,
[khasra_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[khasra_no_urdu] nvarchar(1650),
[sub_khasra_no] nvarchar(50)
);

CREATE TABLE [generic].[NoteChangeLandType] (
[notelandtype_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[area] varchar(15),
[user_id] uniqueidentifier,
[access_datetime] datetime NOT NULL,
[timestamp] rowversion NOT NULL,
PRIMARY KEY ([notelandtype_id])
);

CREATE TABLE [workflow].[Task] (
[task_id] uniqueidentifier NOT NULL,
[task_no] int,
[assigned_to] uniqueidentifier,
[assigned_by] uniqueidentifier,
[task_stage] tinyint,
[mauza_id] uniqueidentifier,
[is_updated] bit,
[task_completion_date] datetime,
[mauza_stage] tinyint,
[access_datetime] datetime,
[user_id] uniqueidentifier,
[remarks] nvarchar(2000),
[register] varchar(50),
[SCI_CompleteDate] datetime,
[SCO_CompleteDate] datetime,
[SCI_ReturnDate] datetime,
PRIMARY KEY ([task_id])
);

CREATE TABLE [transactions].[HistoryIntiqalBankOrder] (
[intiqalbankorder_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[issue_date] datetime,
[letter_number] nvarchar(50),
[bank_name] nvarchar(200),
[branch_name] nvarchar(200),
[history_operation_id] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [territory].[Mauza] (
[mauza_id] uniqueidentifier NOT NULL,
[patwar_circle_id] uniqueidentifier,
[chak_tashkhees_id] uniqueidentifier,
[mauza_name] varbinary(750),
[had_bust_no] int,
[feet_per_marla] smallint,
[preparation_year] int,
[is_misl_mayadi] bit,
[is_mauza_sikni] bit,
[is_marla_calculation_unit] bit,
[mauza_stage] varbinary(750),
[has_shamilat] bit,
[mauza_type] tinyint,
[area_format] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[Mauza_Total_Area_Updated] varchar(20),
[TotalKhasraCount_Updated] int,
[TotalCultivated_Area_Updated] varchar(20),
[TotalNonCultivated_Area_Updated] varchar(20),
[Mauza_Total_Area_Feets_Updated] bigint,
PRIMARY KEY ([mauza_id])
);

CREATE TABLE [rhz].[Khatuni] (
[khatuni_id] uniqueidentifier NOT NULL,
[parent_khatuni_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khatuni_no] varbinary(250),
[sub_khatuni_no] varbinary(250) DEFAULT ((1)),
[khatuni_type_id] uniqueidentifier,
[khatuni_description] nvarchar(4000),
[laagan] varbinary(1100),
[is_blocked] bit,
[block_detail] nvarchar(150),
[total_share] varbinary(200),
[total_area] varchar(50),
[is_updated] bit DEFAULT ((0)),
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(400),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[KashatkarName] nvarchar(200),
[Lagaan_Dahinda] nvarchar(4000),
[Building_owner] nvarchar(4000),
[time_stamp] rowversion NOT NULL,
[old_khatuni_no] varbinary(250),
[area_format] smallint,
[sys_datetime] datetime DEFAULT (getdate()),
[Area] int,
[total_area_1] bigint,
PRIMARY KEY ([khatuni_id])
);

CREATE TABLE [web].[PersonKhewat] (
[person_khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[is_owner] bit NOT NULL,
[is_updated] bit NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [users].[HistoryRoleRights] (
[role_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[role_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[operation_id] int,
[machine_id] varchar(50),
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [rhz].[KhewatNumberLog] (
[khewat_no_log_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[computrized_khewat_no] nvarchar(50),
[patwari_khewat_no] nvarchar(50),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([khewat_no_log_id])
);

CREATE TABLE [fardbadr].[HistoryFardBadrKhatuni] (
[fardbadrkhatuni_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[khatuni_type_id] uniqueidentifier,
[fardbadrtype_id] varchar(500),
[possession_id] uniqueidentifier,
[person_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khatuni_no] nvarchar(50),
[person_share] varchar(25),
[person_area] bigint,
[total_share] varchar(25),
[total_area] bigint,
[person_status_id] uniqueidentifier,
[laagan] nvarchar(1000),
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime,
[history_operation_id] smallint
);

CREATE TABLE [tmp].[IntiqalPersonInfo] (
[intiqalperson_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[status] int,
[is_verified] bit,
[dep_person_id] uniqueidentifier,
[is_alive] bit,
[old_person_caste_id] uniqueidentifier,
[old_person_name] nvarchar(300),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [familytree].[FamilyTree] (
[familytree_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[person_id] uniqueidentifier,
[family_no] varbinary(200),
[dep_person_id] uniqueidentifier,
[is_numberdar] bit,
[is_childless] bit,
[sequence_no] int,
[remarks] nvarchar(1000),
[intiqal_no] int,
[is_updated] bit DEFAULT ((0)),
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[family_type] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[sys_datetime] datetime DEFAULT (getdate()),
PRIMARY KEY ([familytree_id])
);

CREATE TABLE [tmp].[bridgeRHZtoFamilyTree] (
[PK] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[relation_id] int NOT NULL,
[dependent_id] uniqueidentifier NOT NULL,
PRIMARY KEY ([PK])
);

CREATE TABLE [fard].[FardKhasra] (
[fardkhasra_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[fardkhewat_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier,
[khasra_area] varchar(50),
[user_id] uniqueidentifier,
[actual_khasra_area] varchar(50),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[area_format] smallint DEFAULT ((2)),
PRIMARY KEY ([fardkhasra_id])
);

CREATE TABLE [transactions].[HistoryIntiqalPersonInfo] (
[intiqalperson_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[status] int,
[is_verified] bit,
[dep_person_id] uniqueidentifier,
[old_person_name] nvarchar(300),
[is_alive] bit,
[operation_id] int,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [Setup].[IntiqalType] (
[intiqal_type_id] int NOT NULL,
[intiqal_type_description] nvarchar(40) NOT NULL,
[parent_intiqal] nvarchar(40),
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqal_type_id])
);

CREATE TABLE [web].[Khatuni] (
[khatuni_id] uniqueidentifier NOT NULL,
[parent_khatuni_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khatuni_no] nvarchar(200),
[sub_khatuni_no] nvarchar(200),
[khatuni_type_id] uniqueidentifier,
[khatuni_description] nvarchar(4000),
[laagan] nvarchar(500),
[is_blocked] bit,
[block_detail] nvarchar(150),
[total_share] varchar(21),
[total_area] varchar(50),
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(400),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[KashatkarName] nvarchar(200),
[Lagaan_Dahinda] nvarchar(4000),
[Building_owner] nvarchar(4000),
[old_khatuni_no] nvarchar(200),
[area_format] smallint
);

CREATE TABLE [tmp].[tmpFieldBook] (
[mauza_id] uniqueidentifier NOT NULL,
[fieldbook_id] uniqueidentifier,
[north] nvarchar(1000),
[east] nvarchar(1000),
[west] nvarchar(1000),
[south] nvarchar(1000),
[calc_area] nvarchar(max),
[land_type_id] uniqueidentifier,
[land_type_name] nvarchar(100),
[current_khasra_no] nvarchar(400),
[old_khasra_no] nvarchar(400),
[area] int,
[muraba_no] varchar(10),
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [users].[UserServiceCentre] (
[user_service_centre_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[service_centre_id] uniqueidentifier NOT NULL,
[active_status] bit NOT NULL,
[access_user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([user_service_centre_id])
);

CREATE TABLE [users].[Forms] (
[form_id] uniqueidentifier NOT NULL,
[module_id] uniqueidentifier NOT NULL,
[menu_id] int,
[description] nvarchar(50),
[path] nvarchar(200),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([form_id])
);

CREATE TABLE [utility].[DatabaseLog] (
[DatabaseLogID] int NOT NULL IDENTITY(1,1),
[PostTime] datetime NOT NULL,
[DatabaseUser] sys.sysname NOT NULL,
[Event] sys.sysname NOT NULL,
[Schema] sys.sysname,
[Object] sys.sysname,
[TSQL] nvarchar(max) NOT NULL,
[XmlEvent] xml NOT NULL,
PRIMARY KEY ([DatabaseLogID])
);

CREATE TABLE [tmp].[PersonKhewat] (
[person_khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[is_owner] bit NOT NULL,
[is_updated] bit NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [utility].[ChangeLog] (
[LogId] int NOT NULL IDENTITY(1,1),
[DatabaseName] varchar(256) NOT NULL,
[EventType] varchar(50) NOT NULL,
[ObjectName] varchar(256) NOT NULL,
[ObjectType] varchar(25) NOT NULL,
[SqlCommand] varchar(max) NOT NULL,
[EventDate] datetime DEFAULT (getdate()) NOT NULL,
[LoginName] varchar(256) NOT NULL
);

CREATE TABLE [correction].[Remarks] (
[remarks_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[description] nvarchar(3000),
[remarks_type] smallint,
[remarks_insertion_type] smallint,
[is_redink] bit,
[parent_remarks_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[task_id] uniqueidentifier,
[remarks_correction_id] uniqueidentifier,
[is_new] bit,
[change_fields] nvarchar(100),
[operation_type] int
);

CREATE TABLE [fardbadr].[FardBadrFamilyTree] (
[fardbadrfamilytree_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier,
[fardbadrtype_id] varchar(500),
[fardbadrperson_id] uniqueidentifier,
[familytree_id] uniqueidentifier,
[person_id] uniqueidentifier,
[dep_person_id] uniqueidentifier,
[family_no] varbinary(200),
[is_numberdar] bit,
[is_childless] bit,
[family_type] smallint,
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fardbadrfamilytree_id])
);

CREATE TABLE [users].[HistoryUser] (
[user_id] uniqueidentifier NOT NULL,
[user_name] varbinary(4000),
[user_password] varbinary(4000),
[first_name] nvarchar(50),
[last_name] nvarchar(50),
[user_nic] varchar(15),
[user_active_status] bit,
[user_thumb] nvarchar(max),
[is_biomatric_on] bit,
[is_first_login] bit,
[secret_question] nvarchar(100),
[secret_answer] nvarchar(100),
[dep_user_id] uniqueidentifier,
[user_signature] varbinary(max),
[access_datetime] datetime,
[operation_id] int,
[machine_id] varchar(50),
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [fardbadr].[HistoryFardBadr] (
[fardbadr_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[operation_id] uniqueidentifier,
[fardbadr_type] smallint,
[fardbadr_no] int,
[fardbadr_status] smallint DEFAULT ((1)) NOT NULL,
[report_patwari] nvarchar(2000),
[report_gardawar] nvarchar(2000),
[report_ro] nvarchar(2000),
[history_operation_id] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime DEFAULT (getdate()) NOT NULL
);

CREATE TABLE [transactions].[HistoryIntiqalRegistery] (
[intiqalregistery_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[registery_no] varchar(50),
[bahi_no] int,
[jild_no] int,
[sub_registrar] nvarchar(50),
[registery_date] datetime,
[operation_id] int,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [rhz].[MauzaTrees] (
[mauza_trees_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[person_id] uniqueidentifier NOT NULL,
[khasra_no] nvarchar(50),
[tree_type] nvarchar(100),
[total_trees] int,
[price] int,
[remarks] nvarchar(250),
[serial] int,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([mauza_trees_id])
);

CREATE TABLE [rhz].[PossessionAbadi] (
[possession_abadi_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[person_status_id] uniqueidentifier,
[person_type] smallint,
[person_share_old] varchar(15),
[person_area] bigint,
[dep_person_id] uniqueidentifier,
[rent] nvarchar(50),
[is_updated] bit,
[is_active] bit,
[print_sequence_no] int,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[person_share] varchar(250),
PRIMARY KEY ([possession_abadi_id])
);

CREATE TABLE [tmp].[tempStateKhatuni] (
[khatuni_id] uniqueidentifier NOT NULL,
[parent_khatuni_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khatuni_no] nvarchar(100),
[sub_khatuni_no] nvarchar(100),
[khatuni_type_id] uniqueidentifier,
[khatuni_description] nvarchar(4000),
[laagan] nvarchar(500),
[is_blocked] bit,
[block_detail] nvarchar(150),
[total_share] varchar(21),
[total_area] bigint,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(400),
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [generic].[KarguzariPatwari] (
[karguzaripatwari_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[entry_date] datetime NOT NULL,
[patwari_name] nvarchar(25),
[worktype] nvarchar(50),
[area] varchar(15),
[nooffields] int,
[noofkhatunis] int,
[noofsquares] int,
[noofintiqals] int,
[remarks] nvarchar(1000),
[last_no] int,
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([karguzaripatwari_id])
);

CREATE TABLE [generic].[PanChakiyat] (
[pan_chaki_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier NOT NULL,
[name] nvarchar(100),
[previous_detail] nvarchar(250),
[owner_id] uniqueidentifier,
[pan_chaki_owner_name] nvarchar(100),
[asiaban_name] nvarchar(100),
[pisayi_days_nights] nvarchar(50),
[hisa_malik_aab] nvarchar(50),
[hisa_malik_pan_chaki] nvarchar(50),
[hisa_asiaban] nvarchar(50),
[band_tafseel] nvarchar(50),
[mutalba_sarkar] nvarchar(50),
[remarks] nvarchar(500),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([pan_chaki_id])
);

CREATE TABLE [correction].[Person] (
[person_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier,
[first_name_old] varbinary(750),
[relation_id] int,
[last_name_old] varbinary(750),
[address] varbinary(550),
[nic] varbinary(80),
[is_govt] bit DEFAULT ((0)),
[is_alive] bit,
[is_kashmiri] bit,
[pass_book_no] varbinary(80),
[is_department] bit,
[thumb] nvarchar(max),
[pic_path] varchar(50),
[is_blocked] bit,
[block_detail] nvarchar(500),
[old_person_id] uniqueidentifier,
[is_updated] bit,
[is_active] bit,
[user_id] uniqueidentifier,
[person_fname] nvarchar(150),
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[correction_person_id] uniqueidentifier NOT NULL,
[is_new] bit,
[change_fields] nvarchar(100),
[caste_name] nvarchar(100),
[task_id] uniqueidentifier,
[operation_type] int,
[relation_name] nvarchar(200),
[first_name] varchar(250),
[last_name] varchar(250),
PRIMARY KEY ([correction_person_id])
);

CREATE TABLE [tmp].[RoleRights1] (
[role_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[role_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [generic].[KioskOperations] (
[operation_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_no] varchar(5),
[operation_date] datetime,
[revisit_date] datetime,
[operation_type] smallint,
[operation_remarks] nvarchar(100),
[status] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([operation_id])
);

CREATE TABLE [users].[FieldLevelSecurity] (
[field_level_security_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier NOT NULL,
[field_id] nvarchar(50) NOT NULL,
[field_name] nvarchar(150) NOT NULL,
[access_date_time] datetime,
[access_user_id] uniqueidentifier,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([field_level_security_id])
);

CREATE TABLE [correction].[Khatuni] (
[khatuni_id] uniqueidentifier NOT NULL,
[parent_khatuni_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khatuni_no] varbinary(250),
[sub_khatuni_no] varbinary(250),
[khatuni_type_id] uniqueidentifier,
[khatuni_description] nvarchar(4000),
[laagan] varbinary(1100),
[is_blocked] bit,
[block_detail] nvarchar(150),
[total_share] varbinary(200),
[total_area] bigint,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(400),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[KashatkarName] nvarchar(200),
[Lagaan_Dahinda] nvarchar(4000),
[Building_owner] nvarchar(4000),
[time_stamp] rowversion NOT NULL,
[khatuni_correction_id] bigint NOT NULL IDENTITY(1,1),
[is_new] bit,
[change_fields] nvarchar(200),
[TaskID] uniqueidentifier,
[KhatuniTypeName] nvarchar(100),
[OperationType] int,
PRIMARY KEY ([khatuni_correction_id])
);

CREATE TABLE [fardbadr].[HistoryFardBadrPerson] (
[fardbadrperson_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[person_name] nvarchar(200),
[relation_id] int,
[person_fname] nvarchar(200),
[nic] varchar(200),
[address] nvarchar(800),
[pass_book_no] varchar(15),
[is_wrong] bit,
[wrong_fields] varchar(200),
[history_operation_id] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [transactions].[IntiqalPersonShare] (
[intiqalperson_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[poss_person_status_id] uniqueidentifier,
[person_status_id] smallint NOT NULL,
[person_total_share] varbinary(100),
[person_total_area] varchar(50),
[person_selling_share] varbinary(100) NOT NULL,
[person_selling_area] varchar(50),
[person_remaining_share] varbinary(100),
[khewat_total_area] varchar(50),
[khewat_total_khasra] varchar(25),
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[person_remaining_area] varchar(50),
[seller_bakibadastoor] varchar(50),
[buyer_bakibadastoor] varchar(50),
[area_format] smallint,
[total_share_transf] varchar(50),
[total_area_transf] varchar(50),
[measured_area] varchar(30),
[person_total_area1] int,
PRIMARY KEY ([intiqalperson_id])
);

CREATE TABLE [generic].[ComplaintRevisited] (
[RevisitedValue] int NOT NULL,
[ID] int NOT NULL
);

CREATE TABLE [generic].[Waqiati] (
[waqiati_id] uniqueidentifier NOT NULL,
[patwar_circle_id] uniqueidentifier NOT NULL,
[sequence_no] int,
[waqiati_date] datetime NOT NULL,
[topic] nvarchar(100),
[description] nvarchar(4000),
[remarks] nvarchar(500),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([waqiati_id], [patwar_circle_id])
);

CREATE TABLE [web].[Possession] (
[possession_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share] varchar(21),
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[wrong_fields] varchar(200),
[dimension] nvarchar(30),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[person_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int
);

CREATE TABLE [rhz].[HistoryKhatuni] (
[khatuni_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khatuni_no] nvarchar(50),
[khatuni_type_id] uniqueidentifier,
[khatuni_description] nvarchar(max),
[laagan] nvarchar(250),
[sub_khatuni_no] varchar(100),
[total_share] varchar(21),
[total_area] varchar(50),
[is_blocked] bit,
[block_detail] nvarchar(150),
[is_wrong] bit,
[wrong_fields] varchar(400),
[is_updated] bit DEFAULT ((0)),
[is_active] bit,
[operation_id] smallint,
[parent_khatuni_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[area_format] varchar(50),
[old_khatuni_no] nvarchar(50)
);

CREATE TABLE [transactions].[IntiqalKhatuni] (
[intiqalkhatuni_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khatuni_no] nvarchar(50),
[khatuni_description] nvarchar(2000),
[is_new] bit,
[old_laagan] varbinary(1100),
[new_laagan] varbinary(1100),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqalkhatuni_id])
);

CREATE TABLE [rhz].[RemarksPerson] (
[remarksperson_id] uniqueidentifier NOT NULL,
[remarks_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[is_updated] bit NOT NULL,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([remarksperson_id])
);

CREATE TABLE [correction].[Possession] (
[possession_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share_old] varbinary(100),
[person_area] bigint,
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[wrong_fields] varchar(200),
[dimension] nvarchar(30),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
[possession_correction_id] bigint NOT NULL IDENTITY(1,1),
[is_new] bit,
[change_fields] nvarchar(200),
[mauza_id] uniqueidentifier,
[name] nvarchar(100),
[person_status_name] nvarchar(100),
[task_id] uniqueidentifier,
[dep_person_name] nvarchar(100),
[operation_type] int,
[last_name] nvarchar(100),
[caste_name] nvarchar(100),
[person_share] varchar(250),
PRIMARY KEY ([possession_correction_id])
);

CREATE TABLE [rhz].[Ownership] (
[ownership_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[person_status_id] int,
[person_share_old] varbinary(300),
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit DEFAULT ((0)) NOT NULL,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier NOT NULL,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[access_datetime] datetime NOT NULL,
[kamasmarla] bit,
[time_stamp] rowversion NOT NULL,
[person_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[name_tarf_numberdar] nvarchar(100),
[parta_qisam_war] nvarchar(100),
[sys_datetime] datetime DEFAULT (getdate()),
[created_usr_id] uniqueidentifier,
[Area] int,
[person_share] varchar(250),
[person_area_1] bigint,
PRIMARY KEY ([ownership_id])
);

CREATE TABLE [transactions].[TransactionImages] (
[transaction_image_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[transaction_id] uniqueidentifier,
[image_id] uniqueidentifier,
[name] nvarchar(4000),
[transaction_type] nvarchar(200),
[doc_number] varchar(150),
[status_primary_db] int,
[status_secondary_db] int,
[access_datetime] datetime,
[user_id] uniqueidentifier,
[page_no] nvarchar(20),
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([transaction_image_id])
);

CREATE TABLE [familytree].[FamilyTreeTitle] (
[mauza_id] uniqueidentifier NOT NULL,
[rhzdate] datetime,
[field1] nvarchar(1000),
[field2] nvarchar(1000),
[field3] nvarchar(1000),
[field4] nvarchar(1000),
[field5] nvarchar(1000),
[field6] nvarchar(1000),
[field7] nvarchar(1000),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([mauza_id])
);

CREATE TABLE [transactions].[TaghayarKhasra] (
[taghayarKhasra_id] uniqueidentifier NOT NULL,
[taghayar_id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[khasra_area] bigint,
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([taghayarKhasra_id])
);

CREATE TABLE [web].[Khewat] (
[khewat_id] uniqueidentifier NOT NULL,
[parent_khewat_id] uniqueidentifier,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[old_khewat_no] nvarchar(300),
[sub_khewat_no] nvarchar(50),
[maalia] nvarchar(250),
[haboob] nvarchar(100),
[is_shared] bit,
[is_sikni] bit,
[khewat_type] smallint,
[is_blocked] bit,
[block_detail] nvarchar(500),
[total_share] varchar(21),
[total_area] varchar(50),
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[FirstOwner] nvarchar(200),
[TotalOwners] int,
[area_format] smallint,
[khewat_type_meezan] smallint
);

CREATE TABLE [tmp].[tmpFamilytreeMissmatch] (
[mauza_id] uniqueidentifier NOT NULL,
[family_no] nvarchar(50),
[first_name] nvarchar(200),
[last_name] nvarchar(200),
[relation_id] int,
[PreviousOwner] nvarchar(200),
[khewats] varchar(500),
[is_numberdar] bit,
[is_govt] bit,
[is_childless] bit,
[is_alive] bit,
[is_department] bit,
[is_kashmiri] bit,
[family_type] bit,
[caste_id] uniqueidentifier,
[caste_name] nvarchar(100),
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [tmp].[TmpKhatuniPerson] (
[tmp_khatuni_person_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[person_status_id] uniqueidentifier NOT NULL,
[person_share] varchar(21),
[person_area] varchar(15),
PRIMARY KEY ([tmp_khatuni_person_id])
);

CREATE TABLE [fardbadr].[HistoryFardBadrKhewat] (
[fardbadrkhewat_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[ownership_id] uniqueidentifier,
[person_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[person_share] varchar(35),
[person_area] bigint,
[total_share] varchar(25),
[total_area] bigint,
[ownership_status_id] int,
[is_wrong] bit,
[wrong_fields] varchar(200),
[history_operation_id] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [users].[Role] (
[role_id] uniqueidentifier NOT NULL,
[description] nvarchar(50),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([role_id])
);

CREATE TABLE [tmp].[tempStateKhewat] (
[khewat_id] uniqueidentifier NOT NULL,
[parent_khewat_id] uniqueidentifier,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[old_khewat_no] nvarchar(50),
[sub_khewat_no] nvarchar(100),
[maalia] nvarchar(250),
[haboob] nvarchar(100),
[is_shared] bit,
[is_sikni] bit,
[khewat_type] smallint,
[is_blocked] bit,
[block_detail] nvarchar(150),
[total_share] varchar(21),
[total_area] bigint,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [territory].[District] (
[district_id] uniqueidentifier NOT NULL,
[district_name] nvarchar(50),
[province_id] smallint,
[is_locked] bit,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([district_id])
);

CREATE TABLE [rhz].[PersonKhatuni] (
[person_khatuni_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[is_updated] bit DEFAULT ((0)) NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([person_khatuni_id])
);

CREATE TABLE [tmp].[Khasra] (
[khasra_id] uniqueidentifier NOT NULL,
[parent_khasra_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khasra_no] varbinary(1650),
[old_khasra_no] varbinary(6100),
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[khasra_area] varchar(50),
[khasra_dimension] varbinary(150),
[print_sequence_no] int,
[is_blocked] bit,
[block_detail] nvarchar(150),
[is_urban] bit,
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[land_classification] smallint,
[location] smallint,
[rate] int,
[rate_units] smallint,
[user_id] uniqueidentifier,
[muraba_no] varchar(10),
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
[khasra_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[khasra_no_urdu] nvarchar(1650),
[sub_khasra_no] nvarchar(50)
);

CREATE TABLE [transactions].[specialintiqals] (
[intiqal_id] uniqueidentifier,
[mauza_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[khewat_no] nvarchar(50) NOT NULL,
[remark_type_id] int NOT NULL,
[remark_type_description] nvarchar(200) NOT NULL,
[intiqal_no] bigint NOT NULL,
[intiqal_date] datetime,
[remarks] nvarchar(2000) NOT NULL
);

CREATE TABLE [tmp].[forms2] (
[form_id] uniqueidentifier NOT NULL,
[module_id] uniqueidentifier NOT NULL,
[menu_id] int,
[description] nvarchar(50),
[path] nvarchar(200),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [transactions].[Intiqal] (
[intiqal_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_id] uniqueidentifier,
[intiqal_type_id] int,
[intiqal_date] datetime,
[intiqal_no] varbinary(70),
[intiqal_reference_no] varbinary(200),
[intiqal_initiation_type] smallint,
[intiqal_amount] bigint,
[evaluation_price] bigint,
[intiqal_status] tinyint DEFAULT ((1)),
[is_khanakasht] tinyint,
[is_shamlat] tinyint,
[intiqal_aprove_date] datetime,
[intiqal_remarks] nvarchar(1000),
[crop_name] nvarchar(50),
[is_approved] bit,
[intiqal_sub_type_id] int,
[patta_start_date] varchar(10),
[patta_end_date] varchar(10),
[patta_lagan] nvarchar(50),
[death_date] datetime,
[is_sale_shamilat] bit,
[is_qa] bit,
[khanakasht_sub_type_id] int,
[intiqal_type] nvarchar(100),
[gaintax_amount] bigint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[is_landtype_change_required] bit,
PRIMARY KEY ([intiqal_id])
);

CREATE TABLE [utility].[HardwareRegistration] (
[hardware_reg_id] uniqueidentifier NOT NULL,
[user_id] uniqueidentifier,
[user_ip] varchar(50),
[device_id] varchar(50),
[device_type] varchar(50),
[device_description] varchar(50),
[is_active] bit,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([hardware_reg_id])
);

CREATE TABLE [dbo].[GlobalValues] (
[TotalFard] bigint NOT NULL,
[TotalFradFee] bigint NOT NULL,
[TotalIntiqal] bigint NOT NULL,
[TotalIntiqalFee] bigint NOT NULL,
[TotalDocuments] bigint NOT NULL,
[TotalFee] bigint NOT NULL
);

CREATE TABLE [transactions].[HistoryTaghayarCultivator] (
[taghayarcultivator_id] uniqueidentifier NOT NULL,
[taghayar_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[dep_person_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share] varchar(21),
[is_new] bit,
[operation_id] int,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [generic].[BandSawalQuestions] (
[question_id] int NOT NULL,
[question_description] nvarchar(1000),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([question_id])
);

CREATE TABLE [transactions].[IntiqalCourtOrder] (
[intiqalcourtorder_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[case_number] nvarchar(50),
[case_type] nvarchar(100),
[application_date] datetime,
[decision_date] datetime,
[court_name] nvarchar(100),
[judge_name] nvarchar(100),
[case_detail] nvarchar(250),
[copyattestation_date] date,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion,
PRIMARY KEY ([intiqalcourtorder_id])
);

CREATE TABLE [dbo].[TempResults] (
[db_name] varchar(50),
[user_id] nvarchar(100),
[first_name] nvarchar(100),
[username] varchar(100),
[familytree] int,
[ownership] int,
[possession] int,
[khatuni] int,
[khasra] int,
[Remarks] int,
[TOTAL] int
);

CREATE TABLE [audit].[IntiqalOpenLog] (
[LogId] bigint NOT NULL IDENTITY(1,1),
[IntiqalId] uniqueidentifier NOT NULL,
[UserId] uniqueidentifier NOT NULL,
[OpenDateTime] datetime DEFAULT (getdate()) NOT NULL,
PRIMARY KEY ([LogId])
);

CREATE TABLE [utility].[Directory_Contents] (
[dir] nvarchar(255),
[Create_Time] datetime,
[File_Size] decimal(18,0),
[File_Name] nvarchar(255),
[Struct_Type] char(9),
[dirPath] nvarchar(255)
);

CREATE TABLE [territory].[Province] (
[province_id] smallint NOT NULL,
[province_name] nvarchar(50)
);

CREATE TABLE [transactions].[IntiqalMauza] (
[Intiqalmauza_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier NOT NULL,
[patwar_circle_id] uniqueidentifier,
[chak_tashkhees_id] uniqueidentifier,
[mauza_name] nvarchar(50),
[had_bust_no] int,
[feet_per_marla] smallint,
[preparation_year] int,
[is_misl_mayadi] bit,
[is_mauza_sikni] bit,
[is_marla_calculation_unit] bit,
[is_new] bit NOT NULL,
[mauza_stage] tinyint,
[has_shamilat] bit,
[mauza_type] tinyint,
[area_format] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([Intiqalmauza_id])
);

CREATE TABLE [tmp].[tmpTransactionOperationsabc123] (
[transaction_id] uniqueidentifier NOT NULL,
[Operation_id] uniqueidentifier NOT NULL,
[Remarks] nvarchar(200),
[transaction_type] nvarchar(50),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL
);

CREATE TABLE [tmp].[tmpOwnership] (
[mauza_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[family_no] nvarchar(500),
[first_name] nvarchar(200),
[relation_id] int,
[last_name] nvarchar(200),
[person_status_id] int,
[person_status] nvarchar(100),
[dep_person_fname] nvarchar(200),
[caste_id] uniqueidentifier,
[caste_name] nvarchar(100),
[person_share] varchar(100),
[person_area] bigint,
[pass_book_no] varchar(15),
[is_updated] bit,
[is_active] bit
);

CREATE TABLE [Setup].[RegisterFee] (
[fee_id] int NOT NULL,
[register_id] int,
[register_fee] int,
[is_rural] bit,
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([fee_id])
);

CREATE TABLE [tmp].[tmpIntiqalabc123] (
[intiqal_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_id] uniqueidentifier,
[intiqal_type_id] int,
[intiqal_date] datetime,
[intiqal_no] varbinary(70),
[intiqal_reference_no] varbinary(70),
[intiqal_initiation_type] smallint,
[intiqal_amount] bigint,
[evaluation_price] bigint,
[intiqal_status] tinyint,
[is_khanakasht] tinyint,
[is_shamlat] tinyint,
[intiqal_aprove_date] datetime,
[intiqal_remarks] nvarchar(1000),
[crop_name] nvarchar(50),
[is_approved] bit,
[intiqal_sub_type_id] int,
[patta_start_date] varchar(10),
[patta_end_date] varchar(10),
[patta_lagan] nvarchar(50),
[death_date] datetime,
[is_sale_shamilat] bit,
[is_qa] bit,
[khanakasht_sub_type_id] int,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[intiqal_type] nvarchar(50),
[gaintax_amount] bigint,
[is_landtype_change_required] bit
);

CREATE TABLE [tmp].[tmp_AIT] (
[province_id] int,
[district_name] nvarchar(100),
[tehsil_name] nvarchar(100),
[mauza_id] uniqueidentifier,
[mauza_name] nvarchar(100),
[person_id] uniqueidentifier,
[first_name] nvarchar(150),
[address] nvarchar(300),
[khewat_id] uniqueidentifier,
[khewat_no] nvarchar(50),
[person_share] varchar(50),
[person_area] varchar(50),
[preparation_year] int,
[relation_name] nvarchar(30),
[person_fname] nvarchar(150),
[gardawari_year] int,
[season_type_id] int,
[feet_per_marla] int,
[print_sequence_no] int,
[NonBaghIrrigatedArea] varchar(50),
[NonBaghUnirrigatedArea] varchar(50),
[BaghIrrigatedArea] varchar(50),
[BaghUnirrigatedArea] varchar(50),
[NonBaghTotalArea] varchar(50),
[BaghTotalArea] varchar(50),
[area_format] int
);

CREATE TABLE [dbo].[Ownership] (
[district_name] nvarchar(50),
[tehsil_name] nvarchar(50),
[mauza_name] nvarchar(50),
[mauza_id] uniqueidentifier NOT NULL,
[Owners] int
);

CREATE TABLE [tmp].[IntiqalBankOrder] (
[intiqalbankorder_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[issue_date] datetime,
[letter_number] varbinary(250),
[bank_name] varbinary(450),
[branch_name] varbinary(450),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [utility].[Directory_Contents_Stage] (
[dir] nvarchar(255),
[dir_output] nvarchar(255)
);

CREATE TABLE [transactions].[ChallanForm] (
[challan_id] bigint NOT NULL IDENTITY(1,1),
[Intiqal_id] uniqueidentifier,
[Buyer] nvarchar(200),
[Seller] nvarchar(200),
[Seller_area] varchar(15),
PRIMARY KEY ([challan_id])
);

CREATE TABLE [territory].[ServiceCentre] (
[service_centre_id] uniqueidentifier NOT NULL,
[service_centre_name] nvarchar(50),
[is_locked] bit DEFAULT ((0)),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([service_centre_id])
);

CREATE TABLE [error].[Errors] (
[error_id] uniqueidentifier NOT NULL,
[error_number] varchar(20),
[error_class] nvarchar(20),
[error_subTitles] nvarchar(150),
[error_title] nvarchar(200),
[descrition] nvarchar(200),
[step_reproduce] nvarchar(200),
[access_datetime] datetime,
[time_stamp] rowversion,
PRIMARY KEY ([error_id])
);

CREATE TABLE [transactions].[TashkheesMaalia] (
[tashkhees_maalia_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[chak_tashkhees_id] uniqueidentifier NOT NULL,
[approval_date] datetime NOT NULL,
[consolidation_year] int NOT NULL,
[maalia_amount] int NOT NULL,
[sequence_no] int NOT NULL,
[detail] nvarchar(250),
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([tashkhees_maalia_id])
);

CREATE TABLE [transactions].[TaghayarKhatuni] (
[taghayarkhatuni_id] uniqueidentifier NOT NULL,
[taghayar_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khatuni_type_id] uniqueidentifier,
[lagan] varbinary(2100),
[khatuni_description] nvarchar(4000),
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([taghayarkhatuni_id])
);

CREATE TABLE [tmp].[Possession] (
[possession_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[Intiqal_id] uniqueidentifier,
[person_status_id] uniqueidentifier NOT NULL,
[person_share_old] varbinary(100),
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[print_sequence_no] int NOT NULL,
[is_updated] bit NOT NULL,
[is_active] bit,
[is_wrong] bit,
[is_blocked] bit,
[block_detail] nvarchar(1000),
[wrong_fields] varchar(200),
[dimension] nvarchar(30),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
[person_area_new] bigint,
[area_format] smallint,
[kanal_area] int,
[marla_area] int,
[fsg_area] int,
[inch_area] int,
[person_share] varchar(250)
);

CREATE TABLE [transactions].[IntiqalCharges] (
[intiqalcharges_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[intiqal_district_fee] bigint,
[Intiqal_fee] bigint,
[intiqal_stamp_duty] bigint,
[intiqal_cvt] bigint,
[chalan_no] varchar(15),
[bank_name] varbinary(450),
[branch_name] varbinary(450),
[amount_paid] bigint,
[payment_date] datetime,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqalcharges_id])
);

CREATE TABLE [tmp].[tmpCourtOrderabc123] (
[court_order_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[person_id] uniqueidentifier,
[transaction_id] uniqueidentifier,
[transaction_type_id] smallint NOT NULL,
[is_updated] bit NOT NULL,
[discription] nvarchar(250),
[status] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[remarks_id] uniqueidentifier
);

CREATE TABLE [dbo].[Users] (
[user_id] int NOT NULL IDENTITY(1,1),
[user_name] nvarchar(56) NOT NULL,
PRIMARY KEY ([user_id])
);

CREATE TABLE [utility].[JamaBandiLog] (
[JamaBandiLog_id] int NOT NULL IDENTITY(1,1),
[prev_khewat_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[prev_khatuni_id] uniqueidentifier,
[khatuni_id] uniqueidentifier,
[descr] varchar(2000),
[mauza_id] uniqueidentifier
);

CREATE TABLE [territory].[Tehsil] (
[tehsil_id] uniqueidentifier NOT NULL,
[district_id] uniqueidentifier,
[tehsil_name] nvarchar(50),
[is_locked] bit,
[user_id] uniqueidentifier,
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([tehsil_id])
);

CREATE TABLE [tmp].[Person] (
[person_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier,
[first_name] varbinary(750),
[relation_id] int,
[last_name] varbinary(750),
[address] varbinary(550),
[nic] varbinary(80),
[is_govt] bit,
[is_alive] bit,
[is_kashmiri] bit,
[pass_book_no] varbinary(80),
[is_department] bit,
[thumb] nvarchar(max),
[pic_path] varchar(50),
[person_pic] varbinary(max),
[is_blocked] bit,
[block_detail] nvarchar(500),
[old_person_id] uniqueidentifier,
[is_updated] bit,
[is_active] bit,
[user_id] uniqueidentifier,
[person_fname] nvarchar(150),
[access_date_time] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [users].[HistoryRole] (
[role_id] uniqueidentifier NOT NULL,
[description] nvarchar(50),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[operation_id] int,
[machine_id] varchar(50),
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [tmp].[Intiqal] (
[intiqal_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_id] uniqueidentifier,
[intiqal_type_id] int,
[intiqal_date] datetime,
[intiqal_no] varbinary(70),
[intiqal_reference_no] varbinary(200),
[intiqal_initiation_type] smallint,
[intiqal_amount] bigint,
[evaluation_price] bigint,
[intiqal_status] tinyint,
[is_khanakasht] tinyint,
[is_shamlat] tinyint,
[intiqal_aprove_date] datetime,
[intiqal_remarks] nvarchar(1000),
[crop_name] nvarchar(50),
[is_approved] bit,
[intiqal_sub_type_id] int,
[patta_start_date] varchar(10),
[patta_end_date] varchar(10),
[patta_lagan] nvarchar(50),
[death_date] datetime,
[is_sale_shamilat] bit,
[is_qa] bit,
[khanakasht_sub_type_id] int,
[intiqal_type] nvarchar(100),
[gaintax_amount] bigint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[is_landtype_change_required] bit
);

CREATE TABLE [rhz].[HistoryOwnership] (
[ownership_id] uniqueidentifier NOT NULL,
[khewat_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[person_status_id] int,
[person_share] varchar(21),
[person_area1] varchar(15),
[person_area] varchar(50),
[dep_person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[print_sequence_no] int NOT NULL,
[is_updated] bit DEFAULT ((0)) NOT NULL,
[operation_id] smallint,
[parent_ownership_id] uniqueidentifier,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[is_blocked] bit,
[block_detail] nvarchar(1000),
[user_id] uniqueidentifier NOT NULL,
[access_datetime] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
[ownership_history_id] bigint NOT NULL IDENTITY(1,1),
[area_format] smallint,
PRIMARY KEY ([ownership_history_id])
);

CREATE TABLE [Setup].[IrrigationSource] (
[irrigation_source_id] uniqueidentifier NOT NULL,
[irrigation_source_name] nvarchar(100) NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([irrigation_source_id])
);

CREATE TABLE [transactions].[Gardawri] (
[gardawari_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[crop_type_id] uniqueidentifier,
[land_type_id] uniqueidentifier,
[season_type_id] smallint,
[khasra_area] varchar(50),
[gardawari_date] datetime,
[gardawari_year] smallint DEFAULT ((9999)),
[is_kharaba] bit DEFAULT ((0)),
[is_seh_hadda] bit DEFAULT ((0)),
[seh_hadda_description] nvarchar(100),
[is_dual_crop] bit,
[is_fruit] bit,
[total_land_types] smallint,
[parent_gardawari_id] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[remaining_area] varchar(50),
[area_format] smallint,
[gardawri_area_new] bigint,
[mauza_id] uniqueidentifier,
[status] int,
PRIMARY KEY ([gardawari_id])
);

CREATE TABLE [transactions].[HistoryTaghayar] (
[taghayar_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_id] uniqueidentifier,
[intiqal_id] uniqueidentifier,
[gardawari_date] datetime,
[season_id] smallint,
[taghayar_status] smallint,
[taghayar_type] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[history_operation_id] smallint
);

CREATE TABLE [generic].[LastAttestation] (
[attestation_id] uniqueidentifier DEFAULT (newid()) NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[checkingdate] datetime,
[checkingpoint] nvarchar(50),
[testedaccount1] int,
[testedaccount2] int,
[reconciledaccount1] int,
[reconciledaccount2] int,
[muqabalaaccount1] int,
[muqabalaaccount2] int,
[comparedkhewat1] int,
[comparedkhewat2] int,
[currentkhasras] nvarchar(50),
[khasrastehsil] nvarchar(50),
[pendingintiqal1] nvarchar(50),
[peningintiqal2] nvarchar(50),
[remarks] nvarchar(255),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([attestation_id])
);

CREATE TABLE [generic].[WajibUlArz] (
[wajibularz_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[question_id] int,
[answer] nvarchar(max),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([wajibularz_id])
);

CREATE TABLE [tmp].[tmpIntiqalKhasraabc123] (
[intiqalkhasra_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier NOT NULL,
[new_khasra_no] varbinary(150),
[khasra_total_area] int,
[khasra_selling_area] int,
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[area_format] smallint,
[khasra_remaining_area] varchar(50)
);

CREATE TABLE [Setup].[Caste] (
[caste_id] uniqueidentifier NOT NULL,
[caste_name] nvarchar(50) NOT NULL,
[dep_caste_id] uniqueidentifier,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL,
[caste_name_trimmed] AS (ltrim(rtrim([caste_name]))) PERSISTED NOT NULL,
PRIMARY KEY ([caste_id])
);

CREATE TABLE [tmp].[tmpFardBadrPersonabc123] (
[fardbadrperson_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[person_name] varbinary(150),
[relation_id] int,
[person_fname] varbinary(150),
[nic] varbinary(80),
[address] varbinary(450),
[pass_book_no] varbinary(80),
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime
);

CREATE TABLE [transactions].[HistoryIntiqal] (
[intiqal_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_id] uniqueidentifier,
[intiqal_type_id] int,
[intiqal_date] datetime,
[intiqal_no] varchar(10),
[intiqal_reference_no] varchar(45),
[intiqal_initiation_type] smallint,
[intiqal_amount] bigint,
[evaluation_price] bigint,
[intiqal_status] tinyint,
[is_khanakasht] tinyint,
[is_shamlat] tinyint,
[intiqal_aprove_date] datetime,
[intiqal_remarks] nvarchar(1000),
[crop_name] nvarchar(50),
[is_approved] bit,
[intiqal_sub_type_id] int,
[patta_start_date] varchar(10),
[patta_end_date] varchar(10),
[patta_lagan] nvarchar(50),
[death_date] datetime,
[is_sale_shamilat] bit,
[is_qa] bit,
[khanakasht_sub_type_id] int,
[intiqal_type] nvarchar(50),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[history_operation_id] smallint
);

CREATE TABLE [fard].[Fard] (
[fard_id] uniqueidentifier NOT NULL,
[operation_id] uniqueidentifier NOT NULL,
[register_id] int,
[fard_objective] nvarchar(50),
[is_shamlat] bit,
[total_fee] money,
[document_id] varchar(5) NOT NULL,
[fard_status] bit,
[print_status] smallint,
[remarks] nvarchar(2000),
[gaintax_remarks] nvarchar(200),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
[qr_code] varbinary(max),
PRIMARY KEY ([fard_id])
);

CREATE TABLE [dbo].[webpages_Roles] (
[RoleId] int NOT NULL IDENTITY(1,1),
[RoleName] nvarchar(256) NOT NULL,
PRIMARY KEY ([RoleId])
);

CREATE TABLE [tmp].[PersonKhatuni] (
[person_khatuni_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[khatuni_id] uniqueidentifier NOT NULL,
[is_updated] bit NOT NULL,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [tmp].[tmpkhewatabc123] (
[khewat_id] uniqueidentifier NOT NULL,
[parent_khewat_id] uniqueidentifier,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[khewat_no] varbinary(150),
[old_khewat_no] varbinary(1000),
[sub_khewat_no] varbinary(150),
[maalia] varbinary(1100),
[haboob] varbinary(250),
[is_shared] bit,
[is_sikni] bit,
[khewat_type] smallint,
[is_blocked] bit,
[block_detail] nvarchar(500),
[total_share] varbinary(100),
[total_area] varchar(50),
[is_updated] bit,
[is_active] bit,
[is_wrong] bit,
[wrong_fields] varchar(200),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[FirstOwner] nvarchar(200),
[TotalOwners] int,
[area_format] smallint,
[khewat_type_meezan] smallint
);

CREATE TABLE [tmp].[menu1] (
[menu_id] int NOT NULL,
[description] nvarchar(255),
[parent_id] int
);

CREATE TABLE [familytree].[HistoryFamilyTreeCasteSequence] (
[family_tree_caste_sequence_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[caste_id] uniqueidentifier NOT NULL,
[sequence_no] int NOT NULL,
[operation_id] smallint,
[user_id] uniqueidentifier NOT NULL,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [tmp].[tmpFardBadrKhasraabc123] (
[fardbadrkhasra_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[khatuni_id] uniqueidentifier,
[khasra_id] uniqueidentifier NOT NULL,
[new_khasra_no] varbinary(150),
[khasra_area] int,
[land_type_id] uniqueidentifier,
[irrigation_source_id] uniqueidentifier,
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime
);

CREATE TABLE [familytree].[RptShajra] (
[jobid] uniqueidentifier NOT NULL,
[pageno] int NOT NULL,
[col1] nvarchar(500),
[col2] nvarchar(500),
[col3] nvarchar(500),
[col4] nvarchar(500),
[col5] nvarchar(500),
[col6] nvarchar(500),
[col7] nvarchar(500),
[col8] nvarchar(500),
[col9] nvarchar(500),
[pic9] int DEFAULT ((0)) NOT NULL,
[col10] nvarchar(500),
[pic10] int DEFAULT ((0)) NOT NULL,
[col11] nvarchar(500),
[pic11] int DEFAULT ((0)) NOT NULL,
[col12] nvarchar(500),
[pic12] int DEFAULT ((0)) NOT NULL,
[col13] nvarchar(500),
[pic13] int DEFAULT ((0)) NOT NULL,
[col14] nvarchar(500),
[pic14] int DEFAULT ((0)) NOT NULL,
[col15] nvarchar(500),
[pic15] int DEFAULT ((0)) NOT NULL,
[col16] nvarchar(500),
[pic16] int DEFAULT ((0)) NOT NULL,
[col17] nvarchar(500),
[col18] nvarchar(500),
[col19] nvarchar(500),
[col20] nvarchar(500),
[col21] nvarchar(500),
[col22] nvarchar(500),
[col23] nvarchar(500),
[col24] nvarchar(500),
[col25] nvarchar(500),
[pic25] int DEFAULT ((0)) NOT NULL,
[col26] nvarchar(500),
[pic26] int DEFAULT ((0)) NOT NULL,
[col27] nvarchar(500),
[pic27] int DEFAULT ((0)) NOT NULL,
[col28] nvarchar(500),
[pic28] int DEFAULT ((0)) NOT NULL,
[col29] nvarchar(500),
[pic29] int DEFAULT ((0)) NOT NULL,
[col30] nvarchar(500),
[pic30] int DEFAULT ((0)) NOT NULL,
[col31] nvarchar(500),
[pic31] int DEFAULT ((0)) NOT NULL,
[col32] nvarchar(500),
[pic32] int DEFAULT ((0)) NOT NULL,
[col97] nvarchar(500),
[col98] nvarchar(500),
[col99] nvarchar(500),
[col100] nvarchar(500),
[col101] nvarchar(500),
[col102] nvarchar(500),
[col103] nvarchar(500),
[col104] nvarchar(500),
[col105] nvarchar(500),
[col106] nvarchar(500),
[col107] nvarchar(500),
[col108] nvarchar(500),
[col109] nvarchar(500),
[col110] nvarchar(500),
[col111] nvarchar(500),
[col112] nvarchar(500),
[district] nvarchar(500),
[tehsil] nvarchar(500),
[mauza] nvarchar(500),
[rpt_year] int,
[book_no] int,
PRIMARY KEY ([jobid], [pageno])
);

CREATE TABLE [utility].[Status] (
[status_id] uniqueidentifier NOT NULL,
[value_id] uniqueidentifier,
[user_id] uniqueidentifier,
[page] nvarchar(100),
[description] nvarchar(500),
[access_datetime] datetime,
[is_completed] bit,
[query_string] nvarchar(1000),
PRIMARY KEY ([status_id])
);

CREATE TABLE [tmp].[tmpAreabylandType] (
[mauza_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[land_type_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[is_upadted] bit,
[TotalKhasraAreabyLandType] varchar(20),
[TotalKhasraAreabyLandTypeTarafPatti] varchar(20)
);

CREATE TABLE [familytree].[HistoryFamilyTree] (
[familytree_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[taraf_id] uniqueidentifier,
[patti_id] uniqueidentifier,
[person_id] uniqueidentifier,
[family_no] varbinary(100),
[dep_person_id] uniqueidentifier,
[is_numberdar] bit,
[sequence_no] int,
[remarks] nvarchar(1000),
[intiqal_no] int,
[is_updated] bit DEFAULT ((0)),
[is_active] int,
[is_wrong] bit,
[is_childless] bit,
[wrong_fields] varchar(200),
[operation_id] smallint,
[family_type] smallint,
[user_id] uniqueidentifier,
[access_date_time] datetime NOT NULL
);

CREATE TABLE [tmp].[UserRights1] (
[user_right_id] uniqueidentifier NOT NULL,
[form_id] uniqueidentifier,
[user_id] uniqueidentifier,
[view_right] bit,
[insert_right] bit,
[update_right] bit,
[delete_right] bit,
[print_right] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [dbo].[KioskOperations] (
[operation_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier,
[operation_no] varchar(5),
[operation_date] datetime,
[revisit_date] datetime,
[operation_type] smallint,
[operation_remarks] nvarchar(100),
[status] smallint,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL
);

CREATE TABLE [workflow].[Shifts] (
[shift_id] uniqueidentifier NOT NULL,
[shift_description] nvarchar(50),
[shift_start_time] time(7),
[shift_end_time] time(7),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion,
PRIMARY KEY ([shift_id])
);

CREATE TABLE [mail].[AttachmentTypes] (
[attachment_type_id] uniqueidentifier NOT NULL,
[attachment_type_name] varchar(50),
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[attachment_type] tinyint,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([attachment_type_id])
);

CREATE TABLE [transactions].[HistoryIntiqalKhasra] (
[intiqalkhasra_id] uniqueidentifier NOT NULL,
[intiqal_logicalpartition_id] uniqueidentifier NOT NULL,
[khasra_id] uniqueidentifier NOT NULL,
[new_khasra_no] varchar(50),
[khasra_total_area] varchar(50),
[khasra_selling_area] varchar(50),
[is_new] bit,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[history_operation_id] smallint,
[area_format] smallint
);

CREATE TABLE [transactions].[IntiqalPersonInfo] (
[intiqalperson_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[status] int,
[is_verified] bit,
[dep_person_id] uniqueidentifier,
[is_alive] bit,
[old_person_caste_id] uniqueidentifier,
[old_person_name] nvarchar(300),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([intiqalperson_id])
);

CREATE TABLE [generic].[ShajraParcha] (
[Shajra_parcha_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier,
[khasra_id] uniqueidentifier,
[tateema_image] uniqueidentifier,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([Shajra_parcha_id])
);

CREATE TABLE [fard].[FardPOA] (
[document_no] varchar(50) NOT NULL,
[fard_id] uniqueidentifier NOT NULL,
[person_id] uniqueidentifier,
[is_common] bit,
[issued_date] datetime,
[bahi_no] int,
[jild_no] int,
[document_image] image,
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([document_no], [fard_id])
);

CREATE TABLE [generic].[KarguzariQanonGo] (
[karguzariqanoongo_id] uniqueidentifier NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[name] nvarchar(35),
[entry_date] datetime NOT NULL,
[detail] nvarchar(1000),
[remarks] nvarchar(1000),
[user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion NOT NULL,
PRIMARY KEY ([karguzariqanoongo_id])
);

CREATE TABLE [tmp].[tmpFardBadrKhewatabc123] (
[fardbadrkhewat_id] uniqueidentifier NOT NULL,
[fardbadr_id] uniqueidentifier NOT NULL,
[fardbadrtype_id] varchar(500),
[ownership_id] uniqueidentifier,
[person_id] uniqueidentifier,
[khewat_id] uniqueidentifier,
[khewat_no] varbinary(150),
[person_share] varbinary(100),
[person_area] int,
[total_share] varbinary(100),
[total_area] int,
[ownership_status_id] int,
[user_id] uniqueidentifier,
[is_wrong] bit,
[wrong_fields] varchar(200),
[access_datetime] datetime
);

CREATE TABLE [Setup].[CasteSequence] (
[id] int NOT NULL,
[mauza_id] uniqueidentifier NOT NULL,
[caste_id] uniqueidentifier,
PRIMARY KEY ([id])
);

CREATE TABLE [tmp].[tmpIntiqalChargesabc123] (
[intiqalcharges_id] uniqueidentifier NOT NULL,
[intiqal_id] uniqueidentifier NOT NULL,
[intiqal_district_fee] bigint,
[Intiqal_fee] bigint,
[intiqal_stamp_duty] bigint,
[intiqal_cvt] bigint,
[chalan_no] varchar(15),
[bank_name] varbinary(450),
[branch_name] varbinary(450),
[amount_paid] bigint,
[payment_date] datetime,
[user_id] uniqueidentifier,
[access_datetime] datetime
);

CREATE TABLE [workflow].[ShiftUsers] (
[shift_user_id] uniqueidentifier NOT NULL,
[shift_id] uniqueidentifier,
[user_id] uniqueidentifier,
[is_current] bit,
[access_user_id] uniqueidentifier,
[access_datetime] datetime,
[time_stamp] rowversion,
PRIMARY KEY ([shift_user_id])
);


ALTER TABLE [transactions].[IntiqalPatta]
ADD CONSTRAINT [FK_IntiqalPatta_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TransactionOperations]
ADD CONSTRAINT [FK_TransactionOperations_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhatuni]
ADD CONSTRAINT [FK_FardBadrKhatuni_PersonStatusRights]
FOREIGN KEY ([person_status_id]) 
REFERENCES [Setup].[PersonStatusRights]([person_status_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhatuni]
ADD CONSTRAINT [FK_FardBadrKhatuni_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhatuni]
ADD CONSTRAINT [FK_FardBadrKhatuni_FardBadrKhatuniType]
FOREIGN KEY ([khatuni_type_id]) 
REFERENCES [Setup].[KhatuniType]([khatuni_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhatuni]
ADD CONSTRAINT [FK_FardBadrKhatuni_FardBadrKhatuni]
FOREIGN KEY ([fardbadrkhatuni_id]) 
REFERENCES [fardbadr].[FardBadrKhatuni]([fardbadrkhatuni_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhatuni]
ADD CONSTRAINT [FK_FardBadrKhatunitype]
FOREIGN KEY ([khatuni_type_id]) 
REFERENCES [Setup].[KhatuniType]([khatuni_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhatuni]
ADD CONSTRAINT [FK_FardBadrKhatuni_Possession]
FOREIGN KEY ([possession_id]) 
REFERENCES [rhz].[Possession]([possession_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Possession]
ADD CONSTRAINT [FK_Possession_PersonStatusRights]
FOREIGN KEY ([person_status_id]) 
REFERENCES [Setup].[PersonStatusRights]([person_status_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Possession]
ADD CONSTRAINT [FK_Possession_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Possession]
ADD CONSTRAINT [FK_Possession_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalErrors]
ADD CONSTRAINT [FK_IntiqalErrors_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalErrors]
ADD CONSTRAINT [FK_IntiqalErrors_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalTateema]
ADD CONSTRAINT [FK_IntiqalTateema_LandType]
FOREIGN KEY ([land_type_id]) 
REFERENCES [Setup].[LandType]([land_type_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [transactions].[IntiqalTateema]
ADD CONSTRAINT [FK_IntiqalTateema_Intiqal]
FOREIGN KEY ([Intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[BandSawalAnswers]
ADD CONSTRAINT [FK_BandSawalAnswers_BandSawalQuestions]
FOREIGN KEY ([question_id]) 
REFERENCES [generic].[BandSawalQuestions]([question_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[BandSawalAnswers]
ADD CONSTRAINT [FK_BandSawalAnswers_BandSawal]
FOREIGN KEY ([band_sawal_id]) 
REFERENCES [generic].[BandSawal]([band_sawal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserRoles]
ADD CONSTRAINT [FK_UserRoles_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserRoles]
ADD CONSTRAINT [FK_UserRoles_Role1]
FOREIGN KEY ([role_id]) 
REFERENCES [users].[Role]([role_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalBankOrder]
ADD CONSTRAINT [FK_IntiqalBankOrder_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [dbo].[webpages_UsersInRoles]
ADD CONSTRAINT [fk_RoleId]
FOREIGN KEY ([RoleId]) 
REFERENCES [dbo].[webpages_Roles]([RoleId])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [dbo].[webpages_UsersInRoles]
ADD CONSTRAINT [fk_UserId]
FOREIGN KEY ([UserId]) 
REFERENCES [dbo].[Users]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[TaxRate]
ADD CONSTRAINT [FK_TaxRate_TaxRate]
FOREIGN KEY ([tax_id]) 
REFERENCES [Setup].[TaxRate]([tax_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[IntiqalFees]
ADD CONSTRAINT [FK_IntiqalFees_IntiqalType]
FOREIGN KEY ([Intiqal_type_id]) 
REFERENCES [Setup].[IntiqalType]([intiqal_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardGuardian]
ADD CONSTRAINT [FK_FardGuardian_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardGuardian]
ADD CONSTRAINT [FK_FardGuardian_Fard]
FOREIGN KEY ([fard_id]) 
REFERENCES [fard].[Fard]([fard_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Khewat]
ADD CONSTRAINT [FK_Khewat_Patti]
FOREIGN KEY ([patti_id]) 
REFERENCES [territory].[Patti]([patti_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Khewat]
ADD CONSTRAINT [FK_Khewat_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Khewat]
ADD CONSTRAINT [FK_Khewat_Taraf]
FOREIGN KEY ([taraf_id]) 
REFERENCES [territory].[Taraf]([taraf_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[FieldLevelUserRights]
ADD CONSTRAINT [FK_FieldLevelUserRights_FieldLevelSecurity]
FOREIGN KEY ([field_level_security_id]) 
REFERENCES [users].[FieldLevelSecurity]([field_level_security_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardPersons]
ADD CONSTRAINT [FK_FardPersons_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardPersons]
ADD CONSTRAINT [FK_FardPersons_FardKhewats]
FOREIGN KEY ([fardkhewat_id]) 
REFERENCES [fard].[FardKhewats]([fardkhewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [territory].[PatwarCircle]
ADD CONSTRAINT [FK_PatwarCircle_QanoonGoi]
FOREIGN KEY ([qanoon_goi_id]) 
REFERENCES [territory].[QanoonGoi]([qanoon_goi_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [rhz].[Khasra]
ADD CONSTRAINT [FK_Khasra_IrrigationSource]
FOREIGN KEY ([irrigation_source_id]) 
REFERENCES [Setup].[IrrigationSource]([irrigation_source_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Khasra]
ADD CONSTRAINT [FK_Khasra_LandType]
FOREIGN KEY ([land_type_id]) 
REFERENCES [Setup].[LandType]([land_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Khasra]
ADD CONSTRAINT [FK_Khasra_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[NumberdarKhewat]
ADD CONSTRAINT [FK_NumberdarKhewat_Taraf]
FOREIGN KEY ([taraf_id]) 
REFERENCES [territory].[Taraf]([taraf_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[NumberdarKhewat]
ADD CONSTRAINT [FK_NumberdarKhewat_Patti]
FOREIGN KEY ([patti_id]) 
REFERENCES [territory].[Patti]([patti_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[NumberdarKhewat]
ADD CONSTRAINT [FK_NumberdarKhewat_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardVisitors]
ADD CONSTRAINT [FK_FardVisitors_Person1]
FOREIGN KEY ([owner_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardVisitors]
ADD CONSTRAINT [FK_FardVisitors_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardVisitors]
ADD CONSTRAINT [FK_FardVisitors_Fard]
FOREIGN KEY ([fard_id]) 
REFERENCES [fard].[Fard]([fard_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [territory].[Taraf]
ADD CONSTRAINT [FK_Taraf_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [generic].[FieldBook]
ADD CONSTRAINT [FK_FieldBook_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[FieldBook]
ADD CONSTRAINT [FK_FieldBook_LandType]
FOREIGN KEY ([land_type_id]) 
REFERENCES [Setup].[LandType]([land_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[FieldBook]
ADD CONSTRAINT [FK_FieldBook_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserQanoonGoi]
ADD CONSTRAINT [FK_UserQanoonGoi_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserQanoonGoi]
ADD CONSTRAINT [FK_UserQanoonGoi_QanoonGoi]
FOREIGN KEY ([qanoon_goi_id]) 
REFERENCES [territory].[QanoonGoi]([qanoon_goi_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [generic].[NaqshaHaqooqChahatWaNalChahat]
ADD CONSTRAINT [FK_NaqshaHaqooqChahatWaNalChahat_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[Partaal]
ADD CONSTRAINT [FK_Partaal_PatwarCircle]
FOREIGN KEY ([patwar_circle_id]) 
REFERENCES [territory].[PatwarCircle]([patwar_circle_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [users].[QanoonGoiRights]
ADD CONSTRAINT [FK_QanoonGoiRights_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[QanoonGoiRights]
ADD CONSTRAINT [FK_QanoonGoiRights_QanoonGoi]
FOREIGN KEY ([qanoon_goi_id]) 
REFERENCES [territory].[QanoonGoi]([qanoon_goi_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[PersonKhewat]
ADD CONSTRAINT [FK_PersonKhewat_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[PersonKhewat]
ADD CONSTRAINT [FK_PersonKhewat_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [mail].[Attachments]
ADD CONSTRAINT [FK_Attachments_Mail]
FOREIGN KEY ([mail_id]) 
REFERENCES [mail].[Mail]([mail_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [mail].[Attachments]
ADD CONSTRAINT [FK_Attachments_AttachmentTypes]
FOREIGN KEY ([attachment_type_id]) 
REFERENCES [mail].[AttachmentTypes]([attachment_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TransactionVisitorInfo]
ADD CONSTRAINT [FK_TransactionVisitorInfo_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[PassBookLog]
ADD CONSTRAINT [FK_PassBookLog_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[FardTaqseemAabRemarks]
ADD CONSTRAINT [FK_FardTaqseemAabRemarks_FardTaqseemAabRemarks]
FOREIGN KEY ([fard_taqseemaab_id]) 
REFERENCES [generic].[FardTaqseemAab]([fard_taqseemaab_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[RHZTitle]
ADD CONSTRAINT [FK_RHZTitle_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [territory].[Patti]
ADD CONSTRAINT [FK_Patti_Taraf]
FOREIGN KEY ([taraf_id]) 
REFERENCES [territory].[Taraf]([taraf_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [transactions].[Taghayar]
ADD CONSTRAINT [FK_Taghayar_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Taghayar]
ADD CONSTRAINT [FK_Taghayar_KioskOperations]
FOREIGN KEY ([operation_id]) 
REFERENCES [generic].[KioskOperations]([operation_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Taghayar]
ADD CONSTRAINT [FK_Taghayar_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[NoteQanoonGo]
ADD CONSTRAINT [FK_NoteQanoonGo_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[IntiqalDeed]
ADD CONSTRAINT [FK_IntiqalDeed_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[IntiqalDeed]
ADD CONSTRAINT [FK_IntiqalDeed_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[IntiqalDeed]
ADD CONSTRAINT [FK_IntiqalDeed_IntiqalType]
FOREIGN KEY ([intiqal_type_id]) 
REFERENCES [Setup].[IntiqalType]([intiqal_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[IntiqalDeed]
ADD CONSTRAINT [FK_IntiqalDeed_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalKhasra]
ADD CONSTRAINT [FK_IntiqalKhasra_IntiqalLogicalPartition]
FOREIGN KEY ([intiqal_logicalpartition_id]) 
REFERENCES [transactions].[IntiqalLogicalPartition]([intiqal_logicalpartition_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalKhasra]
ADD CONSTRAINT [FK_IntiqalKhasra_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[KhasraAbadi]
ADD CONSTRAINT [FK_KhasraAbadi_LandType]
FOREIGN KEY ([land_type_id]) 
REFERENCES [Setup].[LandType]([land_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[KhasraAbadi]
ADD CONSTRAINT [FK_KhasraAbadi_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[IntiqalInitiation]
ADD CONSTRAINT [FK_IntiqalInitiation_IntiqalInitiationType]
FOREIGN KEY ([intiqal_initiation_id]) 
REFERENCES [Setup].[IntiqalInitiationType]([intiqal_initiation_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[IntiqalInitiation]
ADD CONSTRAINT [FK_IntiqalInitiation_IntiqalType]
FOREIGN KEY ([intiqal_type_id]) 
REFERENCES [Setup].[IntiqalType]([intiqal_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [territory].[QanoonGoi]
ADD CONSTRAINT [FK_QanoonGoi_Tehsil]
FOREIGN KEY ([tehsil_id]) 
REFERENCES [territory].[Tehsil]([tehsil_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[Hidiati]
ADD CONSTRAINT [FK_Hidiati_PatwarCircle]
FOREIGN KEY ([patwar_circle_id]) 
REFERENCES [territory].[PatwarCircle]([patwar_circle_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [fardbadr].[FardBadrPerson]
ADD CONSTRAINT [FK_FardBadrPerson_FardBadr]
FOREIGN KEY ([fardbadr_id]) 
REFERENCES [fardbadr].[FardBadr]([fardbadr_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrPerson]
ADD CONSTRAINT [FK_FardBadrPerson_Caste]
FOREIGN KEY ([caste_id]) 
REFERENCES [Setup].[Caste]([caste_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrPerson]
ADD CONSTRAINT [FK_FardBadrPerson_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TaghayarCultivator]
ADD CONSTRAINT [FK_TaghayarCultivator_Taghayar]
FOREIGN KEY ([taghayar_id]) 
REFERENCES [transactions].[Taghayar]([taghayar_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TaghayarCultivator]
ADD CONSTRAINT [FK_TaghayarCultivator_PersonStatusRights]
FOREIGN KEY ([person_status_id]) 
REFERENCES [Setup].[PersonStatusRights]([person_status_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TaghayarCultivator]
ADD CONSTRAINT [FK_TaghayarCultivator_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[MauzaRights]
ADD CONSTRAINT [FK_MauzaRights_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[MauzaRights]
ADD CONSTRAINT [FK_MauzaRights_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserPatwarCircle]
ADD CONSTRAINT [FK_UserPatwarCircle_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserPatwarCircle]
ADD CONSTRAINT [FK_UserPatwarCircle_PatwarCircle]
FOREIGN KEY ([patwar_circle_id]) 
REFERENCES [territory].[PatwarCircle]([patwar_circle_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [generic].[Complaint]
ADD CONSTRAINT [FK_Complaint_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[Complaint]
ADD CONSTRAINT [FK_Complaint_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[Complaint]
ADD CONSTRAINT [FK_Complaint_KioskOperations]
FOREIGN KEY ([operation_id]) 
REFERENCES [generic].[KioskOperations]([operation_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[Complaint]
ADD CONSTRAINT [FK_Complaint_Fard]
FOREIGN KEY ([fard_id]) 
REFERENCES [fard].[Fard]([fard_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[Complaint]
ADD CONSTRAINT [FK_Complaint_Caste]
FOREIGN KEY ([new_caste_id]) 
REFERENCES [Setup].[Caste]([caste_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[GISKhasras]
ADD CONSTRAINT [FK_GISKhasras_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[PatwarCircleRights]
ADD CONSTRAINT [FK_PatwarCircleRights_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[PatwarCircleRights]
ADD CONSTRAINT [FK_PatwarCircleRights_PatwarCircle]
FOREIGN KEY ([patwar_circle_id]) 
REFERENCES [territory].[PatwarCircle]([patwar_circle_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[RemarksKhasra]
ADD CONSTRAINT [FK_RemarksKhasra_Remarks]
FOREIGN KEY ([remarks_id]) 
REFERENCES [rhz].[Remarks]([remarks_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[RemarksKhasra]
ADD CONSTRAINT [FK_RemarksKhasra_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [mail].[Mail]
ADD CONSTRAINT [FK_Mail_User]
FOREIGN KEY ([from_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTreeCasteSequence_tmp]
ADD CONSTRAINT [FK_FamilyTreeCasteSequence_Taraf]
FOREIGN KEY ([taraf_id]) 
REFERENCES [territory].[Taraf]([taraf_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTreeCasteSequence_tmp]
ADD CONSTRAINT [FK_FamilyTreeCasteSequence_Patti]
FOREIGN KEY ([patti_id]) 
REFERENCES [territory].[Patti]([patti_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTreeCasteSequence_tmp]
ADD CONSTRAINT [FK_FamilyTreeCasteSequence_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTreeCasteSequence_tmp]
ADD CONSTRAINT [FK_FamilyTreeCasteSequence_Caste]
FOREIGN KEY ([caste_id]) 
REFERENCES [Setup].[Caste]([caste_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [territory].[ServiceCentreRegion]
ADD CONSTRAINT [FK_ServiceCentreRegion_ServiceCentre]
FOREIGN KEY ([service_centre_id]) 
REFERENCES [territory].[ServiceCentre]([service_centre_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [territory].[ServiceCentreRegion]
ADD CONSTRAINT [FK_ServiceCentreRegion_QanoonGoi]
FOREIGN KEY ([qanoon_goi_id]) 
REFERENCES [territory].[QanoonGoi]([qanoon_goi_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[JobAssignment]
ADD CONSTRAINT [FK_JobAssignment_To_User1]
FOREIGN KEY ([assignedTo_user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[JobAssignment]
ADD CONSTRAINT [FK_JobAssignment_By_User]
FOREIGN KEY ([assignedBy_user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhasra]
ADD CONSTRAINT [FK_FardBadrKhasra_FardBadr]
FOREIGN KEY ([fardbadr_id]) 
REFERENCES [fardbadr].[FardBadr]([fardbadr_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[NakhlishtanTreeQuantity]
ADD CONSTRAINT [FK_NakhlishtanTreeQuantity_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[ChakUnit]
ADD CONSTRAINT [FK_ChakUnit_Tehsil]
FOREIGN KEY ([tehsil_id]) 
REFERENCES [territory].[Tehsil]([tehsil_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[ChakUnit]
ADD CONSTRAINT [FK_ChakUnit_LandType]
FOREIGN KEY ([land_type_id]) 
REFERENCES [Setup].[LandType]([land_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[ChakUnit]
ADD CONSTRAINT [FK_ChakUnit_ChakTashkhees]
FOREIGN KEY ([chak_tashkhees_id]) 
REFERENCES [Setup].[ChakTashkhees]([chak_tashkhees_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[RegisterSchema]
ADD CONSTRAINT [FK_RegisterSchema_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[BandSawal]
ADD CONSTRAINT [FK_BandSawal_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ParchaKhatuni]
ADD CONSTRAINT [FK_ParchaKhatuni_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ParchaKhatuni]
ADD CONSTRAINT [FK_ParchaKhatuni_LandType]
FOREIGN KEY ([land_type_id]) 
REFERENCES [Setup].[LandType]([land_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ParchaKhatuni]
ADD CONSTRAINT [FK_ParchaKhatuni_IrrigationSource]
FOREIGN KEY ([irrigation_source_id]) 
REFERENCES [Setup].[IrrigationSource]([irrigation_source_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ParchaKhatuni]
ADD CONSTRAINT [FK_ParchaKhatuni_Patti]
FOREIGN KEY ([patti_id]) 
REFERENCES [territory].[Patti]([patti_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ParchaKhatuni]
ADD CONSTRAINT [FK_ParchaKhatuni_Taraf]
FOREIGN KEY ([taraf_id]) 
REFERENCES [territory].[Taraf]([taraf_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ParchaKhatuni]
ADD CONSTRAINT [FK_ParchaKhatuni_PersonStatusRights]
FOREIGN KEY ([person_status_id]) 
REFERENCES [Setup].[PersonStatusRights]([person_status_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ParchaKhatuni]
ADD CONSTRAINT [FK_ParchaKhatuni_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalLogicalPartition]
ADD CONSTRAINT [FK_IntiqalLogicalPartition_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalLogicalPartition]
ADD CONSTRAINT [FK_IntiqalLogicalPartition_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE CASCADE
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalLogicalPartition]
ADD CONSTRAINT [FK_IntiqalLogicalPartition_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[RegisterScheme]
ADD CONSTRAINT [FK_RegisterScheme_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserModule]
ADD CONSTRAINT [FK_UserModule_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserModule]
ADD CONSTRAINT [FK_UserModule_Module]
FOREIGN KEY ([module_id]) 
REFERENCES [users].[Module]([module_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Remarks]
ADD CONSTRAINT [FK_Remarks_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadr]
ADD CONSTRAINT [FK_FardBadr_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadr]
ADD CONSTRAINT [FK_FardBadr_KioskOperations]
FOREIGN KEY ([operation_id]) 
REFERENCES [generic].[KioskOperations]([operation_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadr]
ADD CONSTRAINT [FK_FardBadr_FardBadrType]
FOREIGN KEY ([fardbadrtype_id]) 
REFERENCES [Setup].[FardBadrType]([fardbadrtype_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [mail].[MailReceiver]
ADD CONSTRAINT [FK_MailReceiver_User]
FOREIGN KEY ([sent_to]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [mail].[MailReceiver]
ADD CONSTRAINT [FK_MailReceiver_Mail]
FOREIGN KEY ([mail_id]) 
REFERENCES [mail].[Mail]([mail_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [mail].[MailReceiver]
ADD CONSTRAINT [FK_MailReceiver_User1]
FOREIGN KEY ([copy_to]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [reference].[Person]
ADD CONSTRAINT [FK_Person_Caste]
FOREIGN KEY ([caste_id]) 
REFERENCES [Setup].[Caste]([caste_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [reference].[Person]
ADD CONSTRAINT [FK_Person_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[StateBeforeIntiqal]
ADD CONSTRAINT [FK_StateBeforeIntiqal_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[StateBeforeIntiqal]
ADD CONSTRAINT [FK_StatusBeforeIntiqal_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalRegistery]
ADD CONSTRAINT [FK_IntiqalRegistery_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalReport]
ADD CONSTRAINT [FK_IntiqalReport_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[CourtOrder]
ADD CONSTRAINT [FK_CourtOrder_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[CourtOrder]
ADD CONSTRAINT [FK_CourtOrder_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[CourtOrder]
ADD CONSTRAINT [FK_CourtOrder_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[CourtOrder]
ADD CONSTRAINT [FK_CourtOrder_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[KhatuniNumberLog]
ADD CONSTRAINT [FK_KhatuniNoLog_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[TaskDetail]
ADD CONSTRAINT [FK_TaskDetail_Task]
FOREIGN KEY ([task_id]) 
REFERENCES [workflow].[Task]([task_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[TaskDetail]
ADD CONSTRAINT [FK_TaskDetail_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalTrees]
ADD CONSTRAINT [FK_IntiqalTrees_IntiqalLogicalPartition]
FOREIGN KEY ([intiqal_logicalpartition_id]) 
REFERENCES [transactions].[IntiqalLogicalPartition]([intiqal_logicalpartition_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalTrees]
ADD CONSTRAINT [FK_IntiqalTrees_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserRights]
ADD CONSTRAINT [FK_UserRights_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserRights]
ADD CONSTRAINT [FK_UserRights_Forms]
FOREIGN KEY ([form_id]) 
REFERENCES [users].[Forms]([form_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[RoleRights]
ADD CONSTRAINT [FK_RoleRights_Role]
FOREIGN KEY ([role_id]) 
REFERENCES [users].[Role]([role_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[RoleRights]
ADD CONSTRAINT [FK_RoleRights_Forms]
FOREIGN KEY ([form_id]) 
REFERENCES [users].[Forms]([form_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhewat]
ADD CONSTRAINT [FK_FardBadrKhewat_FardBadr]
FOREIGN KEY ([fardbadr_id]) 
REFERENCES [fardbadr].[FardBadr]([fardbadr_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhewat]
ADD CONSTRAINT [FK_FardBadrKhewat_Ownership]
FOREIGN KEY ([ownership_id]) 
REFERENCES [rhz].[Ownership]([ownership_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrKhewat]
ADD CONSTRAINT [FK_FardBadrKhewat_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[FardTaqseemAab]
ADD CONSTRAINT [FK_FardTaqseemAab_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[FardTaqseemAab]
ADD CONSTRAINT [FK_FardTaqseemAab_IrrigationSource]
FOREIGN KEY ([irrigation_source_id]) 
REFERENCES [Setup].[IrrigationSource]([irrigation_source_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[FardTaqseemAab]
ADD CONSTRAINT [FK_FardTaqseemAab_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[FardTaqseemAab]
ADD CONSTRAINT [FK_FardTaqseemAab_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardKhewats]
ADD CONSTRAINT [FK_FardKhewats_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardKhewats]
ADD CONSTRAINT [FK_FardKhewats_Fard]
FOREIGN KEY ([fard_id]) 
REFERENCES [fard].[Fard]([fard_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [tmp].[TmpKhatuni]
ADD CONSTRAINT [FK_TmpKhatuni_KhatuniType]
FOREIGN KEY ([new_khatuni_type_id]) 
REFERENCES [Setup].[KhatuniType]([khatuni_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [tmp].[TmpKhatuni]
ADD CONSTRAINT [FK_TmpKhatuni_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[RemarksKhatuni]
ADD CONSTRAINT [FK_RemarksKhatuni_Remarks]
FOREIGN KEY ([remarks_id]) 
REFERENCES [rhz].[Remarks]([remarks_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[RemarksKhatuni]
ADD CONSTRAINT [FK_RemarksKhatuni_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE CASCADE
ON UPDATE NO ACTION;



ALTER TABLE [generic].[NoteChangeLandType]
ADD CONSTRAINT [FK_NoteChangeLandType_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[Task]
ADD CONSTRAINT [FK_Task_User_assignTo]
FOREIGN KEY ([assigned_to]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[Task]
ADD CONSTRAINT [FK_Task_User_assignby]
FOREIGN KEY ([assigned_by]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[Task]
ADD CONSTRAINT [FK_Task_Task]
FOREIGN KEY ([task_id]) 
REFERENCES [workflow].[Task]([task_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[Task]
ADD CONSTRAINT [FK_Task_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [territory].[Mauza]
ADD CONSTRAINT [FK_Mauza_PatwarCircle]
FOREIGN KEY ([patwar_circle_id]) 
REFERENCES [territory].[PatwarCircle]([patwar_circle_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [territory].[Mauza]
ADD CONSTRAINT [FK_Mauza_ChakTashkhees]
FOREIGN KEY ([chak_tashkhees_id]) 
REFERENCES [Setup].[ChakTashkhees]([chak_tashkhees_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Khatuni]
ADD CONSTRAINT [FK_Khatuni_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Khatuni]
ADD CONSTRAINT [FK_Khatuni_KhatuniType]
FOREIGN KEY ([khatuni_type_id]) 
REFERENCES [Setup].[KhatuniType]([khatuni_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[KhewatNumberLog]
ADD CONSTRAINT [FK_KhewatNoLog_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTree]
ADD CONSTRAINT [FK_FamilyTree_Patti]
FOREIGN KEY ([patti_id]) 
REFERENCES [territory].[Patti]([patti_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTree]
ADD CONSTRAINT [FK_FamilyTree_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTree]
ADD CONSTRAINT [FK_FamilyTree_Taraf]
FOREIGN KEY ([taraf_id]) 
REFERENCES [territory].[Taraf]([taraf_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTree]
ADD CONSTRAINT [FK_FamilyTree_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardKhasra]
ADD CONSTRAINT [FK_FardKhasra_FardKhewats]
FOREIGN KEY ([fardkhewat_id]) 
REFERENCES [fard].[FardKhewats]([fardkhewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardKhasra]
ADD CONSTRAINT [FK_FardKhasra_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserServiceCentre]
ADD CONSTRAINT [FK_UserServiceCentre_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[UserServiceCentre]
ADD CONSTRAINT [FK_UserServiceCentre_ServiceCentre]
FOREIGN KEY ([service_centre_id]) 
REFERENCES [territory].[ServiceCentre]([service_centre_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[Forms]
ADD CONSTRAINT [FK_Forms_Module]
FOREIGN KEY ([module_id]) 
REFERENCES [users].[Module]([module_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[Forms]
ADD CONSTRAINT [FK_Forms_Menu]
FOREIGN KEY ([menu_id]) 
REFERENCES [users].[Menu]([menu_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrFamilyTree]
ADD CONSTRAINT [FK_FardBadrFamilyTree_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fardbadr].[FardBadrFamilyTree]
ADD CONSTRAINT [FK_FardBadrFamilyTree_FardBadr]
FOREIGN KEY ([fardbadr_id]) 
REFERENCES [fardbadr].[FardBadr]([fardbadr_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[MauzaTrees]
ADD CONSTRAINT [FK_MauzaTrees_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[MauzaTrees]
ADD CONSTRAINT [FK_MauzaTrees_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[PossessionAbadi]
ADD CONSTRAINT [FK_PossessionAbadi_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE CASCADE
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[PossessionAbadi]
ADD CONSTRAINT [FK_PossessionAbadi_PersonStatusRights]
FOREIGN KEY ([person_status_id]) 
REFERENCES [Setup].[PersonStatusRights]([person_status_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[PossessionAbadi]
ADD CONSTRAINT [FK_PossessionAbadi_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[KarguzariPatwari]
ADD CONSTRAINT [FK_KarguzariPatwari_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[PanChakiyat]
ADD CONSTRAINT [FK_PanChakiyat_Person]
FOREIGN KEY ([owner_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[PanChakiyat]
ADD CONSTRAINT [FK_PanChakiyat_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [correction].[Person]
ADD CONSTRAINT [FK_Person_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [correction].[Person]
ADD CONSTRAINT [FK_Person_Caste]
FOREIGN KEY ([caste_id]) 
REFERENCES [Setup].[Caste]([caste_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[KioskOperations]
ADD CONSTRAINT [FK_KioskOperations_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [users].[FieldLevelSecurity]
ADD CONSTRAINT [FK_FieldLevelSecurity_Forms]
FOREIGN KEY ([form_id]) 
REFERENCES [users].[Forms]([form_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalPersonShare]
ADD CONSTRAINT [FK_IntiqalPersonShare_PersonStatusRights]
FOREIGN KEY ([poss_person_status_id]) 
REFERENCES [Setup].[PersonStatusRights]([person_status_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalPersonShare]
ADD CONSTRAINT [FK_IntiqalPersonShare_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalPersonShare]
ADD CONSTRAINT [FK_IntiqalPersonShare_IntiqalLogicalPartition]
FOREIGN KEY ([intiqal_logicalpartition_id]) 
REFERENCES [transactions].[IntiqalLogicalPartition]([intiqal_logicalpartition_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[Waqiati]
ADD CONSTRAINT [FK_Waqiati_PatwarCircle]
FOREIGN KEY ([patwar_circle_id]) 
REFERENCES [territory].[PatwarCircle]([patwar_circle_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [transactions].[IntiqalKhatuni]
ADD CONSTRAINT [FK_IntiqalKhatuni_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalKhatuni]
ADD CONSTRAINT [FK_IntiqalKhatuni_IntiqalLogicalPartition]
FOREIGN KEY ([intiqal_logicalpartition_id]) 
REFERENCES [transactions].[IntiqalLogicalPartition]([intiqal_logicalpartition_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[RemarksPerson]
ADD CONSTRAINT [FK_RemarksPerson_Remarks]
FOREIGN KEY ([remarks_id]) 
REFERENCES [rhz].[Remarks]([remarks_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[RemarksPerson]
ADD CONSTRAINT [FK_RemarksPerson_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Ownership]
ADD CONSTRAINT [FK_Ownership_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[Ownership]
ADD CONSTRAINT [FK_Ownership_Khewat]
FOREIGN KEY ([khewat_id]) 
REFERENCES [rhz].[Khewat]([khewat_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TransactionImages]
ADD CONSTRAINT [FK_TransactionImages_ScanImages]
FOREIGN KEY ([image_id]) 
REFERENCES [transactions].[ScanImages]([image_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TransactionImages]
ADD CONSTRAINT [FK_TransactionImages_Mauza]
FOREIGN KEY ([transaction_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [familytree].[FamilyTreeTitle]
ADD CONSTRAINT [FK_FamilyTreeTitle_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TaghayarKhasra]
ADD CONSTRAINT [FK_TaghayarKhasra_Taghayar]
FOREIGN KEY ([taghayar_id]) 
REFERENCES [transactions].[Taghayar]([taghayar_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TaghayarKhasra]
ADD CONSTRAINT [FK_TaghayarKhasra_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[PersonKhatuni]
ADD CONSTRAINT [FK_PersonKhatuni_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [rhz].[PersonKhatuni]
ADD CONSTRAINT [FK_PersonKhatuni_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE CASCADE
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Intiqal]
ADD CONSTRAINT [FK_Intiqal_ServiceCentre]
FOREIGN KEY ([operation_id]) 
REFERENCES [generic].[KioskOperations]([operation_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Intiqal]
ADD CONSTRAINT [FK_Intiqal_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Intiqal]
ADD CONSTRAINT [FK_Intiqal_IntiqalType]
FOREIGN KEY ([intiqal_type_id]) 
REFERENCES [Setup].[IntiqalType]([intiqal_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalCourtOrder]
ADD CONSTRAINT [FK_IntiqalCourtOrders_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalMauza]
ADD CONSTRAINT [FK_IntiqalMauza_Intiqal]
FOREIGN KEY ([Intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[RegisterFee]
ADD CONSTRAINT [FK_RegisterFee_Register]
FOREIGN KEY ([register_id]) 
REFERENCES [Setup].[Register]([register_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[ChallanForm]
ADD CONSTRAINT [FK_ChallanForm_Intiqal]
FOREIGN KEY ([Intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TashkheesMaalia]
ADD CONSTRAINT [FK_TashkheesMaalia_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TashkheesMaalia]
ADD CONSTRAINT [FK_TashkheesMaalia_ChakTashkhees]
FOREIGN KEY ([chak_tashkhees_id]) 
REFERENCES [Setup].[ChakTashkhees]([chak_tashkhees_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TaghayarKhatuni]
ADD CONSTRAINT [FK_TaghayarKhatuni_Taghayar]
FOREIGN KEY ([taghayar_id]) 
REFERENCES [transactions].[Taghayar]([taghayar_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [transactions].[TaghayarKhatuni]
ADD CONSTRAINT [FK_TaghayarKhatuni_KhatuniType]
FOREIGN KEY ([khatuni_type_id]) 
REFERENCES [Setup].[KhatuniType]([khatuni_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[TaghayarKhatuni]
ADD CONSTRAINT [FK_TaghayarKhatuni_Khatuni]
FOREIGN KEY ([khatuni_id]) 
REFERENCES [rhz].[Khatuni]([khatuni_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalCharges]
ADD CONSTRAINT [FK_IntiqalCharges_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [territory].[Tehsil]
ADD CONSTRAINT [FK_Tehsil_District]
FOREIGN KEY ([district_id]) 
REFERENCES [territory].[District]([district_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Gardawri]
ADD CONSTRAINT [FK_Gardawri_LandType]
FOREIGN KEY ([land_type_id]) 
REFERENCES [Setup].[LandType]([land_type_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Gardawri]
ADD CONSTRAINT [FK_Gardawri_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Gardawri]
ADD CONSTRAINT [FK_Gardawri_IrrigationSource]
FOREIGN KEY ([irrigation_source_id]) 
REFERENCES [Setup].[IrrigationSource]([irrigation_source_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[Gardawri]
ADD CONSTRAINT [FK_Gardawri_Crop]
FOREIGN KEY ([crop_type_id]) 
REFERENCES [Setup].[Crop]([crop_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[LastAttestation]
ADD CONSTRAINT [FK_LastAttestation_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [generic].[WajibUlArz]
ADD CONSTRAINT [FK_WajibUlArz_WajibUlArz]
FOREIGN KEY ([question_id]) 
REFERENCES [generic].[BandSawalQuestions]([question_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[WajibUlArz]
ADD CONSTRAINT [FK_WajibUlArz_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [fard].[Fard]
ADD CONSTRAINT [FK_Fard_Register]
FOREIGN KEY ([register_id]) 
REFERENCES [Setup].[Register]([register_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [transactions].[IntiqalPersonInfo]
ADD CONSTRAINT [FK_IntiqalPersonInfo_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [transactions].[IntiqalPersonInfo]
ADD CONSTRAINT [FK_IntiqalPersonInfo_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE CASCADE
ON UPDATE CASCADE;



ALTER TABLE [generic].[ShajraParcha]
ADD CONSTRAINT [FK_ShajraParcha_ShajraParcha]
FOREIGN KEY ([Shajra_parcha_id]) 
REFERENCES [generic].[ShajraParcha]([Shajra_parcha_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ShajraParcha]
ADD CONSTRAINT [FK_ShajraParcha_Khasra]
FOREIGN KEY ([khasra_id]) 
REFERENCES [rhz].[Khasra]([khasra_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[ShajraParcha]
ADD CONSTRAINT [FK_ShajraParcha_Intiqal]
FOREIGN KEY ([intiqal_id]) 
REFERENCES [transactions].[Intiqal]([intiqal_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardPOA]
ADD CONSTRAINT [FK_FardPOA_Person]
FOREIGN KEY ([person_id]) 
REFERENCES [reference].[Person]([person_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [fard].[FardPOA]
ADD CONSTRAINT [FK_FardPOA_Fard]
FOREIGN KEY ([fard_id]) 
REFERENCES [fard].[Fard]([fard_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [generic].[KarguzariQanonGo]
ADD CONSTRAINT [FK_KarguzariQanonGo_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[CasteSequence]
ADD CONSTRAINT [FK_CastSequence_Mauza]
FOREIGN KEY ([mauza_id]) 
REFERENCES [territory].[Mauza]([mauza_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [Setup].[CasteSequence]
ADD CONSTRAINT [FK_CastSequence_Caste]
FOREIGN KEY ([caste_id]) 
REFERENCES [Setup].[Caste]([caste_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[ShiftUsers]
ADD CONSTRAINT [FK_ShiftUsers_User]
FOREIGN KEY ([user_id]) 
REFERENCES [users].[User]([user_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



ALTER TABLE [workflow].[ShiftUsers]
ADD CONSTRAINT [FK_ShiftUsers_Shifts]
FOREIGN KEY ([shift_id]) 
REFERENCES [workflow].[Shifts]([shift_id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;



