import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

declare global {
  interface Window { aptos?: any }
}

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

const ensureWallet = () => {
  if (!window.aptos) throw new Error("No Aptos wallet found. Install Petra.");
  return window.aptos;
};

const moduleFn = (moduleAddress: string, func: string) => `${moduleAddress}::ProblemRegistry::${func}`;

export async function callCreateProblem(moduleAddress: string, cid: string, lat: number, lng: number, bountyOctas: string) {
  const wallet = ensureWallet();
  const payload = {
    type: "entry_function_payload",
    function: moduleFn(moduleAddress, "create_problem"),
    type_arguments: [] as string[],
    arguments: [cid, String(lat), String(lng), bountyOctas],
  };
  const res = await wallet.signAndSubmitTransaction(payload);
  await aptos.waitForTransaction({ transactionHash: res.hash });
  return res.hash as string;
}

export async function callAddSolution(moduleAddress: string, problemId: string, solver: string, cid: string) {
  const wallet = ensureWallet();
  const payload = {
    type: "entry_function_payload",
    function: moduleFn(moduleAddress, "add_solution"),
    type_arguments: [] as string[],
    arguments: [problemId, solver, cid],
  };
  const res = await wallet.signAndSubmitTransaction(payload);
  await aptos.waitForTransaction({ transactionHash: res.hash });
  return res.hash as string;
}

export async function callVoteSolution(moduleAddress: string, problemId: string, solutionId: string) {
  const wallet = ensureWallet();
  const payload = {
    type: "entry_function_payload",
    function: moduleFn(moduleAddress, "vote_solution"),
    type_arguments: [] as string[],
    arguments: [problemId, solutionId],
  };
  const res = await wallet.signAndSubmitTransaction(payload);
  await aptos.waitForTransaction({ transactionHash: res.hash });
  return res.hash as string;
}

export async function callReleaseReward(moduleAddress: string, problemId: string, solutionId: string) {
  const wallet = ensureWallet();
  const payload = {
    type: "entry_function_payload",
    function: moduleFn(moduleAddress, "release_reward"),
    type_arguments: [] as string[],
    arguments: [problemId, solutionId],
  };
  const res = await wallet.signAndSubmitTransaction(payload);
  await aptos.waitForTransaction({ transactionHash: res.hash });
  return res.hash as string;
}
