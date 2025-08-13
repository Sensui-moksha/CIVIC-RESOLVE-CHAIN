export type Problem = {
  id: string;
  title: string;
  description: string;
  cid: string;
  imageCid?: string;
  lat: number;
  lng: number;
  bountyAPT: string; // human-readable APT
  bountyOctas: string; // on-chain
  owner: string;
  createdAt: number;
  moduleAddress?: string;
  address?: string; // Human-readable address from geocoding
};

export type Solution = {
  id: string;
  cid: string;
  title?: string;
  description?: string;
  solver: string;
  createdAt: number;
  votes?: number;
};

const KEY = "defix.problems";

export const getProblems = (): Problem[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};

export const saveProblems = (items: Problem[]) => localStorage.setItem(KEY, JSON.stringify(items));

export const addProblem = (p: Problem) => {
  const items = getProblems();
  items.unshift(p);
  saveProblems(items);
};

export const getProblemById = (id: string) => getProblems().find(p => p.id === id);

export const addLocalSolution = (problemId: string, solution: Solution) => {
  const key = `defix.solutions.${problemId}`;
  const items: Solution[] = JSON.parse(localStorage.getItem(key) || "[]");
  items.push(solution);
  localStorage.setItem(key, JSON.stringify(items));
};

export const getLocalSolutions = (problemId: string): Solution[] => {
  return JSON.parse(localStorage.getItem(`defix.solutions.${problemId}`) || "[]");
};
