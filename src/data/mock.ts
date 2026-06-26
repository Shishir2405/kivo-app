/**
 * Deterministic, production-quality mock data for every Kivo domain.
 *
 * RULES enforced here:
 * - ZERO emoji / pictographs anywhere. Every former emoji field now holds an
 *   `IconName` token from the curated icon registry (render with `<Icon />`).
 * - No Math.random / Date.now at module scope — every value is static so screens
 *   render identically across reloads and snapshot tests. The contribution
 *   heatmap is built from a pure index hash. "Today" is pinned to TODAY
 *   (2026-06-26) so due-today / streak logic is stable.
 *
 * The data models a CS senior grinding DSA toward a FAANG interview loop: real
 * roadmaps (Striver A2Z, Blind 75, NeetCode 150, Love Babbar 450), real topics,
 * real LeetCode problems with complexity + coding-journal fields, spaced
 * revisions, tasks with checklists, habits, study sessions, written reflections,
 * achievements, rotating quotes and a full-year heatmap.
 */
import { avatarAssets } from '@/constants/brandAssets';
import type {
  IconName,
  UserProfile,
  Roadmap,
  DsaTopic,
  Problem,
  Revision,
  Task,
  Habit,
  StudySession,
  StudySummary,
  Reflection,
  Achievement,
  HeatmapDay,
  Quote,
  DashboardData,
  Note,
  Resource,
  JournalEntry,
  AppNotification,
  AchievementEntry,
  WeeklyReport,
  ProductivityPoint,
  CalendarEvent,
  Settings,
} from '@/types/models';

/** Pinned "today" so due-today / streak logic is deterministic. */
export const TODAY = '2026-06-26';

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export const mockProfile: UserProfile = {
  id: 'u_1',
  name: 'Aarav Mehta',
  username: 'aarav.codes',
  email: 'aarav@kivo.app',
  avatar: avatarAssets.johny,
  bio: 'CS senior grinding DSA toward a FAANG loop. One deliberate problem a day, then a clean write-up. Consistency over intensity.',
  streak: 27,
  longestStreak: 41,
  totalSolved: 412,
  xp: 8640,
  level: 12,
  joinedAt: '2025-09-01',
  dailyGoal: 3,
};

/* ------------------------------------------------------------------ */
/* Roadmaps                                                            */
/* ------------------------------------------------------------------ */

export const mockRoadmaps: Roadmap[] = [
  {
    id: 'rm_striver',
    title: 'Striver A2Z DSA',
    description:
      'The complete A-to-Z sheet: step-by-step from basics through advanced graphs and DP. The gold standard for a structured grind.',
    emoji: 'compass',
    topicIds: [
      't_arrays',
      't_binary_search',
      't_linked_list',
      't_strings',
      't_trees',
      't_graphs',
      't_dp',
    ],
    totalProblems: 455,
    solvedProblems: 198,
    progress: 44,
    accent: 'highlighter',
    curator: 'Striver (takeUforward)',
    estimatedWeeks: 18,
    level: 'Beginner to Advanced',
  },
  {
    id: 'rm_blind75',
    title: 'Blind 75',
    description:
      'The essential 75 problems that cover every core interview pattern. The fastest way to interview-ready coverage.',
    emoji: 'target',
    topicIds: ['t_arrays', 't_strings', 't_binary_search', 't_trees', 't_graphs', 't_dp'],
    totalProblems: 75,
    solvedProblems: 61,
    progress: 81,
    accent: 'signal',
    curator: 'Yangshun Tay',
    estimatedWeeks: 6,
    level: 'Intermediate',
  },
  {
    id: 'rm_neetcode150',
    title: 'NeetCode 150',
    description:
      'Blind 75 extended to 150, grouped by pattern with curated explanations. Deep, pattern-first coverage.',
    emoji: 'layers',
    topicIds: [
      't_arrays',
      't_binary_search',
      't_linked_list',
      't_trees',
      't_graphs',
      't_dp',
    ],
    totalProblems: 150,
    solvedProblems: 73,
    progress: 49,
    accent: 'peach',
    curator: 'NeetCode',
    estimatedWeeks: 10,
    level: 'Intermediate to Advanced',
  },
  {
    id: 'rm_lovebabbar',
    title: 'Love Babbar 450',
    description:
      'The 450 DSA cracker sheet across 15 topics. Breadth-first volume practice to harden fundamentals.',
    emoji: 'list',
    topicIds: ['t_arrays', 't_strings', 't_linked_list', 't_trees', 't_dp'],
    totalProblems: 450,
    solvedProblems: 120,
    progress: 27,
    accent: 'annotation',
    curator: 'Love Babbar',
    estimatedWeeks: 20,
    level: 'Beginner to Advanced',
  },
  {
    id: 'rm_graphs',
    title: 'Graph Mastery',
    description:
      'A focused deep-dive: BFS, DFS, union-find, Dijkstra, Bellman-Ford, MST and topological sort end to end.',
    emoji: 'globe',
    topicIds: ['t_graphs'],
    totalProblems: 42,
    solvedProblems: 14,
    progress: 33,
    accent: 'success',
    curator: 'Kivo Editorial',
    estimatedWeeks: 4,
    level: 'Advanced',
  },
];

/* ------------------------------------------------------------------ */
/* Topics                                                              */
/* ------------------------------------------------------------------ */

export const mockTopics: DsaTopic[] = [
  {
    id: 't_arrays',
    roadmapId: 'rm_striver',
    title: 'Arrays & Hashing',
    emoji: 'grid',
    description:
      'Two pointers, prefix sums, Kadane, sliding window and hash maps — the bread and butter of every sheet.',
    difficulty: 'EASY',
    totalProblems: 38,
    solvedProblems: 31,
    progress: 82,
    estimatedMinutes: 540,
    tags: ['Two Pointers', 'Prefix Sum', 'Hashing', 'Sliding Window'],
    mastery: 78,
  },
  {
    id: 't_binary_search',
    roadmapId: 'rm_striver',
    title: 'Binary Search',
    emoji: 'search',
    description:
      'Search on sorted arrays and on the answer space — rotated arrays, allocation and aggressive-cow style problems.',
    difficulty: 'MEDIUM',
    totalProblems: 26,
    solvedProblems: 16,
    progress: 62,
    estimatedMinutes: 360,
    tags: ['Sorted Array', 'Search on Answer', 'Monotonic'],
    mastery: 58,
  },
  {
    id: 't_linked_list',
    roadmapId: 'rm_striver',
    title: 'Linked List',
    emoji: 'link',
    description:
      'Reversal, cycle detection, fast/slow pointers, merge and reorder. Pointer-discipline practice.',
    difficulty: 'MEDIUM',
    totalProblems: 22,
    solvedProblems: 12,
    progress: 55,
    estimatedMinutes: 300,
    tags: ['Fast & Slow', 'Reversal', 'Dummy Node'],
    mastery: 49,
  },
  {
    id: 't_strings',
    roadmapId: 'rm_striver',
    title: 'Strings',
    emoji: 'hash',
    description:
      'Pattern matching, palindromes, anagrams, KMP and string DP. Parsing and window techniques on characters.',
    difficulty: 'MEDIUM',
    totalProblems: 24,
    solvedProblems: 13,
    progress: 54,
    estimatedMinutes: 330,
    tags: ['Palindrome', 'KMP', 'Sliding Window', 'Parsing'],
    mastery: 47,
  },
  {
    id: 't_trees',
    roadmapId: 'rm_striver',
    title: 'Trees & BST',
    emoji: 'layers',
    description:
      'Traversals, recursion, height/diameter, balancing, BST invariants and lowest common ancestor.',
    difficulty: 'MEDIUM',
    totalProblems: 32,
    solvedProblems: 18,
    progress: 56,
    estimatedMinutes: 480,
    tags: ['DFS', 'BFS', 'Recursion', 'BST'],
    mastery: 52,
  },
  {
    id: 't_graphs',
    roadmapId: 'rm_graphs',
    title: 'Graphs',
    emoji: 'globe',
    description:
      'Traversal, connectivity, cycle detection, shortest paths, MST and topological sort on directed/undirected graphs.',
    difficulty: 'HARD',
    totalProblems: 36,
    solvedProblems: 11,
    progress: 31,
    estimatedMinutes: 600,
    tags: ['BFS', 'DFS', 'Union Find', 'Dijkstra', 'Topo Sort'],
    mastery: 28,
  },
  {
    id: 't_dp',
    roadmapId: 'rm_striver',
    title: 'Dynamic Programming',
    emoji: 'brain',
    description:
      'Memoization to tabulation, knapsack family, longest-subsequence patterns, interval and bitmask DP.',
    difficulty: 'HARD',
    totalProblems: 44,
    solvedProblems: 9,
    progress: 20,
    estimatedMinutes: 780,
    tags: ['Memoization', 'Tabulation', 'Knapsack', 'LIS', 'Intervals'],
    mastery: 18,
  },
];

