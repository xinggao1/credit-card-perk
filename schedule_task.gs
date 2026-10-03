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
  const isSetupMode = (run_mode === "SETUP");

  // AUTO only runs on the 1st.
  if (!isSetupMode) {
    if (today.getDate() !== 1) {
      console.log("Mode is AUTO and today is not the 1st. Skipping execution.");
      return;
    }
  } else {
    console.log(
      "Mode is SETUP. Running immediate population of all active tasks..."
    );
  }


  // ==========================================
  //      DATABASE: ALL POSSIBLE CARDS
  // ==========================================

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


  // ==========================================
  //      FILTER: SELECT USER CARDS
  // ==========================================

  const activeCards = allCards.filter(
    card => my_cards.includes(card.name)
  );

  if (activeCards.length === 0) {
    console.log(
      "No matching cards found. Check your spelling in 'my_cards'."
    );
    return;
  }


  // ==========================================
  //      DATE CALCULATORS
  // ==========================================
  //
  // Noon is deliberately used for period dates to avoid
  // timezone conversion moving the date forward/backward.
  //

  // ----- Month -----
  const startOfMonth = new Date(
    year,
    month,
    1,
    12
  );

  const endOfMonth = new Date(
    year,
    month + 1,
    0,
    12
  );


  // ----- Quarter -----
  const quarterStartMonth =
    Math.floor(month / 3) * 3;

  const startOfQuarter = new Date(
    year,
    quarterStartMonth,
    1,
    12
  );

  const quarterEndMonth =
    quarterStartMonth + 3;

  const endOfQuarter = new Date(
    year,
    quarterEndMonth,
    0,
    12
  );


  // ----- Half Year -----
  const semiStartMonth =
    (month < 6) ? 0 : 6;

  const startOfSemi = new Date(
    year,
    semiStartMonth,
    1,
    12
  );

  const semiEndMonth =
    (month < 6) ? 6 : 12;

  const endOfSemi = new Date(
    year,
    semiEndMonth,
    0,
    12
  );


  // ----- Year -----
  const startOfYear = new Date(
    year,
    0,
    1,
    12
  );

  const endOfYear = new Date(
    year,
    12,
    0,
    12
  );


  // ==========================================
  //      TASK TITLE PREFIXES
  // ==========================================

  const monthPrefix =
    today.toLocaleString(
      "default",
      { month: "long" }
    ) + "-";

  const quarterPrefix =
    "Q" + (Math.floor(month / 3) + 1);

  const semiPrefix =
    (month < 6) ? "H1" : "H2";

  const yearPrefix =
    year.toString();


  // ==========================================
  //      LOAD EXISTING TASK KEYS ONCE
  // ==========================================
  //
  // Example key:
  //
  // October- Amex Platinum: $15 Uber Cash|2026-10-01
  //
  // Q4 Amex Platinum: $100 Resy|2026-10-01
  //
  // H2 Amex Platinum: $50 Saks|2026-07-01
  //
  // 2026 Amex Platinum: $200 Airline Fee|2026-01-01
  //

  const existingTaskKeys =
    getExistingTaskKeys(taskListId);


  // ==========================================
  //      EXECUTION LOOP
  // ==========================================

  activeCards.forEach(function(card) {

    console.log(`Processing ${card.name}...`);


    // ------------------------------------------
    // Monthly
    // ------------------------------------------

    addTaskBatch(
      card.monthly,

      today,          // Calendar due date
      startOfMonth,   // Stable period identity
      endOfMonth,

      card.name,
      monthPrefix,

      taskListId,
      existingTaskKeys
    );


    // ------------------------------------------
    // Quarterly
    //
    // AUTO:
    // Jan / Apr / Jul / Oct only
    //
    // SETUP:
    // Current quarter regardless of month
    // ------------------------------------------

    if (
      isSetupMode ||
      month % 3 === 0
    ) {
      addTaskBatch(
        card.quarterly,

        today,
        startOfQuarter,
        endOfQuarter,

        card.name,
        quarterPrefix,

        taskListId,
        existingTaskKeys
      );
    }


    // ------------------------------------------
    // Semi-Annual
    //
    // AUTO:
    // Jan / Jul only
    //
    // SETUP:
    // Current half regardless of month
    // ------------------------------------------

    if (
      isSetupMode ||
      month % 6 === 0
    ) {
      addTaskBatch(
        card.semiAnnual,

        today,
        startOfSemi,
        endOfSemi,

        card.name,
        semiPrefix,

        taskListId,
        existingTaskKeys
      );
    }


    // ------------------------------------------
    // Annual
    //
    // AUTO:
    // January only
    //
    // SETUP:
    // Current year regardless of month
    // ------------------------------------------

    if (
      isSetupMode ||
      month === 0
    ) {
      addTaskBatch(
        card.annual,

        today,
        startOfYear,
        endOfYear,

        card.name,
        yearPrefix,

        taskListId,
        existingTaskKeys
      );
    }

  });
}


// ==========================================
//      ADD ONE BATCH OF TASKS
// ==========================================

