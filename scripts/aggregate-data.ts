import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const DATA_DIR = path.join(process.cwd(), 'Data');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/external_filings.json');

interface PlanData {
  ackId: string;
  ein: string;
  pn: string;
  planName: string;
  sponsorName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dateReceived: string;
  planCodes: string;
  planType: string;
  planYear: string;
  participants: number;
  participantsEoy: number;
  assetsBoy: number;
  assets: number;
  link: string;
}

function getAllCsvFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllCsvFiles(file));
    } else if (file.endsWith('.csv')) {
      results.push(file);
    }
  });
  return results;
}

function mapRowToPlanData(row: any): PlanData {
  // Support multiple header variations
  return {
    ackId: row["Ack ID"] || row["ackId"] || row["ACK_ID"] || "",
    ein: row["EIN"] || row["ein"] || row["SPONS_DFE_EIN"] || "",
    pn: row["PN"] || row["pn"] || row["PLAN_NUM"] || "",
    planName: row["Plan Name"] || row["planName"] || row["PLAN_NAME"] || "",
    sponsorName: row["Sponsor Name"] || row["sponsorName"] || row["SPONS_NAME"] || "",
    address: row["Address"] || row["address"] || row["SPONS_ADDR_1"] || "",
    city: row["City"] || row["city"] || row["SPONS_CITY_NAME"] || "",
    state: row["State"] || row["state"] || row["SPONS_STATE_CD"] || "",
    zip: row["Zip"] || row["zip"] || row["SPONS_ZIP_CD"] || "",
    dateReceived: row["Date Received"] || row["dateReceived"] || row["RECV_DATE"] || "",
    planCodes: row["Plan Codes"] || row["planCodes"] || row["TYPE_PLAN_CD"] || "",
    planType: row["Plan Type"] || row["planType"] || "",
    planYear: row["Plan Year"] || row["planYear"] || row["PLAN_YEAR"] || "",
    participants: parseInt(row["Participants"] || row["participants"] || row["TOT_PARTCP_CNT"] || "0"),
    participantsEoy: parseInt(row["Participants EOY"] || row["participantsEoy"] || row["RTRE_PLAN_PARTCP_CNT"] || row["TOT_PARTCP_CNT"] || "0"),
    assetsBoy: parseInt(row["Assets BOY"] || row["assetsBoy"] || row["TOT_ASSETS_BEG_AMT"] || "0"),
    assets: parseInt(row["Assets"] || row["assets"] || row["TOT_ASSETS_END_AMT"] || row["NET_ASSETS_END_AMT"] || "0"),
    link: row["Link"] || row["link"] || ""
  };
}

async function aggregate() {
  const csvFiles = getAllCsvFiles(DATA_DIR);
  console.log(`Found ${csvFiles.length} CSV files in ${DATA_DIR}`);

  const allPlans: PlanData[] = [];
  const seenAckIds = new Set<string>();

  for (const file of csvFiles) {
    const csvContent = fs.readFileSync(file, 'utf8');
    const results = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    const parsedRows = results.data
      .map(mapRowToPlanData)
      .filter((plan) => plan.ackId && !seenAckIds.has(plan.ackId));

    parsedRows.forEach((plan) => {
      allPlans.push(plan);
      seenAckIds.add(plan.ackId);
    });

    console.log(`Processed ${file}: added ${parsedRows.length} new filings.`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputData = {
    lastUpdated: new Date().toISOString(),
    plans: allPlans
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
  console.log(`Successfully aggregated ${allPlans.length} filings to ${OUTPUT_FILE}`);
}

aggregate().catch(console.error);