/* ------------------------------------------------------------------ */
/* Problems                                                            */
/* ------------------------------------------------------------------ */

export const mockProblems: Problem[] = [
  /* ---- Arrays & Hashing ---- */
  {
    id: 'p_1',
    topicId: 't_arrays',
    title: 'Two Sum',
    difficulty: 'EASY',
    status: 'MASTERED',
    source: 'LeetCode 1',
    platform: 'LeetCode',
    tags: ['Array', 'Hash Map'],
    bookmarked: true,
    attempts: 3,
    lastAttemptedAt: '2026-06-20',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    approach:
      'One pass; store each value -> index and look up the complement (target - x) as you go.',
    timeSpentMinutes: 8,
    notes: 'The canonical hash-map trick. Watch for duplicate values mapping to the same key.',
  },
  {
    id: 'p_2',
    topicId: 't_arrays',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'EASY',
    status: 'SOLVED',
    source: 'LeetCode 121',
    platform: 'LeetCode',
    tags: ['Array', 'Greedy', 'Sliding Window'],
    bookmarked: false,
    attempts: 2,
    lastAttemptedAt: '2026-06-22',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approach: 'Track the running minimum price and the best profit against it in a single pass.',
    timeSpentMinutes: 11,
  },
  {
    id: 'p_3',
    topicId: 't_arrays',
    title: 'Longest Consecutive Sequence',
    difficulty: 'MEDIUM',
    status: 'ATTEMPTED',
    source: 'LeetCode 128',
    platform: 'LeetCode',
    tags: ['Array', 'Hash Set', 'Union Find'],
    bookmarked: true,
    attempts: 2,
    lastAttemptedAt: '2026-06-25',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    approach:
      'Put all values in a set; only start counting a run from a number whose predecessor is absent.',
    timeSpentMinutes: 26,
    notes: 'Kept getting O(n log n) until I realised to only expand from sequence heads.',
  },
  {
    id: 'p_4',
    topicId: 't_arrays',
    title: 'Product of Array Except Self',
    difficulty: 'MEDIUM',
    status: 'SOLVED',
    source: 'LeetCode 238',
    platform: 'LeetCode',
    tags: ['Array', 'Prefix Sum'],
    bookmarked: false,
    attempts: 1,
    lastAttemptedAt: '2026-06-19',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approach: 'Prefix products left-to-right, then suffix products right-to-left in the output array.',
    timeSpentMinutes: 17,
  },
  {
    id: 'p_5',
    topicId: 't_arrays',
    title: 'Maximum Subarray',
    difficulty: 'MEDIUM',
    status: 'MASTERED',
    source: 'LeetCode 53',
    platform: 'LeetCode',
    tags: ['Array', 'Kadane', 'DP'],
    bookmarked: false,
    attempts: 2,
    lastAttemptedAt: '2026-06-15',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approach: "Kadane: reset the running sum to the current element whenever it dips below zero.",
    timeSpentMinutes: 9,
  },

  /* ---- Strings ---- */
  {
    id: 'p_6',
    topicId: 't_strings',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'MEDIUM',
    status: 'SOLVED',
    source: 'LeetCode 3',
    platform: 'LeetCode',
    tags: ['String', 'Sliding Window', 'Hash Set'],
    bookmarked: true,
    attempts: 3,
    lastAttemptedAt: '2026-06-21',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(min(n, charset))',
    approach:
      'Sliding window with a last-seen index map; jump the left bound past the previous occurrence.',
    timeSpentMinutes: 22,
  },
  {
    id: 'p_7',
    topicId: 't_strings',
    title: 'Longest Palindromic Substring',
    difficulty: 'MEDIUM',
    status: 'SOLVED',
    source: 'LeetCode 5',
    platform: 'LeetCode',
    tags: ['String', 'Two Pointers', 'DP'],
    bookmarked: false,
    attempts: 2,
    lastAttemptedAt: '2026-06-18',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    approach: 'Expand around every center (2n-1 centers) and track the longest even/odd palindrome.',
    timeSpentMinutes: 24,
  },
  {
    id: 'p_8',
    topicId: 't_strings',
    title: 'Valid Anagram',
    difficulty: 'EASY',
    status: 'MASTERED',
    source: 'LeetCode 242',
    platform: 'LeetCode',
    tags: ['String', 'Hash Map', 'Counting'],
    bookmarked: false,
    attempts: 1,
    lastAttemptedAt: '2026-06-10',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approach: 'Count 26 letter frequencies for one string and decrement for the other; all zero.',
    timeSpentMinutes: 6,
  },

  /* ---- Binary Search ---- */
  {
    id: 'p_9',
    topicId: 't_binary_search',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'MEDIUM',
    status: 'SOLVED',
    source: 'LeetCode 33',
    platform: 'LeetCode',
    tags: ['Binary Search', 'Array'],
    bookmarked: true,
    attempts: 2,
    lastAttemptedAt: '2026-06-23',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    approach: 'Each half is sorted; decide which side is ordered, then check if target lies within it.',
    timeSpentMinutes: 28,
  },
  {
    id: 'p_10',
    topicId: 't_binary_search',
    title: 'Koko Eating Bananas',
    difficulty: 'MEDIUM',
    status: 'ATTEMPTED',
    source: 'LeetCode 875',
    platform: 'LeetCode',
    tags: ['Binary Search', 'Search on Answer'],
    bookmarked: false,
    attempts: 1,
    lastAttemptedAt: '2026-06-24',
    timeComplexity: 'O(n log m)',
    spaceComplexity: 'O(1)',
    approach: 'Binary search the eating speed; feasibility check sums ceil(pile / speed) hours.',
    timeSpentMinutes: 31,
    notes: 'First "binary search on the answer" problem — the pattern finally clicked.',
  },
  {
    id: 'p_11',
    topicId: 't_binary_search',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'HARD',
    status: 'TODO',
    source: 'LeetCode 4',
    platform: 'LeetCode',
    tags: ['Binary Search', 'Partition'],
    bookmarked: true,
    attempts: 0,
  },

  /* ---- Linked List ---- */
  {
    id: 'p_12',
    topicId: 't_linked_list',
    title: 'Reverse Linked List',
    difficulty: 'EASY',
    status: 'MASTERED',
    source: 'LeetCode 206',
    platform: 'LeetCode',
    tags: ['Linked List', 'Reversal'],
    bookmarked: false,
    attempts: 2,
    lastAttemptedAt: '2026-06-12',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approach: 'Iterate with prev/curr/next pointers, re-linking each node backward.',
    timeSpentMinutes: 7,
  },
  {
    id: 'p_13',
    topicId: 't_linked_list',
    title: 'Linked List Cycle',
    difficulty: 'EASY',
    status: 'SOLVED',
    source: 'LeetCode 141',
    platform: 'LeetCode',
    tags: ['Linked List', 'Fast & Slow'],
    bookmarked: false,
    attempts: 1,
    lastAttemptedAt: '2026-06-13',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approach: "Floyd's tortoise & hare — if the fast pointer laps the slow one, there is a cycle.",
    timeSpentMinutes: 10,
  },
  {
    id: 'p_14',
    topicId: 't_linked_list',
    title: 'Merge Two Sorted Lists',
    difficulty: 'EASY',
    status: 'SOLVED',
    source: 'LeetCode 21',
    platform: 'LeetCode',
    tags: ['Linked List', 'Two Pointers'],
    bookmarked: false,
    attempts: 1,
    lastAttemptedAt: '2026-06-14',
    timeComplexity: 'O(n + m)',
    spaceComplexity: 'O(1)',
    approach: 'Dummy head; splice the smaller current node each step, then attach the remainder.',
    timeSpentMinutes: 12,
  },

  /* ---- Trees & BST ---- */
  {
    id: 'p_15',
    topicId: 't_trees',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'MEDIUM',
    status: 'SOLVED',
    source: 'LeetCode 102',
    platform: 'LeetCode',
    tags: ['Tree', 'BFS', 'Queue'],
    bookmarked: true,
    attempts: 1,
    lastAttemptedAt: '2026-06-24',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    approach: 'BFS with a queue, snapshotting the queue size to group nodes per level.',
    timeSpentMinutes: 14,
  },
  {
    id: 'p_16',
    topicId: 't_trees',
    title: 'Lowest Common Ancestor of a BST',
    difficulty: 'MEDIUM',
    status: 'TODO',
    source: 'LeetCode 235',
    platform: 'LeetCode',
    tags: ['Tree', 'BST', 'Recursion'],
    bookmarked: false,
    attempts: 0,
  },
  {
    id: 'p_17',
    topicId: 't_trees',
    title: 'Validate Binary Search Tree',
    difficulty: 'MEDIUM',
    status: 'ATTEMPTED',
    source: 'LeetCode 98',
    platform: 'LeetCode',
    tags: ['Tree', 'BST', 'DFS'],
    bookmarked: true,
    attempts: 2,
    lastAttemptedAt: '2026-06-25',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    approach: 'DFS carrying an open (low, high) range; each node must fall strictly within it.',
    timeSpentMinutes: 21,
    notes: 'Failed first attempt by only comparing parent-child instead of the full range.',
  },

  /* ---- Graphs ---- */
  {
    id: 'p_18',
    topicId: 't_graphs',
    title: 'Number of Islands',
    difficulty: 'MEDIUM',
    status: 'SOLVED',
    source: 'LeetCode 200',
    platform: 'LeetCode',
    tags: ['Graph', 'BFS', 'DFS', 'Grid'],
    bookmarked: true,
    attempts: 2,
    lastAttemptedAt: '2026-06-23',
    timeComplexity: 'O(m * n)',
    spaceComplexity: 'O(m * n)',
    approach: 'Scan the grid; on each unvisited land cell flood-fill its component and count it.',
    timeSpentMinutes: 19,
  },
  {
    id: 'p_19',
    topicId: 't_graphs',
    title: 'Course Schedule',
    difficulty: 'MEDIUM',
    status: 'ATTEMPTED',
    source: 'LeetCode 207',
    platform: 'LeetCode',
    tags: ['Graph', 'Topo Sort', 'DFS', 'Cycle Detection'],
    bookmarked: false,
    attempts: 2,
    lastAttemptedAt: '2026-06-25',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V + E)',
    approach: "Kahn's algorithm: repeatedly remove zero-indegree nodes; a leftover means a cycle.",
    timeSpentMinutes: 34,
    notes: 'Cycle detection = "can we topologically order all nodes?". Reframing helped.',
  },
  {
    id: 'p_20',
    topicId: 't_graphs',
    title: 'Word Ladder',
    difficulty: 'HARD',
    status: 'TODO',
    source: 'LeetCode 127',
    platform: 'LeetCode',
    tags: ['Graph', 'BFS', 'Shortest Path'],
    bookmarked: true,
    attempts: 0,
  },
  {
    id: 'p_21',
    topicId: 't_graphs',
    title: 'Network Delay Time',
    difficulty: 'MEDIUM',
    status: 'TODO',
    source: 'LeetCode 743',
    platform: 'LeetCode',
    tags: ['Graph', 'Dijkstra', 'Shortest Path'],
    bookmarked: false,
    attempts: 0,
  },

  /* ---- Dynamic Programming ---- */
  {
    id: 'p_22',
    topicId: 't_dp',
    title: 'Climbing Stairs',
    difficulty: 'EASY',
    status: 'MASTERED',
    source: 'LeetCode 70',
    platform: 'LeetCode',
    tags: ['DP', 'Fibonacci'],
    bookmarked: false,
    attempts: 1,
    lastAttemptedAt: '2026-06-08',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    approach: 'Fibonacci recurrence ways(n) = ways(n-1) + ways(n-2); roll two variables.',
    timeSpentMinutes: 6,
  },
  {
    id: 'p_23',
    topicId: 't_dp',
    title: 'Coin Change',
    difficulty: 'MEDIUM',
    status: 'ATTEMPTED',
    source: 'LeetCode 322',
    platform: 'LeetCode',
    tags: ['DP', 'Unbounded Knapsack'],
    bookmarked: true,
    attempts: 2,
    lastAttemptedAt: '2026-06-26',
    timeComplexity: 'O(amount * coins)',
    spaceComplexity: 'O(amount)',
    approach: 'Bottom-up dp[a] = min over coins of dp[a - coin] + 1, seeded with dp[0] = 0.',
    timeSpentMinutes: 29,
    notes: 'Unbounded knapsack flavour — iterate amounts outward, coins inner.',
  },
  {
    id: 'p_24',
    topicId: 't_dp',
    title: 'Longest Increasing Subsequence',
    difficulty: 'MEDIUM',
    status: 'TODO',
    source: 'LeetCode 300',
    platform: 'LeetCode',
    tags: ['DP', 'LIS', 'Binary Search'],
    bookmarked: true,
    attempts: 0,
  },
  {
    id: 'p_25',
    topicId: 't_dp',
    title: 'Edit Distance',
    difficulty: 'HARD',
    status: 'TODO',
    source: 'LeetCode 72',
    platform: 'LeetCode',
    tags: ['DP', 'String', 'Intervals'],
    bookmarked: false,
    attempts: 0,
  },
];

