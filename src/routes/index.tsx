import { createFileRoute } from "@tanstack/react-router";
import { css } from "../../styled-system/css";
import { Button } from "@/components/ui";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className={css({ color: "red.500" })}>
      <h1>test</h1>
      <Button>test</Button>
    </main>
  );
}
