# **App Name**: AdiArc: Forensic Land Records

## Core Features:

- Mutation Inventory Scanner: Scan local folders for land record images and extract Mutation Numbers from XMP metadata. Use 'Universal Hunter' logic to find IDs. Show status (Valid, No Match, Stripped).
- Inventory Stats Display: Display stats as data cards showing the counts of 'Found IDs', 'No Match', and 'Stripped' files after a scan. Color code for quick identification.
- CSV Download: Allow users to download a CSV file containing valid Mutation IDs, file names, and source tags after scanning.
- SQL Server Bridge: Connect to a SQL Server via a local proxy to upload the inventory.
- SQL Configuration: Configuration panel with input fields for Server IP, Database Name, Username, and Password for the SQL Server connection. Includes a 'Test Connection' button.
- Pending Uploads Display: Show the count of valid items ready for upload to the SQL Server. Includes a 'Sync to Server' button and connection status indicator.
- Server Connection Management: Visually manages the user's connection and SQL upload proxy on http://localhost:3001/api/sql. Includes testing connection and syncing of SQL datato database with safe insert queries. The proxy handles test requests and upload actions by accepting SQL credentials from the request body, and executing safe INSERT queries for security.

## Style Guidelines:

- Primary color: Emerald green (#3CB371) for success states and data visualization.
- Background color: Light slate gray (#F0F8FF) for a clean, forensic data aesthetic.
- Accent color: Amber (#FFC107) to indicate 'No Match' statuses and warnings.
- Body and headline font: 'Inter' for a modern, machined, objective, neutral look in the tables.
- Use Lucide Icons for consistent, modern iconography across the dashboard.
- Modern 'Dashboard' layout with a sidebar for navigation and clear separation of concerns. Use Shadcn UI components for a professional look and feel.
- Subtle transition animations for loading data and status changes.