/* ------------------------------------------------------------------ */
/* Revisions (spaced repetition)                                       */
/* ------------------------------------------------------------------ */

export const mockRevisions: Revision[] = [
  {
    id: 'rev_1',
    problemId: 'p_1',
    problemTitle: 'Two Sum',
    topicTitle: 'Arrays & Hashing',
    difficulty: 'EASY',
    dueDate: TODAY,
    dueToday: true,
    confidence: 5,
    intervalDays: 14,
    reviewCount: 4,
    lastReviewedAt: '2026-06-12',
  },
  {
    id: 'rev_2',
    problemId: 'p_3',
    problemTitle: 'Longest Consecutive Sequence',
    topicTitle: 'Arrays & Hashing',
    difficulty: 'MEDIUM',
    dueDate: TODAY,
    dueToday: true,
    confidence: 2,
    intervalDays: 1,
    reviewCount: 1,
    lastReviewedAt: '2026-06-25',
  },
  {
    id: 'rev_3',
    problemId: 'p_18',
    problemTitle: 'Number of Islands',
    topicTitle: 'Graphs',
    difficulty: 'MEDIUM',
    dueDate: TODAY,
    dueToday: true,
    confidence: 3,
    intervalDays: 3,
    reviewCount: 2,
    lastReviewedAt: '2026-06-23',
  },
  {
    id: 'rev_4',
    problemId: 'p_19',
    problemTitle: 'Course Schedule',
    topicTitle: 'Graphs',
    difficulty: 'MEDIUM',
    dueDate: TODAY,
    dueToday: true,
    confidence: 2,
    intervalDays: 1,
    reviewCount: 1,
    lastReviewedAt: '2026-06-25',
  },
  {
    id: 'rev_5',
    problemId: 'p_7',
    problemTitle: 'Longest Palindromic Substring',
    topicTitle: 'Strings',
    difficulty: 'MEDIUM',
    dueDate: '2026-06-28',
    dueToday: false,
    confidence: 4,
    intervalDays: 7,
    reviewCount: 3,
    lastReviewedAt: '2026-06-21',
  },
  {
    id: 'rev_6',
    problemId: 'p_15',
    problemTitle: 'Binary Tree Level Order Traversal',
    topicTitle: 'Trees & BST',
    difficulty: 'MEDIUM',
    dueDate: '2026-06-30',
    dueToday: false,
    confidence: 4,
    intervalDays: 6,
    reviewCount: 2,
    lastReviewedAt: '2026-06-24',
  },
  {
    id: 'rev_7',
    problemId: 'p_9',
    problemTitle: 'Search in Rotated Sorted Array',
    topicTitle: 'Binary Search',
    difficulty: 'MEDIUM',
    dueDate: '2026-07-02',
    dueToday: false,
    confidence: 3,
    intervalDays: 9,
    reviewCount: 2,
    lastReviewedAt: '2026-06-23',
  },
  {
    id: 'rev_8',
    problemId: 'p_2',
    problemTitle: 'Best Time to Buy and Sell Stock',
    topicTitle: 'Arrays & Hashing',
    difficulty: 'EASY',
    dueDate: '2026-07-05',
    dueToday: false,
    confidence: 5,
    intervalDays: 13,
    reviewCount: 3,
    lastReviewedAt: '2026-06-22',
  },
];

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export const mockTasks: Task[] = [
  {
    id: 'task_1',
    title: 'Solve 3 graph problems',
    done: false,
    priority: 'HIGH',
    dueDate: TODAY,
    topicId: 't_graphs',
    category: 'DSA',
    icon: 'globe',
    notes: 'Focus on the shortest-path family before tomorrow’s mock.',
    checklist: [
      { id: 'c_1a', label: 'Word Ladder (BFS shortest path)', done: false },
      { id: 'c_1b', label: 'Network Delay Time (Dijkstra)', done: false },
      { id: 'c_1c', label: 'Course Schedule II (topo order)', done: false },
    ],
  },
  {
    id: 'task_2',
    title: 'Clear flagged revisions',
    done: false,
    priority: 'HIGH',
    dueDate: TODAY,
    category: 'REVISION',
    icon: 'repeat',
    notes: 'Two low-confidence cards are overdue — do these first.',
    checklist: [
      { id: 'c_2a', label: 'Longest Consecutive Sequence', done: false },
      { id: 'c_2b', label: 'Course Schedule', done: false },
    ],
  },
  {
    id: 'task_3',
    title: 'Watch DP patterns lecture',
    done: true,
    priority: 'MEDIUM',
    dueDate: '2026-06-25',
    topicId: 't_dp',
    category: 'DSA',
    icon: 'book-open',
    notes: 'Knapsack vs. LIS templates — take notes in the journal.',
  },
  {
    id: 'task_4',
    title: 'Refactor portfolio site hero',
    done: false,
    priority: 'LOW',
    dueDate: '2026-06-29',
    category: 'PROJECT',
    icon: 'code',
    notes: 'Tighten spacing, ship the new case-study card.',
    checklist: [
      { id: 'c_4a', label: 'Rebuild hero layout', done: true },
      { id: 'c_4b', label: 'Add project case study', done: false },
      { id: 'c_4c', label: 'Lighthouse pass > 95', done: false },
    ],
  },
  {
    id: 'task_5',
    title: 'Update resume bullet points',
    done: true,
    priority: 'MEDIUM',
    category: 'OTHER',
    icon: 'file-text',
  },
  {
    id: 'task_6',
    title: 'Schedule mock interview with peer',
    done: false,
    priority: 'MEDIUM',
    dueDate: '2026-06-28',
    category: 'OTHER',
    icon: 'calendar-check',
  },
];

