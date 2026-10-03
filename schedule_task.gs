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

  const taskListId = "@default";

  // --- LOGIC: CHECK RUN MODE ---
  let isSetupMode = (run_mode === "SETUP");

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
      annual: [
        "$150 Renowned Hotels",
        "Avis/B $40 cars.united.com 1/2",
        "Avis/B $40 cars.united.com 2/2"
      ]
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
  const endOfMonth = new Date(year, month + 1, 0, 12);

  const quarterEndMonth = (Math.floor(month / 3) * 3) + 3;
  const endOfQuarter = new Date(year, quarterEndMonth, 0, 12);

  const semiEndMonth = (month < 6) ? 6 : 12;
  const endOfSemi = new Date(year, semiEndMonth, 0, 12);

  const endOfYear = new Date(year, 12, 0, 12);

  // --- TITLE PREFIXES ---
  const monthPrefix =
    today.toLocaleString("default", { month: "long" }) + "-";

  const quarterPrefix =
    "Q" + (Math.floor(month / 3) + 1);

  const semiPrefix =
    (month < 6) ? "H1" : "H2";

  const yearPrefix =
    year.toString();

  // ==========================================================
  // IDEMPOTENCY:
  // Read existing tasks ONCE and build a Set of title + due date.
  // ==========================================================
  const existingTaskKeys = getExistingTaskKeys(taskListId);

  // --- EXECUTION LOOP ---
  activeCards.forEach(function(card) {
    console.log(`Processing ${card.name}...`);

    addTaskBatch(
      card.monthly,
      today,
      endOfMonth,
      card.name,
      monthPrefix,
      taskListId,
      existingTaskKeys
    );

    if (isSetupMode || month % 3 === 0) {
      addTaskBatch(
        card.quarterly,
        today,
        endOfQuarter,
        card.name,
        quarterPrefix,
        taskListId,
        existingTaskKeys
      );
    }

    if (isSetupMode || month % 6 === 0) {
      addTaskBatch(
        card.semiAnnual,
        today,
        endOfSemi,
        card.name,
        semiPrefix,
        taskListId,
        existingTaskKeys
      );
    }

    if (isSetupMode || month === 0) {
      addTaskBatch(
        card.annual,
        today,
        endOfYear,
        card.name,
        yearPrefix,
        taskListId,
        existingTaskKeys
      );
    }
  });
}


// ==========================================================
// ADD TASKS
// ==========================================================
function addTaskBatch(
  taskList,
  startDate,
  deadlineDate,
  cardName,
  timePrefix,
  taskListId,
  existingTaskKeys
) {
  if (!taskList || taskList.length === 0) return;

  const startStr = startDate.toLocaleDateString();
  const endStr = deadlineDate.toLocaleDateString();

  taskList.forEach(function(item) {
    const taskTitle = `${timePrefix} ${cardName}: ${item}`;

    const taskPayload = {
      title: taskTitle,
      notes: `Period: ${startStr} - ${endStr}`,
      due: startDate.toISOString(),
    };

    const key = makeTaskKey(taskTitle, startDate);

    // Already exists -> skip
    if (existingTaskKeys.has(key)) {
      console.log(`  > Already exists, skipping: ${taskTitle}`);
      return;
    }

    try {
      Tasks.Tasks.insert(taskPayload, taskListId);

      // Important:
      // Update the in-memory set immediately so even duplicate entries
      // during THIS execution cannot be inserted twice.
      existingTaskKeys.add(key);

      console.log(`  > Added: ${taskTitle} (Deadline: ${endStr})`);
    } catch (e) {
      console.log(`  > Error: ${e.message}`);
    }
  });
}


// ==========================================================
// LOAD EXISTING TASKS
// ==========================================================
function getExistingTaskKeys(taskListId) {
  const keys = new Set();

  let pageToken;

  do {
    const options = {
      maxResults: 100,
      showCompleted: true,
      showHidden: true,
    };

    if (pageToken) {
      options.pageToken = pageToken;
    }

    const response = Tasks.Tasks.list(taskListId, options);

    const tasks = response.items || [];

    tasks.forEach(function(task) {
      if (!task.title || !task.due) return;

      keys.add(makeTaskKey(task.title, task.due));
    });

    pageToken = response.nextPageToken;

  } while (pageToken);

  console.log(`Loaded ${keys.size} existing task keys.`);

  return keys;
}


// ==========================================================
// CREATE STABLE DUPLICATE-DETECTION KEY
//
// Example:
// "October- Amex Platinum: $15 Uber Cash|2026-10-01"
// ==========================================================
function makeTaskKey(title, date) {
  return `${title}|${getDateKey(date)}`;
}


// Return only YYYY-MM-DD.
//
// Works with:
//   Date object
//   "2026-10-01T07:00:00.000Z"
// ==========================================================
function getDateKey(date) {
  if (date instanceof Date) {
    return date.toISOString().substring(0, 10);
  }

  return String(date).substring(0, 10);
}
