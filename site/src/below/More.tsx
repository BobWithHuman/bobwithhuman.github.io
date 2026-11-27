// The questions, in shadcn's Accordion.
import { createRoot } from "react-dom/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// ---- Questions ----
const FAQ: [string, string][] = [
  ["What leaves my machine?", "The agent's hooks send each prompt, call and result to the engine you run, which keeps sessions in its own PostgreSQL. To judge a call, the engine sends the judging model the request, the call and the text the agent read before it. Nothing else is sent anywhere."],
  ["What if the engine is down or slow?", "The call is denied. WithHuman fails closed: when it can't be reached or can't judge in time, nothing runs unchecked."],
  ["Will it get in my way?", "Start in shadow mode. It judges and records every call and blocks nothing. Switch to enforce once you've seen what it would have stopped."],
  ["Does the agent learn why a call was stopped?", "No. The agent is told the call was denied, and nothing about why. The why stays with you, in the session graph."],
  ["Which agents does it work with?", "Claude Code, Codex CLI, Cursor CLI, Hermes Agent and OpenClaw. Codex, Cursor and Hermes can't show a confirmation from a hook, so a call that needs your answer is blocked there."],
  ["Is it a sandbox?", "No. It judges where a call came from, not whether its code is safe. Pair it with your usual sandboxing and review."],
  ["Can a security team roll it out?", "Yes. Hooks can be managed for the whole device so users can't turn them off, with per-user keys, a kill switch, a device inventory and a viewer for the team."],
  ["Is it open source?", "Yes, under the MIT license."],
];
function Faq() {
  return (
    <Accordion type="single" collapsible defaultValue="q0" className="w-full">
      {FAQ.map(([q, a], i) => (
        <AccordionItem key={q} value={"q" + i} className="border-neutral-200">
          <AccordionTrigger className="py-5 text-left text-[17px] font-semibold hover:no-underline">{q}</AccordionTrigger>
          <AccordionContent className="pb-5 text-[15px] leading-relaxed text-neutral-600">{a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function mountMore() {
  const put = (id: string, el: React.ReactNode) => { const host = document.getElementById(id); if (host) createRoot(host).render(el); };
  put("faq-list", <Faq />);
}