/* ------------------------------------------------------------------ */
/* Habits                                                              */
/* ------------------------------------------------------------------ */

export const mockHabits: Habit[] = [
  {
    id: 'habit_1',
    title: 'Solve a problem',
    emoji: 'code',
    streak: 27,
    completedToday: true,
    targetPerWeek: 7,
    weekHistory: [true, true, true, true, true, true, true],
    accent: 'highlighter',
  },
  {
    id: 'habit_2',
    title: 'Read theory',
    emoji: 'book-open',
    streak: 9,
    completedToday: false,
    targetPerWeek: 5,
    weekHistory: [true, false, true, true, false, true, false],
    accent: 'signal',
  },
  {
    id: 'habit_3',
    title: 'Daily reflection',
    emoji: 'notebook-pen',
    streak: 14,
    completedToday: false,
    targetPerWeek: 7,
    weekHistory: [true, true, true, false, true, true, false],
    accent: 'peach',
  },
  {
    id: 'habit_4',
    title: 'Mock interview',
    emoji: 'mail',
    streak: 2,
    completedToday: false,
    targetPerWeek: 2,
    weekHistory: [false, true, false, false, false, true, false],
    accent: 'success',
  },
  {
    id: 'habit_5',
    title: 'Workout',
    emoji: 'dumbbell',
    streak: 6,
    completedToday: true,
    targetPerWeek: 4,
    weekHistory: [true, false, true, true, false, true, true],
    accent: 'signal',
  },
];

/* ------------------------------------------------------------------ */
/* Study sessions + summary                                            */
/* ------------------------------------------------------------------ */

export const mockStudySessions: StudySession[] = [
  { id: 's_1', date: TODAY, minutes: 95, topic: 'Graphs', problemsSolved: 2 },
  { id: 's_2', date: '2026-06-25', minutes: 120, topic: 'Arrays & Hashing', problemsSolved: 3 },
  { id: 's_3', date: '2026-06-24', minutes: 60, topic: 'Trees & BST', problemsSolved: 1 },
  { id: 's_4', date: '2026-06-23', minutes: 140, topic: 'Graphs', problemsSolved: 4 },
  { id: 's_5', date: '2026-06-22', minutes: 45, topic: 'Strings', problemsSolved: 1 },
  { id: 's_6', date: '2026-06-21', minutes: 80, topic: 'Binary Search', problemsSolved: 2 },
];

export const mockStudySummary: StudySummary = {
  totalMinutesThisWeek: 540,
  totalMinutesAllTime: 18420,
  sessionsThisWeek: 6,
  averageMinutesPerDay: 90,
  // Mon..Sun
  weeklyMinutes: [120, 45, 140, 60, 80, 95, 0],
  recentSessions: mockStudySessions,
};

/* ------------------------------------------------------------------ */
/* Reflections                                                         */
/* ------------------------------------------------------------------ */

export const mockReflections: Reflection[] = [
  {
    id: 'ref_1',
    date: TODAY,
    mood: 'GOOD',
    emoji: 'smile',
    note: 'Cracked the islands flood-fill faster than last time, and my grid-traversal template is finally muscle memory. Graph intuition is genuinely building — directed cycle detection still feels shaky though.',
    win: 'Reframed cycle detection as a topological-order question and it clicked.',
  },
  {
    id: 'ref_2',
    date: '2026-06-25',
    mood: 'TIRED',
    emoji: 'moon',
    note: 'Long lab day, low energy. Almost skipped, but kept the streak alive with one easy problem and a short revision pass. Quantity zero, consistency one.',
    win: 'Showed up anyway. Streak intact at 26.',
  },
  {
    id: 'ref_3',
    date: '2026-06-24',
    mood: 'GREAT',
    emoji: 'flame',
    note: 'Four problems before lunch, all first-try accepts. Momentum is real when I start the day with the hardest topic first instead of warming up on easies.',
    win: 'Best focus block of the week — 140 deep-work minutes, no context switching.',
  },
  {
    id: 'ref_4',
    date: '2026-06-23',
    mood: 'OKAY',
    emoji: 'sun',
    note: 'Spent too long on Search in Rotated Sorted Array because I kept reasoning about the wrong half. Wrote out the "which side is sorted" invariant explicitly and it stopped being confusing.',
    win: 'Turned a frustrating bug into a reusable note.',
  },
];

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export const mockAchievements: Achievement[] = [
  {
    id: 'ach_1',
    title: 'First Blood',
    description: 'Solve your very first problem.',
    emoji: 'zap',
    unlocked: true,
    unlockedAt: '2025-09-02',
    progress: 100,
    tone: 'annotation',
  },
  {
    id: 'ach_2',
    title: 'Streak Master',
    description: 'Maintain a 30-day solving streak.',
    emoji: 'flame',
    unlocked: false,
    progress: 90,
    tone: 'peach',
  },
  {
    id: 'ach_3',
    title: 'Century',
    description: 'Solve 100 problems all-time.',
    emoji: 'medal',
    unlocked: true,
    unlockedAt: '2026-01-14',
    progress: 100,
    tone: 'highlighter',
  },
  {
    id: 'ach_4',
    title: 'Graph Whisperer',
    description: 'Solve 25 graph problems.',
    emoji: 'globe',
    unlocked: false,
    progress: 44,
    tone: 'signal',
  },
  {
    id: 'ach_5',
    title: 'Reviewer',
    description: 'Complete 50 spaced revisions.',
    emoji: 'repeat',
    unlocked: true,
    unlockedAt: '2026-05-30',
    progress: 100,
    tone: 'success',
  },
  {
    id: 'ach_6',
    title: 'Early Bird',
    description: 'Solve before 9am for 10 days.',
    emoji: 'sun',
    unlocked: false,
    progress: 60,
    tone: 'peach',
  },
  {
    id: 'ach_7',
    title: 'Pattern Hunter',
    description: 'Finish the Blind 75 sheet.',
    emoji: 'target',
    unlocked: false,
    progress: 81,
    tone: 'signal',
  },
  {
    id: 'ach_8',
    title: 'Deep Work',
    description: 'Log a 2-hour focused session.',
    emoji: 'brain',
    unlocked: true,
    unlockedAt: '2026-06-23',
    progress: 100,
    tone: 'highlighter',
  },
];

