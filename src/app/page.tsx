"use client";

import { useRef, useState } from "react";
import { TitleScreen } from "@/components/screens/TitleScreen";
import { TutorialScreen } from "@/components/screens/TutorialScreen";
import { DuelScreen } from "@/components/screens/DuelScreen";
import { ExperimentSettings, SettingsScreen } from "@/components/screens/SettingsScreen";
import { SurveyScreen } from "@/components/screens/SurveyScreen";
import { TrainingScreen } from "@/components/screens/TrainingScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import {
  Agent,
  BASELINE_CLASSES,
  QLearningAgent,
  runTournament,
  TournamentResult,
  Traits,
} from "@/lib/engine";

type Phase = "title" | "tutorial" | "duel" | "settings" | "survey" | "training" | "results";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("title");
  const [settings, setSettings] = useState<ExperimentSettings | null>(null);
  const [participantIdx, setParticipantIdx] = useState(0);
  const traitsListRef = useRef<Traits[]>([]);
  const [qlAgents, setQlAgents] = useState<QLearningAgent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [summary, setSummary] = useState<Record<string, TournamentResult> | null>(null);

  const resetAll = () => {
    traitsListRef.current = [];
    setQlAgents([]);
    setAllAgents([]);
    setSettings(null);
    setParticipantIdx(0);
    setSummary(null);
    setPhase("title");
  };

  if (phase === "title") {
    return <TitleScreen onStart={() => setPhase("tutorial")} onDuel={() => setPhase("duel")} />;
  }

  if (phase === "duel") {
    return <DuelScreen onExit={() => setPhase("title")} />;
  }

  if (phase === "tutorial") {
    return <TutorialScreen onDone={() => setPhase("settings")} />;
  }

  if (phase === "settings") {
    return (
      <SettingsScreen
        onNext={(s) => {
          setSettings(s);
          traitsListRef.current = [];
          setParticipantIdx(0);
          setPhase("survey");
        }}
      />
    );
  }

  if (phase === "survey" && settings) {
    return (
      <SurveyScreen
        key={participantIdx}
        participantIndex={participantIdx}
        totalParticipants={settings.nPeople}
        onComplete={(traits) => {
          traitsListRef.current = [...traitsListRef.current, traits];
          if (participantIdx + 1 < settings.nPeople) {
            setParticipantIdx(participantIdx + 1);
          } else {
            setQlAgents(traitsListRef.current.map((t) => new QLearningAgent(t.name, t)));
            setPhase("training");
          }
        }}
      />
    );
  }

  if (phase === "training" && settings) {
    return (
      <TrainingScreen
        agents={qlAgents}
        episodes={settings.episodes}
        onComplete={() => {
          const baselines: Agent[] = BASELINE_CLASSES.map((Cls) => new Cls());
          const combined: Agent[] = [...qlAgents, ...baselines];
          const result = runTournament(combined, settings.rounds);
          setAllAgents(combined);
          setSummary(result);
          setPhase("results");
        }}
      />
    );
  }

  if (phase === "results" && summary && settings) {
    return (
      <ResultsScreen agents={allAgents} summary={summary} prefix={settings.prefix} onRestart={resetAll} />
    );
  }

  return <TitleScreen onStart={() => setPhase("tutorial")} onDuel={() => setPhase("duel")} />;
}