function addTaskBatch(
  taskList,
  dueDate,
  periodStartDate,
  deadlineDate,
  cardName,
  timePrefix,
  taskListId,
  existingTaskKeys
) {

  if (
    !taskList ||
    taskList.length === 0
  ) {
    return;
  }


  const startStr =
    periodStartDate.toLocaleDateString();

  const endStr =
    deadlineDate.toLocaleDateString();

  // Stable machine-readable period identity.
  //
  // Example:
  // 2026-10-01
  const periodKey =
    getDateKey(periodStartDate);


  taskList.forEach(function(item) {

    const taskTitle =
      `${timePrefix} ${cardName}: ${item}`;


    // ------------------------------------------
    // IDEMPOTENCY KEY
    //
    // Does NOT use the task's due date.
    //
    // This allows SETUP to run Oct 3 and Oct 15
    // without creating the same October task twice.
    // ------------------------------------------

    const key =
      makeTaskKey(
        taskTitle,
        periodStartDate
      );


    // Already exists
    if (existingTaskKeys.has(key)) {

      console.log(
        `  > Already exists, skipping: ${taskTitle}`
      );

      return;
    }


    // ------------------------------------------
    // TASK PAYLOAD
    //
    // due = when the task is put on your calendar
    //
    // PeriodKey = stable identity used for
    // duplicate detection
    // ------------------------------------------

    const taskPayload = {

      title: taskTitle,

      notes:
        `Period: ${startStr} - ${endStr}\n` +
        `PeriodKey: ${periodKey}`,

      due:
        dueDate.toISOString(),
    };


    try {

      Tasks.Tasks.insert(
        taskPayload,
        taskListId
      );


      // Add immediately to in-memory set.
      //
      // This prevents duplicates even if the
      // same benefit accidentally appears twice
      // in this execution.
      existingTaskKeys.add(key);


      console.log(
        `  > Added: ${taskTitle}` +
        ` (Period: ${startStr} - ${endStr})`
      );

    } catch (e) {

      console.log(
        `  > Error adding ${taskTitle}: ${e.message}`
      );

    }

  });
}


// ==========================================
//      LOAD EXISTING TASK KEYS
// ==========================================

function getExistingTaskKeys(taskListId) {

  const keys = new Set();

  let pageToken;


  do {

    const options = {

      maxResults: 100,

      // We want completed tasks included too.
      // Otherwise completing a task could cause
      // SETUP to recreate it.
      showCompleted: true,

      showHidden: true,
    };


    if (pageToken) {
      options.pageToken = pageToken;
    }


    const response =
      Tasks.Tasks.list(
        taskListId,
        options
      );


    const tasks =
      response.items || [];


    tasks.forEach(function(task) {

      if (!task.title) {
        return;
      }


      // ------------------------------------------
      // Preferred:
      //
      // Read our machine-readable PeriodKey.
      // ------------------------------------------

      let periodKey =
        getPeriodKeyFromNotes(task.notes);


      // ------------------------------------------
      // BACKWARD COMPATIBILITY
      //
      // Old tasks created by your previous script
      // don't contain PeriodKey.
      //
      // Try:
      //
      // Period: 10/1/2026 - 10/31/2026
      //
      // and recover 10/1/2026.
      // ------------------------------------------

      if (!periodKey) {

        periodKey =
          getLegacyPeriodKeyFromNotes(
            task.notes
          );

      }


      // If neither format exists, it isn't one
      // of our identifiable benefit tasks.
      if (!periodKey) {
        return;
      }


      const key =
        `${task.title}|${periodKey}`;

      keys.add(key);

    });


    pageToken =
      response.nextPageToken;


  } while (pageToken);


  console.log(
    `Loaded ${keys.size} existing benefit task keys.`
  );


  return keys;
}


// ==========================================
//      CREATE IDEMPOTENCY KEY
// ==========================================
//
// Example:
//
// October- Amex Platinum: $15 Uber Cash
// +
// 2026-10-01
//
// becomes:
//
// October- Amex Platinum: $15 Uber Cash|2026-10-01
//

function makeTaskKey(
  title,
  periodStartDate
) {

  return (
    `${title}|${getDateKey(periodStartDate)}`
  );
}


// ==========================================
//      NORMALIZE DATE -> YYYY-MM-DD
// ==========================================

function getDateKey(date) {

  if (date instanceof Date) {

    return date
      .toISOString()
      .substring(0, 10);

  }


  return String(date)
    .substring(0, 10);
}


// ==========================================
//      READ NEW PeriodKey FORMAT
// ==========================================
//
// Notes:
//
// Period: 10/1/2026 - 10/31/2026
// PeriodKey: 2026-10-01
//

function getPeriodKeyFromNotes(notes) {

  if (!notes) {
    return null;
  }


  const match =
    notes.match(
      /^PeriodKey:\s*(\d{4}-\d{2}-\d{2})\s*$/m
    );


  if (!match) {
    return null;
  }


  return match[1];
}


// ==========================================
//      READ OLD TASK FORMAT
// ==========================================
//
// Old notes:
//
// Period: 10/1/2026 - 10/31/2026
//
// This lets the new script recognize tasks
// you've already created with the old script.
// ==========================================

function getLegacyPeriodKeyFromNotes(notes) {

  if (!notes) {
    return null;
  }


  const match =
    notes.match(
      /^Period:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-/m
    );


  if (!match) {
    return null;
  }


  const month =
    String(match[1]).padStart(2, "0");

  const day =
    String(match[2]).padStart(2, "0");

  const year =
    match[3];


  return `${year}-${month}-${day}`;
}