/* ------------------------------------------------------------------ */
/* Quotes (rotating)                                                   */
/* ------------------------------------------------------------------ */

export const mockQuotes: Quote[] = [
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: 'Slow is smooth, and smooth is fast.', author: 'Navy SEAL maxim' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'Amateurs sit and wait for inspiration; the rest of us just get up and go to work.', author: 'Stephen King' },
  { text: 'Repetition is the mother of skill.', author: 'Tony Robbins' },
  { text: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Harold Abelson' },
];

/**
 * The single quote surfaced by default (kept for backward-compat). Chosen
 * deterministically so it is stable across reloads.
 */
export const mockQuote: Quote = mockQuotes[0];

/* ------------------------------------------------------------------ */
/* Dashboard composite                                                 */
/* ------------------------------------------------------------------ */

export const mockDashboard: DashboardData = {
  greeting: 'Good morning, Aarav',
  solvedToday: 2,
  dailyGoal: 3,
  streak: 27,
  revisionsDueToday: 4,
  openTasks: 4,
  focusMinutesToday: 95,
  continueTopics: [mockTopics[5], mockTopics[1], mockTopics[6]],
  quote: mockQuote,
};

/* ------------------------------------------------------------------ */
/* Heatmap — one year of deterministic per-day counts                  */
/* ------------------------------------------------------------------ */

/**
 * Generates `days` days ending at `end` (inclusive) with deterministic counts
 * via a pure index hash — NO Math.random / Date.now. Called once at module load
 * with the pinned TODAY so output is stable across reloads and snapshots.
 *
 * The shape is intentionally lifelike: quieter weekends, periodic rest days, and
 * occasional grind spikes, all derived purely from the day index.
 */
function buildHeatmap(end: string, days = 365): HeatmapDay[] {
  const endMs = Date.parse(`${end}T00:00:00Z`);
  const DAY_MS = 86_400_000;
  const out: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ms = endMs - i * DAY_MS;
    const d = new Date(ms);
    const iso = d.toISOString().slice(0, 10);
    // Deterministic pseudo-count: weave a couple of integer sequences.
    const seed = (i * 1103515245 + 12345) >>> 8;
    const dow = d.getUTCDay();
    let count = seed % 6; // 0..5
    if (dow === 0) count = Math.max(0, count - 2); // quieter Sundays
    if (dow === 6) count = Math.max(0, count - 1); // slightly quieter Saturdays
    if (i % 17 === 0) count = 0; // occasional rest day
    if (i % 11 === 0) count = Math.min(8, count + 4); // grind spikes
    out.push({ day: iso, count });
  }
  return out;
}

export const mockHeatmap: HeatmapDay[] = buildHeatmap(TODAY, 365);

/* ================================================================== */
/* EXPANSION — feature-screen mock data                                */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/* Notes — rich markdown notebook                                      */
/* ------------------------------------------------------------------ */

export const mockNotes: Note[] = [
  {
    id: 'note_1',
    title: 'Sliding Window — the universal template',
    body: `# Sliding Window

A reusable template for **substring / subarray** problems.

## When to reach for it
- "Longest / shortest / count of" contiguous window
- A constraint that *expands* and *contracts* monotonically

## Template
\`\`\`ts
let left = 0;
let best = 0;
const need = new Map<string, number>();
for (let right = 0; right < s.length; right++) {
  // 1. include s[right]
  // 2. while (window invalid) shrink from left
  // 3. update best
}
\`\`\`

> The trick is recognising that \`left\` only ever moves forward — so the whole scan is O(n).

## Gotchas
1. Distinguish "at most K" vs "exactly K" (exactly K = atMost(K) - atMost(K-1)).
2. Reset state correctly when shrinking.`,
    preview: 'A reusable template for substring / subarray problems. left only ever moves forward → O(n).',
    tags: ['Sliding Window', 'Arrays', 'Template'],
    folder: 'DSA',
    icon: 'code',
    accent: 'highlighter',
    favorite: true,
    pinned: true,
    archived: false,
    createdAt: '2026-05-12',
    updatedAt: '2026-06-24',
    wordCount: 96,
  },
  {
    id: 'note_2',
    title: 'Graph traversal cheat sheet',
    body: `# Graph Traversal

## BFS vs DFS — pick by goal
- **BFS** → shortest path in *unweighted* graphs, level-order.
- **DFS** → connectivity, cycle detection, topological order, backtracking.

## Cycle detection
- **Undirected**: DFS, a back-edge to a *non-parent* visited node = cycle.
- **Directed**: track a \`recursionStack\` (gray set) — a node already gray = cycle.

## Shortest paths
| Algorithm | Use when |
|---|---|
| BFS | unweighted |
| Dijkstra | non-negative weights |
| Bellman-Ford | negative edges |
| Floyd-Warshall | all-pairs |

> Reframe "is there a cycle?" as "can I topologically order every node?" — Kahn's algorithm answers both.`,
    preview: 'BFS for shortest unweighted paths, DFS for connectivity/cycles. Dijkstra vs Bellman-Ford table.',
    tags: ['Graphs', 'BFS', 'DFS', 'Cheat Sheet'],
    folder: 'DSA',
    icon: 'globe',
    accent: 'signal',
    favorite: true,
    pinned: true,
    archived: false,
    createdAt: '2026-04-30',
    updatedAt: '2026-06-26',
    wordCount: 110,
  },
  {
    id: 'note_3',
    title: 'DP — memoization to tabulation',
    body: `# Dynamic Programming

## The 5-step recipe
1. Define the **state** (what does dp[i] mean?).
2. Write the **recurrence** (transitions).
3. Identify **base cases**.
4. Decide order (top-down memo vs bottom-up table).
5. Optimise space (rolling array).

## Knapsack family
- 0/1 knapsack → iterate capacity **descending**.
- Unbounded → iterate capacity **ascending**.

\`\`\`ts
// Coin change (min coins)
dp[0] = 0;
for (let a = 1; a <= amount; a++) {
  dp[a] = Infinity;
  for (const c of coins) if (a >= c) dp[a] = Math.min(dp[a], dp[a - c] + 1);
}
\`\`\``,
    preview: 'The 5-step recipe: state, recurrence, base cases, order, space. Knapsack iteration direction.',
    tags: ['DP', 'Knapsack', 'Template'],
    folder: 'DSA',
    icon: 'brain',
    accent: 'peach',
    favorite: false,
    pinned: false,
    archived: false,
    createdAt: '2026-05-20',
    updatedAt: '2026-06-18',
    wordCount: 102,
  },
  {
    id: 'note_4',
    title: 'System design: rate limiter',
    body: `# Designing a Rate Limiter

## Algorithms
- **Token bucket** — smooth bursts, refill at fixed rate. Most common.
- **Leaky bucket** — constant outflow, queue requests.
- **Fixed window** — simple but spiky at boundaries.
- **Sliding window log / counter** — accurate, more memory.

## Where it lives
Client → **API Gateway (rate limit here)** → Service.

## Distributed concerns
- Store counters in **Redis** (atomic \`INCR\` + TTL).
- Use a **Lua script** for check-and-decrement atomicity.
- Return \`429\` + \`Retry-After\` header.`,
    preview: 'Token bucket vs leaky bucket vs sliding window. Redis INCR + Lua for distributed counters.',
    tags: ['System Design', 'Scalability', 'Redis'],
    folder: 'System Design',
    icon: 'layers',
    accent: 'annotation',
    favorite: true,
    pinned: false,
    archived: false,
    createdAt: '2026-06-02',
    updatedAt: '2026-06-22',
    wordCount: 88,
  },
  {
    id: 'note_5',
    title: 'Behavioral: STAR stories bank',
    body: `# STAR Story Bank

Keep 6–8 polished stories ready, each tagged to common themes.

## Format
- **S**ituation — set the scene briefly.
- **T**ask — what was the goal / your responsibility.
- **A**ction — what *you* did (use "I", not "we").
- **R**esult — quantified outcome.

## Themes to cover
1. Conflict / disagreement
2. Leadership / ownership
3. Failure & what you learned
4. Ambiguity / tight deadline
5. Influence without authority

> Rehearse out loud. Aim for ~2 minutes each. Lead with the result if asked "tell me about a time...".`,
    preview: 'Keep 6-8 STAR stories tagged to themes: conflict, leadership, failure, ambiguity, influence.',
    tags: ['Behavioral', 'Interview', 'STAR'],
    folder: 'Behavioral',
    icon: 'mail',
    accent: 'success',
    favorite: false,
    pinned: false,
    archived: false,
    createdAt: '2026-06-08',
    updatedAt: '2026-06-15',
    wordCount: 95,
  },
  {
    id: 'note_6',
    title: 'Useful TS snippets',
    body: `# Handy Snippets

## Counter from array
\`\`\`ts
const count = arr.reduce<Record<string, number>>(
  (m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {},
);
\`\`\`

## Min-heap via array (manual)
Use a class-based binary heap or a library — JS has no built-in PQ.

## 2D grid init
\`\`\`ts
const grid = Array.from({ length: m }, () => Array<number>(n).fill(0));
\`\`\``,
    preview: 'Counter via reduce, 2D grid init with Array.from, note on JS lacking a built-in priority queue.',
    tags: ['TypeScript', 'Snippets'],
    folder: 'Snippets',
    icon: 'code-xml',
    accent: 'signal',
    favorite: false,
    pinned: false,
    archived: false,
    createdAt: '2026-03-18',
    updatedAt: '2026-05-29',
    wordCount: 64,
  },
  {
    id: 'note_7',
    title: 'Old: brute-force sorting notes',
    body: `# Sorting (archived)

Early notes from when I was starting out. Superseded by the patterns sheet.

- Bubble / selection / insertion — O(n^2), only for tiny inputs.
- Merge sort — stable, O(n log n), O(n) space.
- Quick sort — in-place, average O(n log n), worst O(n^2).`,
    preview: 'Early sorting notes, archived. Superseded by the patterns sheet.',
    tags: ['Sorting', 'Archive'],
    folder: 'General',
    icon: 'book',
    accent: 'peach',
    favorite: false,
    pinned: false,
    archived: true,
    createdAt: '2025-10-04',
    updatedAt: '2025-11-12',
    wordCount: 52,
  },
];

