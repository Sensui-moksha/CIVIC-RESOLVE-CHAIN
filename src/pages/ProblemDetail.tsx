import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProblemById, addLocalSolution, getLocalSolutions, Solution } from "@/utils/store";
import { uploadJSONToIPFS } from "@/utils/ipfs";
import { callAddSolution, callReleaseReward, callVoteSolution } from "@/utils/aptos";
import { toast } from "@/hooks/use-toast";

const GatewayLink: React.FC<{ cid?: string }> = ({ cid }) => {
  if (!cid) return null;
  const href = `https://ipfs.io/ipfs/${cid}`;
  return <a className="text-primary underline" target="_blank" rel="noreferrer" href={href}>Open media</a>;
};

const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const problem = useMemo(() => (id ? getProblemById(decodeURIComponent(id)) : undefined), [id]);
  const [solutions, setSolutions] = useState<Solution[]>(() => (id ? getLocalSolutions(id) : []));

  const [solutionTitle, setSolutionTitle] = useState("");
  const [solutionDesc, setSolutionDesc] = useState("");
  const [nftToken, setNftToken] = useState(localStorage.getItem("defix.nft.token") || "");
  const [loading, setLoading] = useState(false);

  if (!problem) return <div className="container py-10">Problem not found.</div>;

  const addSolution = async () => {
    setLoading(true);
    try {
      const cid = await uploadJSONToIPFS(nftToken, { title: solutionTitle, description: solutionDesc });
      const local: Solution = { id: `${Date.now()}`, cid, title: solutionTitle, description: solutionDesc, solver: "", createdAt: Date.now(), votes: 0 };
      addLocalSolution(problem.id, local);
      setSolutions(getLocalSolutions(problem.id));

      if (problem.moduleAddress) {
        try {
          await callAddSolution(problem.moduleAddress, problem.id, problem.owner, cid);
          toast({ title: "Solution submitted on-chain" });
        } catch (e: any) {
          toast({ title: "Chain submit failed", description: e?.message ?? String(e) });
        }
      }

      setSolutionTitle("");
      setSolutionDesc("");
    } catch (e: any) {
      toast({ title: "Failed to add solution", description: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  };

  const vote = async (solutionId: string) => {
    if (!problem.moduleAddress) return toast({ title: "Module not set" });
    try {
      await callVoteSolution(problem.moduleAddress, problem.id, solutionId);
      toast({ title: "Voted" });
    } catch (e: any) {
      toast({ title: "Vote failed", description: e?.message ?? String(e) });
    }
  };

  const release = async (solutionId: string) => {
    if (!problem.moduleAddress) return toast({ title: "Module not set" });
    try {
      await callReleaseReward(problem.moduleAddress, problem.id, solutionId);
      toast({ title: "Reward released" });
    } catch (e: any) {
      toast({ title: "Release failed", description: e?.message ?? String(e) });
    }
  };

  return (
    <main className="container py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Problem Detail</h1>
        <p className="text-muted-foreground">Posted by {problem.owner}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{problem.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{problem.description}</p>
          <div className="text-sm">Bounty: {problem.bountyAPT} APT</div>
          <GatewayLink cid={problem.imageCid} />
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add a Solution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={solutionTitle} onChange={(e) => setSolutionTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={4} value={solutionDesc} onChange={(e) => setSolutionDesc(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>NFT.Storage Token</Label>
              <Input value={nftToken} onChange={(e) => setNftToken(e.target.value)} placeholder="Paste your token" />
            </div>
            <Button onClick={addSolution} disabled={loading || !solutionTitle || !solutionDesc || !nftToken}>
              {loading ? "Submitting..." : "Submit Solution"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {solutions.length === 0 && <div className="text-muted-foreground">No solutions yet.</div>}
            {solutions.map((s) => (
              <div key={s.id} className="p-3 rounded-md border">
                <div className="font-medium">{s.title || `Solution ${s.id}`}</div>
                <div className="text-sm text-muted-foreground mb-2">{s.description}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => vote(s.id)}>Vote</Button>
                  <Button size="sm" onClick={() => release(s.id)}>Release Reward</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default ProblemDetail;
