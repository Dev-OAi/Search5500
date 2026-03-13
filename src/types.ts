export interface PlanData {
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

export interface DeepAnalysis {
  planSponsor: string;
  planType: string;
  participantCount: {
    start: number;
    end: number;
  };
  totalNetAssets: {
    boy: string;
    eoy: string;
  };
  income: {
    total: string;
    participantContributions: string;
    investmentIncome: string;
  };
  employerContributions: string;
  expenses: {
    total: string;
    benefitsPaid: string;
    adminFees: string;
  };
  netGainLoss: string;
  compliance: {
    fidelityBond: string;
    participantLoans: string;
    operationalIntegrity: string;
  };
  conclusion: string;
}

export interface PlanAnalysis {
  identity: string;
  status: string;
  financialPerformance: {
    assetsChange: string;
    income: string;
    employerContributions: string;
    expenses: string;
    netIncome: string;
  };
  compliance: string;
  conclusion: string;
}