/* ------------------------------------------------------------------ */
/* Resources — saved learning links                                    */
/* ------------------------------------------------------------------ */

export const mockResources: Resource[] = [
  {
    id: 'res_1',
    title: 'Striver A2Z DSA Course Sheet',
    url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/',
    type: 'documentation',
    topic: 'DSA Roadmap',
    source: 'takeUforward',
    description: 'The complete structured A-to-Z sheet with ordered steps and notes.',
    icon: 'compass',
    accent: 'highlighter',
    favorite: true,
    completed: false,
    addedAt: '2026-05-01',
  },
  {
    id: 'res_2',
    title: 'Graph Series — full playlist',
    url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0oE3gA41TKO2H5bHpPd7fzn',
    type: 'playlist',
    topic: 'Graphs',
    source: 'takeUforward',
    description: 'BFS, DFS, shortest paths, MST and topological sort, end to end.',
    icon: 'globe',
    accent: 'signal',
    favorite: true,
    completed: false,
    duration: '18h 40m',
    addedAt: '2026-05-04',
  },
  {
    id: 'res_3',
    title: 'Dynamic Programming patterns',
    url: 'https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns',
    type: 'article',
    topic: 'Dynamic Programming',
    source: 'LeetCode Discuss',
    description: 'Classic write-up grouping DP problems by reusable pattern.',
    icon: 'brain',
    accent: 'peach',
    favorite: false,
    completed: true,
    duration: '25 min',
    addedAt: '2026-05-10',
  },
  {
    id: 'res_4',
    title: 'NeetCode 150 practice',
    url: 'https://neetcode.io/practice',
    type: 'documentation',
    topic: 'Practice',
    source: 'NeetCode',
    description: 'Curated 150 grouped by pattern with video explanations.',
    icon: 'target',
    accent: 'annotation',
    favorite: true,
    completed: false,
    addedAt: '2026-04-22',
  },
  {
    id: 'res_5',
    title: 'System Design Primer',
    url: 'https://github.com/donnemartin/system-design-primer',
    type: 'github',
    topic: 'System Design',
    source: 'donnemartin',
    description: 'The canonical open-source guide to learning system design.',
    icon: 'layers',
    accent: 'signal',
    favorite: true,
    completed: false,
    addedAt: '2026-06-01',
  },
  {
    id: 'res_6',
    title: 'Binary Search — the clean template',
    url: 'https://www.youtube.com/watch?v=GU7DpgHINWQ',
    type: 'youtube',
    topic: 'Binary Search',
    source: 'NeetCode',
    description: 'Removing off-by-one anxiety with one consistent template.',
    icon: 'search',
    accent: 'highlighter',
    favorite: false,
    completed: true,
    duration: '14 min',
    addedAt: '2026-05-18',
  },
  {
    id: 'res_7',
    title: 'Big-O Cheat Sheet',
    url: 'https://www.bigocheatsheet.com/',
    type: 'documentation',
    topic: 'Complexity',
    source: 'bigocheatsheet.com',
    description: 'Time/space complexity reference for common data structures.',
    icon: 'chart',
    accent: 'success',
    favorite: false,
    completed: false,
    addedAt: '2026-03-30',
  },
  {
    id: 'res_8',
    title: 'What every dev should know about Unicode',
    url: 'https://tonsky.me/blog/unicode/',
    type: 'blog',
    topic: 'Fundamentals',
    source: 'tonsky.me',
    description: 'A deep, friendly dive into strings, code points and graphemes.',
    icon: 'hash',
    accent: 'peach',
    favorite: false,
    completed: true,
    duration: '20 min',
    addedAt: '2026-04-11',
  },
  {
    id: 'res_9',
    title: 'Cracking the Coding Interview (notes PDF)',
    url: 'https://example.com/ctci-notes.pdf',
    type: 'pdf',
    topic: 'Interview Prep',
    source: 'Personal',
    description: 'My condensed chapter notes and flagged problems.',
    icon: 'file-text',
    accent: 'annotation',
    favorite: false,
    completed: false,
    addedAt: '2026-06-05',
  },
];

/* ------------------------------------------------------------------ */
/* Daily journal / reflections (rich, keyed by day)                    */
/* ------------------------------------------------------------------ */

