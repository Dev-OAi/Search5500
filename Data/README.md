# Form 5500 Data Folder

Upload your eFAST2 CSV files here to update the application's database.

## Recommended Organization
To keep things tidy, you can create subfolders named with the current date and time:
- `Data/03-24-2024_0100PM/filings.csv`
- `Data/03-25-2024_0930AM/more_filings.csv`

**Note:** You can also upload CSV files directly to this `Data/` folder without using subfolders. The app will find and include them automatically.

## Automatic Updates
Whenever you push a new CSV file to this directory on GitHub, the GitHub Actions workflow will automatically:
1. Detect the new data.
2. Aggregate all CSVs in this folder (including those in subfolders).
3. Rebuild and redeploy the website with the updated information.

## Supported Formats
The app supports standard eFAST2 search result CSVs. It automatically maps common headers like:
- `Ack ID` / `ACK_ID`
- `Plan Name` / `PLAN_NAME`
- `Sponsor Name` / `SPONS_NAME`
- `EIN` / `SPONS_DFE_EIN`
- `Net Assets End of Year` / `TOT_ASSETS_END_AMT`
