// ==========================================
//       USER SETTINGS (EDIT THIS AREA)
// ==========================================

// 1. Which cards do you own? (Must match names in the database below exactly)
const my_cards = [
  "Amex Platinum",
  "Amex Gold",
  "Amex Aspire",
  "Chase Quest",
  "Chase SapphireP",
  "Chase Ritz",
  "Chase Ihg",
];

// 2. How are you running this?
// "SETUP" = Adds ALL active tasks for the current year/quarter/month immediately.
// "AUTO"  = The normal monthly scheduler (Only runs on 1st of month).
const run_mode = "AUTO";

// ==========================================
//      END OF USER SETTINGS
// ==========================================

function main() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0 = Jan, 11 = Dec

  // --- LOGIC: CHECK RUN MODE ---
  let isSetupMode = (run_mode === "SETUP");

  // If in AUTO mode, strictly enforce the "1st of the month" rule
  if (!isSetupMode) {
    if (today.getDate() !== 1) {
      console.log("Mode is AUTO and today is not the 1st. Skipping execution.");
      return;
    }
  } else {
    console.log("Mode is SETUP. Running immediate population of all active tasks...");
  }

  // --- DATABASE: ALL POSSIBLE CARDS ---
  const allCards = [
    {
      name: "Amex Platinum",
      monthly: ["$15 Uber Cash"],
      quarterly: ["$100 Resy", "$75 Lululemon"],
      semiAnnual: ["$50 Saks", "$300 FHR"],
      annual: ["$200 Airline Fee", "$200 Oura Ring", "$120 Uber One"]
    },
    {
      name: "Amex Gold",
      monthly: ["$10 Dining", "$10 Uber", "$7 Dunkin"],
      quarterly: [],
      semiAnnual: ["$50 Resy"],
      annual: []
    },
    {
      name: "Amex Aspire",
      monthly: [],
      quarterly: ["$50 Flight"],
      semiAnnual: ["$200 Hilton Resort"],
      annual: []
    },
    {
      name: "Chase SapphireP",
      monthly: [],
      quarterly: [],
      semiAnnual: [],
      annual: ["$50 Hotel (Chase Travel)"]
    },
    {
      name: "Chase Quest",
      monthly: ["$8 rideshare"],
      quarterly: [],
      semiAnnual: [],
      annual: ["$150 Renowned Hotels", "Avis/B $40 cars.united.com 1/2", "Avis/B $40 cars.united.com 2/2"]
    },
    {
      name: "Chase Ritz",
      monthly: [],
      quarterly: [],
      semiAnnual: [],
      annual: ["$300 airline incidental"]
    },
    {
      name: "Chase Ihg",
      monthly: [],
      quarterly: [],
      semiAnnual: ["$25 travelbank (auto expire)"],
      annual: []
    }
  ];

  // --- FILTER: SELECT USER CARDS ---
  const activeCards = allCards.filter(card => my_cards.includes(card.name));

  if (activeCards.length === 0) {
    console.log("No matching cards found. Check your spelling in 'my_cards'.");
    return;
  }

  // --- DATE CALCULATORS ---
  // We use '12' (Noon) to prevent timezone shifts making it the previous day

  // End of Month
  const endOfMonth = new Date(year, month + 1, 0, 12);

  // End of Quarter (Finds the last month of the current 3-month block)
  const quarterEndMonth = (Math.floor(month / 3) * 3) + 3;
  const endOfQuarter = new Date(year, quarterEndMonth, 0, 12);

  // End of Semi-Annual (June or Dec)
  const semiEndMonth = (month < 6) ? 6 : 12;
  const endOfSemi = new Date(year, semiEndMonth, 0, 12);

  // End of Year
  const endOfYear = new Date(year, 12, 0, 12);


  // --- EXECUTION LOOP ---

  const monthPrefix = today.toLocaleString('default', { month: 'long' }) + "-"; // "July-"
  const quarterPrefix = "Q" + (Math.floor(month / 3) + 1);                      // "Q3"
  const semiPrefix = (month < 6) ? "H1" : "H2";                                 // "H2"
  const yearPrefix = year.toString();                                           // "2025"

  activeCards.forEach(function (card) {
    console.log(`Processing ${card.name}...`);

    addTaskBatch(card.monthly, today, endOfMonth, card.name, monthPrefix);

    if (isSetupMode || month % 3 === 0) {
      addTaskBatch(card.quarterly, today, endOfQuarter, card.name, quarterPrefix);
    }

    if (isSetupMode || month % 6 === 0) {
      addTaskBatch(card.semiAnnual, today, endOfSemi, card.name, semiPrefix);
    }

    if (isSetupMode || month === 0) {
      addTaskBatch(card.annual, today, endOfYear, card.name, yearPrefix);
    }
  });
}

// --- HELPER FUNCTION ---
function addTaskBatch(taskList, startDate, deadlineDate, cardName, timePrefix) {
  if (!taskList || taskList.length === 0) return;

  const startStr = startDate.toLocaleDateString();
  const endStr = deadlineDate.toLocaleDateString();

  taskList.forEach(function (item) {
    const taskTitle = `${timePrefix} ${cardName}: ${item}`;

    const taskPayload = {
      title: taskTitle,
      notes: `Period: ${startStr} - ${endStr}`,
      due: startDate.toISOString(),
      // deadline: endDate.toISOString(),
    };

    try {
      Tasks.Tasks.insert(taskPayload, '@default');
      console.log(`  > Added: ${taskTitle} (Deadline: ${endStr})`);
    } catch (e) {
      console.log(`  > Error: ${e.message} `);
    }
  });
}