export const mockJournal: JournalEntry[] = [
  {
    id: 'jr_2026-06-26',
    dayKey: TODAY,
    learned:
      'Flood-fill grid traversal is finally automatic — I wrote Number of Islands without re-deriving the direction array. Directed cycle detection via the recursion stack also clicked.',
    challenged:
      'Still slow to spot when a problem is "binary search on the answer". I default to linear scans first.',
    goalsCompleted: [
      'Solved 2 graph problems',
      'Cleared 4 due revisions',
      '95 minutes of deep work',
    ],
    focus: 4,
    confidence: 4,
    tomorrowPlan:
      'Start with the hardest topic (DP) while fresh. Two LIS-family problems, then a short revision pass.',
    mood: 'GOOD',
    moodIcon: 'smile',
  },
  {
    id: 'jr_2026-06-25',
    dayKey: '2026-06-25',
    learned:
      'Even a single easy problem keeps momentum. Showing up beats intensity on low-energy days.',
    challenged: 'Low energy after a long lab day — almost broke the streak.',
    goalsCompleted: ['Kept the streak alive', 'One easy problem', 'Short revision pass'],
    focus: 2,
    confidence: 3,
    tomorrowPlan: 'Earlier start, fuller focus block. Aim for the full 3-problem goal.',
    mood: 'TIRED',
    moodIcon: 'moon',
  },
  {
    id: 'jr_2026-06-24',
    dayKey: '2026-06-24',
    learned:
      'Tackling the hardest topic first thing produces the best focus. Four first-try accepts before lunch.',
    challenged: 'Resisting the urge to "warm up" on easy problems and waste the fresh hours.',
    goalsCompleted: ['4 problems solved', '140-minute deep-work block', 'No context switching'],
    focus: 5,
    confidence: 5,
    tomorrowPlan: 'Repeat the morning ritual. Protect the first 2 hours from notifications.',
    mood: 'GREAT',
    moodIcon: 'flame',
  },
  {
    id: 'jr_2026-06-23',
    dayKey: '2026-06-23',
    learned:
      'Writing the "which half is sorted" invariant explicitly turned a confusing problem into a clean one. Externalising invariants beats holding them in my head.',
    challenged: 'Spent too long reasoning about the wrong half in rotated binary search.',
    goalsCompleted: ['Solved Search in Rotated Sorted Array', 'Wrote a reusable note'],
    focus: 3,
    confidence: 3,
    tomorrowPlan: 'Drill two more binary-search-on-answer problems to cement the pattern.',
    mood: 'OKAY',
    moodIcon: 'sun',
  },
  {
    id: 'jr_2026-06-22',
    dayKey: '2026-06-22',
    learned: 'Kadane and the running-minimum trick are two faces of the same single-pass idea.',
    challenged: 'Strings parsing problems still feel fiddly with edge cases.',
    goalsCompleted: ['Solved Best Time to Buy and Sell Stock', '45 minutes focused'],
    focus: 3,
    confidence: 4,
    tomorrowPlan: 'A binary search day. Start the rotated-array family.',
    mood: 'GOOD',
    moodIcon: 'smile',
  },
];

/* ------------------------------------------------------------------ */
/* Notifications (history)                                             */
/* ------------------------------------------------------------------ */

export const mockNotifications: AppNotification[] = [
  {
    id: 'ntf_1',
    type: 'REVISION_DUE',
    title: '4 revisions are due today',
    body: 'Two low-confidence cards are overdue — clear them first to keep retention high.',
    icon: 'repeat',
    accent: 'highlighter',
    read: false,
    createdAt: '2026-06-26T08:00:00Z',
    href: '/(tabs)/revisions',
  },
  {
    id: 'ntf_2',
    type: 'DAILY_GOAL',
    title: 'One more to hit your goal',
    body: "You've solved 2 of 3 today. One more problem locks in the day.",
    icon: 'target',
    accent: 'signal',
    read: false,
    createdAt: '2026-06-26T07:30:00Z',
    href: '/(tabs)/dsa',
  },
  {
    id: 'ntf_3',
    type: 'STREAK',
    title: '27-day streak — keep it alive',
    body: 'You are 3 days from your all-time best of 41. Show up today.',
    icon: 'flame',
    accent: 'peach',
    read: false,
    createdAt: '2026-06-26T06:45:00Z',
  },
  {
    id: 'ntf_4',
    type: 'ACHIEVEMENT',
    title: 'Achievement progress: Streak Master',
    body: "You're 90% of the way to a 30-day streak. Almost there.",
    icon: 'trophy',
    accent: 'highlighter',
    read: true,
    createdAt: '2026-06-25T21:10:00Z',
    href: '/achievements',
  },
  {
    id: 'ntf_5',
    type: 'HABIT',
    title: 'Daily reflection not logged',
    body: 'Take 2 minutes to capture what you learned today.',
    icon: 'notebook-pen',
    accent: 'peach',
    read: true,
    createdAt: '2026-06-25T20:00:00Z',
    href: '/reflections',
  },
  {
    id: 'ntf_6',
    type: 'FOCUS_SESSION',
    title: 'Deep-work session complete',
    body: 'Nice — 95 focused minutes logged on Graphs. Take a break.',
    icon: 'timer',
    accent: 'signal',
    read: true,
    createdAt: '2026-06-25T18:20:00Z',
  },
  {
    id: 'ntf_7',
    type: 'TASK_DUE',
    title: 'Task due today: Solve 3 graph problems',
    body: 'Focus on the shortest-path family before tomorrow’s mock.',
    icon: 'clipboard',
    accent: 'annotation',
    read: true,
    createdAt: '2026-06-25T09:00:00Z',
    href: '/(tabs)/tracker',
  },
  {
    id: 'ntf_8',
    type: 'WEEKLY_REPORT',
    title: 'Your weekly report is ready',
    body: '9 hours focused, 13 problems solved, productivity up 6 points.',
    icon: 'chart',
    accent: 'success',
    read: true,
    createdAt: '2026-06-23T08:00:00Z',
    href: '/analytics',
  },
  {
    id: 'ntf_9',
    type: 'ACHIEVEMENT',
    title: 'Unlocked: Deep Work',
    body: 'You logged a 2-hour focused session. +150 XP.',
    icon: 'award',
    accent: 'highlighter',
    read: true,
    createdAt: '2026-06-23T16:40:00Z',
    href: '/achievements',
  },
  {
    id: 'ntf_10',
    type: 'SYSTEM',
    title: 'Welcome to Kivo',
    body: 'Your spaced-repetition and focus toolkit is ready. Set your daily goal in Settings.',
    icon: 'sparkles',
    accent: 'signal',
    read: true,
    createdAt: '2026-06-20T12:00:00Z',
    href: '/settings',
  },
];

/* ------------------------------------------------------------------ */
/* Achievement catalog (earned + locked, with XP)                      */
/* ------------------------------------------------------------------ */

export const mockAchievementCatalog: AchievementEntry[] = [
  {
    key: 'first_blood',
    title: 'First Blood',
    description: 'Solve your very first problem.',
    icon: 'zap',
    xp: 50,
    unlocked: true,
    unlockedAt: '2025-09-02',
    progress: 100,
    category: 'MILESTONE',
    tone: 'annotation',
  },
  {
    key: 'streak_30',
    title: 'Streak Master',
    description: 'Maintain a 30-day solving streak.',
    icon: 'flame',
    xp: 300,
    unlocked: false,
    progress: 90,
    category: 'STREAK',
    tone: 'peach',
  },
  {
    key: 'century',
    title: 'Century',
    description: 'Solve 100 problems all-time.',
    icon: 'medal',
    xp: 200,
    unlocked: true,
    unlockedAt: '2026-01-14',
    progress: 100,
    category: 'VOLUME',
    tone: 'highlighter',
  },
  {
    key: 'graph_whisperer',
    title: 'Graph Whisperer',
    description: 'Solve 25 graph problems.',
    icon: 'globe',
    xp: 250,
    unlocked: false,
    progress: 44,
    category: 'VOLUME',
    tone: 'signal',
  },
  {
    key: 'reviewer_50',
    title: 'Reviewer',
    description: 'Complete 50 spaced revisions.',
    icon: 'repeat',
    xp: 200,
    unlocked: true,
    unlockedAt: '2026-05-30',
    progress: 100,
    category: 'REVISION',
    tone: 'success',
  },
  {
    key: 'early_bird',
    title: 'Early Bird',
    description: 'Solve before 9am for 10 days.',
    icon: 'sun',
    xp: 150,
    unlocked: false,
    progress: 60,
    category: 'FOCUS',
    tone: 'peach',
  },
  {
    key: 'pattern_hunter',
    title: 'Pattern Hunter',
    description: 'Finish the Blind 75 sheet.',
    icon: 'target',
    xp: 400,
    unlocked: false,
    progress: 81,
    category: 'MILESTONE',
    tone: 'signal',
  },
  {
    key: 'deep_work',
    title: 'Deep Work',
    description: 'Log a 2-hour focused session.',
    icon: 'brain',
    xp: 150,
    unlocked: true,
    unlockedAt: '2026-06-23',
    progress: 100,
    category: 'FOCUS',
    tone: 'highlighter',
  },
  {
    key: 'half_k',
    title: 'Halfway to 1K',
    description: 'Solve 500 problems all-time.',
    icon: 'trophy',
    xp: 500,
    unlocked: false,
    progress: 82,
    category: 'VOLUME',
    tone: 'highlighter',
  },
  {
    key: 'iron_will',
    title: 'Iron Will',
    description: 'Maintain a 100-day streak.',
    icon: 'crown',
    xp: 1000,
    unlocked: false,
    progress: 27,
    category: 'STREAK',
    tone: 'peach',
  },
  {
    key: 'reflective',
    title: 'Reflective',
    description: 'Write 30 daily journal entries.',
    icon: 'notebook-pen',
    xp: 200,
    unlocked: false,
    progress: 47,
    category: 'FOCUS',
    tone: 'success',
  },
  {
    key: 'focused_mind',
    title: 'Focused Mind',
    description: 'Log 50 focus sessions.',
    icon: 'timer',
    xp: 250,
    unlocked: false,
    progress: 64,
    category: 'FOCUS',
    tone: 'signal',
  },
];

/* ------------------------------------------------------------------ */
/* Analytics — weekly reports + productivity trend                     */
/* ------------------------------------------------------------------ */

export const mockWeeklyReports: WeeklyReport[] = [
  {
    id: 'wr_2026-06-22',
    weekStart: '2026-06-22',
    label: 'Jun 22 – Jun 28',
    studyHours: 9.0,
    problemsSolved: 13,
    revisionRate: 78,
    taskRate: 67,
    focusSessions: 6,
    habitRate: 71,
    longestSession: 140,
    strongestTopic: 'Arrays & Hashing',
    weakestTopic: 'Dynamic Programming',
    productivityScore: 82,
    scoreDelta: 6,
    recommendations: [
      'Front-load DP earlier in the day while focus is highest.',
      'Two low-confidence revision cards keep recurring — over-learn them.',
      'You skipped habit "Read theory" 3×; pair it with your morning solve.',
    ],
  },
  {
    id: 'wr_2026-06-15',
    weekStart: '2026-06-15',
    label: 'Jun 15 – Jun 21',
    studyHours: 7.8,
    problemsSolved: 11,
    revisionRate: 70,
    taskRate: 60,
    focusSessions: 5,
    habitRate: 64,
    longestSession: 110,
    strongestTopic: 'Strings',
    weakestTopic: 'Graphs',
    productivityScore: 76,
    scoreDelta: 4,
    recommendations: [
      'Graphs is your weakest topic — dedicate two focused blocks next week.',
      'Your longest session shrank; protect one 2-hour block.',
    ],
  },
  {
    id: 'wr_2026-06-08',
    weekStart: '2026-06-08',
    label: 'Jun 08 – Jun 14',
    studyHours: 6.5,
    problemsSolved: 9,
    revisionRate: 66,
    taskRate: 55,
    focusSessions: 4,
    habitRate: 57,
    longestSession: 95,
    strongestTopic: 'Linked List',
    weakestTopic: 'Dynamic Programming',
    productivityScore: 72,
    scoreDelta: -3,
    recommendations: [
      'Volume dipped — aim for one more session next week.',
      'Revision rate slipping below 70%; clear due cards daily.',
    ],
  },
];

/** Latest report, surfaced by default on the analytics screen. */
export const mockWeeklyReport: WeeklyReport = mockWeeklyReports[0];

export const mockProductivityTrend: ProductivityPoint[] = [
  { weekStart: '2026-05-04', label: 'May 4', score: 64 },
  { weekStart: '2026-05-11', label: 'May 11', score: 69 },
  { weekStart: '2026-05-18', label: 'May 18', score: 67 },
  { weekStart: '2026-05-25', label: 'May 25', score: 73 },
  { weekStart: '2026-06-01', label: 'Jun 1', score: 75 },
  { weekStart: '2026-06-08', label: 'Jun 8', score: 72 },
  { weekStart: '2026-06-15', label: 'Jun 15', score: 76 },
  { weekStart: '2026-06-22', label: 'Jun 22', score: 82 },
];

/* ------------------------------------------------------------------ */
/* Calendar — events derived from tasks / revisions / sessions          */
/* ------------------------------------------------------------------ */

export const mockCalendarEvents: CalendarEvent[] = [
  // ---- Today ----
  {
    id: 'cal_1',
    date: TODAY,
    time: '08:00',
    type: 'REVISION',
    title: 'Clear 4 due revisions',
    subtitle: 'Spaced repetition',
    icon: 'repeat',
    accent: 'highlighter',
    done: false,
  },
  {
    id: 'cal_2',
    date: TODAY,
    time: '09:30',
    type: 'SESSION',
    title: 'Deep work — Graphs',
    subtitle: '95 min focus',
    icon: 'timer',
    accent: 'signal',
    done: true,
  },
  {
    id: 'cal_3',
    date: TODAY,
    time: '14:00',
    type: 'TASK',
    title: 'Solve 3 graph problems',
    subtitle: 'DSA · high priority',
    icon: 'globe',
    accent: 'annotation',
    done: false,
  },
  {
    id: 'cal_4',
    date: TODAY,
    type: 'HABIT',
    title: 'Daily reflection',
    subtitle: 'All-day habit',
    icon: 'notebook-pen',
    accent: 'peach',
    done: false,
  },
  // ---- Upcoming ----
  {
    id: 'cal_5',
    date: '2026-06-27',
    time: '10:00',
    type: 'GOAL',
    title: 'Hit 3-problem daily goal',
    subtitle: 'Daily target',
    icon: 'target',
    accent: 'highlighter',
    done: false,
  },
  {
    id: 'cal_6',
    date: '2026-06-28',
    time: '11:00',
    type: 'TASK',
    title: 'Mock interview with peer',
    subtitle: 'Interview prep',
    icon: 'mail',
    accent: 'signal',
    done: false,
  },
  {
    id: 'cal_7',
    date: '2026-06-28',
    time: '16:00',
    type: 'REVISION',
    title: 'Longest Palindromic Substring',
    subtitle: 'Strings · review',
    icon: 'repeat',
    accent: 'highlighter',
    done: false,
  },
  {
    id: 'cal_8',
    date: '2026-06-29',
    time: '09:00',
    type: 'TASK',
    title: 'Refactor portfolio site hero',
    subtitle: 'Project · low priority',
    icon: 'code',
    accent: 'peach',
    done: false,
  },
  {
    id: 'cal_9',
    date: '2026-06-30',
    time: '15:00',
    type: 'REVISION',
    title: 'Binary Tree Level Order Traversal',
    subtitle: 'Trees & BST · review',
    icon: 'repeat',
    accent: 'highlighter',
    done: false,
  },
  {
    id: 'cal_10',
    date: '2026-07-02',
    time: '15:00',
    type: 'REVISION',
    title: 'Search in Rotated Sorted Array',
    subtitle: 'Binary Search · review',
    icon: 'repeat',
    accent: 'highlighter',
    done: false,
  },
  // ---- Earlier this week ----
  {
    id: 'cal_11',
    date: '2026-06-25',
    time: '13:00',
    type: 'SESSION',
    title: 'Deep work — Arrays',
    subtitle: '120 min focus',
    icon: 'timer',
    accent: 'signal',
    done: true,
  },
  {
    id: 'cal_12',
    date: '2026-06-24',
    time: '08:30',
    type: 'SESSION',
    title: 'Deep work — Trees',
    subtitle: '60 min focus',
    icon: 'timer',
    accent: 'signal',
    done: true,
  },
];

/* ------------------------------------------------------------------ */
/* Settings & preferences                                              */
/* ------------------------------------------------------------------ */

export const mockSettings: Settings = {
  profile: {
    name: mockProfile.name,
    username: mockProfile.username,
    email: mockProfile.email,
    bio: mockProfile.bio ?? '',
    avatar: mockProfile.avatar,
  },
  notifications: {
    revisionReminders: true,
    dailyGoalAlerts: true,
    streakAlerts: true,
    habitReminders: false,
    taskReminders: true,
    achievementAlerts: true,
    weeklyReport: true,
    quietHours: true,
    quietStart: '22:00',
    quietEnd: '08:00',
  },
  preferences: {
    theme: 'light',
    weekStart: 'mon',
    language: 'en',
    dailyGoal: mockProfile.dailyGoal,
    focusDuration: 25,
    breakDuration: 5,
    haptics: true,
    soundEffects: true,
  },
  appVersion: '1.0.0',
};
